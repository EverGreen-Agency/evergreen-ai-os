# Squad Memory: Meta — Auto-melhoria

> Lê memories.md + runs de um squad-alvo → propõe diff nos .agent.md dele → aplica só o aprovado (HITL). É o squad que melhora os outros.

## Estilo de Escrita

## Design Visual

## Estrutura de Conteúdo

## Proibições Explícitas
- Nunca reescrever um .agent.md sem aprovação humana explícita (Write/Read barrier).
- Nunca propor mudança sem evidência na memória/runs do alvo.

## Técnico (específico do squad)
- Entrada: nome do squad-alvo → `squads/<alvo>/_memory/memories.md` + `agents/*.agent.md` + `runs.md`/`state.json`.
- Saída: diff proposto (evidência → mudança → risco); aplica aprovado; registra changelog no memories do alvo.
- Conservador: ajuste pequeno > reescrita grande.
