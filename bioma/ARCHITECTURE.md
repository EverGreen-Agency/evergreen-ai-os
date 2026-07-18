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

Mapa de acesso (quem vê o quê):

| Camada | Rotas | Guarda |
|---|---|---|
| Público | `/` (login), `/convite/:token`, `/redefinir/:token`, `/privacidade` | nenhuma |
| Cliente | `/clientes`, `/conteudo`, `/comercial`, `/analytics`, `/engenharia` | `guard()` — módulo da org (`enabled_modules`) |
| EG interno | `/eg-office`, `/eg-ideas`, `/eg-tech`, `/eg-architecture`, `/configuracoes` (aba empresa) | `guardAdmin()` + grupo "Administração EG" na Sidebar |

Regras invioláveis:

1. **Nada de `fetch()` cru** — todo request passa por `lib/api.ts` (base URL de
   produção + cookies + erros padronizados).
2. **Nada de dado mockado apresentado como real** — estado vazio honesto ou
   badge "demo"; "em breve" só para feature declarada, nunca número inventado.
3. **View nova = lazy no `App.tsx`** se não for a rota inicial.
4. **Variável CSS nova nasce no `:root` do `styles.css`** — referenciar token
   inexistente falha em silêncio (já aconteceu duas vezes).

## Protocolo de sessão (humano ou IA)

1. `git status` antes de começar; uma frente por sessão.
2. UI-only significa UI-only: precisou de backend, **pare e liste o que falta**.
3. Antes de encerrar: `npx tsc -b` + `npm run build` (web), `compileall` +
   boot da API + smoke do domínio tocado (api). **Nunca deixar o tree quebrado.**
4. Commit pequeno por marco, mensagem em PT, sem co-author de IA.
5. Decisões de escopo vão para `ROADMAP-MVP.md`; fila operacional em
   `EXECUCAO-MVP.md`.
