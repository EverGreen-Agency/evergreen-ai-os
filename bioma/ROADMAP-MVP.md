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
- [ ] Fazer QA visual manual em desktop, notebook com DevTools aberto e mobile.
- [ ] Criar checklist manual de QA assinado.

### P1 - Aproximar da entrega HM

- [ ] Aplicar logos/assets reais da EG e, quando houver, da HM.
- [ ] Criar experiência específica de Briefing além do artefato textual.
- [ ] Criar experiência específica de Brand Book além do artefato textual.
- [ ] Criar calendário editorial rico, com visão semanal/mensal.
- [ ] Criar visão de Analytics honesta, sem fingir dados reais.
- [ ] Refinar UI para ficar mais próxima da proposta visual HM sem abandonar branding EG.

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
