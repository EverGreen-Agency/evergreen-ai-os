# Mega-Plataforma EG — Proposta de escrita no Banco de Ideias (RASCUNHO — nada gravado)

> Gerado na sessão 2026-07-06 pelo dispatcher (opensquad). Fonte da verdade `ideas.json` **intacta**.
> Decisões travadas pelo Eduardo: Q1 = *produto amplo já* · Q2 = *SEPARAR como umbrellas irmãs* · Q3 = *umbrella + tags + rascunhar módulos novos*.
> Este arquivo é o "diff pretendido" para revisão item-a-item antes do merge.

---

## A) Nova ideia UMBRELLA

```json
{
  "id": "mega-plataforma",
  "title": "Mega Plataforma EG",
  "desc": "Ecossistema multi-módulo (backoffice interno + área do cliente) que unifica o AI-OS já construído (cockpit, bancos, squads, entrega, RAG) e a superfície de negócio a construir (client-hub, financeiro, RH, billing/SaaS, site/CMS, comunicação). Nasce mirando virar produto/white-label (modelo Service-as-Software). Multi-tenant. É o guarda-chuva; os módulos são part_of dela.",
  "stage": "project",
  "horizon": "NOW",
  "category": "Platform",
  "origin": "internal",
  "archived": false,
  "depends_on": [],
  "enables": [],
  "readiness": "Fundação = multitenant/SSO (M0) antes de tudo. Equipe hoje enxuta (Eduardo/Gustavo) → construir por fatias, dogfooding primeiro. Produto ao mercado só após validado interno.",
  "source": "Mega-Plataforma-parte-1.md + sessão 2026-07-06"
}
```
> **Decisão pendente de schema:** criar a category **`Platform`** (nova) para umbrella+módulos, OU cair para `Infra`. Recomendo `Platform` (bump da nota do schema, sem quebrar nada).

---

## B) Aplicar `part_of` + `readiness` nas 70 ideias existentes

Regra: cada ideia recebe `part_of` do seu módulo (que é `part_of: mega-plataforma`). `readiness` só onde há portão externo.

| id | part_of (proposto) | readiness (se aplicável) |
|---|---|---|
| banks-portability | mod-nucleo | — |
| llm-agnostic | mod-nucleo | — |
| handoff-assincrono-inboxes | mod-nucleo | — |
| vibe-building | mod-nucleo | — (é o "Lego" — habilita reuso p/ white-label) |
| eg-mcp-tools | mod-nucleo | — |
| banco-ideias | mod-cockpit-interno | — |
| banco-arquitetura | mod-cockpit-interno | — |
| banco-arquitetura-tab | mod-cockpit-interno | — |
| banco-stack | mod-cockpit-interno | — |
| dispatcher | mod-cockpit-interno | — |
| hub-chat-dispatcher | mod-cockpit-interno | — |
| tag-ativacao | mod-cockpit-interno | — |
| guardiao-arquiteto | mod-cockpit-interno | — |
| business-evaluator | mod-cockpit-interno | — |
| cross-repo-awareness | mod-cockpit-interno | — |
| codegraph | mod-cockpit-interno | — |
| auto-melhoria-squads | mod-cockpit-interno | — |
| skill-squad-creator | mod-cockpit-interno | — |
| ensemble-juiz | mod-cockpit-interno | — |
| idea-detail-edit | mod-cockpit-interno | — |
| idea-bank-auto | mod-cockpit-interno | — |
| estrutura-modal-briefing | mod-cockpit-interno | — |
| squad-engenharia | mod-cockpit-interno | Motor de entrega de projeto de cliente — vira gargalo de escala se white-label crescer. |
| squad-prospector | mod-comercial | Depende de créditos MCP (Apollo/Lusha/Clay). |
| squad-hunter | mod-comercial | — |
| squad-onboarding | mod-comercial | — |
| carteira-clientes | mod-comercial | — |
| clients-clickup-sync | mod-comercial | — |
| client-config-auto | mod-comercial | — |
| squad-reunioes | mod-comercial | — |
| multi-plataforma-freelance | mod-comercial | Maioria das plataformas sem API/bloqueia scraper → semi-manual. |
| icebreaker | mod-comercial | — |
| matriz-risco-comercial | mod-comercial | — |
| log-audio-wpp | mod-comercial | — |
| clickup-direct-injector | mod-comercial | — |
| auditoria-ai-first | mod-comercial | É oferta high-ticket (ai-firstify). |
| squad-kickoff | mod-comercial | já archived / absorvido por squad-engenharia (part_of mantém squad-engenharia? ver nota) |
| squad-criativos | mod-entrega-mkt | — |
| squad-trafego | mod-entrega-mkt | Write/Read barrier em verba (nunca autônomo). |
| squad-seo-geo | mod-entrega-mkt | — |
| ads-api-skills | mod-entrega-mkt | OAuth Meta/Google; tokens por client_id; testar no Postman. |
| squad-relatorios | mod-entrega-mkt | Depende de vector-store. |
| vector-store | mod-conhecimento | Infra pgvector — custo/host. |
| context-decay | mod-conhecimento | — |
| stack-memoria-zep | mod-conhecimento | — |
| segundo-cerebro | mod-conhecimento | — |
| squad-voz-cliente | mod-conhecimento | — |
| dossie-provas | mod-conhecimento | — |
| tech-scout | mod-radar-pesquisa | — |
| pesquisa-academica | mod-radar-pesquisa | — |
| skill-brand-eg | mod-marca-artefatos | — |
| filosofia-visual-eg | mod-marca-artefatos | — |
| doc-generator-eg | mod-marca-artefatos | — |
| web-artifacts-builder | mod-marca-artefatos | Habilita o front do produto white-label. |
| eg-publish | mod-marca-artefatos | — |
| squad-raiox | mod-client-hub | — |
| skill-raiox | mod-client-hub | — |
| health-score | mod-client-hub | Depende de dados (dossie-provas). |
| sla-watchdog | mod-client-hub | — |
| prospec-wpp-evolution | mod-comunicacao-wpp | Chip fleet aquecido; risco de ban; API não-oficial. |
| voip-qualificacao | mod-comunicacao-wpp | Custo ElevenLabs+Twilio. |
| cockpit-produto | mod-saas-billing | É a ponte "cockpit→produto"; alinhado ao Q1 (produto amplo). Dogfood antes de vender. |

