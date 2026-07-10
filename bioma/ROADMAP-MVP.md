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

Data de referência: 2026-07-09.

O MVP está tecnicamente testável e operável em ambiente local. Ainda não é produto final nem staging publicado.

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

Ainda demo/dry-run:

- Dados iniciais HM vêm de seed, mas já podem ser editados pelo front.
- ClickUp ainda não sincroniza tarefas reais sem token e mapeamento real.
- Briefing, brand book e calendário existem como artefatos editáveis, não como módulos ricos completos.
- Analytics não deve exibir números reais enquanto não houver fonte real conectada.
- Permissões ainda são simples: `eg_admin` e `client_user`.
- UI melhorou, mas ainda precisa QA visual com assets reais e comparação fina com a proposta HM.

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
- **CRM:** fora do MVP. A EG revende Kommo; a direção futura é uma **bridge Kommo** (espelho read-only do funil por cliente, mesmo padrão do ClickUp Bridge), não um CRM nativo.
- **Brand book:** geração LLM, aprovação e versionamento **adiados** — brand book é uma entrega da HM, não módulo da metodologia EG. A UI trata todo documento estratégico de forma genérica (grid de seções), sem hardcodar o tipo. Entra na discussão da mega-plataforma sobre o quanto hardcodar.
- **Calendário editorial/social:** a produção de conteúdo **permanece no ClickUp** (Social Media Engine, 1 task = 1 post, esteira IDEAÇÃO→...→PUBLICADO, conforme Manual Social). O Bioma **espelha** via bridge; ele é a evolução do "Client Portal/Link Único" dos manuais. Próxima evolução: mapear os status da Social Media Engine no sync.
- **Dashboards/BI:** **port completo do BIAds** para a stack do Bioma (ver `bioma/PLANO-PORT-BIADS.md`). Google (Ads/GA4/GSC/GTM) primeiro; **Meta e LinkedIn depois**.
- Financeiro e Notion: depois.

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
- [ ] Fazer QA visual manual em desktop, notebook com DevTools aberto e mobile.
- [x] Criar checklist manual de QA (seção "Checklist de QA visual"; assinatura ainda pendente).

### P1 - Aproximar da entrega HM

- [x] Aplicar logos/assets reais da EG e, quando houver, da HM (placeholders usados temporariamente).
- [x] Criar experiência específica de Briefing além do artefato textual.
- [x] Criar experiência específica de Brand Book além do artefato textual.
- [x] Criar calendário editorial rico com visão semanal navegável alimentada por entregas reais (visão mensal ainda pendente).
- [x] Criar visão de Analytics honesta, sem fingir dados reais.
- [x] Refinar UI para ficar mais próxima da proposta visual HM sem abandonar branding EG.

### P1.5 - BI de performance (port BIAds)

Spec completa em `bioma/PLANO-PORT-BIADS.md`. Backend primeiro (pós-consolidação das worktrees).

- [ ] F1: migrations das tabelas `*_daily` + `performance_connections` + extensão de `sync_runs`.
- [ ] F2: worker Python (Redis) com sync Google Ads.
- [ ] F3: providers GA4 e Search Console.
- [ ] F4: snapshot e auditoria GTM.
- [ ] F5: páginas Performance no frontend (tema EG, TanStack Query, `TrendChart` já criado).
- [ ] F6: cron 2x/dia + sync manual em Settings.

### P2 - ClickUp real

- [ ] Configurar `CLICKUP_API_TOKEN`.
- [ ] Cadastrar mapeamento real de pasta/listas.
- [ ] Ler tarefas reais.
- [ ] Mapear status por lista: Social, Growth e Tech.
- [ ] Registrar erros de sync de forma visível no cockpit.
- [ ] Definir política de escrita: sempre HITL no MVP.

### P3 - Segurança e qualidade

- [x] Smoke test de autorização entre `eg_admin` e `client_user`.
- [x] Smoke test básico de BOLA/IDOR para outro cliente.
- [x] Teste de CORS local.
- [ ] Teste de sessão expirada/revogada.
- [ ] Teste de validação de payload com massa inválida.
- [ ] Teste básico de carga.
- [ ] Burp/ZAP ou pentest automatizado.
- [ ] Checklist LGPD antes de qualquer dado real sensível.

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

## Status de testes

Testes rodados nesta rodada:

- `python -m compileall bioma/apps/api/bioma_api bioma/apps/api/scripts`
- `python scripts/migrate.py`
- `python scripts/seed_dev.py`
- `python scripts/smoke_api.py`
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
- 2026-07-09 - Antigravity - c52349e - Refatoração UI/UX: views extraídas do App (Login, Clients, Content, etc.), experiências de Brand Book, Calendário e Analytics, placeholders de logo - tsc, build frontend - pendências corrigidas na rodada seguinte (contraste, dados demo sem rótulo).
- 2026-07-10 - Claude (Fable) - ver git log dcd2941..HEAD - Tema escuro musgo com tokens EG, assets de marca aplicados, Analytics/calendário com rotulagem honesta e dados reais, briefing/brand book estruturados por seções, ArtifactModal extraído e tipos sem any, checklist de QA visual criado - tsc, build frontend a cada commit - pendente QA visual assinado, visão mensal do calendário e assets finais de marca.
- 2026-07-10 - Claude (Fable) - bccaf50/c9707e4 - Decisões de escopo registradas (CRM=Kommo bridge futuro, brand book adiado, calendário fica no ClickUp, port BIAds), documentos estratégicos generalizados sem hardcode de brand book, TrendChart recharts no Analytics com paleta validada, PLANO-PORT-BIADS.md criado - tsc, build frontend - pendente consolidação das worktrees pelo Juiz e execução do port (P1.5).
