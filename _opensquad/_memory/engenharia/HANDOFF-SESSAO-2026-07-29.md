# Handoff — sessão 2026-07-29

Contexto para retomar em sessão nova. Branch: `develop`. Último commit: `1cf5fff`.

## Sessão paralela — RESOLVIDO

A outra sessão commitou o control plane de IA em `d57976e` e a árvore ficou
limpa. O bloqueio de contrato acabou. Se aparecer sujeira nova em
`openapi.json`/`lib/api.ts`/`useBiomaApi.ts` que não seja sua, é sinal de que
voltou — nesse caso, não regenerar o contrato até eles commitarem.

---

## Regras permanentes desta linha de trabalho

1. **Commits sem co-autor de IA.** Nunca incluir `Co-Authored-By`. Instrução
   explícita e repetida do Eduardo.
2. **Nunca `git add -A`.** Há histórico de sessões concorrentes de IA neste
   repo. Sempre `git status --short` antes de commitar e stagear arquivo a
   arquivo, por lista explícita.
3. **Nunca fabricar dado.** Padrão do projeto: sem credencial configurada, o
   código devolve prévia honesta e claramente rotulada (custo zero) ou falha
   alto — nunca inventa número plausível. Já foram corrigidos 3 casos disso.
4. **Verificar API real antes de implementar.** Toda integração desta sessão
   teve endpoint/payload conferido na documentação oficial via WebSearch/
   WebFetch antes de escrever o cliente. Não escrever de memória.
5. **Ordem de revisão combinada:** login → visão do admin EG → ... → acesso do
   cliente, módulo a módulo. **Eu audito e sugiro primeiro**; o Eduardo aprova,
   redireciona ou acrescenta. Combinado assim porque a auditoria de código
   encontra coisas que não aparecem só usando o produto.

---

## Onde paramos (atualizado)

**Cockpit revisado. Modelagem de Projetos/Tarefas decidida e documentada no
[Manual Operacional Bioma v2](../knowledge/Manual%20Operacional%20Bioma%20v2%20—%20Projetos%20e%20Tarefas.md).**
Próximo passo: **implementar** o que o v2 define (ver "Fila de implementação").

### Decisões travadas (não reabrir sem motivo novo)

- **Frente × Projeto são níveis diferentes.** Frente (`eg_task_lists.type`)
  define status e campos; Projeto (`projects` + `eg_tasks.project_id`) define
  escopo, contrato e datas. Uma frente Tech, N projetos dentro.
- **Projeto é campo da tarefa, como FK** — não lista separada, não texto livre.
- **Social vira aba do Estúdio IA**, mantendo a esteira de 10 status.
  A separação Growth/Social em listas era limitação do ClickUp, declarada no
  próprio manual v1.
- **Checklist ≠ Subtarefa.** Checklist = etapas da mesma tarefa
  (`eg_task_subtasks`, que apesar do nome É um checklist). Subtarefa = trocou
  de responsável ou prazo (`eg_tasks.parent_task_id`). As duas se mantêm.
- **Sem campos personalizados criados pelo usuário** por agora — só os campos
  já existentes nos manuais v1.

### Fila de implementação

**Concluído (`30371d4`), validado contra Postgres real:**

