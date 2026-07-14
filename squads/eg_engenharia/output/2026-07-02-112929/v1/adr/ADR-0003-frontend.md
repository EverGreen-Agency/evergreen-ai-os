# ADR-0003: Frontend em React 19 + Vite + TypeScript (SPA)

- **Status:** aceita
- **Data:** 2026-07-02
- **Projeto / Cliente:** rian-pje-trf1
- **Decisores:** Eduardo (EG) + Arquiteto de Decisões EG

## Contexto
RF2/RF3 exigem um formulário com **lógica dinâmica encadeada** (matéria → jurisdição → classe judicial → assunto, com campos condicionais). RF4 (salvar/reusar modelo) e RF7 (dry-run com pré-visualização do que será enviado) tornam a UX o coração do produto.

## Opções Consideradas
1. **React 19 + Vite + TypeScript (SPA)** — prós: padrão da casa (adopt), ideal para formulários com dependências reativas e estado local rico; tipagem pega erro cedo. contras: build step + overhead de SPA.
2. **Server-rendered + HTMX** (Jinja no FastAPI) — prós: mais simples, menos JS. contras: a cascata reativa e o dry-run interativo ficam capengas; foge do padrão da casa. anel: fora do radar.
3. **Next.js** — o radar diz **NÃO** para casos sem SSR/SEO/deploy público (é o caso aqui).

## Decisão
**Escolhemos React 19 + Vite + TypeScript.** Descartado HTMX porque a lógica dinâmica encadeada e o dry-run pedem interatividade rica no cliente, e o padrão da casa (React/Vite/TS) reduz custo de manutenção e reaproveita componentes.

## Consequências
- **Ganhamos:** UX fluida para o formulário dinâmico; reuso de padrões EG; tipagem.
- **Abrimos mão de:** simplicidade máxima de um app server-rendered.
- **Passa a exigir:** build Vite no pipeline de deploy (servido pela app ou por um container estático).
- **Reversibilidade:** média.

## Impacto no Banco de Stack
Nenhum — React/Vite/TypeScript já são **adopt**.
