# Squad Memory: Banco de Ideias EG

## Estilo de Escrita

## Design Visual

## Estrutura de Conteúdo

## Proibições Explícitas

## Técnico (específico do squad)
- Fonte da verdade do banco: `_opensquad/_memory/banco_ideias/ideas.json`. View humana gerada: `ideas.md`.
- Horizontes do roadmap antigo foram descartados; `horizonte: ""` significa "a redefinir".
- Conexões (`depends_on` / `enables`) são o mecanismo anti-redundância — prioridade sobre categoria.
- Schema em inglês (chaves + valores enum: stage capture/evaluation/processing/project/company; horizon NOW/MEDIUM/LONG/NEW_COMPANY); `title`/`desc`/`source` ficam em PT (conteúdo).
