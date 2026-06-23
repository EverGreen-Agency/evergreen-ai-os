**EVERGREEN · EG**

# **Arquitetura de Squads e IA**

| Documento técnico-operacional. Define como a EverGreen constrói, organiza, hospeda e governa seus times de agentes de IA ("squads"), tanto para uso interno quanto para entrega a clientes. Complementa o Documento Mestre (seção de Tecnologia e AI First) e os Manuais Operacionais do ClickUp. Status: versão de trabalho. A stack e os procedimentos são revisados conforme a EG amadurece e o mercado de IA evolui (versões de modelos e frameworks mudam rápido). |
| :---- |

# **0\. Princípios fundamentais (a constituição dos squads)**

Antes de qualquer ferramenta, cinco princípios que não se quebram:

1. **Squad é por função, não por cliente.** Um squad resolve um *tipo de problema* (prospecção, proposta, conteúdo, relatório). O cliente é uma *configuração* injetada em tempo de execução — nunca um repositório novo. Squad por cliente \= 20 repositórios duplicados e manutenção impossível em 6 meses.

2. **Cliente é configuração, não arquitetura.** Voz, tom, regras de negócio, chaves de API e contexto de cada cliente vivem em arquivos de configuração (JSON/banco), carregados por ID. O código do squad é o mesmo para todos.

3. **Separação dura entre squad interno e squad de entrega.** Interno opera processos da EG (pode ter mais autonomia). De entrega opera para o cliente (autonomia mínima, sempre com revisão humana antes de qualquer output sair). O grau de autonomia é inversamente proporcional ao impacto de um erro.

4. **Código para dados, LLM para raciocínio.** Não escreva lógica complexa de if/else no Python quando bastaria ajustar o prompt; e não tente resolver com prompt o que um código simples de manipulação de JSON resolve melhor. Automação (n8n/Make) são os trilhos; agentes são os nós cognitivos.

5. **Human-in-the-loop (HITL) é obrigatório em qualquer ação externa.** Nenhum agente dispara e-mail, mensagem, anúncio ou publicação sem aprovação humana. O output do agente nasce como *rascunho* no ClickUp ou Slack, e um humano aprova.

# **1\. Arquitetura técnica recomendada**

## **1.1 A stack (começar barato, escalar depois)**

### **Para começar agora (baixo custo, alta velocidade):**

| Camada | Ferramenta | Por quê |
| :---- | :---- | :---- |
| Orquestração de dados (trilhos) | **n8n** (self-hosted) | Backbone de integrações; corta custo de SaaS; conecta ClickUp, APIs, webhooks |
| Orquestração de agentes (cérebro) | **CrewAI** | Rápido de prototipar, paradigma de papéis/objetivos, plug-and-play |
| LLM principal (raciocínio/escrita) | **Modelo de topo de raciocínio disponível** (família Claude para escrita PT-BR e código; ver nota abaixo) | Qualidade premium de copy e código |
| LLM de contexto longo (análise) | **Gemini** (janela de contexto gigante) \[TESTANDO\] | Análise de reuniões/ligações longas |
| LLM de volume (triagem barata) | **Modelo aberto** (Llama/Gemma via OpenRouter) \[TESTANDO\] | Triagem de listas e classificação em massa sem implodir margem |
| Pesquisa/scraping | **Firecrawl \+ Serper** \[TESTANDO\] | Matéria-prima para prospecção e pesquisa de mercado |
| Hospedagem de agentes | **Railway** (containers Docker) \[TESTANDO\] | Equilíbrio entre controle e facilidade; evita timeout de serverless em processos longos |
| Dev | **Cursor \+ Claude Code** (muito de preferência aqui) | Produtividade de desenvolvimento |
| Experimentação interna | **OpenSquad / IDEs com IA** | Geração rápida de conteúdo e testes |
| Registro/gestão | **ClickUp** (já temos) | Fonte de tarefas e portal do cliente |
| BI | **Looker Studio** (provável) | Dashboards e relatórios embutidos |
| **Nota sobre modelos:** versões de LLM mudam a cada poucos meses. Não fixe uma versão no código nem na cabeça — mapeie por *capacidade* ("melhor modelo de raciocínio disponível", "melhor de contexto longo", "mais barato para volume") e troque a versão concreta conforme sai algo melhor. A pesquisa que embasou este documento citava modelos de uma geração que já pode estar superada; a lógica de *qual tipo para qual tarefa* permanece válida. |  |  |
| **Decisão de piloto (jun/2026):** Primeiros squads rodam com SDK Anthropic \+ Python puro, sem n8n. n8n entra depois que pelo menos um squad de receita estiver estável e o pipeline cruzar 3+ sistemas simultâneos. Vantagem: menos camada para depurar, custo zero de infra de workflow no início. |  |  |

