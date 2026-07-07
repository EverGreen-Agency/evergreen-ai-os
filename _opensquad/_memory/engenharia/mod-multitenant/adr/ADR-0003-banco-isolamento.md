# ADR-0003: Banco de Dados e Isolamento Multi-tenant

**Módulo:** `mod-multitenant` (Decisão Transversal P3)
**Data:** 2026-07-06
**Status:** Proposto

## 1. Contexto
A arquitetura B2B SaaS impõe um requisito absoluto: sob nenhuma hipótese os dados de um cliente (tenant) podem vazar ou ser acessados por outro cliente.
Existem duas abordagens principais para implementar este isolamento em bancos de dados relacionais:
1. **Isolamento via Código da Aplicação (App-Level):** Todo query no backend deve explicitamente incluir `WHERE tenant_id = ?`. Se um desenvolvedor esquecer dessa cláusula, ocorre um vazamento de dados (IDOR).
2. **Isolamento via Banco de Dados (Row-Level Security - RLS):** O próprio motor do banco de dados aplica as regras de segurança na linha, interceptando todas as queries e garantindo que a conexão só enxergue as linhas do tenant logado.

## 2. Decisão Proposta
**PostgreSQL com Row-Level Security (RLS).**

## 3. Consequências e Benefícios
*   **Segurança Padrão Ouro:** Mesmo que a aplicação tenha um bug (esquecimento do `WHERE`), o banco de dados bloqueia o acesso, impossibilitando vazamento cross-tenant.
*   **Simplificação do Código Backend:** As queries da aplicação ficam mais limpas, não necessitando de validações complexas e repetitivas de tenancy em toda rota.
*   **Alinhamento com Auth:** Se a decisão do ADR-0002 for o Supabase Auth, o RLS se integra perfeitamente com os JWTs gerados, mapeando o ID do usuário diretamente nas políticas de segurança do banco.
*   **Risco:** Curva de aprendizado inicial para escrever as políticas (Policies) em SQL diretamente no Postgres.

## 4. Reconciliação com ADR-0002 (nota do Juiz)
Este ADR já apontava que "RLS integra perfeitamente com JWT do Supabase". O **ADR-0002 v2** fecha nesse mesmo caminho: **Supabase Auth** emite o JWT com `tenant_id`/role nas claims, e as **policies RLS** aqui aplicam o isolamento. Não há mais a contradição da 1ª rodada (onde o 0002 rejeitava Supabase e o 0003 o elogiava). Auth (Supabase) + isolamento (RLS) + árvore de orgs (nosso schema) formam uma peça só.
