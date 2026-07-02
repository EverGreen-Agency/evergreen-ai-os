# ADR-0004: Persistência em SQLite (Fase 1) → PostgreSQL (Fase 2)

- **Status:** aceita
- **Data:** 2026-07-02
- **Projeto / Cliente:** rian-pje-trf1
- **Decisores:** Eduardo (EG) + Arquiteto de Decisões EG

## Contexto
RF4 (modelos salvos), RF10 (checkpoint/retomada sem duplicar) e o estado dos protocolos exigem persistência transacional. RNF §6: baixa escala (60/mês, 1 escritório), self-hosted por usuário **não-técnico** que roda Docker em casa. Fase 2 traz multi-user/permissões.

## Opções Consideradas
1. **SQLite (Fase 1)** — prós: zero-config, arquivo único (backup trivial), perfeito para baixa escala self-hosted; transacional (checkpoint seguro). contras: concorrência limitada (irrelevante aqui).
2. **PostgreSQL já na Fase 1** — prós: robusto, cresce para multi-user. contras: mais um serviço/container e ops para o Rian; over-engineering para o volume atual.
3. **Arquivos JSON** — prós: simples. contras: sem transação → checkpoint frágil, risco de estado inconsistente em falha (fere RF10).

## Decisão
**Escolhemos SQLite na Fase 1**, atrás de uma camada de acesso (SQLAlchemy) que permite migrar para **PostgreSQL na Fase 2** quando entrarem multi-user e permissões. Descartado Postgres-agora por over-engineering; JSON por falta de atomicidade (checkpoint exige transação).

## Consequências
- **Ganhamos:** simplicidade operacional máxima (1 arquivo, menos um container), backup trivial.
- **Abrimos mão de:** concorrência alta (não necessária na Fase 1).
- **Passa a exigir:** disciplina de migração na Fase 2 (mitigada pela camada SQLAlchemy).
- **Reversibilidade:** fácil (ORM abstrai o motor).

## Impacto no Banco de Stack
Adicionar ao radar: **SQLite** (trial — em validação neste projeto, adr ADR-0004@rian-pje-trf1) e **PostgreSQL** (assess — planejado para Fase 2).
