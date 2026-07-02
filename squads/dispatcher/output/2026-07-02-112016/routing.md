# Dispatcher Routing

**Run ID:** 2026-07-02-112016
**Operational date:** 2026-07-02
**Request:** Montar o documento de spec + confirmação de funcionalidades e regras de negócio para o lead **Rian** (freelancer.com.br) — automação de protocolo no PJe. Já houve proposta inicial + reunião (transcrição/sumário Fathom) que **mudou o escopo**.

## Contexto essencial (o que a reunião mudou vs. o post original)

| Dimensão | Post original | Depois da reunião (escopo real) |
|---|---|---|
| Plataforma | App **desktop** (.exe/.deb), TUI Rich | **Web app** (Docker, servidor de casa, acesso remoto/celular) |
| IA / Ollama | Classificação via LLM local | **Cortada** (sem IA na Fase 1) |
| Escaneia máquina local | Sim (scan de pasta) | **Não** — usuário faz upload de petição + docs |
| Escopo Fase 1 | Múltiplos benefícios previdenciários | **Só protocolo, só TRF1** (modular p/ outros tribunais depois) |
| Núcleo de valor | Extração/classificação | **Modelos (templates) de auto-preenchimento** por tipo de ação (ex.: salário-maternidade, aposentadoria) — reduz protocolo de ~10min → 2-3min |
| Lógica do form | — | **Dinâmica encadeada do PJe**: Matéria → muda Jurisdição → muda Classe Judicial; pessoa física/jurídica, assistência, sigilo, gratuidade |
| Permissões/multi-tenant | — | **Fora da Fase 1** (mapeado p/ futuro: fase de consulta/manifestação) |
| Cert digital | A1/A3 | A1 (.pfx) e A3 (token) — assinatura antes do protocolo |
| Volume | — | 4-8 processos/dia (~60/mês), só o escritório |
| NDA | Obrigatório | Confirmado (assinamos) |

**Alvo do projeto:** CLIENTE (Rian / escritório no Amapá — TRF1). Não é capacidade interna da EG.

## Classification

**Trilho A — tarefa operacional coberta por squad existente.**

Não é Trilho B. A esteira Curador → Arquiteto → Engenharia é para **capacidade/ideia INTERNA da EG** (o `eg_arquiteto` é explicitamente "ideia/projeto INTERNO — nunca de cliente"; o `eg_banco_ideias` é o funil de ideias da própria EG). Empurrar um projeto de **cliente** para lá seria o erro-espelho do anti-padrão clássico.

O que o Eduardo pediu — "documento de spec e confirmação de funcionalidades e regras de negócio" para o cliente validar — é exatamente o que o **`eg_engenharia` (SDD, `target: client`)** faz: recebe o brief do cliente → produz a **spec.md (o contrato)** com requisitos funcionais/não-funcionais, critérios de aceite e o que está FORA de escopo, com gate HITL de aprovação. Casa 1:1 com o Action Item da reunião ("Draft Phase 1 requirements … send to Rian for validation").

## Sobre os squads que o Eduardo cogitou

- **"Análise de reunião"** → **não existe squad dedicado**. A transcrição + sumário Fathom são o **material de brief** que alimenta o Especificador (`eg_engenharia`). Não precisa de squad separado; o mais próximo (`eg_setup > analista_onboarding`) é para pós-venda (ClickUp/Kommo), não para escopar dev de cliente.
- **`eg_engenharia`** → **rota primária.** Produz a spec/requisitos para o Rian validar. Para (gate HITL) na spec — ADRs/scaffold só se/quando o deal fechar.
- **`eg_proposals`** → **rota secundária, DEPOIS** da validação da spec. Gera a proposta comercial atualizada (web, sem IA, TRF1, templates, preço/prazo revistos). Sequência da própria reunião: requisitos → validar → proposta.
- **`eg_setup`** → ainda não. Pós-venda; o deal nem fechou.

## Recommended Route

1. **`eg_engenharia`** (`target: client`, client_id do escritório do Rian) — Especificador monta a **spec.md Fase 1** (TRF1, web/Docker, modular, templates, certs A1/A3, sem IA/permissões) → HITL → é o doc que vai pro Rian validar.
2. **`eg_proposals`** — depois que o Rian validar a spec: proposta comercial EG atualizada ao novo escopo.

## Checkpoint

Confirmar com Eduardo qual rota disparar antes de rodar o próximo squad (HITL — nunca dispara sem ok).
