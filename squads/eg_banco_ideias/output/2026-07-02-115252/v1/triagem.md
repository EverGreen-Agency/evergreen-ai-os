# Triagem - Limpeza do Banco de Ideias EG

**Data:** 2026-07-02
**Pedido:** limpar o banco de ideias, identificar projetos/ideias que ja foram finalizados e apontar onde faltam definicoes de pronto e KPIs.

## Diagnostico rapido

- Total no banco: 67 ideias.
- Ativas: 66.
- Arquivadas: 1.
- Em `capture`: 54.
- Em `processing`: 13.
- Em `project`: 0.
- Em `company`: 0.
- Itens sem `readiness`: 67.
- Itens sem `clickup`: 67.
- Links quebrados: 2.

## Veredito

O banco esta superpovoado em `capture` e `processing`. Ha itens ja construidos que continuam como "em progresso", e isso distorce a leitura de prioridade. O maior problema estrutural nao e quantidade bruta; e falta de criterio de avanco:

- `project` esta vazio, mesmo havendo squads/skills/telas reais em uso.
- DoD/KPI nao estao representados no schema operacional do dashboard.
- `readiness` existe no schema do Curador, mas nenhum item usa.
- O editor do dashboard nao expoe `readiness`, `clickup` nem `part_of`.

## Ja concluidos - mover para `project`

Estes itens tem evidencia concreta no repo e deveriam sair de `processing`.

| ID | Evidencia | Acao proposta |
|---|---|---|
| `banco-ideias` | `_opensquad/_memory/banco_ideias/ideas.json`, `ideas.md`, docs e tela `dashboard/src/idea-bank/IdeaBank.tsx` | mover para `project` |
| `guardiao-arquiteto` | squad `squads/eg_arquiteto` com agente `arquiteto.agent.md` | mover para `project` |
| `business-evaluator` | agente `squads/eg_arquiteto/agents/avaliador_negocios.agent.md` | mover para `project` |
| `banco-arquitetura` | `_opensquad/_memory/banco_arquitetura/arquitetura.md` e `ArchitectureView` no dashboard | mover para `project` |
| `banco-stack` | `_opensquad/_memory/banco_stack/stack.json` e `TechRadar` no dashboard | mover para `project` |
| `squad-engenharia` | squad `squads/eg_engenharia` existe | mover para `project` |
| `squad-hunter` | squad `squads/eg_proposals` existe e materializa a ideia | mover para `project`; manter id antigo por compatibilidade |
| `auto-melhoria-squads` | squad `squads/eg_meta` existe | mover para `project` |
| `squad-prospector` | squad `squads/eg_prospector` existe | mover para `project` |
| `squad-criativos` | squad `squads/eg_criativos` existe | mover para `project` |
| `codegraph` | `.codegraph/` existe e skill `skills/codegraph/SKILL.md` existe | mover para `project` |
| `cross-repo-awareness` | skill `skills/eg-scan/SKILL.md` e script `skills/eg-scan/scripts/eg-scan.mjs` existem | mover para `project`, se a versao atual ja atende o uso minimo |

## Parcialmente concluidos - decidir se vira `project` ou se divide

| ID | Leitura | Acao proposta |
|---|---|---|
| `carteira-clientes` | existe `_opensquad/_memory/clients` e tela `ClientPortfolio`, mas ClickUp sync real esta separado em `clients-clickup-sync` | mover para `project` como "carteira local"; manter `clients-clickup-sync` como proxima evolucao |
| `squad-onboarding` | existe `eg_setup`, mas o item diz "parcialmente ja existe" | mover para `project` se `eg_setup` e o escopo aceito; ou renomear para deixar claro o que falta |
| `idea-detail-edit` | editor de ideias e leitura de doc existem no dashboard | mover para `project` se o criterio era editar titulo/desc/conexoes + abrir docs; manter backlog separado para campos DoD/KPI |
| `banco-arquitetura-tab` | esta arquivada, mas a aba `arquitetura` ja existe no App | manter arquivada como superada ou mover para `project` com nota "entregue" |

## Ideias que parecem travar progresso

| ID | Por que trava | Acao recomendada |
|---|---|---|
| `vector-store` | desbloqueia `segundo-cerebro`, `context-decay`, `squad-relatorios`, `squad-raiox` e parte do RAG | definir DoD/KPIs ou mover para `evaluation` com decisao clara: construir, comprar ou adiar |
| `hub-chat-dispatcher` | dependencia de `tag-ativacao` e `idea-bank-auto`; hoje o link para `dispatcher` esta quebrado | corrigir dependencia e definir MVP do hub |
| `idea-bank-auto` | e exatamente a automacao que evitaria este problema de estagios desatualizados | manter como NOW/MEDIUM prioritario depois da limpeza manual |
| `ads-api-skills` | bloqueia leitura real de performance para `squad-trafego` e loop de criativos | definir escopo minimo: somente leitura Meta/Google primeiro |
| `clients-clickup-sync` | fecha o ciclo entre carteira local e operacao real em ClickUp | avaliar depois de consolidar `carteira-clientes` como project |
| `squad-relatorios` + `squad-raiox` | dependem de dados confiaveis; sem vector/ads/kommo ficam abstratos | manter capturados ate haver DoD de dados |

