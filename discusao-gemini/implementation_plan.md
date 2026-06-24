# Criação do Squad: Outbound Hunter (`eg_hunter`)

Este plano descreve a arquitetura para o novo squad focado em Vendas e Geração de Propostas para plataformas de freelancers, respondendo às suas dúvidas estratégicas e estruturando os agentes.

## Respostas Estratégicas

**1. Mapear com o `eg_banco_ideias`?**
*Recomendação:* **Não.** O Banco de Ideias é o repositório de produtos e projetos *internos* da EverGreen. Leads e propostas comerciais pertencem ao seu **CRM** (como o Kommo CRM, que já vi mapeado no `eg_setup`) ou um Kanban de Vendas. Misturar os dois poluiria seu pipeline de produto. O squad `eg_hunter` vai gerar a proposta final e os dados do cliente estruturados para você apenas dar um copy-paste para dentro do seu CRM de Vendas.

**2. Integração com Plataformas (Upwork, Toptal, Fiverr, etc.)**
A grande maioria dessas plataformas não possui API pública para extração de vagas e elas utilizam bloqueios pesados (Cloudflare, CAPTCHAs) contra scrapers, o que quebra automações constantemente.
*Visão 80/20 (Fase 1 - MVP):* O gatilho do squad será semi-manual. Você encontra a vaga, copia a URL ou o texto bruto da descrição, e aciona o squad. O squad extrai o suco e faz o resto.
*Visão Fase 2:* Configurar gatilhos via RSS (Upwork permite feed RSS para buscas salvas) rodando no n8n que chamam o webhook do Opensquad no futuro.

**3. O Prompt antigo do GPT**
O prompt que você enviou é **excelente**. Ele já está estruturado exatamente como pensamos: regras claras, motor de decisão e output restrito. Vou transformá-lo no coração do Agente Closer.

## Arquitetura do Squad (`eg_hunter`)

O squad terá **dois agentes** trabalhando em sequência (Pipeline):

### Agente 1: Scout (O Pesquisador/Analista)
- **Função:** Receber o texto bruto da vaga ou a URL, limpar a sujeira, identificar as reais necessidades (dores) do cliente.
- **Integração:** Se for URL, usará a skill nativa de `web_fetch` para ler a página. Se o nome da empresa contratante estiver disponível, fará um `web_search` para enriquecer o contexto (saber o que a empresa faz).
- **Output:** Um *Briefing Estruturado do Lead* contendo: Dores principais, Stack sugerido, Perfil do cliente e Gatilhos de conexão.

### Agente 2: Closer (O Estrategista Comercial)
- **Função:** Receber o briefing do Scout e redigir a proposta persuasiva baseada no seu prompt.
- **Framework:** Usará estritamente o seu *Motor de Decisão de Arquitetura* e o *Formato Obrigatório da Resposta* (Proposta Comercial - EverGreen).
- **Tom de Voz:** Executivo, autêntico, aplicando a lei do 80/20.
- **Output:** O texto final da proposta (max 3000 caracteres) pronto para copiar e colar na plataforma.

---

## Arquivos que serão criados

### `squads/eg_hunter/`
#### [NEW] `squad.yaml`
Define o pipeline de 2 passos: `step_research` (Scout) -> `step_proposal` (Closer).
#### [NEW] `squad-party.csv`
Registra os dois agentes e seus ícones (🔎 Scout, 🤝 Closer).
#### [NEW] `agents/scout.agent.md`
O framework operacional de extração de requisitos e pesquisa do lead.
#### [NEW] `agents/closer.agent.md`
Seu super prompt convertido em persona, incluindo a base de conhecimento `Estruturacao_EG.md`.
#### [NEW] `_memory/memories.md`
Repositório de memória específico para aprendizados de vendas (ex: "clientes do Upwork convertem melhor quando focamos em X").

## Open Questions
> [!IMPORTANT]
> 1. O prompt original foca muito em **desenvolvimento de software (Next.js, Supabase, Câmeras)**. A vaga que você enviou inicialmente era de **LinkedIn Ads / Lead Gen**. Você quer que o Agente Closer consiga lidar com os dois universos (Dev e MKT/Growth), adaptando o "Motor de Decisão" dinamicamente dependendo da vaga?
> 2. Posso seguir com a criação destes arquivos para finalizarmos o squad?
