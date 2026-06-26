# Squad Memory: Engenharia EG (SDD + ADR)

## Estilo de Escrita

## Design Visual

## Estrutura de Conteúdo

## Proibições Explícitas

## Técnico (específico do squad)
- Fluxo SDD: brief → spec.md (contrato) → ADRs (porquê de cada escolha) → scaffold (repo + tarefas).
- **Alvo do projeto** (`target`): `client` ou `internal`. É configuração — NÃO muda os gates HITL. Artefatos: cliente em `_opensquad/_memory/clients/<id>/engenharia/`; interno em `_opensquad/_memory/engenharia/<id>/` (spec.md, adr/, scaffold.md). Ver **D6** no Banco de Arquitetura.
- A Engenharia constrói projeto de cliente **E** interno (dogfooding). Fronteira: *auditar* estrutura interna ("isso cabe?") é parecer do Arquiteto (`eg_arquiteto`); *construir* algo interno é da Engenharia.
- Entrada de stack: `banco_stack/stack.json` (preferir Adopt/Trial). Saída: ADRs; promoção de tech atualiza o anel no stack.json com o id do ADR.
- Templates: `templates/spec.template.md`, `templates/adr.template.md`.
- Write/Read barrier: escrita no ClickUp (Kickoff) é aprovada, não automática.

## Changelog de Otimizações

- [2026-06-25] otimização (eg_meta): adicionada regra ao especificador para rejeitar projetos de estrutura interna, redirecionando para `eg_guardiao`. (evidência: memória de escopo exclusivo para clientes)
- [2026-06-25] correção (reverte a anterior — decisão de Eduardo + D6): a Engenharia passa a aceitar projeto interno via `target: internal`. A regra de rejeição virou *triagem* (auditoria → Arquiteto; build interno → Engenharia). O escopo "só cliente" estava errado: confundia separação-de-autonomia (princípio #3) com separação-de-squad. A Engenharia tem raio de impacto baixo (output = specs/ADRs/scaffold com gate HITL), então o alvo não altera autonomia. Ver D6 no Banco de Arquitetura.
