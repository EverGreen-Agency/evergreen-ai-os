# Banco de Ideias EG

Atualizado em: 2026-06-25

## Estágio: CAPTURE

- **Hub: chat = dispatcher** (hub-chat-dispatcher)
  - Categoria: Cockpit | Horizonte: MEDIUM
  - Depende de: dispatcher | Habilita: tag-ativacao
  - Descrição: Barra de comando/chat no dashboard que é o dispatcher evoluído. Costura final do cockpit interno.

- **Tag de Ativação / Gatilho de Desenvolvimento** (tag-ativacao)
  - Categoria: Cockpit | Horizonte: MEDIUM
  - Depende de: hub-chat-dispatcher | Habilita: Nenhuma
  - Descrição: Card sinaliza prontidão ('pronto p/ desenvolver'); ao mover de estágio, ou quando Curador/Arquiteto identifica que pode começar, dispara o squad responsável — SOB aprovação humana (HITL). Não só software: qualquer demanda. Disparo automático full depende do hub-chat.

- **Captação multi-plataforma de propostas** (multi-plataforma-freelance)
  - Categoria: Feature | Horizonte: MEDIUM
  - Depende de: squad-hunter | Habilita: Nenhuma
  - Descrição: Ingestão de vagas de Upwork/freelancermap/Malt/Contra/etc. MVP semi-manual (cola URL ou texto — a maioria não tem API e bloqueia scraper). Fase 2: RSS de buscas salvas (Upwork) → n8n → webhook do Opensquad.

- **Squad Análise de Reuniões** (squad-reunioes)
  - Categoria: Squad | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Transcrição → SPICED, pendências, rascunho pra CRM. Absorve o loop pós-call (origem Kelvin Cleto): fim da call → score SPICED + atualiza Kommo + rascunho de contrato + DoDs + objeções retroalimentam o RAG. Era o bake-off de frameworks.

- **Squad Relatórios de Cliente** (squad-relatorios)
  - Categoria: Squad | Horizonte: A redefinir
  - Depende de: vector-store | Habilita: squad-raiox
  - Descrição: Meta/Google/Kommo → narrativa do relatório. Squad escreve; BI exibe os números.

- **Squad Onboarding / Kommo / ClickUp** (squad-onboarding)
  - Categoria: Squad | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: carteira-clientes
  - Descrição: Proposta aprovada → configura pipeline Kommo, campos de lead, tarefas ClickUp. Absorve a esteira de onboarding: contrato fechado → workspace ClickUp + DoDs padrão + pasta Drive + msg de boas-vindas. Parcialmente já existe (eg_setup).

- **Squad Kickoff Técnico** (squad-kickoff)
  - Categoria: Squad | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Escopo aprovado → árvore de tarefas ClickUp + esqueleto de repo GitHub. Possível overlap com squad-engenharia.

- **Squad Raio-X Automatizado** (squad-raiox)
  - Categoria: Squad | Horizonte: A redefinir
  - Depende de: squad-relatorios | Habilita: Nenhuma
  - Descrição: Coleta dados do cliente → 3 pilares (Oferta/Demanda/Conversão) → score e relatório de gargalo.

- **Squad de Criativos** (squad-criativos)
  - Categoria: Squad | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Matéria-prima: roteiros, variações A/B de copy.

- **Otimização de Tráfego (HITL)** (squad-trafego)
  - Categoria: Squad | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Assistido, nunca autônomo em verba (Write/Read barrier).

- **Squad SEO / GEO** (squad-seo-geo)
  - Categoria: Squad | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Frente de busca orgânica e generativa.

- **Squad de Voz do Cliente** (squad-voz-cliente)
  - Categoria: Squad | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: dossie-provas
  - Descrição: Minera feedback de múltiplas fontes → temas com contagem → prioridade. Alimenta Dossiê e RAG.

- **Log de áudio via WhatsApp** (log-audio-wpp)
  - Categoria: Feature | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Equipe manda áudio pós-reunião/otimização → transcreve, identifica cliente, injeta nota no card ClickUp/CRM.