## Links quebrados

| Origem | Link quebrado | Correcao proposta |
|---|---|---|
| `hub-chat-dispatcher` | `depends_on: dispatcher` | criar ideia `dispatcher` ou remover esse link, porque `dispatcher` e squad real mas nao existe como id no banco |
| `web-artifacts-builder` | `enables: banco-ideias-visual` | trocar para `idea-detail-edit` ou criar `banco-ideias-visual` |

## Duplicidade / fusao sugerida

| Item | Problema | Acao proposta |
|---|---|---|
| `squad-kickoff` | overlap forte com `squad-engenharia` | arquivar como absorvido por `squad-engenharia` ou transformar em `part_of: squad-engenharia` |
| `squad-onboarding` | materializado como `eg_setup`, mas ainda descrito como ideia generica | atualizar desc para "materializado em eg_setup" e mover de estagio |
| `squad-hunter` | id antigo nao bate com nome atual `eg_proposals` | nao renomear id sem necessidade; atualizar titulo/desc para evitar confusao |
| `banco-arquitetura-tab` | ja existe como aba do dashboard, mas esta arquivada | decidir: arquivada como superada ou project como entregue |

## Lacuna de DoD e KPI

Hoje o banco nao tem campo formal para "definicao de pronto" nem KPIs. `readiness` e diferente: ele fala de gates externos para iniciar, nao de criterio de conclusao.

Acao recomendada no schema:

- adicionar `definition_of_done` em cada ideia/projeto;
- adicionar `kpis` como lista de metricas observaveis;
- manter `readiness` para pre-condicoes externas;
- expor esses campos no `IdeaEditForm`;
- quando um item vai para `project`, exigir ao menos 1 DoD e 1 KPI/metric de verificacao.

## DoD/KPIs prioritarios para preencher primeiro

| ID | Definicao de pronto sugerida | KPI sugerido |
|---|---|---|
| `vector-store` | `rag_search(query, client_id)` funcionando com isolamento por cliente e corpus inicial versionado | taxa de respostas com fonte correta; tempo medio de busca; zero vazamento entre clientes |
| `hub-chat-dispatcher` | chat no dashboard roteia pedido livre para squad correto com checkpoint HITL | % de roteamentos aceitos sem correcao; tempo ate squad escolhido |
| `idea-bank-auto` | reconciliador detecta artefatos reais e propoe mudanca de estagio sem escrever sozinho | % de sugestoes corretas; numero de cards obsoletos detectados |
| `ads-api-skills` | leitura Meta/Google por `client_id`, sem escrita automatica | contas conectadas; metricas puxadas sem erro; latencia de coleta |
| `clients-clickup-sync` | diff desejado vs real no ClickUp com aprovacao antes de escrever | cards sincronizados; divergencias detectadas; erros de escrita |
| `squad-relatorios` | gera narrativa a partir de dados reais, nao input manual solto | tempo para relatorio; campos de dados preenchidos; aprovacao do cliente/interno |

## Operacao proposta para o step_registro

Aplicar em lote, com aprovacao:

1. Mover para `project`: `banco-ideias`, `guardiao-arquiteto`, `business-evaluator`, `banco-arquitetura`, `banco-stack`, `squad-engenharia`, `squad-hunter`, `auto-melhoria-squads`, `squad-prospector`, `squad-criativos`, `codegraph`.
2. Mover para `project` tambem, se aprovado: `cross-repo-awareness`, `carteira-clientes`, `squad-onboarding`, `idea-detail-edit`.
3. Arquivar ou absorver: `squad-kickoff` em `squad-engenharia`.
4. Corrigir links quebrados:
   - `hub-chat-dispatcher.depends_on`: remover `dispatcher` ou criar ideia `dispatcher`.
   - `web-artifacts-builder.enables`: trocar `banco-ideias-visual` por `idea-detail-edit`, salvo se voce quiser criar a ideia visual separada.
5. Criar um backlog tecnico separado para evoluir o schema/UI com `definition_of_done`, `kpis`, `readiness`, `clickup` e `part_of`.

## Checkpoint

Confirma aplicar essas mudancas no `ideas.json` e regenerar `ideas.md`?

Opcao recomendada: aplicar os itens 1, 3, 4 e criar o backlog de schema/UI. Deixar os itens parciais do item 2 para uma segunda confirmacao item a item.
