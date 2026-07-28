# Auditoria Bioma — 2026-07-12

Avaliação geral de código, segurança, negócio e próximos passos, feita por Claude Code (Sonnet 5) a pedido do Eduardo. Complementa `ROADMAP-MVP.md` (estado/backlog) e `DEPLOY.md` (runbook) — não os substitui.

## Adendo de produto — 2026-07-27 (pesquisa de mercado)

O primeiro módulo de referência da ferramenta Spalla foi absorvido como domínio nativo `market_research`, sem copiar suas fragilidades. A referência recebida possui bom fluxo de setor → refinamento → relatório, mas o PDF analisado não vincula afirmações a fontes e repete parte das seções. No Bioma:

- cada pesquisa pertence ao workspace interno da EG, recebe versão própria e é usada exclusivamente para escolher e dominar uma vertical de prospecção;
- refinamento e relatório usam schema estruturado, com saídas específicas para prospecção, Growth e Social;
- execução live usa pesquisa web e só aceita URLs efetivamente observadas no retorno do provedor;
- relatório live insuficientemente fundamentado falha em vez de ser publicado como sucesso;
- modo sem credencial é `preview` metodológico, sem fatos, fontes ou números inventados;
- refinamento e geração exigem `manage_work`; não existe leitura, publicação ou navegação de pesquisa no Hub do cliente;
- tokens são registrados em FinOps e o custo fica desconhecido quando não puder ser calculado com fonte confiável;
- nenhuma migration foi aplicada e nenhum dado local foi criado nesta implementação.

O contexto de cliente foi absorvido como domínio separado de onboarding, em vez de reutilizar indevidamente a pesquisa de mercado. `workspace_client_profiles` guarda um perfil por workspace de cliente, com dados básicos, contato, negócio, marketing e recursos/preferências. A completude é calculada a partir de campos reais; leitura requer `view`, escrita requer `manage_work` e é auditada. O planejador recebe esse contexto apenas ao criar o seu rascunho aprovado internamente. Nenhum cliente, perfil ou dado demonstrativo foi criado nesta frente.

No fluxo Tech, `project_documents` agora pode apontar para o contrato correspondente e guardar um resumo/trecho confirmado para planejamento. O serviço recusa contratos de outro projeto e filtra o snapshot pelo contrato selecionado. Isso permite transformar proposta, especificação e escopo em rascunho de fases/entregas sem alegar que uma URL privada foi lida automaticamente. Nenhuma migration foi aplicada e nenhum projeto ou documento local foi criado nesta frente.

O estágio intermediário do planejamento deixou de ser implícito: novos itens gerados são candidatos desmarcados. A equipe pode selecioná-los e editar fase, descrição, prazo, prioridade, definição de pronto e subtarefas enquanto o plano está em rascunho. A aprovação recusa listas vazias; a materialização idempotente cria fases/entregas somente para os escolhidos, e `client_user` não recebe candidatos descartados. A migration 0053 preserva planos anteriores como selecionados e também não foi aplicada ao banco local nesta frente.

Em 27/07 foi incluída a camada anterior ao backlog: `project_planning_intakes`. Ela preserva a fotografia da descoberta por iniciativa, sem criar outro cliente nem misturar a pesquisa de mercado de prospecção com onboarding. `retail_v1` fornece campos comerciais e regras condicionais de maturidade/meta que a API valida. A intake finalizada é imutável e seu snapshot normalizado acompanha o plano gerado; cliente não recebe a intake estratégica. A migration 0054, tal como as anteriores, foi apenas versionada — não aplicada a este banco local.

Em 28/07 o fluxo de propostas deixou de depender apenas do radar de freelas. O wizard de carteira reutiliza cliente/workspace e `NewClientWizard`, consulta um catálogo server-owned, valida briefing e serviços, inclui o perfil estruturado do cliente no contexto dos três pilares e persiste a fotografia `commercial_proposal_v1`. A migration 0055 adiciona vínculo, série/versão e contexto comercial, mas não foi aplicada nem criou registros. Testes unitários provaram validação, vínculo e marcação `preview`; `tsc` e build passaram. Execução live, detalhe/revisão, PDF, envio, assinatura e conversão em contrato/projeto continuam sem prova operacional e não devem ser anunciados como concluídos.

