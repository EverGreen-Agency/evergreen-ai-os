# Spec: mod-comercial (CRM, Carteira e Funil)

- **Cliente:** Interno (`target: internal`) — ideia `mod-comercial` (part_of `mega-plataforma`)
- **Fase:** 2 (Dogfood e Backoffice)
- **Status:** rascunho
- **Data:** 2026-07-07

## 1. Objetivo
Criar um CRM próprio e ultra-customizado para a jornada B2B premium da EverGreen. O módulo consolida o conhecimento já treinado nos squads (prospector, hunter, onboarding) em uma interface unificada, substituindo soluções lentas de mercado (Pipedrive/Kommo) por um funil inteligente que se adapta à Matriz de Risco Comercial.

## 2. Contexto
A captação e o fechamento de grandes clientes exigem uma série de processos (ICE score, qualificação, cold outreach e onboarding manual via Notion). Construir nosso CRM permite atrelar a evolução do *deal* diretamente com a liberação de acesso (magic link/NFC) da Área do Cliente (`client-hub`).

## 3. Escopo Funcional
1. **Pipeline Kanban Inteligente:**
   *   Oportunidades mapeadas por estágios personalizáveis.
   *   Cards dos leads já mostram o Lead Scoring (enriquecido automaticamente por ferramentas B2B).
2. **Matriz de Risco Integrada:**
   *   Antes de mover para "Apresentação de Proposta", o lead precisa preencher campos da Matriz de Risco (CAC vs LTV esperado, budget). O sistema barra se o score for negativo.
3. **Motor de Onboarding Automático:**
   *   Quando o lead é ganho ("Closed Won"), o CRM dispara webhooks que:
       *   Criam as pastas no Google Drive/ClickUp (via `client-config-auto`).
       *   Criam o `tenant_id` oficial no banco de dados.
       *   Emitem o convite de acesso para o `client-hub`.
4. **Histórico e Logs (Squad Reuniões):**
   *   Registro das transcrições de áudio e calls atrelados ao card do cliente, servindo como base RAG para geração de propostas automatizadas.

## 4. Integrações Críticas (ADRs Futuros)
*   **ADR-COM1 (Build vs Kommo/Apollo):** Devemos reinventar a roda criando a gestão de contatos massivos, ou usamos a API do Kommo/Apollo como fonte primária e o nosso CRM foca apenas no Deal (negócio de alto ticket)?
