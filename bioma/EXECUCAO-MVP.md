# Fila de execução do Bioma MVP

Este arquivo é o quadro operacional para Codex, Claude Code, Antigravity ou outra LLM continuarem o trabalho sem depender do histórico de chat.

O `ROADMAP-MVP.md` registra escopo e estado. Este arquivo registra ordem, dependências, dono e validação das próximas entregas.

## Protocolo obrigatório

Antes de trabalhar:

1. Rode `git status --short --branch --untracked-files=all`.
2. Leia `ROADMAP-MVP.md`, este arquivo e a spec relacionada.
3. Escolha uma tarefa com estado `TODO` e escreva no topo do commit/relato: `CLAIM <ID> <IA> <data>`.
4. Não assuma uma segunda tarefa que edite os mesmos arquivos.
5. Faça um commit por tarefa ou marco verificável.
6. Rode a validação declarada na linha da tarefa.
7. Atualize o estado para `DONE`, `BLOCKED` ou devolva para `TODO` com motivo.

Estados:

- `TODO`: livre para execução.
- `DOING`: alguém está executando; não duplicar.
- `BLOCKED`: depende de credencial, decisão ou trabalho anterior.
- `DONE`: código/documento e validação concluídos.

## Ordem de entrega

### Onda 0 — Contratos e deploy-ready

| ID | Estado | Frente | Entrega | Dependência | Validação |
|---|---|---|---|---|---|
| CORE-001 | DONE | Full-stack | Corrigir estados `queued/running` do Client Hub | nenhuma | smoke Performance + portal |
| CORE-002 | DONE | Full-stack | Criar solicitação de aprovação EG → cliente | CORE-001 | smoke API + build web |
| DPL-001 | DONE | Backend | Cookie/CORS por ambiente e `/health/ready` | nenhuma | compile + smoke API |
| DPL-002 | DONE | DevOps | Config as Code Fly/Vercel | DPL-001 | validar TOML/JSON + Docker build |
| DPL-003 | DONE | QA/DevOps | CI web/API/worker no GitHub Actions | DPL-002 | workflow parse + execução no PR |
| DPL-004 | DONE | Backend | Bloquear seed e criar bootstrap admin seguro | DPL-001 | bootstrap em banco descartável |
| DPL-005 | BLOCKED | Operação | Criar staging Fly `gru` + Managed Postgres | DPL-001..004 | deploy + `/health/ready` |
| DPL-006 | BLOCKED | Operação | Criar staging Vercel e domínios | DPL-005 | build + login no browser |
| DPL-007 | BLOCKED | QA | Smoke remoto de staging | DPL-006 | `smoke_remote.py` |

Bloqueio de DPL-005..007: acesso às contas Fly/Vercel, domínio e secrets.

### Onda 1 — Superfícies comerciais do MVP

| ID | Estado | Frente | Entrega | Dependência | Validação |
|---|---|---|---|---|---|
| WEB-CRM-001 | TODO | Frontend | Kanban de leads consumindo endpoints CRM existentes | CORE-002 | build + fluxo criar/mover lead |
| WEB-FIN-001 | TODO | Frontend | Tela financeira consumindo contratos/faturas existentes | CORE-002 | build + CRUD financeiro |
| WEB-PERF-001 | TODO | Frontend | Analytics consumir overview real de Performance | CORE-001 | build + dados seed marcados demo |
| WEB-PERF-002 | TODO | Frontend | Páginas Ads, GA4, GSC e GTM | WEB-PERF-001 | build + estados vazio/erro/freshness |
| AUTH-001 | TODO | Full-stack | EG admin cria/convida usuário cliente | DPL-004 | smoke de convite + isolamento |
| AUTH-002 | TODO | Full-stack | Fluxo seguro de recuperação/rotação de senha | AUTH-001 | token expirável + teste |
| FILE-001 | TODO | Full-stack | Upload/storage de documentos com visibilidade por cliente | AUTH-001 | upload, leitura autorizada e exclusão |
| WEB-BUNDLE-001 | TODO | Frontend | Dividir bundle principal e lazy-load de views | WEB-PERF-002 | build sem chunk principal > 500 kB |

Arquivos sensíveis: `apps/web/src/lib/api.ts`, `App.tsx`, views e estilos. Uma IA frontend por vez.

### Onda 2 — Integrações reais

