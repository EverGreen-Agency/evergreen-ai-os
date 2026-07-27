# Fila de execução do Bioma MVP

Este arquivo é o quadro operacional para Codex, Claude Code, Antigravity ou outra LLM continuarem o trabalho sem depender do histórico de chat.

O `ROADMAP-MVP.md` registra escopo e estado. Este arquivo registra ordem, dependências, dono e validação das próximas entregas.

## Protocolo obrigatório

Antes de trabalhar:

1. Rode `git status --short --branch --untracked-files=all`.
2. Leia `ROADMAP-MVP.md`, este arquivo e a spec relacionada.
3. Escolha uma tarefa com estado `TODO` e escreva no topo do commit/relato: `CLAIM <ID> <IA> <data>`.
4. Não assuma uma segunda tarefa que edite os mesmos arquivos.
5. Faça um commit por tarefa ou marco verificável.
6. Rode a validação declarada na linha da tarefa.
7. Atualize o estado para `DONE`, `BLOCKED` ou devolva para `TODO` com motivo.

Estados:

- `TODO`: livre para execução.
- `DOING`: alguém está executando; não duplicar.
- `BLOCKED`: depende de credencial, decisão ou trabalho anterior.
- `DONE`: código/documento e validação concluídos.

## Ordem de entrega

### Onda 0 — Contratos e deploy-ready

| ID | Estado | Frente | Entrega | Dependência | Validação |
|---|---|---|---|---|---|
| CORE-001 | DONE | Full-stack | Corrigir estados `queued/running` do Client Hub | nenhuma | smoke Performance + portal |
| CORE-002 | DONE | Full-stack | Criar solicitação de aprovação EG → cliente | CORE-001 | smoke API + build web |
| DPL-001 | DONE | Backend | Cookie/CORS por ambiente e `/health/ready` | nenhuma | compile + smoke API |
| DPL-002 | DONE | DevOps | Config as Code Railway/Vercel | DPL-001 | validar JSON + Docker build |
| DPL-003 | DONE | QA/DevOps | CI web/API/worker no GitHub Actions | DPL-002 | workflow parse + execução no PR |
| DPL-004 | DONE | Backend | Bloquear seed e criar bootstrap admin seguro | DPL-001 | bootstrap em banco descartável |
| DPL-005 | BLOCKED | Operação | Criar staging Railway + Postgres | DPL-001..004 | deploy + `/health/ready` |
| DPL-006 | BLOCKED | Operação | Criar staging Vercel e domínios | DPL-005 | build + login no browser |
| DPL-007 | BLOCKED | QA | Smoke remoto de staging | DPL-006 | `smoke_remote.py` |

Bloqueio de DPL-005..007: acesso às contas Railway/Vercel, domínio e secrets.

### Onda 1 — Superfícies comerciais do MVP

| ID | Estado | Frente | Entrega | Dependência | Validação |
|---|---|---|---|---|---|
| WEB-CRM-001 | DONE | Frontend | Kanban de leads consumindo endpoints CRM existentes | CORE-002 | build + fluxo criar/mover lead |
| WEB-FIN-001 | DONE | Frontend | Tela financeira consumindo contratos/faturas existentes | CORE-002 | build + CRUD financeiro |
| WEB-PERF-001 | DONE | Frontend | Analytics consumir overview real de Performance | CORE-001 | build + dados seed marcados demo |
| WEB-PERF-002 | DONE | Frontend | Páginas Ads, GA4, GSC e GTM | WEB-PERF-001 | build + estados vazio/erro/freshness |
| AUTH-001 | DONE | Full-stack | EG admin cria/convida usuário cliente (link copiável) | DPL-004 | smoke de convite + isolamento |
| GATE-001 | DONE | Full-stack | Feature-gating de módulos por organização + campo preparatório `parent_organization_id` (não equivale a white-label pronto) | AUTH-001 | smoke de gating (403/200 por módulo) |
| AUTH-002 | DONE | Full-stack | Fluxo seguro de recuperação/rotação de senha (link 2h + troca logado) | AUTH-001 | token expirável + teste (`smoke_password.py`) |
| AUTH-003 | DONE | Full-stack | Google como vínculo deslinkável (login social invite-only, nunca cria conta) | AUTH-001 | `smoke_oauth.py` + credenciais reais no ambiente |
| FILE-001 | DONE | Full-stack | Upload/storage de documentos com visibilidade por cliente | AUTH-001 | upload, leitura autorizada e exclusão |
| WEB-BUNDLE-001 | DONE | Frontend | Dividir bundle principal e lazy-load de views | WEB-PERF-002 | build sem chunk principal > 500 kB |

