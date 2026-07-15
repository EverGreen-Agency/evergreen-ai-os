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

Documentos operacionais:

- `bioma/EXECUCAO-MVP.md`: fila atômica, dependências, dono e handoff entre LLMs.
- `bioma/DEPLOY.md`: runbook de staging, produção e rollback.

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
- EG admin consegue solicitar aprovação de uma entrega pelo front; o cliente decide no próprio hub.
- Cliente enxerga apenas o próprio hub no seed.
- ClickUp Bridge em modo manual/dry-run.
- CORS local para `localhost:5173` e `127.0.0.1:5173`.
- Área documentada para assets em `apps/web/public/assets/`.
- Smoke test básico de API em `apps/api/scripts/smoke_api.py`.
- Módulo de Performance com schema multi-tenant, API de leitura e conexões por cliente.
- Worker executável para Google Ads, GA4, Search Console e GTM, com fila durável no Postgres.
- CRM/funil e financeiro com backend e telas mínimas integradas no frontend.
- Analytics principal consumindo endpoints reais de Performance do Bioma, ainda com dados demo até credenciais reais.
- Configuração de deploy, CI, bootstrap seguro e smoke remoto preparados; staging externo ainda não foi criado.
- Upload/download/exclusão de documentos por cliente (visibilidade interna/cliente) via storage S3-compatible, com painel no front em Conteúdo; requer `STORAGE_S3_*` configurado no ambiente (503 controlado se ausente).

Ainda demo/dry-run:

- Dados iniciais HM vêm de seed, mas já podem ser editados pelo front.
- ClickUp ainda não sincroniza tarefas reais sem token e mapeamento real.
- Briefing, brand book e calendário existem como artefatos editáveis, não como módulos ricos completos.
- Analytics não deve exibir números reais enquanto não houver fonte real conectada.
- Performance usa dados de seed marcados como demo até a primeira sincronização com credenciais reais.
- Permissões ainda são simples: `eg_admin` e `client_user`.
- UI melhorou, mas ainda precisa QA visual com assets reais e comparação fina com a proposta HM.
- Analytics consome endpoints reais de Performance, mas ainda pode exibir dados de seed enquanto não houver sync real.
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
- **CRM:** o backend mínimo do funil solicitado no caso HM existe e a tela mínima já está integrada. Ele atende o MVP operacional, não pretende substituir um CRM completo. A direção futura preferida é uma **bridge Kommo** (espelho do funil por cliente, no padrão do ClickUp Bridge), pois a EG revende Kommo.
- **Brand book:** geração LLM, aprovação e versionamento **adiados** — brand book é uma entrega da HM, não módulo da metodologia EG. A UI trata todo documento estratégico de forma genérica (grid de seções), sem hardcodar o tipo. Entra na discussão da mega-plataforma sobre o quanto hardcodar.
- **Calendário editorial/social:** a produção de conteúdo **permanece no ClickUp** (Social Media Engine, 1 task = 1 post, esteira IDEAÇÃO→...→PUBLICADO, conforme Manual Social). O Bioma **espelha** via bridge; ele é a evolução do "Client Portal/Link Único" dos manuais. Próxima evolução: mapear os status da Social Media Engine no sync.
- **Dashboards/BI:** **port completo do BIAds** para a stack do Bioma (ver `bioma/PLANO-PORT-BIADS.md`). Google (Ads/GA4/GSC/GTM) primeiro; **Meta e LinkedIn depois**.
- **Financeiro:** backend e tela mínima concluídos; integração com a fonte financeira real ainda pendente.
- **LinkedIn:** orgânico e Ads precisam ser incorporados antes de afirmar aderência integral à proposta HM.
- Notion: depois.

## Decisões de escopo - 2026-07-14

Decisões do Eduardo (rodada de brainstorm com Claude; contexto: deploy em produção via integração Git da Vercel + Railway, dev local):

