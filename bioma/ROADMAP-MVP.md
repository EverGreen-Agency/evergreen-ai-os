# Bioma MVP - Execução Viva

Este documento é a mesa de controle do MVP do Bioma. Ele existe para coordenar múltiplas IAs/sessões sem perder contexto, duplicar trabalho ou misturar responsabilidades.

## Premissa central

A EverGreen/EG é a dona da plataforma Bioma e é quem está construindo, operando e codando este produto.

HM Conexões Poderosas foi um lead/cliente potencial que pediu uma entrega específica descrita na proposta e na reunião. O caso HM é referência de escopo e UX para o primeiro Client Hub, mas a plataforma não pertence à HM e não deve ser pensada como produto nichado para ela.

Leitura correta:

- EG: boutique, dona da operação, dona da plataforma e usuária interna principal.
- Bioma: plataforma operacional da EG para cockpit interno, Client Hub e integrações.
- HM: lead/caso de uso inicial para validar uma entrega comercial concreta.
- Clientes futuros: devem entrar no mesmo modelo, com branding e dados próprios.

## Fontes obrigatórias

Antes de alterar escopo, fluxo de ClickUp ou lógica operacional, consulte:

- `_opensquad/_memory/knowledge/Documento-Mestre_EG.md`
- `_opensquad/_memory/knowledge/Manual Operacional_ EverGreen Tech.md`
- `_opensquad/_memory/knowledge/Manual Operacional_ EverGreen Growth.md`
- `_opensquad/_memory/knowledge/Manual Operacional_ EverGreen Social.md`
- `_opensquad/_memory/knowledge/inputs-mega-plataforma/Reuniao-HM_Conexoes.md`
- `_opensquad/_memory/knowledge/inputs-mega-plataforma/Proposta_EverGreen_HM_Conexoes_Poderosas_v3.md`

## Estado atual

Data de referência: 2026-07-10.

O MVP técnico local está testável e operável. O MVP comercial baseado na proposta HM ainda não está concluído nem publicado em staging.

Funcional hoje:

- Login com sessão por cookie.
- API FastAPI com Postgres.
- Docker local com Postgres, Redis, API e Web.
- Seed dev com usuário EG e usuário cliente HM.
- Client Hub com carteira, entregáveis, aprovações, artefatos, sync e auditoria.
- Criar cliente como EG admin.
- Editar cliente como EG admin.
- Criar, editar e excluir artefatos como EG admin.
- Criar, atualizar status e excluir entregáveis como EG admin.
- Aprovar/reprovar pendência pelo front.
- Cliente enxerga apenas o próprio hub no seed.
- ClickUp Bridge em modo manual/dry-run.
- CORS local para `localhost:5173` e `127.0.0.1:5173`.
- Área documentada para assets em `apps/web/public/assets/`.
- Smoke test básico de API em `apps/api/scripts/smoke_api.py`.
- Módulo de Performance com schema multi-tenant, API de leitura e conexões por cliente.
- Worker executável para Google Ads, GA4, Search Console e GTM, com fila durável no Postgres.
- Backend mínimo de CRM, financeiro e métricas manuais, ainda sem telas integradas no frontend.

Ainda demo/dry-run:

- Dados iniciais HM vêm de seed, mas já podem ser editados pelo front.
- ClickUp ainda não sincroniza tarefas reais sem token e mapeamento real.
- Briefing, brand book e calendário existem como artefatos editáveis, não como módulos ricos completos.
- Analytics não deve exibir números reais enquanto não houver fonte real conectada.
- Performance usa dados de seed marcados como demo até a primeira sincronização com credenciais reais.
- Permissões ainda são simples: `eg_admin` e `client_user`.
- UI melhorou, mas ainda precisa QA visual com assets reais e comparação fina com a proposta HM.
- Analytics usa série explicitamente demonstrativa; ainda não consome os endpoints reais de Performance.
- LinkedIn orgânico e LinkedIn Ads, centrais no caso HM, ainda não foram integrados.

## Protocolo para múltiplas IAs

Antes de qualquer mudança:

1. Rodar `git status --short --branch --untracked-files=all`.
2. Ler este arquivo.
3. Confirmar qual frente será alterada.
4. Não editar arquivos fora da frente combinada.
5. Validar com build/teste compatível.
6. Fazer commit pequeno e claro.
7. Atualizar este documento se a mudança alterar status, backlog ou decisão.