### **Evolução (quando ganhar escala de clientes):**

1. Migrar squads *core* de entrega (proposta, relatório) de CrewAI para **LangGraph** — transições de estado determinísticas, auditoria total, tratamento de erro rígido.

2. Implementar **LangSmith** (ou similar) para versionar prompts centralmente e analisar performance dos agentes.

3. Migrar tarefas braçais de alto volume (limpar 10 mil leads) para **modelos abertos self-hosted** (VPS) — custo operacional perto de zero.

## **1.2 Estrutura de repositório**

Um único repositório, orientado por domínio. Cliente nunca entra no Git.

/core → conexões LLM, bancos vetoriais, orquestração central

/tools (skills) → ferramentas plugáveis em padrão MCP (clickup\_reader, meta\_ads\_reader, github\_writer...)

/squads → configurações de fluxo (squad\_proposta.py, squad\_conteudo.py, squad\_relatorio.py)

/clients → IGNORADO no Git; vem do banco. JSON por cliente: voz/tom, regras, chaves de API

/prompts → versionados (banco ou LangSmith), nunca soltos no código

**Por que MCP nas ferramentas:** padronizar as ferramentas em Model Context Protocol permite que a *mesma* ferramenta (ex: clickup\_reader) seja usada por um script CrewAI/LangGraph **e** por um dev usando Claude Code na IDE. Você constrói a ferramenta uma vez, usa em todo lugar.

**API direta antes de MCP:** na largada, cada tool é uma função Python chamando REST direto (ClickUp, Kommo). Embrulhar em MCP só quando um segundo squad precisar reutilizar a mesma tool — o embrulho é barato de fazer depois, caro de manter cedo demais.

