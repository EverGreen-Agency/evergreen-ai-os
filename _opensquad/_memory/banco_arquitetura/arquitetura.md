<!-- Corpus do Guardião/Arquiteto. Inventário vivo da estrutura da EverGreen. -->
<!-- Atualize quando algo material mudar (novo squad, nova integração, nova plataforma). -->
# Banco de Arquitetura EG

> O mapa do que **já existe** na EverGreen. É contra este inventário que o **Guardião** audita toda ideia ou projeto interno — para responder "isso já é coberto, precisa de ajuste, ou pede coisa nova?". Não é aspiracional: descreve o presente. O que é desejo/futuro vive no [Banco de Ideias](../banco_ideias/ideas.md).
>
> Atualizado: 2026-06-24.

---

## 0. Identidade

- **Empresa:** EverGreen MKT — boutique de crescimento e consultoria comercial executiva (AI-First, orientada a dados). Não é agência 360.
- **ICP:** B2B, foco em integradoras de energia solar (faturamento > R$ 150 mil/mês), operação madura, dono presente.
- **Repo:** `evergreen-ai-os` — o "AI OS" da agência. Monorepo: framework de orquestração + squads + dashboard.
- **Princípios de engenharia da casa:** motor antes da interface · HITL (Human-in-the-loop) em tudo que escreve fora · Write/Read barrier (IA lê livre, só escreve com aprovação) · dogfooding (rodar a EG nos próprios squads antes de vender).

---

## 1. Camada de Código (repo)

> Esta seção é a que o **CodeGraph** (quando adotado, ver Banco de Ideias `codegraph`) indexaria automaticamente. Por ora, mantida à mão.

```
evergreen-ai-os/
├── _opensquad/            # núcleo do framework (não editar à mão)
│   ├── core/              # runner.pipeline.md, architect.agent.yaml, skills.engine.md
│   ├── skills/            # clickup/, kommo/  (skills globais)
│   ├── config/            # playwright.config.json
│   ├── _memory/           # memória persistente da EG ↓
│   │   ├── company.md         # perfil da empresa (carregado em todo run)
│   │   ├── preferences.md     # nome, idioma, IDEs
│   │   ├── banco_ideias/      # Banco de Ideias (ideas.json fonte da verdade)
│   │   ├── banco_arquitetura/ # ESTE banco
│   │   ├── banco_stack/       # Tech Radar
│   │   └── clients/           # Carteira de Clientes (configs por cliente)
│   └── _investigations/   # análises do Sherlock (perfis de referência)
├── squads/                # squads do usuário ↓ (seção 3)
├── dashboard/             # cockpit visual (seção 4)
├── skills/                # skills no nível raiz
├── .agent/                # config de agentes
├── .claude/               # config Claude Code
├── .mcp.json              # servidores MCP (seção 5)
└── .env.example           # variáveis globais (seção 5)
```

**Stack do código** está catalogada em detalhe no [Banco de Stack](../banco_stack/stack.md). Resumo: dashboard em React 19 + Vite + TypeScript + Zustand + Phaser; framework em Markdown/YAML interpretado pelo Claude Code; integrações via skills (REST) e MCP.

---

## 2. Framework Opensquad (como tudo roda)

- **Entrada única:** skill `/opensquad` (em `.claude/skills/opensquad`). Roteia create / run / edit / skills.
- **Anatomia de um squad** (`squads/<nome>/`):
  - `squad.yaml` — pipeline (lista de steps; cada step tem `agent`, `description`, `interactive`).
  - `squad-party.csv` — elenco: `agent_name,role,displayName,icon,file_path` (formato canônico do runner; `file_path` relativo `./agents/<id>.agent.md`).
  - `agents/<nome>.agent.md` — persona + regras de cada agente.
  - `_memory/memories.md` — memória do squad entre execuções.
  - `state.json` — (em runtime) estado lido pelo dashboard.
  - `output/` — entregáveis gerados.
- **Quem cria squad:** o **Architect** (`_opensquad/core/architect.agent.yaml`).
- **Quem roda:** o **Pipeline Runner** (`_opensquad/core/runner.pipeline.md`) — gerencia ciclo de vida do `state.json`, checkpoints, review loops, atualização de memória.
- **Investigação de referência:** **Sherlock** analisa perfis (IG/YT/X/LinkedIn) via Playwright para extrair padrões.
- **Comunicação entre agentes:** persona switching (inline) ou subagentes (background). Checkpoints pausam para input/aprovação humana.

---

## 3. Catálogo de Squads (o que JÁ existe)

> **Esta é a tabela que o Guardião consulta primeiro** no gate "precisa de squad novo, ou um destes cobre?".

