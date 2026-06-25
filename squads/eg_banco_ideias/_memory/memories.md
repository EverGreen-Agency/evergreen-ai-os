# Squad Memory: Banco de Ideias EG

## Estilo de Escrita
- As descrições das ideias devem ser profundas, detalhadas e claras para qualquer pessoa que leia, não apenas resumos curtos.

## Design Visual

## Estrutura de Conteúdo
- Toda ideia complexa deve ser acompanhada de um arquivo de documentação ("docs") em `.md` correspondente que aprofunde seus fundamentos.

## Proibições Explícitas

## Técnico (específico do squad)
- Fonte da verdade do banco: `_opensquad/_memory/banco_ideias/ideas.json`. View humana gerada: `ideas.md`.
- Os detalhes profundos das ideias são guardados em `_opensquad/_memory/banco_ideias/docs/`.
- Horizontes do roadmap antigo foram descartados; `horizonte: ""` significa "a redefinir".
- Conexões (`depends_on` / `enables`) são o mecanismo anti-redundância — prioridade sobre categoria.
- Schema em inglês (chaves + valores enum: stage capture/evaluation/processing/project/company; horizon NOW/MEDIUM/LONG/NEW_COMPANY); `title`/`desc`/`source` ficam em PT (conteúdo).
