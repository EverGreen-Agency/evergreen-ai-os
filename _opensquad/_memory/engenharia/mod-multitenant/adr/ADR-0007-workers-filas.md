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