Arquivos sensíveis que não devem ser editados por duas IAs ao mesmo tempo:

- `bioma/apps/web/src/App.tsx`
- `bioma/apps/web/src/styles.css`
- `bioma/apps/web/src/lib/api.ts`
- `bioma/apps/web/src/lib/app-config.ts`
- `bioma/apps/web/src/lib/format.ts`
- `bioma/apps/web/src/components/shared.tsx`
- `bioma/apps/web/src/views/CockpitView.tsx`
- `bioma/apps/api/bioma_api/routers/client_hub.py`
- `bioma/apps/api/bioma_api/services/client_hub.py`
- `bioma/apps/api/bioma_api/repositories/client_hub.py`
- `bioma/apps/api/migrations/*.sql`
- `bioma/infra/docker-compose.yml`

Divisão recomendada:

- Backend/API: FastAPI, migrations, auth, permissões, ClickUp, testes API.
- Frontend/UI: componentes, responsividade, assets, UX, estados vazios.
- Produto/QA: comparação com proposta HM, bugs, critérios de pronto, gaps.
- Docs/Coordenação: manter este roadmap, README, specs e handoff.

## ClickUp - direção operacional

A integração deve respeitar os manuais operacionais da EG.

Estrutura de referência:

- Workspace: operação EG.
- Cada cliente deve ter pasta própria.
- Social Media e Growth/Projetos devem ser listas separadas quando aplicável.
- Tech & Software deve seguir SDLC com status de engenharia.
- O cliente deve ter visão por portal único, não uma coleção de links soltos.

MVP do ClickUp Bridge:

1. Mapear cliente Bioma para pasta/listas ClickUp.
2. Ler tarefas por lista.
3. Normalizar status para entregáveis/aprovações no Bioma.
4. Registrar `sync_runs`.
5. Permitir ação manual EG primeiro.
6. Só depois permitir escrita bidirecional com HITL.

Não fazer ainda:

- Escrita automática sem confirmação humana.
- Criar estrutura de cliente no ClickUp sem revisão EG.
- Misturar Social, Growth e Tech em uma lista única.

## Decisões de escopo - 2026-07-10

Decisões do Eduardo nesta rodada (contexto: HM é referência de escopo, não produto a ser vendido; a plataforma é da EG):

- **Auth/perfis:** manter apenas `eg_admin` e `client_user` por enquanto; sem perfil "social media".
- **CRM:** o backend mínimo do funil solicitado no caso HM existe, mas a tela ainda está pendente. Ele atende o MVP operacional, não pretende substituir um CRM completo. A direção futura preferida é uma **bridge Kommo** (espelho do funil por cliente, no padrão do ClickUp Bridge), pois a EG revende Kommo.
- **Brand book:** geração LLM, aprovação e versionamento **adiados** — brand book é uma entrega da HM, não módulo da metodologia EG. A UI trata todo documento estratégico de forma genérica (grid de seções), sem hardcodar o tipo. Entra na discussão da mega-plataforma sobre o quanto hardcodar.
- **Calendário editorial/social:** a produção de conteúdo **permanece no ClickUp** (Social Media Engine, 1 task = 1 post, esteira IDEAÇÃO→...→PUBLICADO, conforme Manual Social). O Bioma **espelha** via bridge; ele é a evolução do "Client Portal/Link Único" dos manuais. Próxima evolução: mapear os status da Social Media Engine no sync.
- **Dashboards/BI:** **port completo do BIAds** para a stack do Bioma (ver `bioma/PLANO-PORT-BIADS.md`). Google (Ads/GA4/GSC/GTM) primeiro; **Meta e LinkedIn depois**.
- **Financeiro:** backend mínimo concluído; tela e integração com a fonte financeira ainda pendentes.
- **LinkedIn:** orgânico e Ads precisam ser incorporados antes de afirmar aderência integral à proposta HM.
- Notion: depois.

## Próximos passos priorizados

### P0 - Fechar MVP testável

