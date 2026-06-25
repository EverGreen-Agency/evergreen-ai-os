<!-- Banco de Arquitetura EG — o PORQUÊ da estrutura, não o inventário do filesystem. -->
<!-- Quem audita aqui é o Arquiteto (squad eg_arquiteto), lendo o repo AO VIVO. -->
<!-- Não liste squads/arquivos aqui: isso se lê do código. Registre só decisões e princípios. -->
# Banco de Arquitetura EG

> Este documento guarda o que **não dá pra ler no código**: a **identidade** da EverGreen, os **princípios de engenharia** da casa e as **decisões arquiteturais** (o *porquê* de cada escolha estrutural).
>
> O **inventário vivo** — quais squads existem, qual stack, quais integrações — **não mora aqui**. Ele é lido direto do repo pelo Arquiteto (`squads/*/squad.yaml`, `stack.json`, `.mcp.json`, o código) e exibido ao vivo na aba **Arquitetura** do dashboard (Mapa de Squads). Espelhar o filesystem num doc só cria divergência.
>
> Atualizado: 2026-06-25.

---

## 0. Identidade

- **Empresa:** EverGreen MKT — boutique de crescimento e consultoria comercial executiva (AI-First, orientada a dados). Não é agência 360.
- **ICP:** B2B, foco em integradoras de energia solar (faturamento > R$ 150 mil/mês), operação madura, dono presente.
- **Repo:** `evergreen-ai-os` — o "AI OS" da agência. Monorepo: framework de orquestração + squads + dashboard.

---

## 1. Princípios de Engenharia da Casa

Estes são os critérios contra os quais o **Gate de Princípios** do Arquiteto mede qualquer ideia ou projeto interno. São lei até serem revisados aqui.

- **Motor antes da interface.** Primeiro a lógica que funciona (squad, dado, regra); a tela vem depois e reflete o motor. Nunca uma UI bonita sobre um motor que não existe.
- **HITL (Human-in-the-loop).** Tudo que sai da máquina pro mundo (ClickUp, Kommo, ads, e-mail) passa por aprovação humana antes de escrever. A IA propõe; o humano libera.
- **Write/Read barrier.** A IA **lê** livremente (repo, bancos, plataformas), mas só **escreve** com aprovação explícita. Vale também pra auto-modificação: nenhum agente reescreve prompt/estrutura sozinho.
- **Isolamento por `client_id`.** Credenciais e dados de cliente nunca se misturam. Tokens de cliente jamais no `.env` global — ficam por cliente, isolados.
- **Dogfooding.** A EG roda nos próprios squads antes de vender o método. Se não serve pra gente, não vende.

---

## 2. Decisões Arquiteturais (o porquê)

> Onde registramos *por que* a estrutura é como é. Cada decisão é um ADR enxuto: contexto → escolha → porquê. O Arquiteto propõe novas entradas aqui (com aprovação) quando uma escolha estrutural se firma.

### D1 — Framework em Markdown/YAML interpretado, não em código

**Contexto:** precisávamos orquestrar múltiplos agentes. **Escolha:** squads são `squad.yaml` + `.agent.md` lidos pelo Claude Code, não um runtime em código. **Porquê:** versionável em git, editável por humano sem build, e o próprio LLM interpreta — zero camada de execução pra manter. O custo é não ter garantia de tipos; mitigado por convenções (formato do party.csv, schema dos bancos).

### D2 — Bancos em JSON/MD versionados, não em banco de dados

**Contexto:** Banco de Ideias, Stack e Arquitetura precisam persistir. **Escolha:** arquivos JSON/MD no repo, não um BD. **Porquê:** portabilidade (não somos reféns de infra), histórico no git de graça, e o dashboard lê/escreve via endpoints simples. Trade-off: não escala pra milhares de registros nem concorrência pesada — aceitável na escala de uma boutique. Migrar pra BD é uma decisão futura registrada no Banco de Ideias (`banks-portability`), não um default.

### D3 — Dashboard lê o filesystem ao vivo, não um estado duplicado

**Contexto:** o cockpit precisa mostrar squads e estados. **Escolha:** o `squadWatcher` (plugin Vite) escaneia `squads/`, lê `state.json` e os bancos, e serve via REST + WebSocket; o front não guarda verdade própria. **Porquê:** uma fonte só (o repo). O dashboard é janela, não cópia. Mesma filosofia do Arquiteto: ler a realidade, não um espelho.

### D4 — Arquiteto lê o repo ao vivo; este doc guarda só o porquê

**Contexto:** a primeira versão tinha um catálogo de squads escrito à mão aqui — e um squad "Cartógrafo" só pra sincronizá-lo. **Escolha:** eliminamos o Cartógrafo; o Arquiteto lê `squads/`, `stack.json` etc. direto, como um engenheiro faria. **Porquê:** um inventário escrito à mão **sempre** diverge do código. O agente já sabe ler arquivos — duplicar isso num doc e criar um squad pra ressincronizar era fragmentação pura. Este doc fica só com o que o código não diz: princípios e decisões.

### D5 — Curador, Arquiteto e Engenharia são papéis distintos

**Contexto:** risco de um agente "faz-tudo" que decide ideia, estrutura e código. **Escolha:** três perguntas, três donos. **Curador** (eg_banco_ideias): "essa ideia é nova no banco?". **Arquiteto** (eg_arquiteto): "isso cabe na arquitetura ou pede squad/stack nova?". **Engenharia** (eg_engenharia): "como construir o projeto do cliente (spec→ADR→scaffold)?". **Porquê:** separar a curadoria de ideia, a vigilância de estrutura e a execução de projeto evita conflito de interesse e mantém cada parecer focado. O Arquiteto roda muitas vezes *depois* do Curador.

---

## 3. Glossário rápido

- **Squad** — time de agentes com pipeline próprio (`squads/<nome>/`).
- **Banco** — arquivo de verdade versionado (Ideias = `ideas.json`, Stack = `stack.json`, Arquitetura = este `.md`).
- **Gate** — verificação que o Arquiteto roda (Squad / Integração / Stack / Princípios).
- **Anel (ring)** — estágio de adoção de uma tech no Banco de Stack: assess → trial → adopt; ou hold (evitar).
- **HITL** — Human-in-the-loop. **ADR** — Architecture Decision Record (decisão registrada com o porquê).
