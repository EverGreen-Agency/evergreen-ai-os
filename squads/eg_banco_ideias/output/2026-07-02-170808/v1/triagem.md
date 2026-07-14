# Triagem — eg-publish

**Run:** 2026-07-02-170808 · **Curador**

## Ideia crua
Uma **skill para publicar direto na Vercel ou GitHub Pages** (não como link de artefato do claude.ai, que derruba percepção de valor). Motivação concreta: deployar o protótipo do Rian num link profissional.

## Checagem no banco (69 ideias)
- **`web-artifacts-builder`** — gera a UI (React/Vite). É produção do artefato, não o **deploy** dele. Distinto → eg-publish é o last-mile.
- **`doc-generator-eg`** — gera documentos (PDF/HTML). Também produção, não publicação. Distinto → eg-publish publica o que ele gera.
- Nenhuma ideia existente cobre **deploy/hospedagem**. → **NOVA**.

## Veredito
```
Veredito: NOVA (não há ideia de deploy/publish no banco)
Registro:  eg-publish (deploy de artefatos: Vercel / GitHub Pages) · Infra · origin internal
Conexões:  depends_on [] · enables [] (last-mile de web-artifacts-builder e doc-generator-eg — citado na desc; sem edge falso)
```

Aprovado por Eduardo ("Sim, registra via Curador").