- [x] Criar documento vivo de execução do MVP.
- [x] Corrigir CORS local e sessão.
- [x] Criar CRUD mínimo de cliente.
- [x] Criar CRUD mínimo de artefatos.
- [x] Criar CRUD mínimo de entregáveis.
- [x] Criar endpoint/retorno para estados de sync e auditoria.
- [x] Adicionar smoke test básico de API.
- [x] Validar build frontend.
- [x] Separar constantes, helpers e componentes comuns para reduzir `App.tsx`.
- [x] Separar router HTTP do serviço do Client Hub no backend.
- [x] Separar SQL do Client Hub em repositório de persistência.
- [x] Criar backend mínimo de CRM/funil de leads da proposta HM.
- [x] Criar backend mínimo de financeiro da reunião HM.
- [x] Criar backend mínimo de métricas manuais para Analytics honesto.
- [x] Fazer smoke visual assistido em desktop e mobile, sem overflow nas rotas principais.
- [ ] Fazer QA visual humano em notebook com DevTools aberto e assinar o checklist.
- [x] Criar checklist manual de QA (seção "Checklist de QA visual"; assinatura ainda pendente).

### P1 - Aproximar da entrega HM

- [ ] Aplicar logos/assets finais da EG e, quando houver autorização, da HM; os SVGs atuais são placeholders.
- [x] Criar experiência específica de Briefing além do artefato textual.
- [x] Renderizar documentos estratégicos estruturados de forma genérica, incluindo brand book quando cadastrado.
- [ ] Implementar geração, aprovação e versionamento específicos de Brand Book, caso retornem ao escopo.
- [x] Criar calendário editorial semanal navegável alimentado por entregas reais.
- [ ] Criar visão mensal do calendário editorial.
- [x] Criar visão de Analytics honesta, sem fingir dados reais.
- [x] Refinar UI para ficar mais próxima da proposta visual HM sem abandonar branding EG.
- [ ] Concluir QA visual assinado e ajustes finais de responsividade com assets definitivos.

### P1.5 - Port do BIAds / Performance

Spec e histórico de decisão em `bioma/PLANO-PORT-BIADS.md`.

- [x] Portar tabelas diárias de Google Ads, GA4 e Search Console para o Postgres do Bioma.
- [x] Portar snapshots e auditoria de Google Tag Manager.
- [x] Unificar logs de sincronização em `sync_runs`.
- [x] Criar `performance_connections` por cliente sem armazenar segredo em texto puro.
- [x] Criar endpoints de overview, campanhas, aquisição GA4, consultas GSC e snapshots GTM.
- [x] Criar fila durável `queued/running/ok/partial/error` com lock no Postgres.
- [x] Portar o coletor para worker Python com `google-auth` e providers isolados.
- [x] Criar execução manual e agendada incremental (`--enqueue-all --drain`).
- [x] Criar smokes de normalização, autorização, fila e falha auditável.
- [x] Criar `TrendChart` no frontend com Recharts e tokens da marca.
- [ ] Validar cada provider com credenciais reais de uma conta Google controlada pela EG.
- [ ] Comparar amostras coletadas com as interfaces de Google Ads, GA4, GSC e GTM.
- [ ] Configurar segredos e cron no staging da Railway.
- [ ] Criar as páginas de Performance e conectá-las aos endpoints reais; o Analytics atual ainda é uma demonstração honesta.
- [ ] Portar/conectar LinkedIn orgânico e LinkedIn Ads conforme o escopo de referência HM.

### P2 - ClickUp real

- [ ] Configurar `CLICKUP_API_TOKEN`.
- [ ] Cadastrar mapeamento real de pasta/listas.
- [x] Implementar leitura real de tarefas quando `CLICKUP_API_TOKEN` e pasta/listas estiverem configurados.
- [x] Suportar leitura por `clickup_mappings` quando houver mapeamento de lista.
- [x] Fazer upsert local de entregáveis por `clickup_task_id`.
- [x] Registrar erros de sync no histórico retornado pelo portal.
- [x] Definir política de escrita: sempre HITL no MVP.
- [ ] Mapear status por lista: Social, Growth e Tech com regras configuráveis por operação.

### P3 - Segurança e qualidade