Arquivos sensíveis: `apps/web/src/lib/api.ts`, `App.tsx`, views e estilos. Uma IA frontend por vez.

### Onda 1.5 — Contexto operacional e escala

| ID | Estado | Frente | Entrega | Dependência | Validação |
|---|---|---|---|---|---|
| WEB-CTX-001 | DONE | Frontend | Restaurar CRM, financeiro e métricas EG preservando os Hubs de Cliente | WEB-CRM-001..PERF-001 | tsc + build + isolamento por rota |
| WEB-NAV-001 | DONE | Frontend | Navegador pesquisável de workspaces com recentes; sem dropdown longo na Sidebar | WEB-CTX-001 | tsc + build + QA teclado/mobile |
| ARCH-CTX-001 | DONE | Arquitetura | ADR `Platform → Tenant/Agência → Workspaces`, limites white-label e billing | WEB-CTX-001 | `docs/adr/0001-tenant-workspace-hierarchy.md` |
| TEAM-001 | DONE | Full-stack | Times, memberships e atribuições para carteira por gestor/time | ARCH-CTX-001 | backend, smokes e gestão visual em Configurações |
| DATA-WS-001A | DONE | Full-stack | Persistir identidade de workspace, backfill, provisionamento e descoberta no navegador | ARCH-CTX-001 | compile + smoke API + tsc/build |
| DATA-WS-001B | DONE | Backend | Migrar APIs/Performance de `client_id` para `workspace_id` com adapters e dual-read/write | DATA-WS-001A | paridade + smokes + backfill |
| AUTHZ-WS-001 | DONE | Full-stack | Separar platform/tenant/workspace roles e testar EG→cliente, cliente→cliente e time→workspace | TEAM-001, DATA-WS-001B | matriz automatizada de autorização |
| WEB-NAV-002 | DONE | Full-stack | Favoritos, “Minha carteira” e visões salvas alimentados por assignments reais | TEAM-001 | smoke de persistência + tsc/build |
| AI-CONTENT-001 | DONE | Full-stack/Worker | Gerar rascunhos sociais por workspace com metodologia, fila, auditoria e provider OpenAI | AUTHZ-WS-001 | preview local + mock Responses API + tsc/build |
| TASK-AUTHZ-001 | DONE | Backend | Extrair repositório de tarefas e aplicar `view`/`manage_work`, BOLA/IDOR e invariantes de assignee/owner/dependencies | AUTHZ-WS-001 | `smoke_tasks.py` com matriz de papéis e cliente A→B |
| TASK-DOM-001 | DONE | Full-stack | CRUD real de subtarefas/dependências, resposta 204 segura e recorrência idempotente | TASK-AUTHZ-001 | `smoke_tasks.py` + tsc/build |
| CLIENT-LIFE-001 | DONE | Full-stack | Trocar delete cotidiano por archive e separar purge confirmado com auditoria e limpeza S3 | AUTHZ-WS-001 | `smoke_api.py` |
| VAULT-001 | DONE | Full-stack | Cofre de acessos por workspace: cifra, depósito do cliente, RBAC, rotação e auditoria | AUTHZ-WS-001 | migration 0021 + `smoke_vault.py` + compile/OpenAPI + tsc/build |
| VAULT-002 | DONE | Full-stack | Campos equivalentes à planilha de acessos: plataforma, conta, usuário, e-mail, senha, outro método e link | VAULT-001 | migration 0024 + compile/OpenAPI + tsc; smoke mutável passa a exigir banco isolado |
| PROJECT-001 | DONE | Full-stack | Motor nativo projeto → contrato → escopo → entrega/aceite + UI do Hub | TASK-DOM-001 | migrations 0022/0023 + `smoke_projects.py` + compile/OpenAPI + tsc/build |
| PROJECT-TECH-001 | DONE | Full-stack | Fases ordenadas, entregas por fase, links de proposta/especificação e feed de progresso/bloqueio/teste/release para projetos Tech | PROJECT-001 | `smoke_projects.py` cobre visibilidade do cliente, conteúdo interno e fase cruzada |
| PROJECT-GH-001 | DONE | Full-stack | Ligar projetos Tech em leitura a repositório, issues, PRs e commits sem perder o Bioma como fonte canônica | PROJECT-001 | migration 0028 + adapter mockado sem rede + compile/OpenAPI + tsc/build |
| PROJECT-GH-002 | DONE | Full-stack | Escrita GitHub idempotente e auditada com confirmação HITL | PROJECT-GH-001 | migrations 0037/0049 + teste unitário de transação/marcador + `smoke_github_write.py` |
| PROJECT-PLAN-001 | DONE | Full-stack | Planejador versionado contrato/briefing/onboarding → aprovação → fases e entregas para Tech, Growth e Social | PROJECT-001, AI-OPS-001 | migration 0048 + pytest sem banco + OpenAPI + tsc/build |
| INT-VOIP-001 | PLANNED | Produto/Arquitetura | Desenhar VoIP de prospecção com SIP/provedor, consentimento, gravação, LGPD, CRM e métricas | decisão de produto + requisitos comerciais | ADR e spike sem chamada real |
| AI-METHOD-001 | DONE | Produto/Full-stack | Evoluir Estúdio IA para imagem, brand book versionado, metodologia e score cliente | AI-CONTENT-001 | entregue via cluster Raio-X/brand book/IA multimodal (Onda 5); smokes isolados + pytest + tsc/build |
| AI-OPS-001 | DONE | Full-stack | Control plane interno com templates versionados, execução idempotente, etapas ordenadas e checkpoints HITL | AI-CONTENT-001 | pytest + smoke isolado + contrato + tsc/build |
| FINOPS-AI-001 | DONE | Full-stack | Dashboard EG de assinaturas, custos, uso e cotas observadas de IA, sem inferir saldo indisponível | AI-OPS-001 | migration 0029 + smoke isolado + npm audit |