- **SLA Watchdog (WhatsApp)** (sla-watchdog)
  - Categoria: Feature | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Monitora grupos com cliente; se ninguém responde dentro do SLA, alerta Guilherme/Eduardo.

- **Dossiê de Provas de Confiança** (dossie-provas)
  - Categoria: Feature | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: vector-store
  - Descrição: Agente semanal varre GA4/Ads → cataloga vitórias reais auditadas → alimenta propostas e RAG.

- **Health Score por Dados** (health-score)
  - Categoria: Feature | Horizonte: A redefinir
  - Depende de: dossie-provas | Habilita: Nenhuma
  - Descrição: Cruza frequência de contato × performance. CPA sobe + 15d sem call → tarefa 'Alerta de Risco'.

- **Icebreaker de Prospecção** (icebreaker)
  - Categoria: Feature | Horizonte: A redefinir
  - Depende de: squad-prospector | Habilita: Nenhuma
  - Descrição: Varre site/LinkedIn do prospect → mini Raio-X personalizado → cold outreach com valor antes do pitch.

- **Segundo Cérebro integrado (AI OS)** (segundo-cerebro)
  - Categoria: Infra | Horizonte: A redefinir
  - Depende de: vector-store | Habilita: Nenhuma
  - Descrição: LLM plugado em Drive/ClickUp/Kommo/transcrições/propostas — contexto 360º em tempo real.

- **Vector store EG (pgvector)** (vector-store)
  - Categoria: Infra | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: segundo-cerebro
  - Descrição: Corpus: propostas, Raio-X, transcrições, cases. rag_search(query, client_id) com isolamento. Timestamps + decay.

- **Context Decay** (context-decay)
  - Categoria: Infra | Horizonte: A redefinir
  - Depende de: vector-store | Habilita: Nenhuma
  - Descrição: Toda entrada do vector store com timestamp + peso de recência. Metodologia antiga se invalida sozinha.

- **Camada LLM-agnostic** (llm-agnostic)
  - Categoria: Infra | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Roteamento (LiteLLM/OpenRouter) entre squads e provedores. Trocar de modelo = uma linha.

- **Geração automática de client_config** (client-config-auto)
  - Categoria: Infra | Horizonte: A redefinir
  - Depende de: squad-onboarding | Habilita: carteira-clientes
  - Descrição: Squad de onboarding lê 1ª reunião → gera client_config.yaml. Config da EG permanece manual.

- **Pesquisa acadêmica aplicada** (pesquisa-academica)
  - Categoria: Service | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Aplicar conceitos de fronteira (MoA, ensembling) ao trabalho de cliente mais rápido que concorrentes.

- **Ensemble + Juiz (Mixture of Agents)** (ensemble-juiz)
  - Categoria: Infra | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Painel de modelos paralelos + sintetizador juiz na etapa de julgamento crítico. Só na etapa cara.

- **Forward Deployed AI** (forward-deployed)
  - Categoria: Service | Horizonte: NEW_COMPANY
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Modelos open-source na infra do cliente p/ setores de privacidade severa. DNA de outra empresa.

- **Cockpit interno → produto** (cockpit-produto)
  - Categoria: Service | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Produtizar o cockpit como SaaS vertical p/ agências/consultorias. Só após validado internamente.

- **Precificação por valor/eficiência** (precificacao-valor)
  - Categoria: Commercial | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Setup alto + fee de estratégia. Não cobrar por hora quando a IA automatiza 70%.

- **Service-as-a-Software (oferta invisível)** (service-as-software)
  - Categoria: Commercial | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Vender Growth operado por máquina interna invisível. Tecnologia é bastidor, narrativa é crescimento.

- **AI-CMO como justificativa de MRR** (ai-cmo-mrr)
  - Categoria: Commercial | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Fee não é manutenção de robô — é aluguel do cérebro estratégico. Argumento central de retenção.

- **Dogfooding** (dogfooding)
  - Categoria: Commercial | Horizonte: NOW
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Rodar 100% da operação EG nos próprios squads antes de vender. Princípio inegociável.

