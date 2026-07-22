# Arquitetura do Bioma — mapa para humanos e IAs

Leia antes de mexer no código. Este projeto **não é Next.js**: o frontend é
Vite + React Router (rotas declaradas em `App.tsx`, sem `page.tsx`/pastas-rota)
e o backend é FastAPI síncrono com Postgres.

## Backend (`apps/api/bioma_api/`)

Toda feature segue a **trinca por domínio**:

```text
routers/<dominio>.py       # casca HTTP fina: valida tipos (UUID!), delega
services/<dominio>.py      # regra de negócio, permissões, auditoria
repositories/<dominio>.py  # SQL puro, sempre parametrizado
```

Domínios: `auth`, `oauth`, `passwords`, `invites`, `workspaces`, `client_hub`, `projects`, `tasks`, `vault`, `performance`,
`files`, `kommo` (routers `integrations`/`analytics`), `admin` (= backoffice EG,
prefixo `/backoffice`). Transversais: `access.py` (papéis, membership,
feature-gating), `crypto.py` (segredos em repouso), `config.py` (env),
`migrations/*.sql` (só aditivas, aplicadas no boot por `scripts/start.py`).

O domínio `ai_content` persiste ativações por workspace e não publica conteúdo automaticamente. A API apenas enfileira; o worker escolhe o job mais antigo entre Performance e IA, registra execução em `ai_runs` e produz saída estruturada. Sem credencial externa, o modo local é explicitamente `preview`; com `OPENAI_API_KEY`, o adapter usa a Responses API com JSON Schema estrito.

## Modelo de produto e tenancy

O destino canônico é:

```text
Bioma Platform
└── Tenant / Agência
    ├── Workspace agency_internal
    └── Workspaces client
```

Glossário:

- **Tenant:** agência assinante/operadora, como EG ou futura agência white-label.
- **Workspace:** fronteira operacional e de dados; pode ser interno da agência ou de cliente.
- **ClientAccount:** vínculo comercial que aparece na carteira; nunca representa a operação interna da agência.
- **Team / Membership / WorkspaceAssignment:** modelo futuro de pessoas, times e carteiras atribuídas.

Decisão completa: [`docs/adr/0001-tenant-workspace-hierarchy.md`](docs/adr/0001-tenant-workspace-hierarchy.md).

Integrações operacionais seguem [`docs/adr/0002-clickup-kommo-integration-strategy.md`](docs/adr/0002-clickup-kommo-integration-strategy.md): o Bioma é a fonte de verdade de projetos e execução; ClickUp é apenas fonte legada de migração, sem sincronização exposta na UI. Kommo, GitHub, SleekFlow e providers de Performance entram como adapters substituíveis, tenant-scoped e auditados. Escrita externa com impacto exige idempotência e HITL conforme o risco.

O domínio `projects` materializa `workspace → project → project_contracts → contract_scope_items → project_phases → deliverables`, com `project_documents` e `project_updates` como registros de acompanhamento. Contrato é versionado; entrega pode apontar para item de escopo e fase; conclusão e aceite são sinais distintos. Projetos Tech vinculam proposta/especificação por URL e publicam progresso, bloqueios, testes e releases com visibilidade explícita ao cliente. O progresso é calculado a partir das entregas e o ritmo considera atraso/bloqueio. O banco valida coerência de tenant/workspace/organização/projeto/escopo/fase por FKs e triggers.

O domínio `vault` guarda somente ciphertext `enc:v1:`. A listagem devolve metadados, nunca segredos; revelação/cópia exige capability específica, motivo e auditoria. Cliente pode depositar credenciais para o próprio workspace sem obter permissão de revelação. O frontend descarta o segredo revelado após 60 segundos, mas esse TTL de UI não substitui controles de servidor.

O domínio `tasks` segue a trinca completa: o router só traduz HTTP, o service aplica capacidades e invariantes, e `repositories/tasks.py` concentra todo SQL. Leituras exigem `view`; listas e mutações exigem `manage_work`. Assignee, owner e dependencies são resolvidos dentro do mesmo tenant/workspace, ciclos são rejeitados e a recorrência usa uma chave de origem única para ser idempotente.

Estado transitório: `workspaces` fornece a identidade persistente e `GET /workspaces` faz a descoberta autorizada. Os domínios operacionais aceitam `/workspaces/{workspace_id}/...`; `/clients/{client_id}/...` permanece como adapter de compatibilidade. Performance mantém `client_id` e `workspace_id` em dual-write enquanto leitores e workers migram, e o identificador externo do GTM chama-se `gtm_workspace_id`. `subject_organization_id` ainda aponta para o contêiner físico dos dados e `clients` continua como extensão comercial 1:1. `EverGreen Internal` fornece somente a ponte técnica da Operação EG e não pode ser removido antes das FKs/adapters restantes. `parent_organization_id` e `tenant_organization_id` descrevem pertencimento, mas não concedem autorização hierárquica. A carteira é uma projeção de `workspace_assignments`: atribuições podem apontar diretamente para usuário ou time, e `workspace_access_role(...)` centraliza a precedência dos papéis.