### Onda 2 — Integrações reais e migração legada

| ID | Estado | Frente | Entrega | Dependência | Validação |
|---|---|---|---|---|---|
| INT-CU-001 | DONE | Backend/Operação | Importador ClickUp env-only, tenant-scoped, transacional por pasta e idempotente por external ID | DPL-005 | importador compilado + smoke mockado |
| INT-CU-002 | DONE | Backend | Mapear status Social/Growth/Tech por lista | INT-CU-001 | fixture local; lista real segue bloqueada por credencial |
| INT-CU-003 | DONE | Produto/Full-stack | Superseded em 2026-07-22: Bioma passa a ser fonte de verdade; manter somente rastreabilidade do legado | PROJECT-001 | ADR 0002 revisado + UI sem sync |
| INT-CU-RETIRE-001 | DONE | Dados/Backend | Reconciliar import, gerar snapshot final e remover endpoint/config/adapter ClickUp | PROJECT-001 | relatório sem órfãos (`bioma/docs/clickup-legacy-reconciliation-2026-07-24.json`) + `pytest`/`tsc`/compile verdes |
| INT-SF-001 | BLOCKED | Arquitetura/Parcerias | Definir contrato SleekFlow como adapter omnichannel | proposta de parceria + documentação/API oficial | ADR de eventos, auth, LGPD e limites aprovado |
| INT-G-001 | BLOCKED | Backend/Operação | Validar Google Ads real | DPL-005 | comparação por campanha/data |
| INT-G-002 | BLOCKED | Backend/Operação | Validar GA4 real | DPL-005 | comparação aquisição/eventos |
| INT-G-003 | BLOCKED | Backend/Operação | Validar GSC real | DPL-005 | comparação consultas/páginas |
| INT-G-004 | BLOCKED | Backend/Operação | Validar GTM real | DPL-005 | snapshot comparado |
| INT-LI-001 | TODO | Arquitetura | ADR LinkedIn orgânico/Ads: API, CSV e limites | nenhuma | ADR aprovado |
| INT-LI-002 | BLOCKED | Backend | Implementar caminho LinkedIn aprovado | INT-LI-001 | fixture + conta controlada |

### Onda 3 — Segurança, operação e QA

