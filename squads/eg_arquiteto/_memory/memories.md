# Squad Memory: Arquiteto EG

> Autovigilância da estrutura. Audita ideia/projeto interno LENDO O REPO AO VIVO e emite parecer consultivo (HITL).

## Estilo de Escrita

## Design Visual

## Estrutura de Conteúdo

## Proibições Explícitas
- Nunca recomendar squad novo sem antes escanear `squads/`.
- Nunca auditar de memória ou confiar em catálogo congelado — ler o repo é obrigatório.
- Nunca reescrever a estrutura sozinho (Write/Read barrier).

## Técnico (específico do squad)
- **Conhece a arquitetura lendo o repo ao vivo**, não um inventário: `squads/*/squad.yaml` (catálogo), `banco_stack/stack.json` (anéis), `.mcp.json` + `_opensquad/skills/` (integrações), código via Glob/Grep/Read.
- O `arquitetura.md` guarda só o **porquê** (identidade, princípios, decisões D1–D7), não o inventário.
- 5 gates: Squad (escaneia squads/) · Integração (.mcp.json/skills) · Stack (stack.json) · Princípios (arquitetura.md) · Alavancagem (reaproveitar/integrar/assinar/construir/ferramenta-direta).
- Consultivo: lê tudo, só escreve com aprovação. Não audita projeto de cliente (isso é eg_engenharia). Não é o Curador (ideia nova ≠ cabe na arquitetura).

## Changelog
- [2026-06-25] Renomeado de "Guardião" para "Arquiteto" (eg_guardiao → eg_arquiteto). Squad "Cartógrafo" descartado por redundância: o Arquiteto lê o repo direto em vez de sincronizar um doc. arquitetura.md enxugado para guardar só princípios + decisões (D1–D5).
- [2026-07-06] Rodado no `mod-multitenant` (fundação da mega-plataforma). Veredito CONSTRUIR: reaproveitar o blueprint do PDF HM Conexões (modelo de dados + monólito-modular), generalizar single-tenant→multi-tenant; NÃO criar squad (é build interno = eg_engenharia, D6). Registrada decisão **D7** (multitenant-first · módulos em 3 fases · moat ≠ aprisionamento). Parecer em `output/mod-multitenant-parecer.md`.