Regras invioláveis:

1. **Todo endpoint tem auth explícita** (`Depends(current_user_from_request)`).
   Endpoint público é exceção documentada (convite/reset/oauth/health).
2. **Todo acesso a dados de cliente passa por `find_accessible_client` ou
   `check_organization_access`** (BOLA/IDOR) e respeita `enabled_modules`
   (`require_client_module`) para `client_user`.
3. **Nenhum segredo em texto puro no banco** — `crypto.encrypt_secret`
   (Fernet, `SECRET_ENCRYPTION_KEY`); segredos nunca voltam em resposta HTTP.
4. **IDs em path são `UUID` tipado**, nunca `str`.
5. Scripts utilitários vivem em `scripts/` e usam `bioma_api.db.connect`
   (nunca connection string hardcoded). Cada domínio tem `smoke_<dominio>.py`.

## Frontend (`apps/web/src/`)

```text
App.tsx                # TODAS as rotas declaradas aqui
lib/api.ts             # único cliente HTTP (request/requestText); nunca fetch cru
hooks/useBiomaApi.ts   # react-query por cima do api.ts (cache/mutações)
store/uiStore.ts       # zustand só para estado de UI (seleções, drafts)
views/<X>View.tsx      # telas de cliente/EG-operação
views/admin/<area>/    # backoffice EG (lazy obrigatório — Phaser pesa 1,4 MB)
components/            # compartilhados; types/ para tipos de domínio do backoffice
styles.css             # design system (tokens EG); inline style é exceção
```

Mapa de acesso atual (quem vê o quê):

| Camada | Rotas | Guarda |
|---|---|---|
| Público | `/` (login), `/convite/:token`, `/redefinir/:token`, `/privacidade` | nenhuma |
| Control Plane EG | `/`, `/clientes` | sessão + `guardAdmin()` quando administrativo |
| Operação EG | `/operacao`, `/operacao/crm`, `/operacao/financeiro`, `/operacao/metricas` | `guardAdmin()` + ponte exata da organização EG |
| Workspace cliente | `/clientes/:id`, `/projetos`, `/tarefas`, `/acessos`, `/crm`, `/financeiro`, `/analytics`, `/documentos`, `/integracoes` | cliente acessível + gate do módulo daquela organização |
| Backoffice EG | `/engenharia`, `/eg-office`, `/eg-ideas`, `/eg-tech`, `/eg-architecture`, `/configuracoes` | `guardAdmin()` + lazy-load |

Regras invioláveis:

1. **Nada de `fetch()` cru** — todo request passa por `lib/api.ts` (base URL de
   produção + cookies + erros padronizados).
2. **Nada de dado mockado apresentado como real** — estado vazio honesto ou
   badge "demo"; "em breve" só para feature declarada, nunca número inventado.
3. **View nova = lazy no `App.tsx`** se não for a rota inicial.
4. **Variável CSS nova nasce no `:root` do `styles.css`** — referenciar token
   inexistente falha em silêncio (já aconteceu duas vezes).
5. **URL/contexto é a fonte da verdade operacional.** Componentes podem ser compartilhados entre EG e clientes, mas toda consulta/mutação recebe workspace explícito; `selectedClientId` é apenas ponte legada de UI.
6. **Carteira não é navegador de módulos.** A troca em escala acontece pelo navegador pesquisável do Topbar; a Sidebar e as tabs mostram apenas o contexto corrente.
7. **DELETE de cliente significa archive.** Purge físico é uma operação separada de platform admin, exige o cliente já arquivado e confirmação exata do nome, remove objetos S3 antes do banco e preserva o evento de auditoria.

## Protocolo de sessão (humano ou IA)

1. `git status` antes de começar; uma frente por sessão.
2. UI-only significa UI-only: precisou de backend, **pare e liste o que falta**.
3. Antes de encerrar: `npx tsc -b` + `npm run build` (web), `compileall` +
   boot da API + smoke do domínio tocado (api). **Nunca deixar o tree quebrado.**
4. Commit pequeno por marco, mensagem em PT, sem co-author de IA.
5. Decisões de escopo vão para `ROADMAP-MVP.md`; fila operacional em
   `EXECUCAO-MVP.md`.
