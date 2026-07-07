# ADR-0004: Hosting, Região e Residência de Dados

**Módulo:** `mod-multitenant` (Decisão Transversal P4)
**Data:** 2026-07-06
**Status:** Proposto

## 1. Contexto
A plataforma vai armazenar dados de clientes, usuários, permissões, tokens de integração, logs de auditoria e possivelmente dados comerciais sensíveis. A experiência pode usar CDN/edge, mas dados sensíveis e credenciais não devem ser tratados como ativo de frontend.

## 2. Decisão Proposta
Separar o hosting em três camadas:
1. **Frontend Público:** Pode usar CDN/Edge para performance extrema, desde que não armazene segredos nem dados sensíveis do cliente.
2. **Aplicação/API:** Deve rodar em uma região juridicamente aceitável para a EG e para os clientes, com forte preferência pelo Brasil (ex: AWS sa-east-1) ou América do Sul, para evitar latência.
3. **Banco de Dados, Auth, Storage Privado e Secrets:** Devem PRIORIZAR ABSOLUTAMENTE a residência de dados no Brasil. Se o provedor escolhido não oferecer isso nativamente, a exceção precisará ter um DPA (Data Processing Agreement), base legal ancorada na LGPD e aprovação explícita.

## 3. Consequências e Trade-offs
*   A escolha do provedor (Vercel, Supabase, Neon, AWS) não pode ser decidida apenas por "conveniência de deploy".
*   Vercel/Edge pode ser aceito para o shell e BFF leve, mas nunca como justificativa para mover dados sensíveis sem avaliação criteriosa.
*   Tokens OAuth (Meta, Google, LinkedIn) e chaves de API devem ficar rigorosamente criptografados (encryption at rest) no server side.
*   Backups, logs e ferramentas de observabilidade entram na mesma regra de residência e retenção.
