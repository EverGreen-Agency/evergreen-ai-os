# Carteira de Clientes EG

Plano de controle **ativo** por cliente — não é uma vitrine passiva. Cada cliente tem uma pasta `clients/<id>/` que é a **fonte da verdade** das suas configurações. Mexer aqui é o que provisiona o ClickUp e dá contexto a todos os squads.

## Estrutura de uma pasta de cliente

```
clients/<id>/
├── config.json         # registro mestre: serviços, status, contatos, provisionamento ClickUp, oferta, datas
├── kommo_config.json   # config ISOLADO do CRM (token + domínio). NUNCA no .env global. Gitignored.
└── engenharia/         # (se houver projeto de dev) spec.md + adr/ + scaffold.md do squad eg_engenharia
```

O `_template/` é o molde. Para um cliente novo: copie `_template/` para `clients/<id-do-cliente>/` e preencha.

## O princípio: fonte da verdade → provisiona

`config.json` descreve o que o cliente **deveria** ter. O ClickUp é o reflexo disso.

- O campo **`purchased_services`** é o gatilho. Quando um serviço entra ou sai dessa lista, o ambiente do cliente precisa mudar.
- Exemplo do Eduardo: cliente Tech contrata Growth → adiciona `"Growth"` em `purchased_services` → o **`eg_setup`** (re)provisiona a estrutura de Growth no ClickUp.
- O bloco **`clickup`** registra o que de fato já foi criado (folder_id, list_ids, portal_url). É como sabemos o que está sincronizado e o que está pendente.

## Write/Read barrier (sempre)

A IA **lê** a carteira à vontade. **Escrever no ClickUp/Kommo do cliente é uma ação externa** e passa por um nó de aprovação humana:

1. Você muda `config.json` (ex: adiciona um serviço).
2. O `eg_setup` calcula o **diff** entre o desejado (config) e o real (bloco `clickup`).
3. Ele **propõe** o plano de provisionamento e pede aprovação.
4. Só após o "pode criar" ele escreve no ClickUp e atualiza o bloco `clickup` + o `log_provisionamento`.

Nada é provisionado autonomamente. Isso protege o ambiente real do cliente.

## Isolamento por `client_id`

- Tokens de cliente (Kommo, futuramente Meta/Google Ads) **nunca** vão para o `.env` global — ficam em `clients/<id>/`. É a fronteira de dados entre clientes.
- O `kommo_config.json` real (com token) é gitignored; só o `_template` é versionado.

## Quem conversa com a Carteira

| Squad | Relação |
|---|---|
| **eg_setup** | Lê `config.json`, calcula o diff, provisiona o ClickUp/Kommo sob aprovação. O braço executor da carteira. |
| **eg_engenharia** | Se `engenharia.tem_projeto`, grava spec/ADRs/scaffold em `clients/<id>/engenharia/`. |
| **eg_guardiao** | NÃO audita cliente. Mas a carteira faz parte do Banco de Arquitetura (§1) como estrutura de dados. |
| Demais squads | Leem `clients/<id>/` para contexto (voz da marca, serviços, contatos). |

## Estado atual

Motor pronto (estrutura de dados + fluxo). A **aba visual "Clientes"** no dashboard — plano de controle gráfico lendo estes `config.json` — é o próximo incremento, a fazer quando o primeiro cliente real entrar (princípio: motor antes da interface).
