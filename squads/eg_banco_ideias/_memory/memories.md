# Squad Memory: Banco de Ideias EG

## Estilo de Escrita
- As descrições das ideias devem ser profundas, detalhadas e claras para qualquer pessoa que leia, não apenas resumos curtos.
- Em documentos textuais `.md`, usar Português do Brasil com acentuação correta sempre que o arquivo estiver em UTF-8 e não houver risco de quebrar encoding legado.

## Design Visual
- Quando uma ideia/doc envolver interface, identidade ou produto EG, respeitar o branding EverGreen: Verde Musgo Profundo `#09231B`, Amarelo Baunilha Claro `#FFF4C7`, Verde Menta Viva `#3AC97B` e tipografia Helvetica.

## Estrutura de Conteúdo
- Toda ideia complexa deve ser acompanhada de um arquivo de documentação ("docs") em `.md` correspondente que aprofunde seus fundamentos.

## Proibições Explícitas

## Técnico (específico do squad)
- Fonte da verdade do banco: `_opensquad/_memory/banco_ideias/ideas.json`. View humana gerada: `ideas.md`.
- Os detalhes profundos das ideias são guardados em `_opensquad/_memory/banco_ideias/docs/`.
- Horizontes do roadmap antigo foram descartados; `horizonte: ""` significa "a redefinir".
- Conexões (`depends_on` / `enables`) são o mecanismo anti-redundância — prioridade sobre categoria.
- Schema em inglês (chaves + valores enum: stage capture/evaluation/processing/project/company; horizon NOW/MEDIUM/LONG/NEW_COMPANY); `title`/`desc`/`source` ficam em PT (conteúdo).

- Em auditorias de conclusão, não marcar uma ideia como `project` apenas porque ela `enables` outra ideia; verificar o escopo próprio e evidência real no repo. Ex.: `banco-ideias` continua separado de `hub-chat-dispatcher`, que ainda precisa do campo de chat no dashboard.

## Changelog de Otimizações
- [2026-06-25] otimização: Atualização do curador para gerar descrições profundas e criar/atualizar documentação em .md (/docs/) para ideias complexas. (evidência: memórias acumuladas de profundidade e uso de /docs/)
