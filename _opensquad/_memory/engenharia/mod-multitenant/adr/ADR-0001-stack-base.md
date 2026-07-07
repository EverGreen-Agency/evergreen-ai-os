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

## 4. Estratégia de Migração — Strangler, NÃO big-bang (adendo do Juiz)
O cockpit atual (`dashboard/`) **funciona hoje** e a spec exige preservá-lo (CA7). Portanto a migração Vite→Next.js é **incremental (Strangler Fig)**, não reescrita de uma vez:
*   **Fase A:** subir o app Next.js novo ao lado, com Supabase Auth + Postgres + a fundação `mod-multitenant` (orgs/RBAC/RLS). O cockpit atual continua rodando local, sem auth, para uso interno da EG.
*   **Fase B:** migrar telas do cockpit (Banco de Ideias, Arquitetura, Carteira) para o app novo uma a uma, quando cada uma ganhar valor de estar autenticada/multi-tenant. Os **bancos internos JSON continuam** sendo lidos por adapters (ADR-0006), não migram para o DB de produto.
*   **Fase C:** quando todas as telas úteis migraram, o Vite antigo é aposentado.
*   **Regra:** nunca quebrar o cockpit interno num deploy. Cada migração de tela é reversível e testável isolada.