| Squad | Papel | Cobre | Estado |
|---|---|---|---|
| **dispatcher** | Roteador de demandas | Recebe pedido livre e direciona para o squad certo. Semente do "hub-chat" do dashboard. | Ativo (1 agente: roteador) |
| **eg_setup** | Onboarding pós-venda | Estrutura ClickUp + Kommo + Kit de boas-vindas de um cliente novo, passo a passo. 5 agentes: analista_onboarding → arquiteto_clickup → especialista_kommo → especialista_kits → gerente_cs. | Ativo |
| **eg_banco_ideias** | Curadoria de ideias | Intake/dedup/conexão de ideias no `ideas.json`. 1 agente: curador. | Ativo |
| **eg_guardiao** | Autovigilância / gate de arquitetura | Audita ideia/projeto interno contra ESTE banco; decide se precisa squad novo. 1 agente: arquiteto. | Ativo (novo) |
| **eg_engenharia** | Projetos de cliente (SDD+ADR) | brief → spec.md → ADRs → scaffold → sub-agentes. | Esqueleto (aguarda 1º brief real) |

**Regra de leitura para o gate:** antes de propor um squad novo, o Guardião verifica se a capacidade pedida é (a) já coberta por um squad acima, (b) uma extensão/novo agente de um existente, ou (c) genuinamente nova. Só (c) justifica squad novo.

---

## 4. Camada de Cockpit (dashboard)

- **Local:** `dashboard/`. Stack: React 19 + Vite + TypeScript + Zustand + Phaser 3.90 + WebSocket (ws + chokidar).
- **O que é:** escritório visual — sprites de agentes animados por squad, lendo `squads/*/state.json` em tempo real via `squadWatcher.ts` (plugin Vite que abre WebSocket + REST de fallback).
- **Abas atuais:**
  - **Escritório** — visão Phaser dos squads rodando.
  - **Banco de Ideias** — Kanban lendo `_opensquad/_memory/banco_ideias/ideas.json` (GET/POST `/api/ideas`, watcher em tempo real). 5 estágios: captura → avaliação → processamento → projeto → empresa.
- **Endpoints servidos pelo dev server:** `/api/snapshot` (squads + estados), `/api/ideas` (GET/POST do banco), `/__squads_ws` (WebSocket).
- **Abas futuras (Banco de Ideias):** Clientes (Carteira), chat = dispatcher evoluído.

---

## 5. Integrações e Credenciais

| Sistema | Escopo | Onde mora | Acesso |
|---|---|---|---|
| **ClickUp** | Global da EG | `CLICKUP_API_KEY` + `CLICKUP_WORKSPACE_ID` no `.env` | skill `_opensquad/skills/clickup` |
| **Kommo (CRM)** | Por cliente | `_opensquad/_memory/clients/<id>/kommo_config.json` | skill `_opensquad/skills/kommo` |
| **Playwright** | Sessões de browser | `_opensquad/_browser_profile/` (login persistente) | MCP `@playwright/mcp` (`.mcp.json`) |
| **Modelos de IA** | Global | `.env`: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY` | direto |
| **n8n** | Orquestração externa (opcional) | `.env`: `N8N_WEBHOOK_URL` | webhook |

**Política de chaves:** chaves centralizadas da agência (ex: ClickUp) vão no `.env` global. Tokens de cliente (Kommo, Meta Ads, etc.) NUNCA vão no `.env` — ficam isolados por cliente em `_opensquad/_memory/clients/<id>/`. É a fronteira de isolamento por `client_id`.

---

## 6. Plataformas Externas em Uso

- **Gestão de projeto:** ClickUp (workspace centralizado da EG; um portal/pasta por cliente).
- **CRM:** Kommo (uma conta por cliente, isolada).
- **Mídia paga:** Meta Ads, Google Ads (tokens por cliente — ainda não integrados via skill).
- **Automação:** n8n (opcional, auto-hospedado).
- **Browser/scraping:** Playwright (Sherlock e coletas).

> Itens marcados "ainda não integrados" são candidatos naturais a virar skill — o Guardião deve apontá-los quando uma ideia depender deles.

---

## Como o Guardião usa este banco

1. **Gate de squad** → seção 3 (catálogo). "Já existe? É extensão? É novo?"
2. **Gate de integração** → seções 5 e 6. "A capacidade pedida usa um sistema que já temos, ou pede integração nova?"
3. **Gate de stack** → [Banco de Stack](../banco_stack/stack.md). "A tecnologia proposta está num anel que permite usar (Adopt/Trial) ou é Hold/desconhecida?"
4. **Coerência de princípios** → seção 0. "Respeita motor-antes-de-interface, HITL, Write/Read barrier, isolamento por client_id?"

O Guardião **lê** este banco; só o atualiza via aprovação humana (Write/Read barrier).
