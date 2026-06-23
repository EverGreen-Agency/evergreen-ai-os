---
name: kommo-api
description: Skill para interagir com a API do Kommo CRM (Pipelines, Leads e Custom Fields)
---

# Kommo CRM API Skill

Esta skill permite aos agentes estruturar e ler dados da conta do Kommo CRM de um cliente específico.

## Autenticação (Por Cliente)

Diferente do ClickUp, **cada conta do Kommo possui suas próprias chaves de API individuais**. 
A autenticação não é global, pois a EverGreen atua nas contas isoladas de cada cliente.

Os agentes devem SEMPRE fazer o seguinte:
1. Ler o arquivo de configuração do cliente localizado em `_opensquad/_memory/clients/<ID_DO_CLIENTE>/kommo_config.json`.
2. Extrair o subdomínio (`<subdomain>.kommo.com`) e as chaves de acesso (como `access_token`).

> Se as chaves ou o arquivo de configuração do cliente não existirem, o agente deve **obrigatoriamente** solicitar ao usuário (Gestor/Humano) que as forneça antes de tentar qualquer requisição.

## Funcionalidades Principais

Endpoint base: `https://<subdomain>.kommo.com/api/v4`
Headers obrigatórios: `Authorization: Bearer <access_token>`

Você pode construir scripts Python para fazer as requisições REST de configuração:

### 1. Criar/Listar Pipelines e Funis de Vendas
`GET ou POST /api/v4/leads/pipelines`
- Permite criar ou mapear as etapas baseadas no *Playbook do Kommo*.

### 2. Criar Tags
`POST /api/v4/leads/tags`
- Ideal para etiquetar os leads conforme a origem (Growth, Social, etc).

### 3. Criar Custom Fields (Campos Personalizados)
`POST /api/v4/leads/custom_fields`
- Permite adicionar os campos de qualificação definidos no escopo do cliente.

## Regras de Execução

1. **Isolamento Total:** Certifique-se SEMPRE de estar utilizando o subdomínio e token corretos do cliente alvo. Um erro aqui pode vazar dados de um cliente para o outro.
2. Nunca coloque (hardcode) chaves diretamente no código do script Python. Sempre leia dinamicamente do JSON de configuração.
3. Utilize blocos de tratamento de erro (`try/except`) para capturar respostas `401 Unauthorized` ou `403 Forbidden`, caso o token esteja expirado, alertando o usuário.
