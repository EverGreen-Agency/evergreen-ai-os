# ADR-0001: Cofre de Senhas e Segredos

- **Status:** proposta
- **Data:** 2026-07-07
- **Projeto / Cliente:** `cofre-senhas`
- **Decisores:** Eduardo / Juiz

## Contexto

Hoje acessos de cliente podem estar em planilha com usuário e senha. O Bioma precisa guardar credenciais de clientes, tokens OAuth, recovery codes e acessos internos com auditoria. Construir criptografia de forma amadora é risco alto.

## Opções Consideradas

1. **Continuar com planilha + disciplina operacional** — prós: imediato. Contras: inseguro, sem auditoria real, não escala.
2. **Password manager externo apenas** — prós: seguro e rápido. Contras: pouca integração com tenant/onboarding e automações.
3. **Camada Bioma + storage de segredo seguro** — prós: UX integrada, auditoria por tenant, evita senha em JSON/git. Contras: exige decisão de KMS/vault e engenharia cuidadosa.
4. **Vault próprio completo** — prós: controle. Contras: risco alto e fora do core.

## Decisão

**Escolhemos camada Bioma + storage de segredo seguro.**

O Bioma guarda metadados, permissões, auditoria e fluxo de solicitação. O valor secreto fica criptografado por mecanismo aprovado em ADR técnico complementar. Não construir um password manager completo no MVP.

## Consequências

- **Ganhamos:** substitui planilhas e conecta onboarding/integrations.
- **Abrimos mão de:** recursos avançados de password manager no começo.
- **Passa a exigir:** threat model, encryption envelope/KMS ou serviço equivalente, redaction de logs.
- **Reversibilidade:** média; metadados ficam no Bioma, segredo pode trocar de backend.

## Impacto no Banco de Stack

Adicionar/avaliar solução de vault/KMS no Banco de Stack antes de produção.

