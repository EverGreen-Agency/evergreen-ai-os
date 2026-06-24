# Squad Memory: Engenharia EG (SDD + ADR)

## Estilo de Escrita

## Design Visual

## Estrutura de Conteúdo

## Proibições Explícitas

## Técnico (específico do squad)
- Fluxo SDD: brief → spec.md (contrato) → ADRs (porquê de cada escolha) → scaffold (repo + tarefas).
- Artefatos de decisão moram em `_opensquad/_memory/clients/<id>/engenharia/` (spec.md, adr/, scaffold.md).
- Entrada de stack: `banco_stack/stack.json` (preferir Adopt/Trial). Saída: ADRs; promoção de tech atualiza o anel no stack.json com o id do ADR.
- Templates: `templates/spec.template.md`, `templates/adr.template.md`.
- Write/Read barrier: escrita no ClickUp (Kickoff) é aprovada, não automática.
- Só projeto de CLIENTE. Auditoria de estrutura interna é do eg_guardiao.
