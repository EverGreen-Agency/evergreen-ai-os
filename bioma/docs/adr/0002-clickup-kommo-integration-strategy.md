# ADR 0002 — Estratégia ClickUp e Kommo: integração antes de substituição

- Status: aceito
- Data: 2026-07-18 (revisado em 2026-07-21)

## Contexto

O Bioma precisa servir simultaneamente a operação da EG, os Hubs de clientes e, no futuro, tenants white-label. Reimplementar de imediato todo o motor de tarefas do ClickUp e todo o CRM/automação do Kommo criaria uma superfície muito maior do que o diferencial atual do produto e duplicaria sistemas maduros antes de validar uso, custo e aderência.

Ao mesmo tempo, limitar o Bioma a um painel passivo impediria que ele se tornasse o sistema operacional da relação agência–cliente e a camada de inteligência descrita na Mega Plataforma.

## Decisão

Adotar uma evolução **integration-first, com substituição seletiva por evidência**.

### O que o Bioma possui desde já

- tenancy, workspaces, times, carteira e autorização;
- experiência única da operação EG, agência e cliente;
- documentos, artefatos, arquivos, aprovações e auditoria;
- contexto cruzado de CRM, financeiro, Performance e conteúdo;
- ativações de IA e metodologia EG;
- IDs canônicos e mapeamentos para sistemas externos.

### O que o ClickUp continua possuindo

- execução detalhada de tarefas, subtarefas e dependências;
- automações operacionais, carga/capacidade e calendário de produção;
- esteiras Social, Growth e Tech enquanto não houver paridade comprovada.

O ClickUp permanece o **system of record da execução operacional**. Tarefas importadas são projeções locais somente leitura, identificadas por `external_source='clickup'` e `external_id`; o Bioma não aceita mutações locais nesses registros. Tarefas criadas nativamente no Bioma continuam locais e não são propagadas ao ClickUp.

O bridge é unidirecional, ClickUp → Bioma. Status são traduzidos por lista/operação para o vocabulário estável do Bioma, sem obrigar todos os tenants a usar exatamente os mesmos nomes no ClickUp. Não chamaremos a integração de bidirecional enquanto não existir escrita externa real, idempotente, auditada e confirmada por HITL.

O importador exige token por variável de ambiente, tenant e team explícitos. Cada pasta é uma unidade transacional independente, e listas, tarefas e subtarefas são reconciliadas por identificador externo para permitir reexecução sem duplicação.

### O que o Kommo continua possuindo

- pipeline especializado, atividades comerciais e histórico de relacionamento;
- automações, canais e recursos nativos do CRM;
- credenciais e tokens operacionais, cifrados quando referenciados pelo Bioma.

O Bioma oferece a visão de CRM dentro do workspace, combina métricas com os demais domínios e só adicionará escrita no Kommo por comandos explícitos, idempotentes e auditados.

## Critério para substituir uma capacidade externa

Uma capacidade só migra para o núcleo do Bioma quando todos os itens forem verdadeiros:

1. é diferencial recorrente para a EG ou para tenants white-label;
2. usuários executam a ação principalmente no Bioma, não no sistema externo;
3. há contrato de dados, autorização, auditoria e recuperação de falha;
4. existe paridade mínima validada com usuários reais;
5. o custo total de manter a integração supera o de possuir a capacidade.

## Sequência

1. Projeção confiável, tenant-scoped e observável, sem escrita externa.
2. Comandos externos assistidos somente após confirmação humana, idempotência e auditoria.
3. Automação opt-in por tenant e por operação.
4. Substituição seletiva apenas para capacidades que cumpram os critérios acima.

## Consequências

- O Bioma pode se tornar o ponto principal de trabalho sem reconstruir dois SaaS completos agora.
- ClickUp e Kommo são dependências substituíveis por adapters, não fronteiras de autorização.
- Credenciais reais nunca entram em código, fixtures ou histórico Git; validação ao vivo exige segredo efêmero no ambiente e conta controlada.
- A direção white-label permanece viável: cada tenant traz ou recebe seus próprios mapeamentos e credenciais.