- **Fábrica: backoffice vs. frontoffice** (fabrica-back-front)
  - Categoria: Commercial | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: IA massacra o backoffice (contratos, ClickUp, relatórios). Humano foca julgamento e fechamento.

- **Change Management no cliente** (change-management)
  - Categoria: Service | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Playbook que mostra que a IA tira o trabalho braçal, não o emprego. Reduz churn por sabotagem.

- **Vibe Building (blocos reutilizáveis)** (vibe-building)
  - Categoria: Infra | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Blocos instanciáveis (qualificador WA, dashboard GA4, qualificador CRM) em vez de reescrever do zero.

- **Auditoria de Prontidão AI-First** (auditoria-ai-first)
  - Categoria: Service | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Auditar operação do cliente em 7 dimensões → score + plano. Entregável high-ticket (ai-firstify).

- **Prospecção WhatsApp (Evolution API)** (prospec-wpp-evolution)
  - Categoria: Feature | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: API não-oficial em VPS p/ outbound frio, chip fleet aquecido. Oficial Meta só no inbound.

- **VoIP inteligente de qualificação** (voip-qualificacao)
  - Categoria: Service | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Agente de voz (ElevenLabs+Twilio) qualifica por telefone. Mais barato que SDR, mais conversão que e-mail.

- **Princípio: IA se adapta ao cliente** (ia-adapta-cliente)
  - Categoria: Commercial | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Nunca substituir o legado do cliente. A IA entra via API, extrai, age, sai. Reduz fricção de venda.

- **Segundo Cérebro — stack de memória (Zep)** (stack-memoria-zep)
  - Categoria: Infra | Horizonte: A redefinir
  - Depende de: vector-store | Habilita: Nenhuma
  - Descrição: Zep como camada de retenção longa sobre o pgvector. Fase 1.5 do RAG.

- **Skill brand-guidelines-EG** (skill-brand-eg)
  - Categoria: Infra | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Aplica identidade EG (musgo/menta/baunilha, Helvetica Neue) a qualquer artefato. Evolui o eg_style.js.

- **Skill squad-creator-EG** (skill-squad-creator)
  - Categoria: Infra | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Scaffolda um squad novo (estrutura, prompts-papel, config, DoD). O scaffolder virando skill formal.

- **eg-mcp-tools (MCP padronizado)** (eg-mcp-tools)
  - Categoria: Infra | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Servidores MCP (clickup_writer, kommo_writer) reutilizáveis, com annotations de risco = Write/Read barrier.

- **Skill raio-x-skill** (skill-raiox)
  - Categoria: Infra | Horizonte: A redefinir
  - Depende de: squad-relatorios | Habilita: Nenhuma
  - Descrição: Aplica a metodologia Raio-X (3 pilares, scoring) a dados de um cliente/prospect.

- **Editar ideias + ver detalhe / 1 doc por ideia** (idea-detail-edit)
  - Categoria: Cockpit | Horizonte: NOW
  - Depende de: banco-ideias | Habilita: Nenhuma
  - Descrição: No Kanban, poder editar título/desc/conexões e abrir um detalhe completo (hoje só expande resumo). Opção: um .md por ideia (notes) ligado ao card, em vez de só o JSON. Modal de edição é o caminho v1.

- **Aba Banco de Arquitetura no dashboard** (banco-arquitetura-tab)
  - Categoria: Cockpit | Horizonte: MEDIUM
  - Depende de: banco-arquitetura | Habilita: Nenhuma
  - Descrição: Renderizar o arquitetura.md (e o catálogo de squads) numa aba, para ver/navegar a estrutura viva. Hoje o Banco de Arquitetura existe só como markdown, sem tela.

- **Carteira ↔ ClickUp (puxar pastas, sincronizar cards)** (clients-clickup-sync)
  - Categoria: Feature | Horizonte: MEDIUM
  - Depende de: carteira-clientes, squad-onboarding | Habilita: Nenhuma
  - Descrição: A aba Clientes puxa as pastas/listas reais do ClickUp e cria/atualiza cards a partir do config.json (diff desejado vs. real), sob aprovação (Write/Read barrier). É a Carteira virando plano de controle de verdade.