O `npm audit --omit=dev` de 2026-07-27 sinalizou duas ocorrências high do mesmo advisory em `react-router`/`react-router-dom` 7.18.1. O advisory afeta o modo RSC; o frontend do Bioma é uma SPA Vite e não usa RSC. O npm só oferece correção automática forçada com mudança de versão incompatível para a faixa atual, portanto não foi aplicado upgrade automático nesta frente. O alerta deve permanecer visível até uma atualização compatível e testada do roteador.

## Adendo de remediação — 2026-07-23

Fechados desta rodada, dos "próximos passos" abaixo:

- **item 6 (rate limit compartilhado):** migrado para Postgres (`login_attempts`, migration 0026), fora da memória do processo; agora sobrevive a restart e vale com múltiplas réplicas.
- **item 11 (extrair helpers de acesso):** `_is_platform_admin`/`_accessible_client` foram removidos das quatro cópias (client_hub, files, performance, invites) e colapsados em `access.resolve_accessible_client` — a regra de acesso passa a ter uma fonte única.
- **item 12 (suíte automatizada):** criada `apps/api/tests/` com 58 testes pytest sem banco, cobrindo a política de acesso, as derivações de Performance (divisão por zero, citada na seção 2), o mapa de status ClickUp e as validações de deploy do `Settings` (o cookie cross-site da seção 3). Job `api-unit` na CI.
- **fora da lista mas relacionado:** QUEUE-001 (reaper de fila, migration 0025) e CONTRACT-001 (tipos TS gerados do OpenAPI com trava de drift) — ver `ROADMAP-MVP.md`.

Segue aberto: migrations 0025/0026 e smokes ainda precisam rodar contra Postgres (Docker indisponível na máquina onde a remediação foi feita). Itens 7 (carga), 8 (LinkedIn), 9 (reconciliar ClickUp), 10 (assets), 13 (rollback de migration) permanecem.

## Adendo de produto e implementação — 2026-07-22

A decisão ClickUp do adendo anterior foi superseded: a EG pretende encerrar o SaaS e o **Bioma passa a ser o system of record operacional**. A sincronização foi retirada das telas; o adapter fica somente para snapshot/reconciliação do legado antes de sua remoção.

Implementações locais desta rodada:

- cofre de acessos por workspace (`migration 0021`), com ciphertext versionado, RBAC separado para depósito/gestão/revelação, motivo obrigatório e auditoria de criação, rotação, status, revelação e cópia;
- área Acessos no Hub; cliente pode entregar segredo à EG sem poder revelá-lo, e valores revelados são limpos da memória da tela após 60 segundos;
- motor nativo de projetos (`migration 0022`): projeto, contrato versionado, item de escopo, vínculo de entrega, conclusão, aceite separado e indicadores de progresso/ritmo;
- área Projetos e Contratos no Hub, com criação inicial de projeto, contrato, escopo e entrega;
- acompanhamento Tech (`migration 0023`): fases ordenadas, entregas por fase, links de proposta/especificação e atualizações de progresso, bloqueio, teste ou release filtradas por visibilidade do cliente;
- GitHub Tech começou em leitura (`migration 0028`) e passou a permitir criação de issue por entrega com `confirm=true`, autorização de workspace, auditoria e replay local idempotente (`migration 0037`);

## Adendo de hardening — 2026-07-27

- O backoffice de propostas passou a exigir EG admin antes de acessar o banco.
- O campo `api_key_or_token` foi removido: o radar atual consome RSS e não possui justificativa para guardar cookies/tokens de plataformas.
- Configurações deixaram de criar/alterar schema em requisições e não gravam mais despesas incompatíveis em `financial_records`.
- Propostas agora consomem as saídas de Oferta, Conversão e Demanda; preço, prazo e cases permanecem vazios até decisão/evidência humana.
- Falha de auditoria, scraper, provider ou squad não é mais convertida em sucesso ou conteúdo fictício.
- O wizard executa o squad de onboarding e incorpora sugestões de entregáveis; execução sem chave fica identificada como prévia local.
- Em 2026-07-27, o domínio de projetos ganhou `project_plans/project_plan_items`: Tech, Growth e Social geram planos versionados de contrato, briefing ou onboarding; aprovação e materialização são separadas, e replay não duplica fases/entregas.
- Social registra política de aprovação adaptativa; Growth/Social nunca geram candidato GitHub. Tech só cria issue após HITL individual.
- A escrita GitHub deixou de manter transação aberta durante a rede e passou a reservar a entrega e usar marcador `[Bioma:<deliverable_id>]` para reconciliar falhas intermediárias.
- `test_proposals_flow.py` foi convertido para teste sem banco depois que a versão anterior deixou registros no Postgres local.
- aba **Configurações → Empresa → Acessos**, para a EG operar o mesmo cofre por workspace sem recorrer a planilhas;
- cofre ampliado com os campos mínimos da operação (plataforma, conta, usuário, e-mail, senha, outro acesso e link), mantendo valores de acesso cifrados;
- smoke isolado para cofre e projetos, sem dependência da HM.

