# ADR-0001: Stack Base da Plataforma (Arquitetura e Ferramentas)

**Módulo:** `mod-multitenant` (Decisão Transversal P1)
**Data:** 2026-07-06
**Status:** Proposto

## 1. Contexto
A plataforma visa sair de um ambiente local (Vite) para um sistema SaaS robusto, distribuído e seguro. Precisamos planejar minuciosamente as tecnologias de base, indo além da simples decisão entre Vite vs Next.js, estabelecendo os pilares para backend, frontend, persistência de dados e a comunicação entre eles.

## 2. Decisão Proposta: Monólito Modular
Visando máxima agilidade no desenvolvimento e facilidade de deploy inicial (mas permitindo extração futura), a arquitetura proposta é um **Monólito Modular** usando o ecossistema Serverless (Next.js App Router). As linguagens, frameworks e libs estão detalhados abaixo:

### 2.1. Frontend (A Superfície de Contato)
*   **Framework:** **Next.js (App Router)**. Traz SSR nativo e roteamento baseado no sistema de arquivos. Resolve as necessidades de SEO do CMS futuro e traz performance extrema.
*   **Linguagem:** **TypeScript (Strict Mode)**. A tipagem forte previne erros catastróficos em produção, essencial para um software multitenant.
*   **Styling & UI:** **TailwindCSS** (produtividade atômica) combinado com **Shadcn/UI** (componentes premium, acessíveis e com controle total do código).
*   **Animação:** **Framer Motion** (vital para a UX de fluidez "Apple-like" que queremos entregar aos clientes).
*   **Estado:** **Zustand** (gerenciamento global levíssimo) e **TanStack Query** (React Query, para caching, deduplicação e sincronização do estado do servidor no cliente).

### 2.2. Backend (A Lógica e Proteção)
*   **Camada API (BFF):** **Next.js Route Handlers** atuarão como nosso Backend For Frontend. Funções serverless que comunicam com o banco e garantem a segurança da sessão e RLS do tenant.
*   **Workers & Microserviços de IA:** Lógicas muito pesadas e síncronas de Python serão separadas (microsserviços isolados, ex: FastAPI/Celery) para não bloquear a thread do Node/Next. 
*   **Comunicação Front ↔ Back:** **tRPC** ou, no mínimo, Fetch REST usando **Zod** para validação estrita de ponta a ponta (Type-safety do frontend até o banco). O frontend nunca poderá quebrar porque um payload mudou sem ser notado.

### 2.3. Persistência de Dados
*   **Banco Principal:** **PostgreSQL**. Padrão absoluto para SaaS multitenant (garante RLS) e maduro no suporte a colunas JSONB para metadados flexíveis.
*   **Banco de IA:** **pgvector**. Rodando dentro do mesmo Postgres, evitando termos que pagar por um banco de vetores dedicado tipo Pinecone.
*   **ORM:** **Drizzle ORM**. Extremamente performático, leve para ambientes Edge e serverless, e sem o overhead do Prisma. Faremos as migrações SQL tipadas direto em TypeScript.

## 3. Consequências e Trade-offs
*   **Esforço de Refatoração:** Migrar o cockpit atual (Vite puro) para Next.js Server Components exige um esforço substancial de reescrita da lógica de data-fetching.
*   **Centralização:** O repositório unificado garante que 1 dev full-stack pode entregar uma funcionalidade ponta-a-ponta (do schema do banco ao botão na UI) sem fricção.

## 4. Estratégia de Migração — GREENFIELD, não strangler (revisado 2026-07-07)
**Correção:** a v1 deste ADR assumia "strangler pattern" para preservar o cockpit atual. O Eduardo confirmou que **o cockpit (`dashboard/`) não tem uso operacional** — sem auth, sem operação de negócio real passando por ele, é um visualizador local dos bancos internos (ideias/arquitetura/stack). Não há nada crítico a "proteger" durante a migração, então strangler (que existe para não quebrar algo em produção) é complexidade desnecessária aqui.

**Decisão:** construir a plataforma nova (Next.js + Supabase + `mod-multitenant`) **greenfield**, do zero, sem obrigação de compatibilidade com o Vite atual:
*   O app Next.js novo nasce limpo com a fundação (orgs/RBAC/RLS/auth).
*   Telas do cockpit que têm valor real (Banco de Ideias, Tech Radar) são **portadas por decisão de produto**, não por obrigação — cada uma vira uma feature normal do roadmap (Fase 2, `mod-cockpit-interno`), especificada e priorizada como qualquer outra.
*   Os **bancos internos JSON continuam** sendo lidos por adapters quando essas telas forem portadas (ADR-0006) — isso não muda.
*   O `dashboard/` Vite atual pode continuar rodando em paralelo enquanto isso, sem pressão de prazo — ele não bloqueia nem é bloqueado pelo desenvolvimento do Bioma.
*   **Ganho:** menos código de transição, menos vínculo com decisões antigas do Vite, arquitetura da fundação fica mais limpa desde o dia 1.