- **Portabilidade dos bancos (não ser refém do opensquad)** (banks-portability)
  - Categoria: Infra | Horizonte: MEDIUM
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: Os bancos (ideias/stack/arquitetura) são arquivos JSON/MD portáveis, mas vivem dentro de _opensquad/. Avaliar mover para um diretório de dados top-level (ex: knowledge/ ou data/) p/ desacoplar do framework. Decisão: arquivos > BD (portabilidade + git).

- **Banco de Ideias auto-atualizável** (idea-bank-auto)
  - Categoria: Cockpit | Horizonte: MEDIUM
  - Depende de: hub-chat-dispatcher, log-audio-wpp | Habilita: Nenhuma
  - Descrição: Banco se atualizar sozinho, principalmente os ESTÁGIOS (hoje o humano move os cards). Reconciliador lê sinais de realidade — existência do artefato (pasta/arquivo do squad), status no ClickUp, ou merge no repo do cliente — e propõe mudança de estágio. Só a metade 'já foi construído?' automatiza; 'a gente liga pra isso?' (capture↔evaluation) fica humano. Captura automática de novas ideias é a outra face.

- **Filosofia Visual EG (Manifesto de Design)** (filosofia-visual-eg)
  - Categoria: Infra | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: skill-brand-eg, idea-detail-edit
  - Descrição: Manifesto estético que traduz a marca EG em regras visuais rígidas (espaço, cor, composição) para garantir que qualquer material gerado por IA tenha padrão boutique.

- **Web Artifacts Builder (Motor de UI Rica)** (web-artifacts-builder)
  - Categoria: Infra | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: cockpit-produto, banco-ideias-visual, idea-detail-edit
  - Descrição: Padrão frontend (React/Vite/Tailwind) com regras anti-slop para a IA gerar Hub, Cockpit e Landing Pages sem cara de template genérico.

- **Matriz de Risco Comercial (Lead Scoring)** (matriz-risco-comercial)
  - Categoria: Commercial | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: squad-hunter, squad-prospector
  - Descrição: Framework quantitativo (Severidade x Probabilidade) para qualificar leads e projetos, decidindo matematicamente se a EG aceita, recusa ou escala o negócio.

- **Estrutura Modal de Briefing** (estrutura-modal-briefing)
  - Categoria: Feature | Horizonte: A redefinir
  - Depende de: Nenhuma | Habilita: squad-reunioes, dossie-provas
  - Descrição: Padronização de síntese da IA em 3 modos operacionais (Daily, Topic, Incident) garantindo consumo ultra-rápido e focado pelos founders.

- **Arquitetura de Handoff Assíncrono (Inboxes)** (handoff-assincrono-inboxes)
  - Categoria: Infra | Horizonte: A redefinir
  - Depende de: hub-chat-dispatcher | Habilita: Nenhuma
  - Descrição: Padrão arquitetural (Pub/Sub) onde squads não se chamam diretamente. Geram outputs em Inboxes para o Dispatcher rotear, evitando acoplamento.

- **ClickUp Direct Injector (Client Insights)** (clickup-direct-injector)
  - Categoria: Feature | Horizonte: A redefinir
  - Depende de: squad-reunioes | Habilita: Nenhuma
  - Descrição: Ferramenta para squads analíticos enviarem ideias de campanha diretamente para a pasta do cliente no ClickUp, pulando o banco de ideias da EG.

## Estágio: EVALUATION

- **Adoção do CodeGraph** (codegraph)
  - Categoria: Infra | Horizonte: MEDIUM
  - Depende de: Nenhuma | Habilita: banco-arquitetura
  - Descrição: MCP que indexa o repo (tree-sitter + SQLite) e dá mapa de código ao Arquiteto. Aceleraria a leitura ao vivo do repo em projetos grandes; hoje o Arquiteto usa Glob/Grep/Read direto.

## Estágio: PROCESSING

- **Banco de Ideias** (banco-ideias)
  - Categoria: Cockpit | Horizonte: NOW
  - Depende de: Nenhuma | Habilita: hub-chat-dispatcher
  - Descrição: Esta ferramenta. Curador faz intake/dedup/conexão das ideias; tela no dashboard lê o banco real.

