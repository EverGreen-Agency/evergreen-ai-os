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

O MVP está em estado técnico validável, mas ainda não é produto final.

Funcional hoje:

- Login com sessão por cookie.
- API FastAPI com Postgres.
- Docker local com Postgres, Redis, API e Web.
- Seed dev com usuário EG e usuário cliente HM.
- Client Hub com carteira, entregáveis, aprovações, artefatos e status.
- Aprovar/reprovar pendência pelo front.
- Atualizar status de entregável como EG admin.
- Modal de artefato.
- ClickUp Bridge em modo manual/dry-run.
- CORS local para `localhost:5173` e `127.0.0.1:5173`.
- Área documentada para assets em `apps/web/public/assets/`.

Ainda demo/dry-run:

- Dados HM ainda vêm de seed.
- ClickUp ainda não sincroniza tarefas reais sem token e mapeamento real.
- Artefatos ainda não têm CRUD completo.
- Briefing, brand book e calendário ainda não estão completos como módulos.
- Permissões ainda são simples: `eg_admin` e `client_user`.
- UI ainda não é a experiência final premium prevista para o Client Hub.

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
- `bioma/apps/api/bioma_api/routers/client_hub.py`
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

- Criar CRUD mínimo de cliente.
- Criar CRUD mínimo de artefatos.
- Criar CRUD mínimo de entregáveis.
- Criar endpoint para listar estados de sync e auditoria.
- Adicionar testes automatizados básicos de API.
- Adicionar smoke test de frontend.
- Criar checklist manual de QA.

### P1 - Aproximar da entrega HM

- Aplicar logos/assets reais da EG e, quando houver, da HM.
- Criar telas específicas de Briefing.
- Criar tela de Brand Book.
- Criar calendário editorial inicial.
- Criar visão de Analytics placeholder honesta, sem fingir dados reais.
- Melhorar Client Hub para ser mais próximo da proposta visual HM, sem perder branding EG.

### P2 - ClickUp real

- Configurar `CLICKUP_API_TOKEN`.
- Cadastrar mapeamento real de pasta/listas.
- Ler tarefas reais.
- Mapear status por lista: Social, Growth e Tech.
- Registrar erros de sync de forma visível no cockpit.
- Definir política de escrita: sempre HITL no MVP.

### P3 - Segurança e qualidade

- Teste de IDOR/BOLA em endpoints com `client_id`.
- Teste de autorização entre `eg_admin` e `client_user`.
- Teste de sessão expirada/revogada.
- Teste de CORS local/staging/prod.
- Teste de validação de payload.
- Teste básico de carga.
- Checklist LGPD antes de qualquer dado real sensível.

### P4 - Staging

- Subir API e Postgres na Railway.
- Subir Web na Vercel.
- Configurar variáveis por ambiente.
- Rodar seed apenas em ambiente local/staging controlado.
- Criar domínio temporário de staging.

## Critério de pronto do MVP v0

O MVP v0 só pode ser considerado funcional quando:

- EG admin consegue entrar, ver clientes, criar/editar cliente, criar/editar entregáveis e artefatos.
- Cliente consegue entrar e ver apenas o próprio hub.
- Aprovações funcionam ponta a ponta.
- ClickUp real lê tarefas de pelo menos uma pasta/lista.
- A UI funciona em desktop, notebook com DevTools aberto e mobile.
- Não há dados fake apresentados como se fossem reais.
- Há testes mínimos de API e smoke test de frontend.
- Há checklist manual de QA assinado.

## Status de testes

Testes já rodados até aqui:

- Build frontend.
- Compile backend.
- Healthcheck API.
- Login via API.
- Fluxo básico de Client Hub.
- Aprovação/reprovação via API.
- ClickUp Bridge dry-run.
- CORS local.

Testes ainda não realizados:

- Burp/ZAP ou pentest automatizado.
- IDOR/BOLA sistemático.
- Teste de carga.
- Teste de invasão.
- Fuzzing de payload.
- Teste real de multiusuário.

Portanto, os testes atuais são testes funcionais e smoke tests de desenvolvimento. Eles não substituem auditoria de segurança.

## Como registrar progresso

Ao concluir uma tarefa, adicione uma linha em "Log de execução".

Formato:

```text
- YYYY-MM-DD - IA/sessão - commit/hash - resumo - validação executada - pendências
```

## Log de execução

- 2026-07-09 - Codex - 4d3502d - Corrigido CORS local, responsividade e área de assets - build front, compile backend, preflight/login CORS - pendente QA visual completo.