| ID | Estado | Frente | Entrega | Dependência | Validação |
|---|---|---|---|---|---|
| INT-CU-001 | BLOCKED | Backend/Operação | Cadastrar token e mapeamento ClickUp controlado | DPL-005 | sync sem dry-run |
| INT-CU-002 | TODO | Backend | Mapear status Social/Growth/Tech por lista | INT-CU-001 | fixture + lista real |
| INT-G-001 | BLOCKED | Backend/Operação | Validar Google Ads real | DPL-005 | comparação por campanha/data |
| INT-G-002 | BLOCKED | Backend/Operação | Validar GA4 real | DPL-005 | comparação aquisição/eventos |
| INT-G-003 | BLOCKED | Backend/Operação | Validar GSC real | DPL-005 | comparação consultas/páginas |
| INT-G-004 | BLOCKED | Backend/Operação | Validar GTM real | DPL-005 | snapshot comparado |
| INT-LI-001 | TODO | Arquitetura | ADR LinkedIn orgânico/Ads: API, CSV e limites | nenhuma | ADR aprovado |
| INT-LI-002 | BLOCKED | Backend | Implementar caminho LinkedIn aprovado | INT-LI-001 | fixture + conta controlada |

### Onda 3 — Segurança, operação e QA

| ID | Estado | Frente | Entrega | Dependência | Validação |
|---|---|---|---|---|---|
| SEC-001 | TODO | Backend | Testar sessão expirada e revogada | DPL-001 | teste automatizado |
| SEC-002 | TODO | Backend | Massa de payload inválido e limites | CORE-002 | teste automatizado |
| SEC-003 | TODO | Backend | Rate limit de login | DPL-005 | teste de excesso e reset |
| SEC-004 | TODO | QA | Carga básica em leitura/login | DPL-006 | relatório p95/erro |
| SEC-005 | TODO | Segurança | ZAP/Burp em staging autorizado | DPL-006 | relatório e correções P0/P1 |
| CONTRACT-001 | TODO | Full-stack | Gerar tipos TS a partir do OpenAPI e eliminar drift manual | WEB-PERF-001 | CI detecta contrato divergente |
| QUEUE-001 | TODO | Backend | Reaper/retry para job preso em `running` | DPL-005 | teste de worker interrompido |
| DB-001 | TODO | Backend/Operação | Medir conexões e decidir pool Postgres | SEC-004 | relatório de carga e limite |
| OPS-001 | BLOCKED | Operação | Backup diário + teste de restore | DPL-005 | restore drill documentado |
| QA-001 | BLOCKED | Humano/QA | Assinar desktop, DevTools e mobile | DPL-006 | checklist no roadmap |
| LGPD-001 | TODO | Jurídico/Produto | Mapa de dados, DPA, retenção e subprocessadores | DPL-005 | checklist aprovado |

### Onda 4 — Produção

| ID | Estado | Frente | Entrega | Dependência | Validação |
|---|---|---|---|---|---|
| PRD-001 | DONE | Produto | Runtime backend definido: Fly `gru` + Managed Postgres | nenhuma | decisão registrada em `DEPLOY.md` |
| PRD-002 | BLOCKED | Release | PR `develop -> main` | ondas 1..3, AUTH-001 | CI verde e review |
| PRD-003 | BLOCKED | Operação | Infra e banco de produção isolados | PRD-001..002 | `/health/ready` |
| PRD-004 | BLOCKED | Release | Deploy web/API/jobs | PRD-003 | smoke remoto |
| PRD-005 | BLOCKED | QA/Produto | Liberação gradual e aceite | PRD-004 | checklist assinado |

## Template de handoff

Copie ao trocar de LLM ou sessão:

```text
Bioma — handoff
Branch/commit:
Task ID:
Estado: TODO | DOING | BLOCKED | DONE
Arquivos alterados:
O que foi implementado:
Validações executadas:
Resultado:
Pendências/bloqueio:
Próxima ação exata:
Não editar simultaneamente:
```

## Regra para créditos acabando

Se não houver tokens suficientes para concluir com validação e commit:

1. Pare antes de iniciar uma mudança estrutural nova.
2. Salve um handoff com comando exato de continuação.
3. Não marque a tarefa como `DONE`.
4. Se houver diff parcial, descreva cada arquivo e não permita que a próxima IA o reverta sem leitura.