- **Arquiteto (autovigilância)** (guardiao-arquiteto)
  - Categoria: Squad | Horizonte: NOW
  - Depende de: banco-arquitetura | Habilita: Nenhuma
  - Descrição: CONSTRUÍDO (squad eg_arquiteto). IA de autovigilância que audita ideia/projeto INTERNO LENDO O REPO AO VIVO (escaneia squads/, stack.json, .mcp.json, código) — não um inventário congelado. 4 gates: squad / integração / stack / princípios. Consultivo, HITL. O Cartógrafo foi descartado por redundância: o Arquiteto lê o repo direto.

- **Banco de Arquitetura** (banco-arquitetura)
  - Categoria: Infra | Horizonte: NOW
  - Depende de: Nenhuma | Habilita: guardiao-arquiteto
  - Descrição: Guarda o PORQUÊ da estrutura — identidade, princípios de engenharia e decisões arquiteturais. NÃO é mais espelho do filesystem: o inventário (squads/stack/integrações) o Arquiteto lê do repo ao vivo. Aba Arquitetura no dashboard mostra o doc + Mapa de Squads ao vivo.

- **Squad de Engenharia (SDD + ADR)** (squad-engenharia)
  - Categoria: Squad | Horizonte: NOW
  - Depende de: banco-stack | Habilita: Nenhuma
  - Descrição: Projetos de cliente: brief → spec.md (SDD) → ADRs do porquê de cada escolha → scaffold de repo → sub-agentes por task.

- **Banco de Stack** (banco-stack)
  - Categoria: Infra | Horizonte: MEDIUM
  - Depende de: Nenhuma | Habilita: squad-engenharia
  - Descrição: Catálogo vivo (Tech Radar) de tecnologias p/ projetos. Status por anel: Assess (vale testar) · Trial (testando agora) · Adopt (padrão) · Hold (evitar). Entrada da Engenharia; ADRs são a saída.

- **Carteira de Clientes** (carteira-clientes)
  - Categoria: Cockpit | Horizonte: MEDIUM
  - Depende de: squad-onboarding | Habilita: Nenhuma
  - Descrição: Plano de controle ativo: por cliente, serviços/tags, configs ClickUp/Kommo, log. Provisiona o ClickUp. Fala com o eg_setup.

- **Squad de Propostas (eg_proposals)** (squad-hunter)
  - Categoria: Squad | Horizonte: NOW
  - Depende de: Nenhuma | Habilita: multi-plataforma-freelance
  - Descrição: CONSTRUÍDO. Scout extrai briefing da oportunidade → Closer escreve a proposta EG (Closer agora consulta o Tech Radar). Consolida o antigo squad-propostas (qualificação fit vs. ICP + rascunho de proposta padrão EG). Reativo: você traz a vaga. Renomeado de eg_hunter (criado pelo Gemini).

- **Auto-melhoria dos Squads (eg_meta)** (auto-melhoria-squads)
  - Categoria: Feature | Horizonte: NOW
  - Depende de: Nenhuma | Habilita: Nenhuma
  - Descrição: CONSTRUÍDO. Squad eg_meta: lê o memories.md + runs de um squad-alvo e PROPÕE diff nos .agent.md dele; aplica só o aprovado (HITL). Fecha o loop: o runner já captura aprendizados; o eg_meta os vira melhoria de prompt.

- **Squad Prospector (eg_prospector)** (squad-prospector)
  - Categoria: Squad | Horizonte: NOW
  - Depende de: Nenhuma | Habilita: icebreaker
  - Descrição: CONSTRUÍDO. Topo de funil: ICP → caça via MCPs reais (Apollo/Lusha/Clay/Vibe) → score de fit → lista qualificada → Kommo/eg_proposals (HITL). Separado do eg_proposals. Sem scraping.

## Estágio: PROJECT

*Nenhuma ideia neste estágio.*

## Estágio: COMPANY

*Nenhuma ideia neste estágio.*