- **Multi-tenant:** v1 fica flat (EG → clientes), mas preparada para hierarquia white-label: adicionar `parent_organization_id` nullable em `organizations` e não hardcodar `eg` em código novo. Hierarquia completa (agência → clientes dela) fica para quando houver demanda real.
- **Cliente piloto:** dar acesso a 1 cliente real em 2–4 semanas. Isso torna AUTH-001, LGPD-001 e assets finais P0 imediato.
- **AUTH-001 (convite):** mecânica escolhida = link de convite copiável com token expirável de uso único; EG admin envia por WhatsApp; usuário define a própria senha. Provedor de e-mail pluga depois no mesmo token.
- **Escopo do piloto:** cliente vê Hub + Conteúdo + Arquivos. Analytics fica oculto até haver sync Google real do próprio cliente — primeiro uso prático do feature-gating.
- **Feature-gating:** criar agora a noção de módulos habilitados por organização (campo/JSON no banco + checagem no backend). Stripe/billing só depois.
- **LGPD:** Eduardo decidiu LGPD-001 completo ANTES do acesso do piloto (não o mínimo viável). O checklist precisa começar imediatamente, em paralelo ao código, para não virar gargalo das 2–4 semanas.
- **Domínio de produção:** `bioma.evergreenmkt.com.br` (web) + `api.bioma.evergreenmkt.com.br` (API), `SESSION_COOKIE_DOMAIN=.bioma.evergreenmkt.com.br`, SameSite=Lax.
- **Storage:** fonte de verdade dos arquivos = bucket S3-compatible (Railway Buckets agora; código FILE-001 já é agnóstico via env `STORAGE_S3_*`). Cloudinary não entra como storage primário; se o módulo de social media precisar de transformação de imagem, entra camada na frente do bucket (imgproxy self-hosted ou Cloudinary fetch mode) — alinhado à visão mega-plataforma de infra própria.
- **Tailwind:** removido (tinha sido instalado sem ativação). Design system continua nos tokens CSS de `styles.css`; Tailwind só volta como decisão deliberada de redesign.

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
- [x] Corrigir contrato de `sync_runs` para `queued/running/ok/partial/error`.
- [x] Criar solicitação de aprovação EG → cliente sem depender do seed.
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
- [x] Conectar Analytics principal aos endpoints reais de Performance.
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
- [ ] Configurar segredos e jobs no staging Railway após validar contas Google controladas.
- [x] Conectar a visão principal de Analytics aos endpoints reais de Performance; dados sem sync real continuam marcados como demo.
- [x] Criar páginas profundas de Performance: Ads, GA4, GSC e GTM.
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
- [x] Teste de sessão revogada.
- [x] Teste de sessão expirada.
- [x] Teste mínimo de validação de payload com massa inválida.
- [ ] Teste básico de carga.
- [ ] Burp/ZAP ou pentest automatizado.
- [ ] Checklist LGPD antes de qualquer dado real sensível.
- [x] Dividir o bundle principal do frontend; Clientes, Conteúdo, Integrações e Engenharia agora são lazy-load, reduzindo o chunk inicial para aproximadamente 227 kB antes de gzip (era 243 kB).
- [x] Criar convite/provisionamento de usuário cliente sem seed (link copiável de uso único; `smoke_invites.py`).
- [x] Feature-gating de módulos por organização com toggle no AdminDock; analytics/comercial bloqueados por default para cliente.
- [ ] Criar recuperação/rotação segura de senha.
- [x] Implementar rate limit de login em processo único.
- [ ] Migrar rate limit para Redis/Postgres antes de múltiplas réplicas.
- [ ] Gerar tipos do frontend a partir do OpenAPI para impedir drift de contrato.
- [ ] Criar retry/reaper para jobs que ficarem presos em `running`.
- [ ] Medir conexões e decidir pool Postgres antes de aumentar carga.

### P4 - Staging

- [x] Criar runbook de deploy e rollback.
- [x] Criar Config as Code Railway para API/worker; jobs entram depois da validação de integrações reais.
- [x] Criar configuração Vercel para o app Vite.
- [x] Criar GitHub Action para deploy Vercel usando token do dono/admin, sem exigir seat Vercel de todo colaborador.
- [x] Criar readiness check com Postgres.
- [x] Bloquear seed demo fora de ambiente autorizado.
- [x] Criar bootstrap seguro de EG admin.
- [x] Criar smoke remoto não destrutivo.
- [x] Criar CI para build e smokes.
- [ ] Subir API e Postgres no Railway.
- [ ] Subir Web na Vercel.
- [ ] Configurar variáveis por ambiente.
- [ ] Rodar seed apenas em ambiente local/staging controlado.
- [ ] Corrigir e validar domínio temporário de staging: web `staging.bioma.evergreenmkt.com.br`, API `api-staging.bioma.evergreenmkt.com.br` atualmente retornam `404`.

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