- ✅ Criar tarefa nas visões **lista e calendário** (era só no Kanban).
- ✅ **Definição de Pronto** rotulada no detalhe (era "Descrição / Copy").
- ✅ **Checklist** renomeado, com a regra na tela ("se muda responsável ou
  prazo, use subtarefa").
- ✅ **Comentários** na tarefa (migração `0066`), com `client_visible`.
- ✅ `project_id` e `parent_task_id` circulando na API, com validações:
  projeto/pai do mesmo workspace, sem auto-pai (422), sem ciclo (409).

**Falta:**

1. **Visão Roadmap (Gantt)** por projeto, usando datas de `project_phases`.
   Hoje a terceira visão é um calendário mensal, não um Gantt. É a visão que o
   manual v1 chamava de "Roadmap do Cliente" — a que se mostra ao cliente.
2. **Agrupar/filtrar por projeto** na lista e no Kanban. O campo já existe e é
   editável; o que falta é agrupar a visão por ele.
3. Filtros salvos que o v1 chamava de views: Bug Tracker (Tipo = Bug), Banco de
   Ideias (status = IDEAÇÃO), Aprovação do Cliente.
4. Recorrência: colunas existem (`recurrence`, `recurrence_source_task_id`),
   regra de negócio **não definida** — pendente de decisão do Eduardo.
5. Campos personalizados no drawer ainda são um conjunto fixo em código; o
   Manual v2 decidiu não permitir criação pelo usuário, mas os campos por frente
   deveriam vir de `task-frentes.ts` como os status agora vêm.
6. **Decisão em aberto:** `deliverables` e `eg_tasks` continuam sendo dois
   sistemas. O Cockpit agora lê os dois, mas unificá-los (ou não) é decisão de
   produto, não dívida óbvia.

### Perguntas do Eduardo ainda sem resposta implementada

- **Copilotos/agentes/squads dentro do Bioma**: como as conversas de
  produto e a "autovigilância" (detectar que uma feature já existe antes de
  pedir de novo) viveriam dentro do produto. Discutido, nada implementado.
  Existe base: `ai_operations`, `squads`, o control plane de IA da outra sessão,
  o Banco de Ideias e o CodeGraph/graphify do repo.

### Limpeza executada

- `bioma-legacy/` (2.0 GB) e `dashboard/` (241 MB) **apagados** — 233 arquivos.
  Recuperáveis pelo histórico git.
- Dados de tarefa **zerados** no banco local (48 tarefas, 189 campos, 6 listas).
  Backup em `scratch/backups/eg_tasks_backup_pre_limpeza.json` (13 ganchos/copies
  preservados). Produção começa vazia por decisão do Eduardo.
- Resolveu de tabela o bug dos 27 `AGENDADO` mapeados em `NOT_STARTED`.

### Dívida de refatoração identificada (não iniciada)

- `styles.css` — **5.404 linhas**, global, sem escopo. Já causou bug nesta sessão
  (tags de integração todas verdes porque `draft`/`cancelled` não existiam).
  Sugestão: quebrar por domínio com `@import`, refator mecânico.
- `lib/api.ts` — **3.385 linhas**. Bloqueado pela sessão paralela.
- `ProposalsManager.tsx` — 1.264 linhas.
- `.bak` no disco em `bioma/apps/web/src/views/admin/office/` (não versionados).

---

## Onde paramos (histórico anterior)

**Login revisado e corrigido; regressão de auth corrigida e validada contra
banco real.** Próximo passo combinado: **visão/acesso do admin da EG (Cockpit)**
— o backend dele já foi verificado (ver abaixo), falta revisar a interface.

### Regressão crítica encontrada e corrigida (`4f243db`)

O commit do PAT (`ede2b79`) quebrou **as três portas de entrada de sessão** do
produto — login, aceitar convite e confirmar redefinição de senha — todas com
500. Causa: `current_user_from_request` passou a ler
`request.headers["authorization"]`, mas esses três fluxos chamavam a função com
um **objeto falso de Request** (`_request_from_token`) que só tinha `.cookies`.

Corrigido extraindo `user_from_session_token(token)` em `auth.py` e **removendo
as três cópias do shim**, em vez de remendá-las com um `headers` vazio. Assim,
qualquer campo novo lido de `Request` no futuro não consegue mais derrubar
esses fluxos.

**Lição que vale para o resto da revisão:** o mesmo hack estava copiado em 3
arquivos. Ao mexer em contrato de função compartilhada, vale um
`grep -rn "<nome>" --include="*.py"` antes de assumir que só há um chamador.

O que foi encontrado e corrigido no login:
- Causa raiz da quebra em celular/tablet/F12: `html, body, #root` são
  `overflow:hidden`, então a página nunca rola sozinha. O `.login-shell` ora
  cortava conteúdo sem scroll (desktop), ora estourava o `#root`
  (empilhado). Agora ele é o próprio container de scroll em todos os
  breakpoints.
- Empilhado, o formulário caía abaixo da dobra → agora vem primeiro
  (`order:-1`), com marca compacta dentro do card.
- Órfã no aviso de privacidade → `nowrap` no nome do documento.
- `apiOnline` era prop recebida e **nunca usada** (CSS existia, JSX não
  renderizava): API fora do ar era invisível ao usuário.
- Botão "Entrar" não desabilitava no envio → duplo clique criava duas sessões
  e podia disparar o rate limit de 5 tentativas.

**Nada disso foi validado visualmente** — não tenho navegador nesta sessão.
Vale o Eduardo conferir no dev server antes de seguir.

---

## O que foi construído nesta sessão (9 commits)

| Commit | O quê |
|---|---|
| `1cf5fff` | Operação interna da EG (dogfooding), responsável, projeto e subtarefa na UI |
| `30371d4` | Projeto/subtarefa na API, comentários (0066), criar tarefa em todas as visões |
| `56989d9` | Manual v2, migração 0065 (project_id + parent_task_id), remoção do legado |
| `a715823` | **Perf:** cache padrão do React Query (causa da tela de Tarefas lenta) |
| `50e7b73` | Cockpit acionável + correção das contagens da carteira |
| `4f243db` | **Fix crítico:** 500 em login/convite/reset causado pelo shim de Request falso |
| `951b2f5` | Este handoff |
| `1cc5852` | Login: responsividade, órfã, estados ausentes |
| `d8ea324` | Guias de conexão, RD Station CRM, HubSpot, fix card multi-conta |
| `539fa69` | TikTok orgânico, TikTok Ads, LinkedIn orgânico (OAuth por conexão) |
| `3a31a37` | Google Meu Negócio, Google AdSense, YouTube orgânico |
| `ede2b79` | Tokens de acesso pessoal (PAT) para apps externos |
| `a8bb61b` | Fix MCP, BriefingPanel plugado, métricas reais do Cockpit EG |
| `0ea2113` | Retrospectiva de conteúdo, banco de ganchos, roteiros sem briefing |
| `e031c29` | Scroll duplo, tags de integração padronizadas, logos |
| `f08db9a` | Avaliação de vaga com IA parou de fabricar nota |

---

## Bloqueios reais (não são bugs — dependem de terceiros)

### Ambiente local — RESOLVIDO no fim da sessão

Postgres subiu e as migrações `0059`–`0063` foram **aplicadas com sucesso**.
O que já foi **executado de verdade** contra banco real:

| Fluxo | Resultado |
|---|---|
| `POST /auth/login` | 200, usuário correto, 8 orgs |
| `GET /auth/me` | 200 |
| `GET /clients` | 200, 5 clientes |
| PAT: criar | 201 |
| PAT: usar sem cookie | 200, usuário correto |
| PAT: token inválido | 401 |
| PAT: token revogado | 401 |
| `GET /backoffice/cockpit-summary` | 200 — MRR 450000, 3 entregas atrasadas, 1 cliente em risco |
| Convite/reset com token inexistente | 404 (não 500) |
| `export_openapi.py --check` | contrato em dia |

O SQL do cockpit foi **conferido linha a linha contra o banco**: 1 contrato
aberto de R$ 4.500 → MRR 450000 centavos; a única fatura está `open` (não
`paid`), por isso faturamento do mês = 0; e há exatamente 3 entregas atrasadas.
Os números não são fabricados.

**O que ainda NÃO foi executado:** nada das integrações novas (Instagram,
TikTok, LinkedIn, GBP, AdSense, YouTube, RD Station, HubSpot) nem os pilares de
retrospectiva/roteiro — todos dependem de credencial externa que não temos.
Também não há smoke test escrito para esses caminhos.

### Credenciais que faltam para as integrações funcionarem
| Integração | Falta | Observação |
|---|---|---|
| Instagram orgânico | `INSTAGRAM_ACCESS_TOKEN` | escopo `instagram_manage_insights` é **separado** do de Ads |
| Google Meu Negócio | aprovação do Google | projetos novos têm **cota zero**; formulário manual, análise demorada |
| Google AdSense | escopo `adsense.readonly` no service account | mesma credencial do GA4/GTM |
| YouTube orgânico | `YOUTUBE_API_KEY` | mais simples de todas, sem OAuth |
| TikTok orgânico | `TIKTOK_CLIENT_KEY` / `_SECRET` | app no **developers.tiktok.com** |
| TikTok Ads | `TIKTOK_ADS_APP_ID` / `_SECRET` | app no **business-api.tiktok.com** — portal **diferente** |
| LinkedIn orgânico | `LINKEDIN_CLIENT_ID` / `_SECRET` | exige app review |
| Benchmark concorrente | `AHREFS_API_KEY` | + conectar concorrente como canal no workspace Ahrefs |
| Retrospectiva/roteiros | `OPENAI_API_KEY` no worker | sem ela, sai prévia rotulada |
| TikTok/LinkedIn/CRMs | `SECRET_ENCRYPTION_KEY` | worker precisa dela pra decifrar tokens |

### Incerteza técnica assumida
- **RD Station CRM:** o parâmetro `?token=` foi **inferido de fontes
  secundárias** — a doc oficial não expôs pelo meu acesso. Se estiver errado,
  falha alto no primeiro sync com erro claro, não silenciosamente. Confirmar
  no primeiro teste real.

---

## Pendências conhecidas

**Combinadas, não iniciadas:**
- Revisão módulo a módulo a partir da **visão do admin EG** (próximo passo).
- Prints dos guias de integração. Convenção pronta e autodocumentada: salvar em
  `bioma/apps/web/public/assets/integration-guides/<provider>/<slug>.png`.
  Enquanto não existir, aparece placeholder tracejado com o caminho exato.
  Tabela de slugs no README daquela pasta.

**Aguardando decisão do Eduardo:**
- `MOD-SAAS-BILLING-001` — modelo de planos/cupons/cotas. Parado há várias
  sessões porque a decisão de cobrança (por squad? módulo? tenant?) é dele.
  Chutar o modelo agora gera retrabalho caro em schema de billing.
- Fóton: PAT está pronto e funcional. Falta mapear **quais dados** o app
  pessoal deve puxar. Como ele é CEO/`eg_admin`, o token herda os direitos
  dele — não foi criada camada `/me` separada de propósito.

**Dívida técnica registrada, sem urgência:**
- `smoke_proposals.py` tem asserção errada (cria proposta `draft` e busca pelo
  endpoint público, que corretamente filtra `sent/negotiating/won`). É bug do
  teste, não do código.
- Bundle grande: `index.js` ~598KB, `PhaserGame` ~1.4MB.
- Worktree git órfão em `.claude/worktrees/wiki-clickup-retire/` de branch já
  mergeada.
- `EditorialCalendar` (calendário semanal pronto) segue com **zero
  importadores** — componente órfão, candidato a uso.

---

## Coisas que economizam tempo na próxima sessão

**Ambiente:**
- venvs próprios por app: `bioma/apps/api/.venv/Scripts/python.exe` e
  `bioma/apps/worker/.venv/Scripts/python.exe`. O `python` do PATH **não** tem
  as dependências.
- Typecheck do front às vezes estoura heap. Fechar Chrome/apps pesados resolve;
  aumentar `--max-old-space-size` **não** resolveu.

**Fluxo obrigatório ao mexer em endpoint:**
1. `cd bioma/apps/api && ./.venv/Scripts/python.exe scripts/export_openapi.py`
2. `cd bioma/apps/web && npm run types:api`
3. `npx tsc --noEmit -p tsconfig.json`
4. `npm run build`
   CI tem gate `CONTRACT-001` que falha se o contrato estiver defasado.

**Padrões do projeto que devem ser seguidos:**
- Nova integração = novo provider em `bioma_worker/providers/` + entrada no
  dispatcher do `orchestrator.py` + `PROVIDER_META` no `IntegrationsTab.tsx` +
  guia em `lib/integration-guides.ts`. Não criar mecanismo paralelo.
- `WORKSPACE_CAPABILITIES` e `CLIENT_MODULES` em `access.py` são listas
  **fechadas**. Usar string fora delas quebra o recurso silenciosamente —
  já aconteceu 3 vezes neste repo.
- Segredo em repouso: sempre `encrypt_secret`/`decrypt_secret` (Fernet).
  O worker tem espelho em `bioma_worker/crypto.py`.
- Ícone de marca: `components/icons/BrandIcons.tsx`, path do Simple Icons
  (CC0). Nunca redesenhar logo à mão — RD Station não tem no banco CC0 e por
  isso usa monograma neutro.

---

## Achados de auditoria que ainda valem como alerta

Padrões que se repetiram e provavelmente existem em outros módulos ainda não
revisados:

1. **Componente construído e nunca importado** (Score invisível,
   `BriefingPanel`, `EditorialCalendar`). Vale rodar contagem de referências
   cruzadas por módulo antes de assumir que algo "não existe".
2. **Placeholder hardcoded que parece feature pronta** (os 4 cards do Cockpit
   mostravam `R$ --` fixo).
3. **Classe CSS usada sem regra definida** — as tags de integração
   renderizavam todas verdes porque `draft`/`cancelled` não existiam no CSS.
4. **`.find()` onde o dado é 1-para-N** — o card de integração mostrava só a
   primeira conta; as outras sincronizavam invisíveis.
5. **Prop recebida e nunca usada** (`apiOnline` no login).
6. **Hack copiado em vários arquivos** — o shim `_request_from_token` existia
   idêntico em 3 routers. Mudar o contrato de uma função compartilhada quebrou
   os 3 de uma vez. Sempre `grep` por outros chamadores antes de assumir que
   há só um.
