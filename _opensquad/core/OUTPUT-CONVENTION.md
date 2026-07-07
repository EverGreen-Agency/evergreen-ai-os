# Convenção de Outputs dos Squads (canônica)

> Referência curta e única da estrutura de saída. O detalhe operacional está em `runner.pipeline.md`
> (seção *Output Path Transformation*). Este arquivo existe porque, na prática, a convenção foi
> aplicada de forma **inconsistente** entre runs — este é o padrão a seguir daqui pra frente.

## Estrutura padrão de um run

```
squads/<squad>/
  state.json                      ← SÓ enquanto há run ativo (dashboard). Removido no fim.
  output/
    <YYYY-MM-DD-HHmmss>/          ← 1 pasta por run (run_id)
      v1/                          ← pasta de versão (v1, v2… por grupo de saída)
        <arquivo-do-step>.md       ← nome = id/label do step (ex.: triagem.md, spec.md)
      state.json                   ← cópia arquivada do dashboard (histórico do run)
```

## Regras

1. **Todo arquivo de saída de step vai dentro de `v1/`** (ou `v2/`… se re-versionar o mesmo grupo).
   Nunca soltar o arquivo direto em `output/<run_id>/`. (Exceção: a cópia de `state.json`, que é
   histórico, não saída de step — essa fica na raiz do run.)
2. **Nome do arquivo = id do step** que o produziu (`step_triagem` → `triagem.md`;
   `step_spec` → `spec.md`). Nada de sinônimos (`routing.md` **ou** `roteamento.md`, escolha um e
   mantenha). Canônico do dispatcher: **`routing.md`**.
3. **`state.json` na raiz do squad** só existe durante o run. Ao terminar: copiar para
   `output/<run_id>/state.json` e **remover a cópia da raiz** (Post-Completion Cleanup). Raiz com
   `state.json` parado = órfão de um run que não fez cleanup → limpar.
4. **Checkpoints** (captura de resposta do usuário) usam só o run_id, **sem** `v1/` (não são saída
   versionada) — conforme runner.

## Inconsistências conhecidas (2026-07-02, não corrigidas retroativamente)

Renomear/mover pastas de runs antigos é **arriscado** (pode quebrar referências / clobbar) e de
**baixo valor** — ficam como estão. A convenção vale para runs **novos**. Exemplos do legado:
`dispatcher/output/2026-07-02-112016/routing.md` (na raiz, sem `v1/`) e
`banco_ideias/output/2026-07-02-112346/triagem.md` (idem) — deixados intactos de propósito.

## Onde mora cada TIPO de artefato (adendo 2026-07-07)

A convenção acima é só para **run de squad**. Mas há 3 tipos de artefato, e nem tudo vai pra `engenharia/`:

| Tipo | Exemplo | Onde mora | Como aparece |
|---|---|---|---|
| **Run de squad** (efêmero) | parecer, triagem, routing | `squads/<squad>/output/<run>/v1/` | histórico do run (dashboard) |
| **Projeto de cliente/lead** | Rian (PJe/TRF1), entregáveis | `_opensquad/_memory/clients/<id>/engenharia/` | **link na área do cliente/lead** (mesmo lead ainda não fechado) |
| **Módulo de plataforma/produto** | `mod-multitenant`, `client-hub`, `mod-bi-dashboards` | `_opensquad/_memory/engenharia/<id>/` (`spec.md` · `adr/` · `tasks.md`) | aba **Engenharia** do dashboard |

**Regras:**
- O `target` do `eg_engenharia` hoje é `client`|`internal`. Módulo de **plataforma/produto** não é projeto-de-cliente nem ferramenta-interna simples → usar `target: internal` com **flag/nota de produto** (ou criar `target: platform` quando o dashboard suportar). *(As specs `client-hub`/`bi` foram criadas com `target: external/mixed` — inválido; corrigir p/ o padrão.)*
- **Projeto de cliente/lead** (ex: Rian) **não** deve viver só no `output/` do squad: o entregável final vai pra `clients/<id>/engenharia/` e é **linkado na área do cliente/lead** — assim se acha pela pessoa, não navegando pastas. *(O Rian hoje está em `squads/eg_engenharia/output/<ts>/` — mover/linkar quando a Carteira/área de leads existir.)*
- **Fix de navegação real:** aba **"Engenharia"** no dashboard (feature de `mod-cockpit-interno`) lê esse filesystem e lista, por projeto/módulo, spec+ADRs+tarefas — como o Banco de Ideias já faz. Enquanto não existe, o índice é o `PLANO-MESTRE.md`.
