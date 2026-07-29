# Handoff — sessão 2026-07-29

Contexto para retomar em sessão nova. Branch: `develop`. Último commit: `1cc5852`.

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

## Onde paramos

**Login foi revisado e corrigido (commit `1cc5852`).** Próximo passo combinado:
**visão/acesso do admin da EG**.

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

### Ambiente local
- **Docker/Postgres não subiu nesta sessão.** Migrações `0059`–`0063` foram
  escritas mas **nunca aplicadas nem testadas contra banco real**.
  Rodar: `cd bioma/apps/api && ./.venv/Scripts/python.exe scripts/migrate.py`
- Sem banco, também não deu para escrever/rodar smoke tests. **Esse é o maior
  risco em aberto**: ~6 mil linhas escritas nesta sessão sem execução real.

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