- [x] Smoke test de autorização entre `eg_admin` e `client_user`.
- [x] Smoke test básico de BOLA/IDOR para outro cliente.
- [x] Teste de CORS local.
- [ ] Teste de sessão expirada/revogada.
- [ ] Teste de validação de payload com massa inválida.
- [ ] Teste básico de carga.
- [ ] Burp/ZAP ou pentest automatizado.
- [ ] Checklist LGPD antes de qualquer dado real sensível.
- [ ] Dividir o bundle principal do frontend; o build atual gera chunk JS de aproximadamente 601 kB antes de gzip.

### P4 - Staging

- [ ] Subir API e Postgres na Railway.
- [ ] Subir Web na Vercel.
- [ ] Configurar variáveis por ambiente.
- [ ] Rodar seed apenas em ambiente local/staging controlado.
- [ ] Criar domínio temporário de staging.

## Checklist de QA visual (manual)

Executar com API + seed locais rodando e frontend em `npm run dev`, logado como EG admin e depois como cliente. Larguras de referência: desktop 1440px+, notebook com DevTools aberto (~1100px úteis) e mobile 390px.

Para cada largura:

- [ ] Login: hero e cartão legíveis, formulário utilizável, erro de credencial visível.
- [ ] Cockpit: métricas, fila de trabalho e sinais sem overflow ou texto cortado.
- [ ] Clientes: carteira + hub, selects de status e ações de aprovação acessíveis.
- [ ] Conteúdo: briefing estruturado, brand book e calendário legíveis; calendário rola na horizontal sem quebrar a página.
- [ ] Analytics: banner de demonstração visível e badge "exemplo" em todos os cards.
- [ ] Integrações e Engenharia: listas e health rows sem overflow.
- [ ] Modal de artefato: abre, edita, fecha; scroll interno funciona.
- [ ] Contraste: nenhum texto creme sobre fundo claro nem texto escuro sobre fundo escuro.
- [ ] Estados vazios honestos em todas as views; nenhum dado fake apresentado como real.
- [ ] Paleta EG (musgo/baunilha/menta/âmbar) sem cores fora da marca.

Smoke assistido executado em 2026-07-10:

- [x] Login e Cockpit em 1440x900 e 390x844 sem overflow horizontal.
- [x] Rotas Clientes, Conteúdo, Analytics, Integrações e Engenharia abrem sem alerta de erro ou sessão ausente.
- [x] Sessão EG admin, API online e dados do seed apresentados após login.
- [ ] Interações detalhadas, notebook com DevTools, assets finais e assinatura humana continuam pendentes.

Assinatura:

- [ ] QA desktop assinado por: ______ em ______
- [ ] QA notebook com DevTools assinado por: ______ em ______
- [ ] QA mobile assinado por: ______ em ______

## Critério de pronto do MVP v0

O MVP v0 pode ser considerado funcional localmente quando:

- EG admin consegue entrar, ver clientes, criar/editar cliente, criar/editar entregáveis e artefatos.
- Cliente consegue entrar e ver apenas o próprio hub.
- Aprovações funcionam ponta a ponta.
- ClickUp dry-run registra sync de forma visível.
- A UI funciona em desktop e largura reduzida sem quebrar layout.
- Não há dados fake apresentados como se fossem reais.
- Há smoke test básico de API e build frontend passando.

O MVP v0 só pode ser considerado pronto para cliente real quando, além disso:

- ClickUp real lê tarefas de pelo menos uma pasta/lista.
- Assets reais de EG/HM estão aplicados.
- Staging está publicado.
- QA visual/manual foi assinado.
- Checklist LGPD foi revisado.

Para aderir ao escopo comercial de referência HM, também faltam:

- telas conectadas aos backends de CRM e financeiro;
- páginas de Performance conectadas aos endpoints reais;
- integração de LinkedIn orgânico e LinkedIn Ads;
- validação real de ClickUp e dos providers de BI;
- staging, assets finais e aceite visual humano.

## Status de testes

Testes rodados nesta rodada:

