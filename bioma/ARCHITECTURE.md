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

Domínios: `auth`, `oauth`, `passwords`, `invites`, `client_hub`, `performance`,
`files`, `kommo` (routers `integrations`/`analytics`), `admin` (= backoffice EG,
prefixo `/backoffice`). Transversais: `access.py` (papéis, membership,
feature-gating), `crypto.py` (segredos em repouso), `config.py` (env),
`migrations/*.sql` (só aditivas, aplicadas no boot por `scripts/start.py`).

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

Estado transitório: `organizations` já é o contêiner da maior parte dos dados operacionais; `clients` é uma extensão comercial 1:1 e fornece o `client_id` exigido pelas rotas atuais. `EverGreen Internal` é somente uma ponte para chegar à organização EG. Não removê-lo antes de migrar Performance e endpoints para `workspace_id`. `parent_organization_id` existe, mas ainda não implementa a hierarquia white-label nem autorização por tenant.

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
| Workspace cliente | `/clientes/:id`, `/clientes/:id/crm`, `/financeiro`, `/analytics`, `/documentos`, `/integracoes` | cliente acessível + gate do módulo daquela organização |
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

## Protocolo de sessão (humano ou IA)

1. `git status` antes de começar; uma frente por sessão.
2. UI-only significa UI-only: precisou de backend, **pare e liste o que falta**.
3. Antes de encerrar: `npx tsc -b` + `npm run build` (web), `compileall` +
   boot da API + smoke do domínio tocado (api). **Nunca deixar o tree quebrado.**
4. Commit pequeno por marco, mensagem em PT, sem co-author de IA.
5. Decisões de escopo vão para `ROADMAP-MVP.md`; fila operacional em
   `EXECUCAO-MVP.md`.