| ID | Estado | Frente | Entrega | Dependência | Validação |
|---|---|---|---|---|---|
| SEC-001A | DONE | Backend | Testar sessão revogada | DPL-001 | smoke API |
| SEC-001B | DONE | Backend | Testar sessão expirada | DPL-001 | teste automatizado |
| SEC-002 | DONE | Backend | Massa mínima de payload inválido | CORE-002 | smoke API |
| SEC-003 | DONE | Backend | Rate limit de login em processo único | DPL-005 | teste de excesso |
| SEC-004 | TODO | QA | Carga básica em leitura/login | DPL-006 | relatório p95/erro |
| SEC-005 | TODO | Segurança | ZAP/Burp em staging autorizado | DPL-006 | relatório e correções P0/P1 |
| SEC-003B | DONE | Backend | Migrar rate limit de login para Postgres (multi-réplica) | SEC-003 | migration 0026 + pytest da chave/janela |
| CONTRACT-001 | DONE | Full-stack | Gerar tipos TS a partir do OpenAPI e eliminar drift manual | WEB-PERF-001 | `export_openapi.py --check` + trava `contract-conformance.ts` na CI |
| QUEUE-001 | DONE | Backend | Reaper/retry para job preso em `running` | DPL-005 | migration 0025 + `reclaim_stalled_jobs` (lease/attempts) + `smoke_reaper.py` (requeue/fail/intocado, sync e ai_content) — passou contra Postgres local |
| QUALITY-001 | DONE | Backend | Extrair helpers de acesso duplicados + suíte pytest de política/invariantes (auditoria 07-12, itens 11-12) | AUTHZ-WS-001 | `access.resolve_accessible_client` + `apps/api/tests` (58 testes) |
| DB-001 | TODO | Backend/Operação | Medir conexões e decidir pool Postgres | SEC-004 | relatório de carga e limite |
| OPS-001 | BLOCKED | Operação | Backup diário + teste de restore | DPL-005 | restore drill documentado |
| QA-001 | BLOCKED | Humano/QA | Assinar desktop, DevTools e mobile | DPL-006 | checklist no roadmap |
| LGPD-001 | DOING | Jurídico/Produto | Mapa de dados, DPA, retenção e subprocessadores (rascunho em `bioma/LGPD-001.md`; gate do piloto) | nenhuma | checklist aprovado e assinado |

### Onda 4 — Produção

| ID | Estado | Frente | Entrega | Dependência | Validação |
|---|---|---|---|---|---|
| PRD-001 | DONE | Produto | Runtime backend MVP definido: Railway + Postgres | nenhuma | decisão registrada em `DEPLOY.md` |
| PRD-002 | BLOCKED | Release | PR `develop -> main` | ondas 1..3, AUTH-001 | CI verde e review |
| PRD-003 | BLOCKED | Operação | Infra e banco de produção isolados | PRD-001..002 | `/health/ready` |
| PRD-004 | BLOCKED | Release | Deploy web/API/jobs | PRD-003 | smoke remoto |
| PRD-005 | BLOCKED | QA/Produto | Liberação gradual e aceite | PRD-004 | checklist assinado |

### Onda 5 — Mega-plataforma (módulos além do MVP HM)

Módulos das Fases 2–4 do `PLANO-MESTRE.md` (`_opensquad/_memory/engenharia/mega-plataforma/`), construídos direto no Bioma em vez do greenfield Next.js/Supabase abandonado — o Bioma é o veículo da mega-plataforma, não um MVP à parte dela.