- `python -m compileall bioma/apps/api/bioma_api bioma/apps/api/scripts`
- `python scripts/migrate.py`
- `python scripts/seed_dev.py`
- `python scripts/smoke_api.py`
- `python scripts/smoke_clickup.py`
- `python scripts/smoke_performance.py`
- `python apps/worker/scripts/smoke_worker.py`
- `python apps/worker/scripts/smoke_queue.py`
- `docker compose -f infra/docker-compose.yml --profile worker config --quiet`
- `docker compose -f infra/docker-compose.yml --profile worker build worker`
- `docker compose -f infra/docker-compose.yml --profile worker run --rm worker`
- `npx tsc -b`
- `npm.cmd run build`

Os testes atuais são funcionais e smoke tests de desenvolvimento. Eles não substituem auditoria de segurança, pentest, teste de carga ou revisão LGPD.

## Como registrar progresso

Ao concluir uma tarefa, adicione uma linha em "Log de execução".

Formato:

```text
- YYYY-MM-DD - IA/sessão - commit/hash - resumo - validação executada - pendências
```

## Log de execução

- 2026-07-09 - Codex - 4d3502d - Corrigido CORS local, responsividade e área de assets - build front, compile backend, preflight/login CORS - pendente QA visual completo.
- 2026-07-09 - Codex - ver git log - CRUD mínimo de cliente/artefato/entrega, auditoria no portal, smoke API e UI revisada - compile backend, migrate, seed, smoke API, tsc, build frontend - pendente assets reais, ClickUp real, QA visual e staging.
- 2026-07-09 - Codex - ver git log - Refatoração estrutural inicial do frontend: constantes, helpers, componentes comuns e CockpitView extraídos do App - tsc, build frontend, smoke API - pendente refatorar backend Client Hub e views restantes.
- 2026-07-09 - Codex - ver git log - Router Client Hub separado da camada de serviço - compile backend e smoke API - pendente quebrar SQL em repositório/testes unitários.
- 2026-07-09 - Codex - ver git log - SQL do Client Hub extraído para repositório de persistência - compile backend e smoke API - pendente testes unitários e integração ClickUp real.
- 2026-07-09 - Codex - ver git log - ClickUp Bridge preparado para leitura real de listas/tasks e upsert local de entregáveis, mantendo HITL para escrita externa - compile backend, smoke API e smoke ClickUp mockado - pendente token/mapeamento real e staging.
- 2026-07-10 - Codex - ver git log - Backend mínimo para CRM/funil, financeiro e métricas manuais da proposta HM - compile backend, migrate, seed, smoke API e smoke ClickUp - pendente frontend consumir endpoints e QA visual.
- 2026-07-10 - Codex - ver git log - Port backend do BIAds: schema, API, fila Postgres e worker Google Ads/GA4/GSC/GTM - compile, migrate, seed, smokes API/ClickUp/Performance/worker/fila - pendente credenciais reais, comparação com Google, frontend e cron de staging.
- 2026-07-09 - Antigravity - c52349e - Refatoração UI/UX: views extraídas do App (Login, Clients, Content, etc.), experiências de Brand Book, Calendário e Analytics, placeholders de logo - tsc, build frontend - pendências corrigidas na rodada seguinte (contraste, dados demo sem rótulo).
- 2026-07-10 - Claude (Fable) - ver git log dcd2941..HEAD - Tema escuro musgo com tokens EG, assets de marca aplicados, Analytics/calendário com rotulagem honesta e dados reais, briefing/brand book estruturados por seções, ArtifactModal extraído e tipos sem any, checklist de QA visual criado - tsc, build frontend a cada commit - pendente QA visual assinado, visão mensal do calendário e assets finais de marca.
- 2026-07-10 - Claude (Fable) - bccaf50/c9707e4 - Decisões de escopo registradas (CRM=Kommo bridge futuro, brand book adiado, calendário fica no ClickUp, port BIAds), documentos estratégicos generalizados sem hardcode de brand book, TrendChart recharts no Analytics com paleta validada, PLANO-PORT-BIADS.md criado - tsc, build frontend - pendente consolidação das worktrees pelo Juiz e execução do port (P1.5).
- 2026-07-10 - Codex/Juiz - c143c7a - Worktrees de API e UI consolidadas no develop, conflito de roadmap resolvido e port backend do BIAds incorporado - tsc, build, migrations, seed, smokes API/ClickUp/Performance/worker/fila e smoke visual desktop/mobile - pendentes frontend CRM/financeiro/Performance, LinkedIn, integrações reais, staging, assets e aceite humano.
