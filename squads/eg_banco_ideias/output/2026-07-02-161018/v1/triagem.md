# Triagem — Gerador de Documentos EG

**Run:** 2026-07-02-161018 · **Curador**

## Ideia crua
Uma capacidade para **gerar/criar documentos entregáveis** (PDF, DOCX) com **branding EG** — e de **cliente** quando preciso — de forma consistente. Motivação: propostas e relatórios saem toda hora com layout/branding diferente; e a necessidade concreta de mandar o doc do Rian por arquivo (WhatsApp/e-mail). Decidido que é **skill**, não squad (capacidade transversal, "motor antes da interface").

## Checagem no banco (55 ideias)
Parentes encontrados — nenhum é a mesma coisa:
- **`skill-brand-eg`** (Skill brand-guidelines-EG) — aplica a *identidade* EG (cor/fonte) a qualquer artefato. É a **camada de marca** (tokens), não o motor de renderização/exportação de documento. → o gerador **depende** dela.
- **`filosofia-visual-eg`** — manifesto de regras visuais. Fundamento de marca. → o gerador **respeita** / depende.
- **`web-artifacts-builder`** — motor de **UI web** (React/Vite). É tela, não documento/arquivo (PDF/DOCX). Distinto.
- **`squad-relatorios`** — escreve a **narrativa** do relatório; o gerador **renderiza o arquivo final**. Complementares → o gerador **habilita**.
- **`squad-hunter` (eg_proposals)** — produz a proposta; o gerador **renderiza** o arquivo entregável. → **habilita**.

## Veredito
```
Veredito: VARIAÇÃO (parente de skill-brand-eg; não é duplicata)
Registro proposto: Gerador de Documentos EG (PDF/DOCX branded) · Infra · horizon a redefinir (sugiro MEDIUM) · origin internal
Conexões: depends_on [skill-brand-eg, filosofia-visual-eg] · enables [squad-relatorios, squad-hunter]
```

## Registro proposto (detalhe)
- **id:** `doc-generator-eg`
- **title:** Gerador de Documentos EG (PDF/DOCX branded)
- **desc:** Skill (motor + templates) que transforma conteúdo (markdown/dados estruturados) em **documentos entregáveis** com layout e identidade consistentes: propostas, relatórios de cliente, specs/anexos de contrato, one-pagers. Saídas: **PDF** (via HTML→Chrome headless `--print-to-pdf`, ou WeasyPrint) e **DOCX**. Branding **parametrizável**: perfil EG (musgo/menta/baunilha, Helvetica Neue) por padrão, ou branding do cliente quando o entregável é para a marca dele. Usa a camada de marca do `skill-brand-eg`. Resolve a dor de "cada documento sai com layout/branding diferente". Origem prática: entregável do lead Rian (PJe/TRF1) precisou virar PDF único e protótipo — feito à mão; esta skill industrializa isso.
- **category:** Infra · **stage:** capture · **horizon:** "" (a redefinir — sugestão MEDIUM) · **origin:** internal
- **depends_on:** [skill-brand-eg, filosofia-visual-eg]
- **enables:** [squad-relatorios, squad-hunter]
- **source:** sessão jul/2026 (feedback Eduardo — lead Rian/PJe)

*Como ideia estrutural, na gravação também crio `docs/doc-generator-eg.md` com os fundamentos.*