Validação executada no desenvolvimento local: migrations 0021/0022/0023, compile/OpenAPI da API, TypeScript, build Vite, `smoke_vault.py` e `smoke_projects.py` passaram. Isso confirma o comportamento local e não constitui validação de deploy ou QA visual humano.

SleekFlow foi classificado apenas como possível adapter omnichannel em descoberta. A parceria e o contrato técnico ainda não existem; não há integração implementada nem promessa bidirecional.

## Adendo de remediação — 2026-07-21

A afirmação original de que nenhum endpoint pulava a checagem de BOLA/IDOR não abrangia corretamente `services/tasks.py`. A janela `85bb410..82c73ca` também continha uma credencial ClickUp hardcoded. O token foi revogado fora do repositório, o commit local ainda não publicado foi reescrito e os scripts passaram a exigir `CLICKUP_API_TOKEN` no ambiente, sem fallback.

Remediações aplicadas nesta rodada:

- SQL de tarefas extraído para `repositories/tasks.py`; leitura exige `view` e escrita exige `manage_work`.
- Toda lista/tarefa/subtarefa é resolvida no workspace autorizado; assignee, owner e dependencies precisam pertencer ao mesmo tenant/workspace, e ciclos são rejeitados.
- Recorrência usa uma origem única e não duplica sucessores; subtarefas e dependências têm edição real e tipada.
- `smoke_tasks.py` cobre EG admin, operator, viewer, client_user e cliente A tentando ler/mutar cliente B. Os smokes de API/workspace/tarefas usam massa efêmera, sem depender da HM.
- À época, ClickUp continuava como system of record; esta decisão foi superseded pelo adendo de 2026-07-22. O importador preservado continua tenant-scoped/idempotente apenas para migração.
- `DELETE /clients/{id}` agora arquiva. Purge físico é separado, exige confirmação exata, limpa S3 antes do banco e preserva auditoria.
- `request<T>` trata corretamente 204/corpo vazio, e a rota duplicada `GET /clients/deliverables/me` foi removida.

O texto abaixo é preservado como fotografia da auditoria de 2026-07-12; quando houver divergência, este adendo e os documentos de arquitetura atuais prevalecem.


### Storage S3 — pergunta do Eduardo

Railway lançou **Railway Buckets**: object storage S3-compatible nativo, isolado por ambiente, sem precisar de conta externa. O módulo de arquivos (FILE-001) já foi implementado genérico via `boto3` com endpoint configurável — funciona com Railway Buckets, Cloudflare R2, Backblaze B2 ou AWS S3 só trocando as env vars `STORAGE_S3_*`, sem mudar código. Recomendo Railway Buckets para manter tudo na mesma plataforma.

## 2. Arquitetura e qualidade de código

**Pontos fortes:**

- Camadas consistentes no backend: router → service → repository, repetido em `client_hub`, `performance` e `files`. Fácil de navegar e de replicar para o próximo módulo.
- Isolamento multi-tenant (BOLA/IDOR) tratado de forma consistente: todo endpoint por cliente resolve `find_accessible_client(client_id, is_admin, user_id)` antes de tocar dados. Não achei nenhum endpoint que pule essa checagem.
- Frontend com bundle dividido por view (lazy-load), tokens de design centralizados em `styles.css`, sem CSS-in-JS ou inconsistência de paleta.
- Honestidade de dados (regra do próprio roadmap) é levada a sério: banners "demo" aparecem sempre que a fonte não tem sync real, e não achei nenhum lugar que finja dado real.

**Pontos a melhorar:**

