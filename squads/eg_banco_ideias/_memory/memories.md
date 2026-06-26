# Squad Memory: Banco de Ideias EG

## Estilo de Escrita
- As descri√ß√µes das ideias devem ser profundas, detalhadas e claras para qualquer pessoa que leia, n√£o apenas resumos curtos.

## Design Visual

## Estrutura de Conte√∫do
- Toda ideia complexa deve ser acompanhada de um arquivo de documenta√ß√£o ("docs") em `.md` correspondente que aprofunde seus fundamentos.

## Proibi√ß√µes Expl√≠citas

## T√©cnico (espec√≠fico do squad)
- Fonte da verdade do banco: `_opensquad/_memory/banco_ideias/ideas.json`. View humana gerada: `ideas.md`.
- Os detalhes profundos das ideias s√£o guardados em `_opensquad/_memory/banco_ideias/docs/`.
- Horizontes do roadmap antigo foram descartados; `horizonte: ""` significa "a redefinir".
- Conex√µes (`depends_on` / `enables`) s√£o o mecanismo anti-redund√¢ncia ‚Äî prioridade sobre categoria.
- Schema em ingl√™s (chaves + valores enum: stage capture/evaluation/processing/project/company; horizon NOW/MEDIUM/LONG/NEW_COMPANY); `title`/`desc`/`source` ficam em PT (conte√∫do).

## Changelog de OtimizaÁıes
- [2026-06-25] otimizaÁ„o: AtualizaÁ„o do curador para gerar descriÁıes profundas e criar/atualizar documentaÁ„o em .md (/docs/) para ideias complexas. (evidÍncia: memÛrias acumuladas de profundidade e uso de /docs/)