| ID | Estado | Frente | Entrega | Dependência | Validação |
|---|---|---|---|---|---|
| MOD-COMERCIAL-001 | DONE | Full-stack | Raio-X: score 3 pilares (Oferta/Demanda/Conversão), diagnóstico e planos de ação de 90 dias | AUTHZ-WS-001 | `smoke_commercial.py`; gate de módulo `commercial` corrigido nesta consolidação |
| MARKET-RESEARCH-001 | DONE | Full-stack/Worker | Pesquisa de mercado da Operação EG: refinamento assistido, relatório versionado com pesquisa web e fontes verificadas, playbook de prospecção e oportunidades Growth/Social; sem publicação em Hub | AUTHZ-WS-001 + FINOPS-AI-001 | `tests/test_market_research.py` + OpenAPI/tipos + tsc/build; execução live real depende de `OPENAI_API_KEY` |
| CLIENT-PROFILE-001 | DONE | Full-stack | Contexto estruturado no Hub: perfil por workspace de cliente, completude derivada, controle `view`/`manage_work`, auditoria e snapshot para rascunho do planejador | AUTHZ-WS-001 + PROJECT-PLAN-001 | `tests/test_client_profiles.py` + `tests/test_project_planner.py` + OpenAPI/tipos + tsc/build |
| MOD-CONTEUDO-002 | DONE | Full-stack/Worker | Estúdio IA: geração de imagem e roteiro de vídeo além de posts sociais | AI-CONTENT-001 | `smoke_ai_content.py` (preview + schema por tipo) |
| MOD-BI-SOCIAL-001 | DONE | Backend/Worker | Sync real de Meta Ads (Graph API insights) e LinkedIn Ads (adAnalytics + resolução de nome de campanha), ligado ao mesmo pipeline de fila/scheduler do Google Ads | WEB-PERF-002 | migration 0041 (habilita os providers + corrige tabelas sem `updated_at`) + `smoke_performance_social.py` (falha alta sem token, parse mockado, persistência); validação contra conta real fica como `INT-META-001`/`INT-LI-002`, bloqueada por credencial |
| INT-META-001 | BLOCKED | Backend/Operação | Validar Meta Ads real | DPL-005 + `META_ADS_ACCESS_TOKEN` | comparação por campanha/data |
| MOD-COMUNICACAO-WPP-001 | DONE | Full-stack/Worker | Bridge WhatsApp multi-provider (Evolution/Meta Cloud/Z-API) com token cifrado em repouso | AUTHZ-WS-001 | `smoke_whatsapp_multiprovider.py` cobre cifra e decifra |
| MOD-SQUADS-AUTONOMOS-001 | DONE | Full-stack/Worker | Agentes autônomos por pilar com execução real via LLM (Responses API + JSON schema) e FinOps por workspace | AI-CONTENT-001 | `smoke_autonomous_squads.py` cobre prévia honesta e execução live mockada |
| MOD-MARCA-001 | DONE | Full-stack | Brand book versionado (tom de voz, arquétipo, posicionamento, regras de copy) | AUTHZ-WS-001 | `smoke_mcp_brand_calendar.py` |
| MOD-CALENDARIO-001 | DONE | Full-stack | Calendário editorial nativo com estágios (ideação→publicado) | AUTHZ-WS-001 | `smoke_mcp_brand_calendar.py` |
| MOD-MCP-001 | DONE | Backend | Servidor MCP stdio para orquestração externa (Fóton/Antigravity) com `service_token` + escopo fixo por workspace | MOD-SQUADS-AUTONOMOS-001 | `smoke_mcp_brand_calendar.py` cobre negação sem token e cross-workspace |
| MOD-LOGISTICA-KITS-001 | DONE | Full-stack | Peças (fornecedor/custo/estoque), definições de kit por nível e envios por cliente (em_producao→enviado→entregue) | AUTHZ-WS-001 | migration 0038 + `smoke_kits.py` (BOLA, peça inexistente, custo total, ciclo de status) |
| MOD-RH-001 | DONE | Full-stack | Rampagem 15/30/60/90 dias (marcos configuráveis por tenant) + satisfação/NPS por workspace + carteira/performance de gestor agregando projetos e entregas já existentes | TEAM-001 | migration 0039 + `smoke_rh.py` (plano duplicado, marco inexistente, carteira própria vs alheia) |
| MOD-SAAS-BILLING-001 | TODO | Full-stack | Stripe: planos, cupons, cotas, clientes legado, suspensão de acesso (retenção, nunca backdoor) | mod-multitenant (já herdado) | — |
| MOD-CERTIFICACOES-001 | DONE | Full-stack | Certificações de funcionário e da própria EG (status active/expiring_soon/expired calculado, sem cron) | TEAM-001 | migration 0040 + `smoke_certifications.py` (autoatendimento vs. gate de terceiro, 3 status, certificação sem dono) |
| MOD-CONTRATOS-001 | DONE | Arquitetura | ADR: Autentique permanece externo como adapter de assinatura; Bioma é fonte de verdade do contrato (campos já existiam em PROJECT-001) | PROJECT-001 | `docs/adr/0003-autentique-contratos.md` |
| MOD-PROPOSTAS-RADAR-001 | IN_PROGRESS | Full-stack/Worker | Captura manual + 3 fontes RSS públicas + feeds configuráveis, scoring determinístico, auditoria por URL e rascunho assistido nos três pilares; conectores adicionais ainda não existem | AUTHZ-WS-001 | migration 0046 + testes unitários sem banco; validação live de fontes segue pendente |
| MOD-BIGDATA-ROI-001 | IN_PROGRESS | Full-stack | Win rate considera apenas decisões; custo, CPP, CAC e ROI usam custos observados do período corrente. Coortes/períodos históricos ainda precisam ser modelados | MOD-PROPOSTAS-RADAR-001 | `get_proposal_analytics_metrics` + testes de divisão e ausência de custo |
| INT-AUT-001 | BLOCKED | Backend | Escrever/ler adapter Autentique real (criar documento, webhook de assinatura) | credencial/API key Autentique | comparação com documento assinado real |

## Template de handoff

Copie ao trocar de LLM ou sessão:

```text
Bioma — handoff
Branch/commit:
Task ID:
Estado: TODO | DOING | BLOCKED | DONE
Arquivos alterados:
O que foi implementado:
Validações executadas:
Resultado:
Pendências/bloqueio:
Próxima ação exata:
Não editar simultaneamente:
```

## Regra para créditos acabando

Se não houver tokens suficientes para concluir com validação e commit:

1. Pare antes de iniciar uma mudança estrutural nova.
2. Salve um handoff com comando exato de continuação.
3. Não marque a tarefa como `DONE`.
4. Se houver diff parcial, descreva cada arquivo e não permita que a próxima IA o reverta sem leitura.