- QA humano das telas CRM, financeiro e Analytics;
- páginas profundas de Performance conectadas aos endpoints reais;
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
- 2026-07-10 - Codex - ver git log - Hardening para deploy, CI, Config as Code, bootstrap admin, smoke remoto, fluxo real de solicitação de aprovação e fila operacional multi-LLM - pendente criar staging externo, conectar credenciais e executar os gates de produção.
- 2026-07-11 - Codex - ver git log - Deploy do MVP redirecionado para Railway/Vercel, CRM/funil e financeiro ligados ao frontend, Analytics conectado ao backend de Performance e hardening mínimo de auth/payload/rate-limit - tsc, build web, compile backend/worker, smokes API/ClickUp/Performance/worker/fila - pendente staging externo, credenciais reais, páginas profundas de Performance, QA humano e LGPD.
- 2026-07-11 - Codex - ver git log - GitHub Action para deploy Vercel via token admin, code-splitting de Analytics/Comercial e smoke de sessão expirada - tsc, build web, smoke API - pendente secrets GitHub/Vercel, URLs públicas para smoke remoto e validação humana.
- 2026-07-11 - Codex - ver git log - URLs de staging registradas e smoke HTTP público tentado - `api-staging.bioma.evergreenmkt.com.br` e `staging.bioma.evergreenmkt.com.br` retornaram 404 - pendente associar domínios aos projetos corretos ou aguardar propagação DNS.
- 2026-07-11 - Codex - ver git log - Railway API start trocado para `python scripts/start.py` e GitHub Action Vercel passou a fazer build local + `vercel deploy dist` para evitar erro de output `dist` no fluxo prebuilt - compile/smokes API, build web e smokes worker executados - pendente redeploy Railway/Vercel e smoke remoto.
- 2026-07-11 - Claude Code (Sonnet 5) - CLAIM WEB-PERF-002 - Páginas profundas de Performance (Google Ads, GA4, Search Console, GTM) como abas dentro de Analytics, consumindo os endpoints reais já existentes do backend (`api.ts`: `ga4Acquisition`, `gscQueries`, `gtmSnapshots`), com estados de carregamento/vazio/erro e banner de freshness por provedor quando a fonte não tem sync real - `npx tsc -b`, `npm run build` (chunk principal mantém ~243 kB, `AnalyticsView` isolado em chunk lazy) - pendente QA visual das novas abas e validação com credenciais Google reais.
- 2026-07-11 - Claude Code (Sonnet 5) - CLAIM WEB-BUNDLE-001 - Lazy-load das views Clientes, Conteúdo, Integrações e Engenharia em `App.tsx` (mesmo padrão `React.lazy`/`Suspense` já usado em Analytics/Comercial), reduzindo o chunk principal de ~243 kB para ~227 kB antes de gzip - `npx tsc -b`, `npm run build` - pendente nenhuma; próxima folga de bundle viria de dividir o chunk pesado do `AnalyticsView` (recharts).
- 2026-07-15 - Claude Code (Fable 5) - CLAIM AUTH-001 + GATE-001 - Convite de usuário cliente por link copiável de uso único (token hasheado, expira em 7 dias, aceite público cria usuário+sessão, página `/convite/:token`, painel no AdminDock) e feature-gating por organização (`enabled_modules` jsonb + `parent_organization_id` na migration 0005, gates de analytics/commercial/files no backend, nav e rotas filtradas no frontend, toggles no AdminDock); fix da regressão do form de edição de cliente que perdeu o pré-preenchimento na migração p/ zustand; release-please com bump automático de `version.ts` via extra-files; proxy Vite revertido p/ 8000; rascunho `LGPD-001.md` criado - compileall, migrate, seed, smokes API/invites/performance/files (MinIO real)/ClickUp, tsc, build web - pendente LGPD-001 assinado, AUTH-002 (reset de senha) e aviso de privacidade na tela de convite.
- 2026-07-12 - Claude Code (Sonnet 5) - CLAIM FILE-001 - Upload/storage de documentos com visibilidade por cliente: migration `client_files`, router/service/repository `files` seguindo o padrão de `performance`/`client_hub` (EG admin sobe/exclui, `client_user` só lê arquivos `visibility=client`), cliente S3-compatible (`services/storage.py`, boto3, endpoint configurável para funcionar com R2/B2/MinIO/AWS), limite de tamanho configurável (`STORAGE_MAX_UPLOAD_MB`), download via URL assinada com expiração curta, painel `FilesPanel` no front dentro de Conteúdo, perfil `storage` (MinIO) no `docker-compose.yml` para dev local sem depender de credencial de nuvem - compile backend, `scripts/smoke_files.py` (upload/list/autorização/limite de tamanho/download real via URL assinada/exclusão) rodado de ponta a ponta contra MinIO local, smokes API/ClickUp/Performance sem regressão, `npx tsc -b`, `npm run build`, fluxo completo testado manualmente no navegador (upload, download do conteúdo real, exclusão) - pendente credenciais de bucket real (R2/B2/S3) em staging/produção; AUTH-002 (rotação de senha) e AUTH-001 (convite sem seed) seguem TODO.
