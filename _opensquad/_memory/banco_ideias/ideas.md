<!-- VIEW GERADA a partir de ideas.json — não editar à mão. O Curador (squad eg_banco_ideias) regenera. -->
# Banco de Ideias EG — view

> Ciclo: **captura → avaliação → processamento → projeto interno → empresa nova**. Horizonte = ordem de urgência (`AGORA` > `MÉDIO` > `LONGO` > a redefinir). Conexões (`→ habilita` / `← depende de`) carregam a integração. Atualizado: 2026-06-24.

## 🟢 Em processamento (construção ativa)
- **Banco de Ideias** `Cockpit` · `AGORA` — esta ferramenta; Curador + aba no dashboard lendo o banco real. → habilita `hub-chat-dispatcher`
- **Guardião / Arquiteto** `Squad` · `AGORA` — autovigilância: audita ideia/projeto interno contra a arquitetura; gate "precisa de squad?". ← depende de `banco-arquitetura`
- **Banco de Arquitetura** `Infra` · `AGORA` — inventário das nossas ferramentas e estrutura (repo + ClickUp + Kommo). → habilita `guardiao-arquiteto`
- **Squad de Engenharia (SDD + ADR)** `Squad` · `AGORA` — projetos de cliente: brief → spec → ADRs → repo → sub-agentes. ← depende de `banco-stack`
- **Banco de Stack** `Infra` · `MÉDIO` — catálogo vivo de tecnologias (Tech Radar). → habilita `squad-engenharia`
- **Carteira de Clientes** `Cockpit` · `MÉDIO` — plano de controle por cliente; provisiona ClickUp. ← depende de `squad-onboarding`

## ◐ Em avaliação
- **Squad Outbound Hunter (eg_hunter)** `Squad` · `AGORA` — Scout pesquisa a vaga + Closer escreve a proposta EG. Consolida `squad-propostas` + `squad-prospector`. → habilita `multi-plataforma-freelance`
- **Adoção do CodeGraph** `Infra` · `MÉDIO` · _externa_ — MCP que indexa o repo; camada de código do Banco de Arquitetura. → habilita `banco-arquitetura`

## • Em captura

**Novas desta sessão**
- **Tag de Ativação / Gatilho de Desenvolvimento** `Cockpit` · `MÉDIO` — card sinaliza prontidão → dispara o squad (HITL). ← depende de `hub-chat-dispatcher`
- **Auto-melhoria dos Squads** `Feature` · `MÉDIO` — lê memories.md pós-run → refina os agentes (com revisão). Parcial já existe.
- **Captação multi-plataforma de propostas** `Feature` · `MÉDIO` — ingestão de vagas (Upwork/Malt/etc.); MVP cola URL, Fase 2 RSS→n8n. ← depende de `squad-hunter`
- **Hub: chat = dispatcher** `Cockpit` · `MÉDIO` — barra de chat no dashboard = dispatcher evoluído. → habilita `tag-ativacao`

**Squads (roadmap)**
- **Análise de Reuniões** · **Propostas** (→ hunter) · **Prospector** (→ hunter) · **Relatórios** · **Onboarding** (→ carteira) · **Kickoff Técnico** · **Raio-X** · **Criativos** · **Tráfego (HITL)** · **SEO/GEO** · **Voz do Cliente**.

**Features**
- **Log de áudio WhatsApp** · **SLA Watchdog** · **Esteira de Onboarding** · **Dossiê de Provas** · **Health Score** · **Icebreaker** · **Loop pós-call** · **Prospecção WhatsApp (Evolution)**.

**Comercial**
- **Máquina Completa** · **Precificação por valor** · **Service-as-a-Software** · **AI-CMO (MRR)** · **Dogfooding** `AGORA` · **Fábrica back/frontoffice** · **IA se adapta ao cliente**.

**Infra**
- **Vector store (pgvector)** · **Context Decay** · **Camada LLM-agnostic** · **client_config automático** · **Segundo Cérebro** · **Ensemble + Juiz (MoA)** · **Vibe Building** · **Stack de memória (Zep)** · **Skills:** brand-EG · squad-creator · eg-mcp-tools · raio-x.

**Serviço**
- **Auditoria AI-First** · **Pesquisa acadêmica** · **Cockpit → produto** · **Change Management** · **VoIP de qualificação**.

## 🏢 Empresa nova
- **Forward Deployed AI** `Serviço` · _externa_ — modelos open-source na infra do cliente; DNA de outra empresa.

## Arquivadas
_(nenhuma)_