**SEPARAR (produto próprio):**
| id | vira | readiness |
|---|---|---|
| forward-deployed | umbrella própria (ou `part_of: telecom`? não) — SEPARAR, já NEW_COMPANY | Setores de privacidade severa; modelos open-source on-prem; capital + demanda. |

**FORA DE ESCOPO — princípio/doutrina (NÃO módulo). Proposta: sem `part_of`; marcar como diretriz de governança:**
`precificacao-valor`, `service-as-software`, `ai-cmo-mrr`, `dogfooding`, `fabrica-back-front`, `ia-adapta-cliente`, `change-management`.

> Nota `squad-kickoff`: já tem `part_of: squad-engenharia` e `archived:true`. Mantém como está (não re-tagueio p/ mega-plataforma; a herança sobe via squad-engenharia → mod-cockpit-interno).

---

## C) Módulos NOVOS a capturar (part_of: mega-plataforma) — aprovar item a item

| id | title | 1-linha | stage/horizon | readiness |
|---|---|---|---|---|
| mod-multitenant | Multitenant / SSO / Acessos | Base de identidade e permissões: EG × clientes × agências-parceiras × clientes-delas; perfil pessoa/CNPJ. | capture / NOW | Fundação de tudo; portão = decisão de arquitetura (Trilho A/B). Bloqueia client-hub e billing. |
| client-hub | Área do Cliente (Hub NFC) | Destino do cartão NFC: score + micro-scores (branding), dashboards/BIs, relatórios, comms centralizadas, funil viz. | capture / NOW | Depende de multitenant + BI. É o que o cliente pede hoje (campanhas/score). |
| mod-bi-dashboards | Motor de BI / Dashboards | Integra o repo BIAds: Meta/Google Ads, funil dinâmico, criativos, UTMs — interno e cliente. | capture / NOW | BIAds já iniciado (+CodeGraph); OAuth Meta/Google; validar response no Postman. |
| mod-financeiro | Módulo Financeiro | Viabilidade/forecasting/metas + cobrança de cliente + contábil/fiscal (NF, situação cadastral, tributário). | capture / MEDIUM | Começar do pessoal (Planilha-Orcamentaria.xlsx). Contábil precisa contador + integração bancária. |
| mod-rh | Módulo RH | Rampagem 15/30/60/90, níveis cultura/cargo, performance/NPS por gestor, kits de funcionário. | capture / MEDIUM | Depende de equipe rampando; hoje EG é enxuta. |
| mod-logistica-kits | Logística de Kits | Estoque, fornecedores/custos, quem recebeu qual kit, campos custom por item (ciclos de lavagem etc.). | capture / MEDIUM | Volume de kits ainda baixo; começar simples. |
| mod-contratos | Gestão de Contratos (Autentique) | Ciclo/assinatura/status de contratos, ligado a financeiro e onboarding. | capture / MEDIUM | Autentique já em uso; absorver via API. |
| mod-certificacoes | Certificações | EG + funcionários (Google/Meta/Salesforce/Hubspot): validade, renovação. | capture / LONG | Nice-to-have; baixa prioridade. |
| mod-saas-billing | Billing / SaaS / Retenção | Stripe, cupons, cotas, planos, clientes legado, white-label; suspensão contratual por inadimplência. | capture / MEDIUM | Depende de multitenant + haver produto a cobrar. **Retenção = suspensão de acesso, NUNCA backdoor.** |
| mod-site-cms | Site EG + EG Lab + CMS | Refatoração do site (cases ligados ao backoffice, EG Lab/POCs, mapa de clientes, EverGreen≠Evergreen) + CMS próprio (pesquisa WP/Framer/próprio). | capture / MEDIUM | Auditoria SEO/GEO já feita; alta interligação com backoffice. Parte pode ser NOW. |
| mod-comunicacao-wpp | Omnichannel WhatsApp | Coexistence/Evolution/VoIP + gestão de números/chips (integra a Telecom S3). | capture / MEDIUM | Meta muda API/janela 24h (cobrança ~out/2026); chip fleet + aquecimento; risco de ban. |
| mod-conhecimento-video | Ingestão de Vídeo (YT/Insta) | Baixar+transcrever+entender vídeo no banco de conhecimento; banco de cases sucesso/fracasso. | capture / MEDIUM | yt-dlp/transcrição + storage; curadoria (não "conhecimento infinito"). LGPD/direitos ao baixar cursos de terceiros. |
| squad-negocios | Squad de Negócios / Estratégia | Decisão de viabilidade (Musk/China/JHSF/BlackRock): investir, assinar ferramenta, contratar, comprar ação? | capture / MEDIUM | Depende do financeiro (dados). Lente de decisão, HITL. |
| mod-policy-research | Pesquisa de Políticas & Updates de Stack | Políticas Meta/Google Ads; mudanças de API/linguagem/framework que quebram projetos (vigilância CI/CD). | capture / MEDIUM | Alimenta squads de ads e projetos de cliente; feeds a definir. |

