# Bioma API

Backend HTTP do Bioma MVP v0.

Responsabilidades iniciais:

- auth e sessão;
- escopo por cliente;
- descoberta persistente de workspaces por tenant;
- CRM/funil de leads;
- financeiro mínimo;
- métricas manuais/analytics honesto;
- audit log;
- motor nativo de projetos, contratos, escopo, tarefas e entregas;
- cofre de acessos cifrado e auditado;
- importador ClickUp legado, sem superfície de sincronização no produto;
- publicação de artefatos para o Client Hub;
- healthcheck para staging e produção.

Deploy do MVP: Railway, com root directory `bioma/apps/api` e `railway.json`.

## Banco local

Com o Docker do Bioma rodando:

```bash
python scripts/migrate.py
python scripts/seed_dev.py
python scripts/create_eg_client.py
```

Usuários de desenvolvimento:

- `eduardo@evergreengrowth.com.br` / `senha-dev-123`
- `henrique@hmconexoes.com.br` / `senha-dev-123`

## Rodar local

```bash
python -m venv .venv
pip install -r requirements.txt
uvicorn bioma_api.main:app --reload
```

## Validar

```bash
python -m compileall bioma_api scripts
python scripts/smoke_api.py
python scripts/smoke_clickup.py
python scripts/smoke_projects.py
python scripts/smoke_vault.py
python scripts/smoke_workspace_authz.py
python scripts/smoke_workspace_navigation.py
python scripts/smoke_tasks.py
```

Os smokes criam massa efêmera própria e não dependem do cliente HM no banco compartilhado. A matriz cobre health, CORS, login, CRUD, archive/purge auditado, navegação, capacidades e isolamento BOLA/IDOR entre clientes.

`smoke_tasks.py` cobre EG admin, operator, viewer e client_user; cliente A tentando ler e mutar cliente B; CRUD, subtarefas, dependências, recorrência idempotente e imutabilidade de projeções ClickUp.

Também valida `GET /workspaces`: o EG admin recebe o workspace interno e os clientes; `client_user` recebe somente seu próprio contexto. O smoke cobre ainda membership legada indevida na organização EG, bloqueio de convite ao workspace interno e revogação de Client Hub, Files, Performance e Kommo quando um workspace cliente é arquivado. `create_eg_client.py` mantém temporariamente o adapter exigido pelos módulos da Operação EG, mas esse registro não aparece como workspace cliente.

Client Hub, CRM, financeiro, métricas, arquivos, convites e Performance também estão expostos por `/workspaces/{workspace_id}/...`. As rotas `/clients/{client_id}/...` permanecem durante a transição. A migration `0013_performance_workspace_context.sql` faz backfill e dual-write do UUID canônico e reserva `gtm_workspace_id` para o identificador textual externo do Google Tag Manager.

Carteiras e autorização usam `tenant_memberships`, `teams`, `team_memberships` e `workspace_assignments`. O acesso efetivo é resolvido uma única vez por workspace, com papéis `tenant_admin`, `workspace_manager`, `operator`, `approver`, `viewer` e o adapter legado `client_user`. A gestão administrativa está em `/teams`, `/tenants/{tenant_id}/members` e `/workspaces/{workspace_id}/assignments`.

Preferências do navegador ficam em `workspace_favorites` e `workspace_saved_views`. A descoberta em `GET /workspaces` informa `is_favorite` e `is_assigned`; favoritos usam `/workspaces/{id}/favorite` e visões salvas usam `/workspaces/views`.

O Estúdio IA usa `POST /workspaces/{id}/ai/content` para enfileirar e `GET` no mesmo caminho para histórico/resultados. A API não chama o modelo dentro da requisição HTTP; o worker processa `ai_content_requests` e audita em `ai_runs`.

O Bioma é o system of record da execução. O importador legado classifica listas ClickUp como `social`, `growth`, `tech` ou `general` e preserva IDs externos para reconciliação. Tarefas importadas continuam somente leitura para não reescrever o histórico; trabalho novo é nativo do Bioma.

`smoke_clickup.py` valida o cliente ClickUp com `httpx.MockTransport`, sem chamar a API real.

## Encerramento do ClickUp

Não configure novo token para uso cotidiano. `scripts/import_clickup_to_bioma.py` permanece temporariamente como ferramenta de migração env-only, tenant-scoped, transacional por pasta e idempotente por `external_id`. Depois do snapshot e da reconciliação com projetos/escopo nativos, endpoint, configuração, adapter e colunas legadas devem ser removidos em etapas verificáveis.

## Projetos e cofre

`projects` segue router → service → repository e exige `view` para leitura e `manage_work` para escrita. O subdomínio Tech adiciona fases, documentos por URL e atualizações de progresso/bloqueio/teste/release, sempre filtrados por `client_visible`. `smoke_projects.py` cobre papéis, BOLA cliente A→B, owner, escopo/fase cruzados, contrato, entrega, ritmo, feed Tech e auditoria.

`vault` exige `SECRET_ENCRYPTION_KEY`, guarda ciphertext versionado, separa `submit_secrets`, `manage_secrets` e `reveal_secrets`, e audita criação, rotação, status, revelação e cópia. O registro suporta plataforma, conta/perfil, usuário, e-mail, senha, outra forma de acesso e link; somente o link é metadado legível. `smoke_vault.py` cobre a matriz de acesso e deve apontar para banco isolado.

`DELETE /clients/{client_id}` arquiva cliente e workspace, preservando o histórico. O purge físico é separado em `POST /clients/{client_id}/purge`, exclusivo de EG admin, exige confirmação exata do nome, limpa objetos S3 antes do banco e mantém o evento `client.purged` na auditoria.

## Endpoints HM/MVP

- `GET/POST/PATCH/DELETE /clients/{client_id}/leads`
- `GET/POST/PATCH/DELETE /clients/{client_id}/finance`
- `GET/POST/PATCH/DELETE /clients/{client_id}/metrics`

Esses endpoints cobrem o mínimo da proposta HM: funil de leads, controle financeiro e analytics manual enquanto integrações de mídia não estão conectadas.
