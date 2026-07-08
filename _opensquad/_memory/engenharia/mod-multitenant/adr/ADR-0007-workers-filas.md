# ADR-0007: Workers, Filas e Jobs Assíncronos

**Módulo:** `mod-multitenant` (Decisão Transversal P7)
**Data:** 2026-07-06
**Status:** Proposto

## 1. Contexto
A Mega Plataforma executará milhares de tarefas que quebram o ciclo clássico de "Request/Response" HTTP: coleta massiva de dados de Ads, geração de PDFs, sincronização com ClickUp/CRM, webhooks externos, processamento de RAG (Vector Stores), avaliação de prompts por IAs e automações. Se fizermos isso na thread principal do Next.js, a aplicação vai cair (Timeout) e a experiência de uso será trágica.

## 2. Decisão Proposta
Em forte alinhamento com o ADR-0001 (Monólito em Next.js), adotaremos uma fila madura no ecossistema Node.js/TypeScript para o produto central, e isolaremos o uso de Python para casos extremos.

*   **BullMQ + Redis:** Para os jobs "core" da plataforma web (atualizar relatórios, disparar e-mails, limpar caches, sync básico). Escrito em TypeScript, consegue dividir o mesmo ORM e regras de negócio da API.
*   **Workers Python Isolados:** Utilizados **apenas** quando a carga ou a natureza da tarefa exigir fortemente o ecossistema Python (ex: Scraping avançado, OCR, Machine Learning nativo, bibliotecas pesadas de áudio/vídeo).

## 3. Regras Arquiteturais
*   Nenhuma rota do Next.js (API Routes) deve aguardar um job longo. A rota devolve rapidamente um `202 Accepted` e o frontend escuta o progresso via polling ou WebSockets.
*   Todo worker deve obrigatoriamente injetar o `tenant_id` e o `correlation_id` em seus payloads e logs.
*   Retentativas (Retries) devem ser configuradas de forma explícita. Falha silenciosa é inaceitável (o erro deve cair em uma Dead Letter Queue para alerta).
*   Workers em background não têm "passe-livre" para ler dados cross-tenant. O RLS do banco deve continuar sendo respeitado.

## 4. Consequências e Trade-offs
*   Mantém a stack TypeScript coesa no dia 1, evitando o caos estrutural e DevOps de gerenciar dois backends (Node + Python) simultâneos no MVP da plataforma.
*   Introduz a necessidade arquitetural de rodar e assinar um serviço de Redis gerenciado (ex: Upstash ou ElastiCache na AWS).

## 5. Nota — "por que não event-driven?" (Eduardo, 2026-07-08)
O Bioma **já é event-driven onde importa**: todo trabalho assíncrono passa pela fila (BullMQ), e cada job É um evento — payload obrigatório `{ tenantId, correlationId }`, retries explícitos, Dead Letter Queue com incidente automático (mod-observabilidade). Quando o motor de squads/IA entrar (conhecimento, entrega-mkt), esses jobs são o barramento natural de eventos.

O que decidimos **não** fazer (por ora) é *event-sourcing / bus como fonte de verdade entre módulos* dentro do monólito: módulos se falam por chamada direta + transação no Postgres — mais simples, transacional e depurável para 1 dev + IA. Se um dia precisarmos de fan-out confiável entre módulos (ex.: `contract.signed` disparando financeiro+onboarding+hub), o caminho de evolução é o **outbox pattern no Postgres** (tabela de eventos + worker que publica na fila) — adiciona-se sem reescrever nada, porque os consumidores já são workers BullMQ. **Gatilho de revisão:** ≥3 módulos reagindo ao mesmo fato de negócio ou necessidade de replay/auditoria de eventos.
