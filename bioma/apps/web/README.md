# Bioma Web

Frontend do Bioma MVP v0.

## Rodar local

```bash
npm install
npm run dev
```

## Validar

```bash
npx tsc -b
npm run build
```

O build executa `tsc -b` e `vite build`. Por enquanto ele é o smoke mínimo do frontend.

O QA visual manual (desktop, notebook com DevTools aberto e mobile) está documentado na seção "Checklist de QA visual" do `bioma/ROADMAP-MVP.md` e precisa ser assinado antes de considerar a UI pronta para cliente real.

## Contextos operacionais

O frontend separa três superfícies:

- **Control Plane:** Cockpit, administração da plataforma e Carteira de Clientes.
- **Central da Agência:** operação da própria EG, times, carteiras atribuídas e gestão do tenant.
- **Workspace:** contexto operacional completo da agência ou de um cliente.

A Operação EG vive sob `/operacao/...`; cada cliente vive sob `/clientes/:clientId/...`. CRM, financeiro e métricas usam as mesmas views nos dois tipos de workspace, mas toda rota passa um contexto explícito e nunca escolhe dados por um seletor global implícito.

O Topbar exibe somente o contexto atual. `Ctrl/⌘ K` abre um navegador largo e pesquisável, com workspaces recentes e busca por cliente, organização ou responsável. A lista completa continua em uma página própria; ela não é despejada em um dropdown da Sidebar. Favoritos e visões salvas são persistidos pela API; “Minha carteira” filtra `is_assigned`, calculado a partir das atribuições diretas e por time do backend.

Administradores EG configuram times, membros já habilitados e distribuição de workspaces em **Configurações → Empresa → Equipes & carteiras**. Na aba **Acessos**, escolhem o workspace do cliente e gerenciam o cofre cifrado sem expor valores na listagem. Essa superfície organiza a operação da agência sem transformar a EG em um item da carteira de clientes.

Cada Hub com módulo `content` habilitado expõe o Estúdio IA em `/clientes/:id/conteudo-ia`. A tela cria ativações, acompanha fila/execução e diferencia visualmente geração real de prévia metodológica local; nenhuma saída é publicada automaticamente.

`/operacao/pesquisa-mercado` abre o Estúdio de Pesquisa da EG: setor → focos selecionáveis → relatório versionado. O resultado separa fontes, dores, líderes, terminologia, roteiro de prospecção e oportunidades de Growth/Social para preparar a abordagem de uma vertical. A espera é indeterminada e não inventa porcentagem de progresso; impressão/exportação usa o relatório atualmente exibido. A pesquisa não é exibida nem publicada no Hub do cliente.

`/clientes/:id/contexto` expõe o contexto estruturado do cliente: informações básicas, contato, negócio, marketing e recursos/preferências. A porcentagem só reflete campos preenchidos de fato; quem possui `manage_work` pode editar, enquanto usuários com `view` acompanham o mesmo contexto em modo leitura.

Na Operação EG, `/operacao/ia` instala e solicita workflows versionados; execuções ficam visíveis com etapas e checkpoints HITL. `/operacao/financeiro` inclui FinOps de IA: assinaturas, equivalência mensal, cotas com fonte declarada e consumo observado. Esses blocos não são consultados nem renderizados em hubs de cliente.

Tarefas importadas do ClickUp aparecem apenas como legado somente leitura. Edição, subtarefas, dependências, recorrência e exclusão ficam disponíveis para tarefas nativas do Bioma e usuários com `manage_work`. A sincronização ClickUp foi removida das superfícies do produto.

O Hub possui rotas `projetos` e `acessos`. Projetos exibem contrato, escopo, planos versionados, fases, entregas, conclusão e ritmo. O planejador atende Tech, Growth e Social; Social escolhe o momento de aprovação e só Tech oferece criação de issue após confirmação explícita. O wizard pode iniciar as frentes escolhidas, mas cria apenas projeto e plano em rascunho — nunca materializa entregas automaticamente. Acessos permite depósito seguro pelo cliente e gestão/revelação conforme o papel, com os campos operacionais da planilha sem incluir segredo nas listagens.

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

O estado atual já separa platform admin, tenant admin, workspace manager, operator, approver, viewer e o adapter legado `client_user`; times e atribuições alimentam “Minha carteira”.

Ao remover um cliente na administração, a ação exposta é arquivamento e preserva histórico. Purge permanente não é oferecido como botão cotidiano no frontend.

## Tema e branding

O app usa tema escuro Verde Musgo com tokens CSS definidos no topo de `src/styles.css` (`--bg`, `--surface`, `--text`, `--accent` etc.). Novos componentes devem consumir os tokens em vez de cores hardcoded. Assets de marca ficam em `public/assets/brand/` (EG) e `public/assets/clients/<cliente>/` (clientes); os SVGs atuais são placeholders até chegarem os vetores finais.