- **Duplicação de auth helpers:** `_is_platform_admin`, `_require_platform_admin` e `_accessible_client`/`find_accessible_client` estão reimplementados de forma quase idêntica em `services/client_hub.py`, `services/performance.py` e `services/files.py` (e seus repositórios). Funciona, mas qualquer mudança de regra de acesso (ex.: novo papel além de `eg_admin`/`client_user`) precisa ser replicada em 3 lugares manualmente. Vale extrair para `bioma_api/security.py` ou um módulo `access.py` compartilhado quando mexer no próximo módulo.
- **Sem suíte de testes automatizada (pytest/vitest):** a validação hoje é só smoke test end-to-end (`smoke_api.py`, `smoke_performance.py`, `smoke_files.py`, etc.) rodando contra um banco real. Isso pega regressões de integração, mas é lento e não cobre casos de borda unitários (ex.: `_derive_ads_metrics` com métricas zeradas, `parseContentSections` com markdown malformado). Não é bloqueador do MVP, mas vai doer conforme o time crescer.
- **Migrations só "para frente":** não há script de rollback/down. Para o estágio atual é aceitável (equipe pequena, banco descartável em staging), mas antes de produção com dado real vale ao menos documentar o procedimento manual de reversão por migration.
- **`AdminDock.tsx` usa `selectedClient: any`** — único lugar do frontend que abre mão de tipagem; fácil de corrigir tipando para `ClientSummary | null`.
- **Chunk do `AnalyticsView` ficou pesado (~369 kB antes de gzip, ~108 kB depois)** por causa do Recharts. Já é lazy-loaded, então não afeta o carregamento inicial, mas se Analytics virar a tela mais usada vale investigar `recharts` tree-shaking ou uma lib mais leve.

## 3. Segurança

**Bem feito:**

- Hash de senha com Argon2 (`argon2-cffi`), não hash reversível.
- Cookie de sessão `HttpOnly`, `Secure` fora de `local`, `SameSite` configurável.
- Rate limit de login e teste de sessão revogada/expirada já existem (`SEC-001A`, `SEC-003` do roadmap).
- Presigned URLs de download expiram em 5 minutos; arquivo `internal` nunca é exposto a `client_user` (checado no service, não só na UI).
- `bootstrap_admin.py` existe justamente para não expor seed demo em staging/produção.

**Gaps reais, não só os já listados no roadmap:**

- **Risco concreto ligado à topologia de deploy atual:** o plano em `DEPLOY.md` é web e API sob o mesmo domínio registrável (`SESSION_COOKIE_SAMESITE=lax` funciona bem nesse caso). Mas **enquanto o domínio próprio não estiver no ar**, qualquer teste com web em `*.vercel.app` e API em `*.railway.app` (domínios diferentes) vai fazer o cookie de sessão **não ser enviado** nas chamadas `fetch(credentials: 'include')` — `SameSite=Lax` não cobre esse caso cross-site. Login vai parecer que "não funciona" mesmo com os dois serviços no ar. Antes de validar staging sem domínio próprio, ou configura o domínio final primeiro, ou muda para `SESSION_COOKIE_SAMESITE=none` + `Secure=true` — e nesse caso, **sem token/verificação de Origin, o CSRF passa a depender só do SameSite**, que deixaria de proteger. Vale adicionar um check de `Origin`/`Referer` no backend antes de aceitar esse modo.
- **Rate limit em memória do processo único:** já anotado no roadmap (`SEC-003` → `migrar para Redis/Postgres`), mas vale reforçar que hoje ele reseta a cada deploy/restart e não vale nada com 2+ réplicas — é uma proteção "de vitrine" até isso ser resolvido.
- **Sem checklist LGPD assinado** antes de qualquer dado real de cliente (`LGPD-001`, já no roadmap) — bloqueador de verdade antes de subir dado real da HM ou de qualquer cliente pagante.
- **Sem teste de carga nem pentest** (`SEC-004`, `SEC-005`, já no roadmap) — aceitável para MVP interno, mas necessário antes de expor a clientes externos.

## 4. Visão de negócio — aderência à proposta HM

- O motor operacional (Client Hub, aprovações, CRM mínimo, financeiro, Performance) está sólido e testável — mais avançado que a maioria dos MVPs nesse estágio.
- **Maior gap comercial: LinkedIn (orgânico + Ads)**, que é o centro da proposta HM, ainda não foi integrado (`INT-LI-001` ainda é só um ADR pendente). Sem isso, por mais completo que o resto esteja, a entrega não cobre o que foi vendido para a HM.
- **ClickUp real** não é mais objetivo de produto. O pendente é reconciliar/exportar o legado e então remover o adapter.
- **Assets de marca** são placeholders (SVGs genéricos "EG"/"HM") — o produto não está apresentável a um cliente externo como está, mesmo com o motor pronto.
- CRM mínimo e Brand Book rico foram conscientemente adiados (decisão já registrada em `ROADMAP-MVP.md`) — correto, mas bom lembrar que "CRM" hoje é kanban simples, não deve ser vendido como CRM completo.

## 5. Próximos passos priorizados


