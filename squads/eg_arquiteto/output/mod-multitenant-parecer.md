# Parecer eg_arquiteto — `mod-multitenant`

Data: 2026-07-06 · Item **interno** (mega-plataforma) · pipeline: Avaliador de Negócios → Arquiteto → Registro.

## Step 1 — Avaliador de Negócios

```
ITEM: mod-multitenant (base de identidade / tenancy / permissões da mega-plataforma)
─────────────────────────────────
Primeiros Princípios: problema-RAIZ (sem tenancy não há client-hub, billing nem
                      agências-parceiras — é A trava do sistema); NÃO deletável (é
                      fundação); 10x (destrava toda a superfície de produto de uma
                      vez); MVP mais burro = 1 org + papéis + isolamento de dados
                      num módulo só, provando o padrão.
Oferta/Valor........: NEGÓCIO (habilita cobrar plataforma/white-label → retenção/MRR);
                      equação de valor: melhora Probabilidade percebida (dado
                      isolado/seguro) e reduz Esforço (reuso entre as 3 fases);
                      monetiza indireto (enabler de mod-saas-billing e client-hub);
                      alavancagem alta (mesmo código serve EG, cliente e agências).
A ONE THING.........: o modelo de tenancy + auth + isolamento de dados. Sem isso,
                      nada acima existe.
─────────────────────────────────
VEREDITO: CONSTRUIR
PRÓXIMO PASSO: handoff pra eg_engenharia escrever a spec (SDD) + ADRs.
```

## Step 2 — Arquiteto (5 gates, repo lido ao vivo)

```
ITEM: mod-multitenant
─────────────────────────────────
Gate Squad........: NÃO É SQUAD — é build de plataforma (eg_engenharia, target:internal,
                    D6). Nenhum squad cobre auth/tenancy. NÃO criar squad.
Gate Integração...: NOVA — hoje ZERO auth. `clients/<id>/` é injeção de contexto por
                    filesystem, não tenancy; o dashboard é cockpit local sem login.
                    Build-vs-buy do auth vai pra ADR (Supabase Auth / Clerk / Auth.js).
Gate Stack........: BANDEIRA — stack de produto (Postgres+RLS, provider de auth,
                    framework web) ainda não está no stack.json como adopt. Entra como
                    ADR + entrada no Banco de Stack. Referência: blueprint do PDF HM
                    (Next.js + PostgreSQL + workers).
Gate Princípios...: OK — respeita motor-antes-de-interface, HITL, Write/Read barrier;
                    ESTENDE "isolamento por client_id" → `tenant_id` + RLS (coerente).
                    Backdoor de inadimplente VETADO (ética/LGPD) → retenção via
                    suspensão de acesso (mod-saas-billing).
Gate Alavancagem..: CONSTRUIR reaproveitando o blueprint do PDF HM (modelo de dados +
                    monólito-modular) — generalizar single-tenant → multi-tenant.
                    Travas/gargalos: é dependência DURA de client-hub/billing/agências
                    (fundação, faz primeiro); LGPD/residência BR entra na spec.
─────────────────────────────────
VEREDITO: CONSTRUIR — fundação da plataforma; reaproveitar o blueprint do PDF;
          NÃO criar squad (é eg_engenharia interno).
PRÓXIMO PASSO: disparar eg_engenharia (target:internal, id `mod-multitenant`).
```

## Step 3 — Registro (aplicado, com aprovação de Eduardo)
- **D7** registrada no `arquitetura.md` (multitenant-first · módulos em 3 fases · moat ≠ aprisionamento).
- Visão canônica em `banco_ideias/docs/mega-plataforma.md`.
- `ideas.json`: `mod-multitenant` já existe (part_of `mod-nucleo`, stage capture/NOW).

## Handoff → eg_engenharia (próximo fluxo)
Escrever, para `mod-multitenant` (target:internal):
- **spec.md (SDD):** modelo de dados multi-tenant (a partir do blueprint do PDF HM + `tenant_id`), papéis/permissões (EG × cliente × agência-parceira × cliente-da-agência), fluxo OAuth, isolamento por RLS no Postgres, LGPD/residência BR.
- **ADRs:** (a) build-vs-buy do auth (Supabase Auth / Clerk / Auth.js / próprio); (b) monólito-modular vs micro-serviços; (c) Postgres RLS como mecanismo de isolamento; (d) hosting por tier (dados sensíveis região BR).
- Artefatos em `_opensquad/_memory/engenharia/mod-multitenant/`.
