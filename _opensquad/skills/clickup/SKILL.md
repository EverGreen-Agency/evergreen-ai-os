---
name: clickup-api
description: Skill para interagir com a API do ClickUp (Criar pastas, listas e tarefas)
---

# ClickUp API Skill

Esta skill permite que agentes interajam com o ambiente ClickUp da EverGreen, usando chamadas HTTP para criar a arquitetura de projetos para os clientes.

## Autenticação

Como o ambiente do ClickUp é interno da EverGreen (um único Workspace onde os ambientes são duplicados), a autenticação utiliza um Token de API global.
Os agentes devem buscar este token através da variável de ambiente: `CLICKUP_API_KEY`.

## Funcionalidades Principais

Você pode construir scripts Python para fazer requisições REST ou usar o comando curl.
Endpoint base: `https://api.clickup.com/api/v2`
Headers obrigatórios: `Authorization: <CLICKUP_API_KEY>`

### 1. Criar Folder (Pasta)
`POST /space/{space_id}/folder`
- Body: `{"name": "Nome do Cliente"}`

### 2. Criar List (Lista)
`POST /folder/{folder_id}/list`
- Body: `{"name": "Social Media Engine", "content": "Descrição"}`

### 3. Criar Task (Tarefa)
`POST /list/{list_id}/task`
- Body: `{"name": "Task Name", "description": "Detalhes"}`

## Regras de Execução

1. Todo script gerado deve incluir tratamento de erros (try/except) e timeout.
2. Confirme os IDs de Space, Folder ou List com o usuário (ou leia da base de conhecimento) antes de executar as criações em massa no ambiente de produção.
