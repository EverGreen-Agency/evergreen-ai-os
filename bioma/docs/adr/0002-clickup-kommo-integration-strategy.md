# ADR 0002 — Bioma como motor operacional e integrações externas por adapters

- Status: aceito; decisão anterior superseded
- Data: 2026-07-18 (revisado em 2026-07-22)

## Contexto

O Bioma precisa servir a operação da EG, os Hubs de clientes e futuros tenants white-label. A decisão inicial preservava o ClickUp como *system of record* e tratava tarefas locais como projeções. Depois da importação dos projetos existentes, a EG decidiu encerrar o uso pago do ClickUp e absorver no Bioma as capacidades realmente utilizadas.

Continuar exibindo sincronização ou mantendo o ClickUp como dependência operacional geraria custo, ruído de produto e duas fontes de verdade. Kommo e possíveis parceiros omnichannel, como SleekFlow, têm outro papel: são sistemas externos especializados que podem ser conectados ao contexto canônico do cliente.

## Decisão

O **Bioma é o system of record de projetos, contratos, escopo, tarefas, subtarefas, dependências, entregas, recorrência e aceite**.

### Motor nativo

- `workspace` delimita cliente, tenant e autorização;
- `project` organiza uma frente Social, Growth, Tech ou geral;
- versões de contrato registram vigência, valor, assinatura e origem;
- itens de escopo registram quantidade, unidade, cadência e critério de aceite;
- entregas ligam execução ao projeto e, quando aplicável, ao item de escopo;
- tarefas detalham o trabalho e podem se ligar a listas/projetos;
- progresso e ritmo derivam de entregas concluídas, atrasadas e bloqueadas;
- entrega concluída não equivale automaticamente a aceite do cliente;
- toda escrita exige `manage_work`; leitura exige `view`; tenant/workspace são verificados em cada recurso.

### ClickUp

O ClickUp deixa de ser integração operacional e fonte de verdade. O código de importação existente fica temporariamente como **ferramenta de migração legada**, sem botão de sincronização na interface, sem token persistente e sem escrita externa. Registros já importados mantêm `external_source='clickup'` e `external_id` para rastreabilidade e permanecem imutáveis; o trabalho novo é nativo do Bioma.

A remoção definitiva do adapter e das colunas legadas ocorrerá somente depois de reconciliar os dados importados e confirmar que nenhum registro necessário ficou para trás. Não há integração bidirecional.

### Kommo e outros CRMs

O Bioma possui o contexto canônico do cliente e pode apresentar uma visão integrada do funil. Kommo continua sendo um adapter especializado enquanto a EG o utilizar. Escritas externas devem ser comandos explícitos, tenant-scoped, idempotentes, auditados e sujeitos a HITL quando houver impacto comercial.

O CRM nativo pode evoluir de forma incremental quando isso reduzir custo ou concentrar o trabalho diário no Bioma. O adapter não define autorização nem substitui IDs canônicos locais.

### SleekFlow

SleekFlow está em descoberta comercial e técnica. A direção provável é um adapter de canais/atendimento omnichannel para contatos, conversas, tickets e eventos, não um motor de projetos. Nenhuma integração será prometida antes de existir parceria, acesso à documentação/API aplicável e contrato de dados confirmado.

Se implementado, o adapter deve usar webhooks/HTTP com assinatura ou autenticação adequada, deduplicação por evento externo, fila de retry, auditoria, consentimento/LGPD e isolamento por tenant. Automação com efeito externo exige HITL conforme risco.

## Consequências

- o Hub do Cliente mostra projetos, contratos, escopo, entregas e acessos sem depender do ClickUp;
- status de Social podem variar por projeto/cliente, preservando templates de processo sem impor uma esteira rígida;
- projetos Tech poderão ligar tarefas a issues/PRs do GitHub, mantendo o Bioma como contexto contratual e de acompanhamento do cliente;
- integrações de CRM, canais, analytics e storage são adapters substituíveis;
- credenciais ficam no cofre cifrado e nunca em planilha, código, fixture ou histórico Git;
- uma integração só pode ser chamada de bidirecional após escrita externa real, idempotente, auditada e confirmada pelo fluxo HITL definido.

## Próxima remoção controlada do ClickUp

1. reconciliar projetos/tarefas importados e criar vínculos locais de projeto/escopo;
2. gerar relatório de itens sem correspondência e resolver duplicidades;
3. exportar snapshot final independente da assinatura do ClickUp;
4. remover endpoint, configuração e adapter de importação;
5. em migration posterior, retirar colunas/tabelas legadas quando não houver mais consumidores.
