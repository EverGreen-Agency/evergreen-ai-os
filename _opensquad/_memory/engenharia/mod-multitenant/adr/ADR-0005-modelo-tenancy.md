# ADR-0005: Modelo de Tenancy e Hierarquia de Organizações

**Módulo:** `mod-multitenant` (Decisão Transversal P5)
**Data:** 2026-07-06
**Status:** Proposto

## 1. Contexto
A Mega Plataforma precisa atender uma variedade imensa de cenários B2B. Usuário, cliente e tenant não são a mesma coisa. Um usuário (como você, Eduardo) pode pertencer a várias organizações, operando em contextos diferentes. O modelo precisa acomodar desde o cliente clássico de agência até o usuário de SaaS puro (que só comprou a ferramenta) e até agências white-label parceiras.

## 2. Decisão Proposta
Adotar um modelo estritamente hierárquico e flexível de organizações:

```text
EG (Admin Global)
  ├── Cliente Direto (Atendido pela EG com serviço ativo)
  ├── Usuário SaaS Independente (Contratou apenas a plataforma via marketing/indicação, sem consultoria)
  └── Agência Parceira (White-label)
       └── Cliente da Agência Parceira
```

**Conceitos Mínimos no Banco de Dados:**
*   `organizations`: Entidade de conta/empresa, com um `parent_org_id` opcional (para criar a árvore de relações).
*   `users`: A identidade humana global (e-mail, senha).
*   `memberships`: A tabela pivô (vínculo) conectando `users` às `organizations`.
*   `roles` e `permissions`: Papéis e escopos da organização (RBAC).
*   `tenant_id`: Coluna OBRIGATÓRIA em absolutamente todas as tabelas de dados de produto.

## 3. Regras de Negócio e Isolamento
*   A EG tem o papel de Super Admin operacional, mas toda e qualquer personificação (acessar o painel de um cliente) deve gerar um log de auditoria inalterável.
*   Uma Agência Parceira não herda acesso aos clientes da EG, e o cliente da parceira não enxerga a agência parceira (white-label perfeito).
*   **Módulos Bloqueados:** No `client-hub`, a renderização do que é bloqueado ou liberado deve ser resolvida por *entitlements/contrato* no backend (checagem de assinatura), e nunca apenas por um "if" visual no frontend.

## 4. Consequências e Trade-offs
*   O schema inicial do banco de dados fica mais trabalhoso (complexidade de árvore hierárquica), mas blinda a EG de precisar refatorar a base de dados inteira quando o SaaS escalar e as Agências Parceiras ou Usuários Independentes entrarem.