**🚩 NÃO capturar como feature (bandeira vermelha):** "backdoors de travamento" para inadimplente → risco jurídico/criminal/LGPD e destrói o premium. Retenção legítima vive em `mod-saas-billing` como **suspensão contratual de acesso**.

---

## D) Umbrellas IRMÃS a criar (SEPARAR — sob a holding Quark; integráveis, não part_of mega-plataforma)

| id | title | readiness |
|---|---|---|
| foton | Fóton (plataforma pessoal do Eduardo) | Baixo custo — é reorganização. Portão = separar dados pessoais × EG (repo/pastas próprios). Absorve: planejamento financeiro pessoal, banco de ideias pessoal, segundo cérebro pessoal, trade. |
| prisma-bi | Prisma BI (relatórios/due-diligence/selos) | Mercado a validar; **jurídico ALTO** ("derrubar empresas" = difamação/LGPD). Validar negócio antes de codar. |
| telecom-chips | Telecom / Hub de Chips (operadora white-label) | Capital + Anatel + reputação (nicho black-hat = risco de marca). Integra via mod-comunicacao-wpp; não construir agora. |
| micro-aws-hosting | Micro-AWS / Hospedagem própria (homelab) | Capital em servidores + volume de hosting que justifique. Hoje Hostgator/Vercel bastam. Adiar. |
| educacao-comunidade | Educação / Comunidade (cursos, clones de mentores) | Autoridade/audiência + produção de conteúdo. Depende de tração da EG. LGPD/direitos autorais dos cursos de terceiros. |
| trade-autonomo | Trade autônomo (bots/challenges) | part_of: foton. Capital de risco; renda pessoal, não-core. Adiar. |

---

## E) Merge plan (após aprovação)
1. Bump `schema_version`? Não (v1.1 já cobre part_of/readiness). Só `updated_at`.
2. Adicionar category `Platform` ao array/nota (decisão pendente).
3. Inserir A) umbrella + C) 14 módulos + D) 6 umbrellas irmãs.
4. Aplicar B) part_of/readiness nas 70.
5. Regenerar `ideas.md` (view humana) a partir do JSON.
6. (Opcional) copiar este arquivo p/ raiz do repo como registro/benchmark.