**P1 — segurança antes de dado real:**
5. Checklist LGPD (`LGPD-001`).
6. Migrar rate limit para armazenamento compartilhado antes de múltiplas réplicas.
7. Teste de carga básico (`SEC-004`).

**P1 — produto/aderência comercial:**
8. ADR + implementação de LinkedIn orgânico/Ads (`INT-LI-001`/`002`).
9. Reconciliar o legado ClickUp com projetos/escopo nativos e remover o adapter após snapshot final.
10. Assets finais de marca (EG e, com autorização, HM).

**P2 — qualidade/manutenibilidade:**
11. Extrair `_is_platform_admin`/`_accessible_client` para um módulo compartilhado.
12. Suíte de testes automatizada (pytest no backend, ao menos testes de componente no frontend).
13. Documentar procedimento de rollback de migration.

## Adendo de implementação — 2026-07-23 (AI Ops e FinOps)

- **AI-OPS-001:** migration 0029 e módulo `ai_operations` criam definições versionadas, runs idempotentes, etapas ordenadas e checkpoints HITL. Templates iniciais: proposta, onboarding nativo no Bioma, LinkedIn e entrega Tech.
- **FINOPS-AI-001:** custos internos foram separados em assinatura, consumo observado e snapshot de cota. Valores usam centavos; moedas permanecem separadas; origem de cota é obrigatória e saldo desconhecido não vira zero.
- **Medição automática:** geração real do Estúdio IA grava tokens no ledger. Se não houver tabela de preço confiável, o evento fica marcado como custo desconhecido.
- **Isolamento:** endpoints vivem em `/backoffice/ai-operations` e exigem EG admin. A tela só consulta FinOps na Operação EG.
- **Validação:** todas as migrations e o smoke `smoke_ai_operations.py` passaram em `bioma_aiops_smoke`, removido depois; pytest completo, OpenAPI/tipos, `tsc -b`, build, compile API/worker, `npm audit --omit=dev` (0 vulnerabilidades) e `git diff --check` passaram.
- **Ainda aberto:** adapters executores, tabela de preços por modelo, câmbio auditado e captura automática de quotas só podem ser ligados quando cada provedor oferecer uma fonte oficial/contratual confiável.

## Metodologia

Revisão manual completa do código do backend (routers/services/repositories/schemas) e frontend (App, views, componentes, lib) já lidos integralmente durante o desenvolvimento desta sessão, cruzada com `ROADMAP-MVP.md`, `EXECUCAO-MVP.md`, `DEPLOY.md` e investigação ao vivo de Vercel (API + CLI) e GitHub Deployments API para Railway. Não rodei `/simplify` ou `/security-review` como skills automatizadas porque elas aplicam mudanças de código automaticamente no diff atual — preferi entregar primeiro a avaliação para vocês decidirem o que priorizar. Posso rodar qualquer uma das duas à parte se quiser um passe automatizado.

## Adendo de implementação — 2026-07-28 (propostas, planejamentos e Copiloto)

- O `PATCH` legado não altera mais status; a máquina de estados auditada exige claims aprovadas antes de aprovação/envio.
- Consulta pública legada e lifecycle público exigem validade, revisão aprovada, proposta não arquivada e status compatível. O novo DTO público omite snapshots, autoria interna e e-mail do signatário.
- A conversão `won → projeto + contrato + escopo` exige platform admin, confirmação HITL, cliente ativo e chave idempotente; conflito de chave é detectado antes das mutações.
- Planejamentos Tech e Growth/Social foram separados do intake Retail e continuam rascunho/finalizado antes da geração do plano.
- O Copiloto implementado é assíncrono/manual. Realtime, envio externo e assinatura permanecem explicitamente não configurados.
- A migration 0056 foi criada, mas não aplicada nem usada para popular banco.
- Validação até este ponto: pytest completo (88 testes), `npx.cmd tsc -b`, `npm.cmd run build`, import da API, `compileall`, regeneração OpenAPI/tipos e leitura sintática/textual do PDF gerado passaram. QA visual e smoke com banco após aplicar 0056 permanecem pendentes.
- `npm.cmd audit --omit=dev` não ficou verde: reportou 2 achados high no `react-router` 7.18.1 (`GHSA-qwww-vcr4-c8h2`). O advisory limita o impacto às APIs RSC instáveis, que este SPA Vite não usa, mas a versão corrigida indicada é 8.3.0 e exige avaliação de upgrade major; nenhum `audit fix --force` foi aplicado.
