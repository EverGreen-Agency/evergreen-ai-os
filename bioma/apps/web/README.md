# Bioma Web

Frontend do Bioma MVP v0.

## Rodar local

```bash
npm install
npm run dev
```

## Validar

```bash
npm run build
```

O build executa `tsc -b` e `vite build`. Por enquanto ele é o smoke mínimo do frontend.

O QA visual manual (desktop, notebook com DevTools aberto e mobile) está documentado na seção "Checklist de QA visual" do `bioma/ROADMAP-MVP.md` e precisa ser assinado antes de considerar a UI pronta para cliente real.

## Contextos operacionais

O frontend separa três superfícies:

- **Control Plane:** Cockpit, administração da plataforma e Carteira de Clientes.
- **Central da Agência:** operação da própria EG e, futuramente, times, carteiras atribuídas e gestão do tenant.
- **Workspace:** contexto operacional completo da agência ou de um cliente.

A Operação EG vive sob `/operacao/...`; cada cliente vive sob `/clientes/:clientId/...`. CRM, financeiro e métricas usam as mesmas views nos dois tipos de workspace, mas toda rota passa um contexto explícito e nunca escolhe dados por um seletor global implícito.

O Topbar exibe somente o contexto atual. `Ctrl/⌘ K` abre um navegador largo e pesquisável, com workspaces recentes e busca por cliente, organização ou responsável. A lista completa continua em uma página própria; ela não é despejada em um dropdown da Sidebar. Favoritos e visões salvas são persistidos pela API; “Minha carteira” filtra `is_assigned`, calculado a partir das atribuições diretas e por time do backend.

A fonte da navegação é `GET /workspaces`, não uma inferência sobre a lista de clientes. Recentes usam `workspace.id`; entradas locais antigas por cliente são convertidas à medida que forem reabertas. As URLs visuais continuam legíveis como `/clientes/:clientId`, mas os módulos chamam a API canônica por `/workspaces/:workspaceId`; o backend ainda aceita `client_id` como adapter de compatibilidade.

O registro técnico `EverGreen Internal` é uma ponte temporária para endpoints ainda baseados em `client_id`. Ele fica oculto da Carteira e só pode ser resolvido por correspondência exata com a organização administrativa da sessão. Ausência ou ambiguidade bloqueiam `/operacao`; não existe fallback para nome, primeiro cliente ou seleção anterior.

No ambiente local, a ponte é provisionada pelo script idempotente já existente:

```bash
cd ../api
python scripts/create_eg_client.py
```

Destino do produto:

```text
Bioma Platform
└── Tenant / Agência
    ├── Workspace interno da agência
    └── Workspaces de clientes
```

No estado transitório atual ainda existem apenas `eg_admin` e `client_user`; tenants, equipes, atribuições e papéis white-label completos estão no backlog arquitetural.

## Tema e branding

O app usa tema escuro Verde Musgo com tokens CSS definidos no topo de `src/styles.css` (`--bg`, `--surface`, `--text`, `--accent` etc.). Novos componentes devem consumir os tokens em vez de cores hardcoded. Assets de marca ficam em `public/assets/brand/` (EG) e `public/assets/clients/<cliente>/` (clientes); os SVGs atuais são placeholders até chegarem os vetores finais.
