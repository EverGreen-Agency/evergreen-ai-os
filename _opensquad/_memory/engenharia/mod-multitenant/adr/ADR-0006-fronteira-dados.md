# ADR-0006: Fronteira entre Memória Interna e Banco do Produto

**Módulo:** `mod-multitenant` (Decisão Transversal P6)
**Data:** 2026-07-06
**Status:** Proposto

## 1. Contexto
Atualmente, a EG opera com altíssimo valor usando arquivos versionados locais via Git: banco de ideias, stack, arquitetura, squads, playbooks e artefatos internos. Isso é excelente para a estratégia e trabalho assistido por LLMs locais, mas **não** é o mesmo domínio de dados de uma plataforma SaaS rodando na nuvem com milhares de usuários externos.

## 2. Decisão Proposta
Manter duas fronteiras cristalinas e intransponíveis:
1. **Memória Interna (Git/JSON/Markdown):** Ideias, playbooks, specs, ADRs, arquitetura, aprendizados e prompts sistêmicos.
2. **Banco do Produto (PostgreSQL):** Usuários, organizações, roles, sessões, entitlements, dashboards, tokens OAuth, métricas de clientes, auditoria e aprovações runtime.

A plataforma SaaS pode *ler* os artefatos internos apenas por meio de adaptadores controlados (APIs/Workers), mas não devemos transformar o Git em banco de produção principal para clientes.

## 3. Regras de Transição e Segurança
*   Nenhum token real, segredo, credencial ou dado sensível de cliente (PII) deve ir para arquivos JSON versionados no Git.
*   Artefatos internos criados pela equipe/IA podem gerar "snapshots" (cópias estáticas) publicados para o SaaS, mas sempre passando por sanitização rigorosa.
*   O cockpit interno da EG pode continuar lendo os arquivos JSON locais sem problemas.
*   Qualquer ponte entre a memória interna e o banco do SaaS deve ter um contrato explícito: origem, destino, schema e nível de permissão.

## 4. Consequências e Trade-offs
*   Preserva a velocidade e a agilidade surreal do Opensquad local e das edições em massa via VSCode.
*   Zera o risco jurídico de um vazamento acidental via Git (ex: expor o plano financeiro interno para um cliente logado no painel dele).
*   Exige a construção de uma fina camada de "adapters/importers" antes de exibir um conteúdo de Markdown no `client-hub`.
