# Banco de Ideias EG

Funil único de ideias da EverGreen — tecnologia, features, squads, oportunidades. Toda ideia entra crua e caminha pelo ciclo **captura → avaliação → processamento → projeto interno → empresa nova**.

## Arquivos

- **`ideas.json`** — fonte da verdade (lida e escrita pelo squad `eg_banco_ideias`, e futuramente pela aba Banco do dashboard).
- **`ideas.md`** — view humana legível, **gerada** a partir do JSON. Não editar à mão; o Curador regenera.
- **`README.md`** — este arquivo.

## Como mexer

- **Via conversa (recomendado):** `/opensquad run eg_banco_ideias` → o Curador recebe a ideia crua, checa duplicata, enriquece e grava.
- **Via tela:** (em construção) aba Banco no dashboard, lendo este `ideas.json`.

## Schema de uma ideia

| Campo | Valores |
|-------|---------|
| `id` | slug-kebab único |
| `title` | nome curto (conteúdo em PT) |
| `desc` | uma frase (conteúdo em PT) |
| `stage` | capture · evaluation · processing · project · company |
| `horizon` | NOW · MEDIUM · LONG · NEW_COMPANY · `""` (a redefinir) |
| `category` | Squad · Cockpit · Feature · Service · Infra · Commercial |
| `origin` | internal · external |
| `archived` | true / false |
| `depends_on` | lista de ids — o que precisa existir antes |
| `enables` | lista de ids — o que essa ideia destrava |
| `source` | de onde veio (doc, sessão, link) |

> **Idioma:** chaves e valores enumerados em **inglês**; `title`/`desc`/`source` ficam em **PT** (conteúdo de negócio mostrado no front). Raiz do arquivo: `schema_version`, `updated_at`, `note`, `stages`, `ideas`.
>
> **Nota sobre horizontes:** as "travas e premissas" do roadmap antigo (`EG_Roadmap_Tecnologia_e_Oportunidades.md`) foram **descartadas** na sessão de jun/2026. As *ideias* daquele doc foram migradas pra cá; os *horizontes* viraram `""` (a redefinir). As conexões (`depends_on`/`enables`) é que carregam a lógica de integração agora.