**Scaffolder:** a estrutura do repo está implementada em \`scaffolder.py\` (raiz do projeto). Rodar uma vez gera os 30 arquivos e pastas com boilerplate. Novo squad \= nova pasta em \`/squads/nome\_do\_squad/\` com \`squad.py\` \+ \`/prompts/\`.

## **1.3 Governança e segurança (os guardrails)**

| Tipo de squad | Autonomia | Output | Guardrails |
| :---- | :---- | :---- | :---- |
| **Interno (pesquisa/experimentação)** | Média | Pode rascunhar e-mails, resumir concorrência, gerar drafts de conteúdo | Falha vira refação de prompt |
| **De entrega (cliente)** | Mínima — só leitura nas bases | Sai sempre como *rascunho* no ClickUp/Slack | HITL obrigatório; modo read-only; sem ação destrutiva |

Os três riscos técnicos que mais ameaçam a EG, e como evitar:

1. **Vazamento de contexto (context bleeding):** usar a mesma sessão/memória para dois clientes. → Agentes *stateless*, injeção de contexto por ID do cliente a cada chamada.

2. **Loop fatal / autonomia não supervisionada:** agente conectado a API de disparo entra em loop e gera spam ou queima R$1.000 de tokens numa madrugada. → max\_iterations fixo, orçamento fixo por API, HITL obrigatório em qualquer gatilho externo.

3. **Complexidade excessiva:** misturar lógica de software com raciocínio de LLM no lugar errado. → Código para tráfego de dados; LLM para raciocínio e geração.

# **2\. Como estruturar um squad (o padrão)**

A regra: **um squad \= um resultado (workflow). Dentro dele, vários agentes desempenham papéis.** Não se cria sub-squad por plataforma nem por formato — plataforma e formato são *parâmetros*.

**Exemplo: Squad de Conteúdo**

Um único squad de conteúdo, com agentes-papel internos:

* **Estrategista** — recebe o tema/objetivo e define ângulo, missão de funil (atrair/nutrir/posicionar/converter) e briefing.

* **Roteirista de Gancho** — cria o hook (primeiros 3s / primeira linha).

* **Roteirista de Corpo** — desenvolve a mensagem.

* **Roteirista de CTA** — fecha com chamada à ação.

* **Editor / Voz da Marca** — garante tom, consistência e padrão de qualidade.

* **Repurposer** — adapta a peça aprovada para cada plataforma (Instagram, LinkedIn, X, TikTok).

Plataforma e formato entram como **input de configuração** ("gere para LinkedIn, formato carrossel, voz da marca X"), não como squads separados. Um squad que sabe escrever para várias plataformas é melhor que vários squads de uma plataforma cada — a especialização por plataforma só vale depois, com volume e padrão estabelecidos.

## **Uso pessoal (ex: social media do Eduardo)**

É o **mesmo squad de conteúdo**, com uma *configuração* diferente: o perfil de voz/tom do Eduardo, as plataformas dele (Instagram, X, LinkedIn, TikTok) e os temas dele. Não se cria arquitetura nova — cria-se um client config chamado "Eduardo" (ou "founder\_eduardo") exatamente como se faria para um cliente. Isso prova o princípio: pessoa/cliente \= configuração.

## **Quando usar squad vs. ferramenta direta**

* **Ferramenta direta (com curadoria humana):** edição de vídeo premium, design gráfico final, criação de imagem de marca, qualquer peça artesanal de alta qualidade e baixo volume. O resultado de IA ainda é inconsistente para entrega premium sem revisão. Use Claude Design, editores, Figma com IA.

* **Squad:** tarefas repetíveis, alto volume, baixa variância — gerar 50 variações de copy, processar 100 leads, montar 20 relatórios, triar listas.

* **Regra:** qualidade e unicidade → humano \+ ferramenta. Escala e repetição → squad. O squad gera a *matéria-prima* (roteiros, variações A/B, listas, resumos); o *acabamento* de marca permanece humano.

# **3\. Squads a construir AGORA (prioridade imediata)**

Todos internos primeiro — menor risco, mais aprendizado, sente na pele antes de expor a cliente.

## **3.0 Sequenciamento de execução (as 3 camadas)**

| Camada | O que é | Status |
| :---- | :---- | :---- |
| **Squads (CLI/código)** | Instâncias operando via terminal, SDK e Python puro. Foco total em lógica, sem interface. | ← Agora |
| **Cockpit interno** | Interface com login, clientes/projetos, execução de squads, logs, dashboards, BI embutido. Spec de referência: proposta HM Conexões (tech stack: Next.js \+ FastAPI/Django \+ Postgres \+ Redis \+ LLM).  | Fase 2 (pós-maturação) |
| **Plataforma pública** | Multi-tenant produtizado para clientes e mercado. A arquitetura stateless/cliente-por-ID já suporta isso sem reescrita.  | Fase 3 (escala de mercado) |

**Regra:** não construir interface antes de ter motor. Cockpit vazio não tem valor; squad sem interface já tem.

## **3.1 Squad Prospector (geração de lista qualificada)**

* **O que faz:** recebe critérios de ICP, faz scraping/enriquecimento (Firecrawl/Serper), qualifica e devolve lista pronta para ligação com dados de contato e gancho de abordagem.

* **Funcionalidades:** filtro por ICP, deduplicação, score de fit, sugestão de gancho por lead, exportação direta para o pipeline Outbound do Kommo.

* **Modelo:** aberto/barato para triagem em volume; topo de raciocínio só para o gancho.

* **Risco:** baixo (interno). HITL na exportação final.

## **3.2 Squad de Propostas**

* **O que faz:** a partir de um briefing/escopo aprovado, preenche o template de proposta da EG (já existe) com os dados do cliente, escopo, investimento e premissas.

* **Funcionalidades:** leitura do contexto no ClickUp, preenchimento do template, geração em .docx, rascunho para revisão humana.

* **Risco:** baixo-médio. Sai sempre como rascunho.

## **3.3 Squad de Análise de Reuniões e Ligações**

* **O que faz:** recebe transcrição de R1/R2/call, extrai dores, objeções, sinais de compra, próximos passos, e gera feedback de performance comercial.

* **Funcionalidades:** resumo executivo, extração de dados para o cartão do Kommo, checklist do que foi/não foi coberto (vs. estrutura SPIN/SPICED), feedback ao vendedor.

* **Modelo:** contexto longo (Gemini) para a transcrição.

* **Risco:** baixo (interno).

## **3.4 Squad de Relatórios de Cliente**

* **O que faz:** consolida dados de campanha (Meta/Google), CRM (Kommo) e atividades (ClickUp) em relatório mensal/semanal por canal e etapa de funil.

* **Funcionalidades:** puxa dados via n8n, gera narrativa do relatório, alimenta o BI (Looker), rascunho no portal do cliente.

* **Risco:** médio (toca dado de cliente). Read-only \+ HITL.

# **4\. Squads para DEPOIS (segunda onda)**

* **Squad de Criativos (matéria-prima):** gera roteiros de vídeo, variações de copy de anúncio, conceitos de A/B. O acabamento (gravação premium, edição cinematográfica) permanece humano. Entra quando o squad de relatórios e o de proposta estiverem estáveis.

* **Squad de Otimização de Tráfego (assistido):** lê performance de campanhas (Meta/Google via MCP/SDK) e *sugere* ajustes de verba, público e criativo — sempre como rascunho para o gestor aprovar. Nunca otimiza sozinho (risco financeiro direto ao cliente).

* **Squad de SEO/GEO:** otimiza conteúdos do blog do cliente para busca e para mecanismos generativos/LLMs.

* **Squad de Revisão de Estratégia:** lê o BI \+ performance acumulada e propõe hipóteses e ajustes de plano, registrando como rascunho no ClickUp. (Conecta direto com a fase "Evoluir" do Sistema Raiz.)

# **5\. Integração com o que já temos (ClickUp, GitHub, BI, Tráfego)**

Esta é a parte que mais gera percepção de "EG tecnológica". O objetivo: tirar trabalho manual e dar visibilidade.

## **5.1 ClickUp como espinha (já temos a base)**

Já existe a clonagem rápida de pasta estruturada por cliente (com dashboard). Próximos saltos:

* **Templates de tarefa por oferta** — clonar não só a pasta, mas a árvore de tarefas-padrão de cada tipo de projeto.

* **Automação nativa \+ n8n** — usar a automação nativa do ClickUp para o simples (mover card, criar follow-up) e o n8n para o que cruza sistemas.

## **5.2 BI (Looker Studio) embutido**

* Conectar fontes (Meta Ads, Google Ads, Kommo) → dashboards por cliente → embutidos no portal.

* O squad de relatórios escreve a *narrativa*; o Looker mostra os *números*.

* Não BI custom por cliente (impossível manter) nem um mega-BI único (perde granularidade). Templates por tipo: Tráfego Pago, Funil Comercial, Projeto Tech — e cada cliente é uma instância desse template.

**Regra crítica:** Looker aponta para um store próprio (Postgres / BigQuery / Sheets-as-DB normalizado por pipeline de dados da EG), nunca para fonte manual nem para a plataforma da ad network diretamente. Quando a plataforma codada chegar, ela lê o mesmo store — a migração vira re-skin, não rebuild. Custo de descartar o Looker depois é barato; custo de descartar o pipeline de dados, não.

O squad de Relatórios (\#3.4) escreve a narrativa; o Looker exibe os números. 

## **5.3 Tráfego pago integrado (Meta/Google via MCP/SDK)**

* Conectar as APIs de anúncios como *tools* MCP, para o squad de tráfego ler performance e sugerir ajustes (read-only \+ HITL para qualquer mudança).

* **Atenção (Kommo, junho/2026):** integrações de ads no Kommo passaram a exigir plano Pro. A integração de tráfego da EG aqui é via API própria/MCP, independente do Kommo — mas vale lembrar disso ao recomendar plano para o cliente.

## **5.4 GitHub ↔ ClickUp (projetos de tecnologia)**

O Manual Tech & Software já define a integração nativa (branch por tarefa, PR muda status). Próximo salto com IA:

* **Squad de Kickoff Técnico:** lê uma proposta/escopo aprovado e gera automaticamente a árvore de tarefas no ClickUp \+ o esqueleto do repositório no GitHub (estrutura de pastas, README, issues iniciais). Economiza o setup manual de cada projeto novo.

* Mantém o padrão de nomenclatura (feat/EG-102-...) e a automação de status (PR aberto → CODE REVIEW) que já existem.

## **5.5 Squad de Revisão de Planos**

* Lê BI \+ status do ClickUp → propõe ajustes de prioridade e estratégia → registra como rascunho/comentário no ClickUp para o gestor decidir. HITL sempre.

## **5.6 Base de conhecimento e RAG (Fase 1.5)**

* **Regras determinísticas:** o arquivo *eg\_config.yaml* centraliza precificação, garantias e diretrizes de posicionamento. É carregado integralmente e validado de forma explícita pelo motor. **Atenção:** isso não é RAG, é configuração dura.

* **RAG (Cérebro semântico):** busca contextual sobre volumes densos de dados (propostas históricas, Raio-X, transcrições e manuais metodológicos). Stack: Postgres com *pgvector* (produção) ou Chroma (dev). Tool MCP *rag\_search(query, client\_id)* disponível para squads; o isolamento por ID de cliente é premissa básica de segurança para evitar vazamento.

* **Pré-requisito de escala:** implementação de RAG inicia somente após a maturação de 2+ squads core em produção. Repositório já prevê estrutura em *data/knowledge\_base/*.

## **5.7 Configuração de CRM (Kommo)**

Quando o cliente opera Kommo via EG, o /clients/{id}/ ganha dois arquivos adicionais além do config padrão: 

**kommo\_config.json** — dado estruturado para squads:

* **pipeline\_stages:** array de etapas (nome, ordem, SLA em horas)  
* **fields:** array de campos (nome, tipo, opções, obrigatoriedade por etapa)  
* **routing\_rules:** mapeamento UF → representante/time  
* **templates:** lista de modelos de chat configurados  
* **automations:** lista de triggers por etapa (evento → ação)  
* **plan:** plano contratado (Base/Advanced/Pro)  
* **waba:** true/false (coexistência ou API oficial)  
* **pending:** lista do que não foi implementado nesta fase 

**kommo\_context.md** — narrativa para contexto de squad:

* Decisões e motivos (por que este funil, por que estes campos)  
* O que foi e o que não foi implementado (e por quê)  
* Histórico de mudanças  
* Notas de onboarding (o que a equipe do cliente precisou de mais atenção) 

Estes dois arquivos são o insumo primário para:

* **Squad de onboarding Kommo** (configurar novo cliente a partir de template)

* **Squad de suporte/manutenção** (diagnosticar problema ou adicionar recurso)

* **Squad de relatório** (saber quais campos e funis ler por cliente)

* Qualquer treinamento futuro do time do cliente

Template base em /clients/\_template\_kommo/.

# **6\. Ideias moonshot (outro patamar)**

Visão de médio/longo prazo — registrar agora, executar com escala:

* **Plataforma EG do cliente** (área de login no site): dashboards, BI, relatórios, status do projeto e comunicação, com a marca EG. Versão 1 \= BI embutido com login; versões seguintes \= agentes de IA, conexão de WhatsApp (coexistence) e Kommo nativos. É o equivalente digital do kit físico: prova tangível do "tecnológico" do slogan.

* **Cartão NFC → hub digital → plataforma:** o cartão de acesso do kit (ver Documento de Kits) eventualmente aponta para o login da plataforma.

* **Infra própria (nano-AWS):** servidores próprios para hospedar sites, projetos e LLMs do time — porta para uma empresa de infra dentro do grupo. **Longe.** Hoje, serviços gerenciados (Railway, VPS) são mais baratos e rápidos. Só vale quando o volume justificar o custo fixo.

* **Biblioteca de prompts como ativo:** prompts versionados viram propriedade intelectual da EG — um diferencial que escala qualidade sem escalar gente.

# **7\. Procedimento ao criar um squad novo (checklist)**

1. Definir: é interno ou de entrega? (define o nível de autonomia e guardrails)

2. Definir o *resultado* (workflow) — um squad, um resultado.

3. Mapear os agentes-papel dentro dele.

4. Identificar as *tools* necessárias (reutilizar do /tools em MCP; criar nova só se não existir).

5. Definir o que é configuração de cliente (voz, regras, chaves) e isolar em /clients.

6. Definir os guardrails: max\_iterations, orçamento de API, ponto de HITL.

7. Prototipar em CrewAI; se for core de entrega e amadurecer, migrar para LangGraph.

8. Registrar prompts versionados (nunca soltos no código).

9. Testar com dois "clientes" diferentes para garantir zero vazamento de contexto.

10. Documentar o squad neste arquivo (o que faz, funcionalidades, modelo, risco).