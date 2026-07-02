# Squad Memory: Engenharia EG (SDD + ADR)

## Estilo de Escrita

## Design Visual

## Estrutura de Conteúdo
- Para projeto de **cliente**, o entregável de spec deve **consolidar num único documento** (anexo de contrato) escopo + arquitetura + stack, e vir acompanhado de **mapa de telas/fluxos + wireframes**. O cliente valida telas e regras de negócio, não a stack (a stack é responsabilidade da EG, registrada em ADR). Isso tira a subjetividade antes de fechar prazo/valores. (feedback Eduardo — projeto rian-pje-trf1, 2026-07-02)
- O documento de escopo, quando vira anexo de contrato, deve dizer explicitamente que trava o escopo e que revisões/novas funcionalidades entram como fase posterior/aditivo.

## Proibições Explícitas

## Técnico (específico do squad)
- Fluxo SDD: brief → spec.md (contrato) → ADRs (porquê de cada escolha) → scaffold (repo + tarefas).
- **Alvo do projeto** (`target`): `client` ou `internal`. É configuração — NÃO muda os gates HITL. Artefatos: cliente em `_opensquad/_memory/clients/<id>/engenharia/`; interno em `_opensquad/_memory/engenharia/<id>/` (spec.md, adr/, scaffold.md). Ver **D6** no Banco de Arquitetura.
- A Engenharia constrói projeto de cliente **E** interno (dogfooding). Fronteira: *auditar* estrutura interna ("isso cabe?") é parecer do Arquiteto (`eg_arquiteto`); *construir* algo interno é da Engenharia.
- Entrada de stack: `banco_stack/stack.json` (preferir Adopt/Trial). Saída: ADRs; promoção de tech atualiza o anel no stack.json com o id do ADR.
- Templates: `templates/spec.template.md`, `templates/adr.template.md`.
- Write/Read barrier: escrita no ClickUp (Kickoff) é aprovada, não automática.
- Geração de entregável em **PDF**: markdown → HTML (`python-markdown`, extensões `tables`/`fenced_code`) → **Chrome headless `--print-to-pdf`**. A máquina não tem `pandoc` nem `wkhtmltopdf`. Alternativa in-app: `page.pdf()` do Playwright ou WeasyPrint. Wireframes/PoC navegáveis: **HTML single-file self-contained** (branding EG), hospedável em GitHub Pages/Vercel.
- **LGPD/residência de dados no design:** ao desenhar projeto com dado sensível/PII, identificar as restrições de **LGPD e residência na própria spec** e escolher hosting **por tier** — backend/DB/credenciais em **região BR**; frontend livre. **Vercel tem região Brasil (gru1)** e Railway tem regiões → *managed ≠ dados fora do BR*. O **kit LGPD** (DPA, política de privacidade, termos, cláusula de transferência internacional) é **entregável** ao cliente (ver ideia `doc-generator-eg`).
- Nomenclatura: o agente de ADRs chama-se **Decisor Técnico** (`decisor_tecnico`), NÃO "Arquiteto de Decisões" — evita confusão com o squad `eg_arquiteto` (parecer interno). Renomeado em 2026-07-02.

## Changelog de Otimizações

- [2026-06-25] otimização (eg_meta): adicionada regra ao especificador para rejeitar projetos de estrutura interna, redirecionando para `eg_guardiao`. (evidência: memória de escopo exclusivo para clientes)
- [2026-06-25] correção (reverte a anterior — decisão de Eduardo + D6): a Engenharia passa a aceitar projeto interno via `target: internal`. A regra de rejeição virou *triagem* (auditoria → Arquiteto; build interno → Engenharia). O escopo "só cliente" estava errado: confundia separação-de-autonomia (princípio #3) com separação-de-squad. A Engenharia tem raio de impacto baixo (output = specs/ADRs/scaffold com gate HITL), então o alvo não altera autonomia. Ver D6 no Banco de Arquitetura.
