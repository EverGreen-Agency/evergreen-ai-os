# ADR-0001: Classificação, Retenção e Uso de IA com Dados

- **Status:** proposta
- **Data:** 2026-07-07
- **Projeto / Cliente:** `mod-lgpd-governanca-dados`
- **Decisores:** Eduardo / Juiz / revisão jurídica

## Contexto

O Bioma vai processar PII, contratos, áudios, credenciais, dados financeiros, reuniões, documentos de cliente e prompts/saídas de LLM. Sem classificação e retenção, módulos podem enviar dados sensíveis para lugares indevidos.

## Opções Consideradas

1. **Política escrita sem enforcement** — prós: rápido. Contras: pouco efetivo.
2. **Classificação simples + enforcement nos adapters** — prós: pragmático, aplicável cedo. Contras: exige disciplina nos módulos.
3. **DLP/compliance corporativo completo** — prós: robusto. Contras: pesado cedo demais.

## Decisão

**Escolhemos classificação simples com enforcement em adapters/API.**

Classes iniciais: `public`, `internal`, `client`, `pii`, `secret`, `financial`, `legal`, `restricted_ai`. Dados `secret` e `restricted_ai` não podem sair para LLM externa sem exceção aprovada e auditada.

## Consequências

- **Ganhamos:** regra operacional clara desde o início.
- **Abrimos mão de:** compliance completo automatizado no MVP.
- **Passa a exigir:** campos de classificação, retenção, consentimento e bloqueio nos adapters de LLM/RAG/publicação.
- **Reversibilidade:** média; classes podem evoluir, mas devem nascer cedo.

## Impacto no Banco de Stack

Nenhum imediato. Pode gerar avaliação futura de DLP/compliance tools.

