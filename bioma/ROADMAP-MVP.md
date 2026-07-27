# Bioma MVP - Execução Viva

Este documento é a mesa de controle do MVP do Bioma. Ele existe para coordenar múltiplas IAs/sessões sem perder contexto, duplicar trabalho ou misturar responsabilidades.

## Premissa central

A EverGreen/EG é a dona da plataforma Bioma e é quem está construindo, operando e codando este produto.

HM Conexões Poderosas foi um lead/cliente potencial cuja proposta descreve uma plataforma interna de agência para operar a própria carteira de clientes. O MVP atual ainda representa HM provisoriamente como um cliente externo para validar autenticação, isolamento e módulos do Hub, mas essa simplificação não é a hierarquia final do produto. A plataforma não pertence à HM e não deve ser pensada como produto nichado para ela.

Leitura correta:

- EG: boutique, dona da operação, dona da plataforma e usuária interna principal.
- Bioma: plataforma operacional que evolui de uso interno EG para operação de clientes e depois white-label/SaaS.
- HM: lead/caso de uso inicial de uma agência operando clientes; no MVP técnico ainda é uma organização externa simplificada.
- Agências futuras: tenants com workspace interno, marca, equipe e clientes próprios.
- Clientes futuros: workspaces operacionais pertencentes a uma agência, com branding e dados isolados.

## Fontes obrigatórias

Antes de alterar escopo, fluxo de ClickUp ou lógica operacional, consulte:

- `_opensquad/_memory/knowledge/Documento-Mestre_EG.md`
- `_opensquad/_memory/knowledge/Manual Operacional_ EverGreen Tech.md`
- `_opensquad/_memory/knowledge/Manual Operacional_ EverGreen Growth.md`
- `_opensquad/_memory/knowledge/Manual Operacional_ EverGreen Social.md`
- `_opensquad/_memory/knowledge/inputs-mega-plataforma/Reuniao-HM_Conexoes.md`
- `_opensquad/_memory/knowledge/inputs-mega-plataforma/Proposta_EverGreen_HM_Conexoes_Poderosas_v3.md`

Documentos operacionais:

- `bioma/EXECUCAO-MVP.md`: fila atômica, dependências, dono e handoff entre LLMs.
- `bioma/DEPLOY.md`: runbook de staging, produção e rollback.

## Estado atual

Data de referência: 2026-07-26.

O MVP técnico local está testável, operável e expandido com o motor completo da Mega-Plataforma. O MVP comercial baseado na proposta HM evoluiu para uma infraestrutura all-in-one para a EverGreen.

Funcional hoje:

- Login com sessão por cookie.
- API FastAPI com Postgres.
- Docker local com Postgres, Redis, API e Web.
- Seed dev com usuário EG e usuário cliente HM.
- Client Hub com carteira, entregáveis, aprovações, artefatos, sync e auditoria.
- Criar cliente como EG admin.
- Editar cliente como EG admin.
- Criar, editar e excluir artefatos como EG admin.
- Criar, atualizar status e excluir entregáveis como EG admin.
- Aprovar/reprovar pendência pelo front.
- EG admin consegue solicitar aprovação de uma entrega pelo front; o cliente decide no próprio hub.
- Cliente enxerga apenas o próprio hub no seed.
- ClickUp aposentado com reconciliação e snapshot legado; Bioma é a única fonte de verdade operacional.
- CORS local para `localhost:5173` e `127.0.0.1:5173`.
- Área documentada para assets em `apps/web/public/assets/`.
- Smoke test básico de API em `apps/api/scripts/smoke_api.py`.
- Módulo de Performance com schema multi-tenant, API de leitura e conexões por cliente.
- Worker executável para Google Ads, GA4, Search Console e GTM, Meta Ads e LinkedIn Ads com fila durável no Postgres.
- CRM/funil e financeiro integrados com lançamento automático de assinaturas SaaS de prospecção em `financial_records`.
- Analytics principal consumindo endpoints reais de Performance e Big Data Comercial.
- Operação EG separada da Carteira, com CRM, financeiro e métricas próprios sob `/operacao/...`.
- **Radar de Oportunidades & Freelancers**:
  - Captura manual, três fontes RSS públicas reais e feeds RSS adicionais configurados pela EG. As demais plataformas permanecem roadmap, não integração concluída.
  - Triagem de fit de oportunidades com scoring de 0-100 e elaboração de proposta comercial em 3 pilares (Oferta/Demanda/Conversão).
  - Configuração interativa de RSS, Tokens, API Keys e custo mensal de subscrição das plataformas.
- **Auto-Vigilância & Auditoria Automática de Perfil por URL**:
  - Scraper e auditor automático por link/URL (`profile_auditor.py` + tabela `freelancer_profiles`).
  - Raio-X com nota de autoridade (0-100), pontos fortes, gaps identificados, headline otimizada e bio em copy persuasiva pronta para copiar.
- **Injeção Automática de Cases & Provas Sociais nas Propostas**:
  - Cruzamento de requisitos de vagas com o acervo de cases validados da EG (`attached_cases`), injetando resultados e métricas reais nas propostas comerciais.
- **Inventário de Gaps Tecnológicos do Mercado**:
  - Detecção automática de ferramentas faltantes (HubSpot, Marketo, Salesforce, Shopify, etc.) nas vagas triadas (`opportunity_skill_gaps`).
  - Incorporação de novas habilidades ao inventário (`tech_skill_inventory`) em 1 clique para aumentar o fit de futuras propostas.
- **Painel de Big Data, ROI & CAC por Plataforma**:
  - Seletor interativo de status de propostas (`Rascunho`, `Enviada`, `Ganha`, `Perdida`).
  - Cálculo automático de Custo por Proposta (CPP), Custo de Aquisição de Cliente (CAC), Receita Ganha, Lucro Líquido de Prospecção e ROI (%) por canal de vendas.
- **Redesenho de Design System em Módulos Nativos (RH & Kits)**:
  - Substituição de Tailwind por tokens CSS do Bioma (`status-pill open`, `status-pill paused`, etc.), garantindo 100% de padronização visual.


Ainda demo/dry-run:

- Dados iniciais HM vêm de seed, mas já podem ser editados pelo front.
- ClickUp real exige token efêmero no ambiente, tenant/team explícitos e mapeamento controlado; nenhum segredo é versionado.
- Briefing, brand book e calendário existem como artefatos editáveis, não como módulos ricos completos.
- Analytics não deve exibir números reais enquanto não houver fonte real conectada.
- Performance usa dados de seed marcados como demo até a primeira sincronização com credenciais reais.
- UI melhorou, mas ainda precisa QA visual com assets reais e comparação fina com a proposta HM.
- Analytics consome endpoints reais de Performance, mas ainda pode exibir dados de seed enquanto não houver sync real.
- LinkedIn Ads possui adapter implementado, ainda pendente de validação com conta controlada; LinkedIn orgânico continua não integrado.

## Protocolo para múltiplas IAs

Antes de qualquer mudança:

1. Rodar `git status --short --branch --untracked-files=all`.
2. Ler este arquivo.
3. Confirmar qual frente será alterada.
4. Não editar arquivos fora da frente combinada.
5. Validar com build/teste compatível.
6. Fazer commit pequeno e claro.
7. Atualizar este documento se a mudança alterar status, backlog ou decisão.

Arquivos sensíveis que não devem ser editados por duas IAs ao mesmo tempo:

- `bioma/apps/web/src/App.tsx`
- `bioma/apps/web/src/styles.css`
- `bioma/apps/web/src/lib/api.ts`
- `bioma/apps/web/src/lib/app-config.ts`
- `bioma/apps/web/src/lib/format.ts`
- `bioma/apps/web/src/components/shared.tsx`
- `bioma/apps/web/src/views/CockpitView.tsx`
- `bioma/apps/api/bioma_api/routers/client_hub.py`
- `bioma/apps/api/bioma_api/services/client_hub.py`
- `bioma/apps/api/bioma_api/repositories/client_hub.py`
- `bioma/apps/api/migrations/*.sql`
- `bioma/infra/docker-compose.yml`

Divisão recomendada:

- Backend/API: FastAPI, migrations, auth, permissões, motor nativo de trabalho, adapters e testes API.
- Frontend/UI: componentes, responsividade, assets, UX, estados vazios.
- Produto/QA: comparação com proposta HM, bugs, critérios de pronto, gaps.
- Docs/Coordenação: manter este roadmap, README, specs e handoff.

## Motor operacional nativo — decisão 2026-07-22

O Bioma substitui o ClickUp como fonte de verdade da execução. A estrutura importada e os manuais operacionais servem de referência, mas o produto passa a possuir `workspace → projeto → contrato versionado → escopo → entregas/tarefas → aceite`.

- Social, Growth, Tech e projetos gerais compartilham o núcleo, com templates e status configuráveis por projeto;
- projetos Social podem exigir aprovação da ideia antes da gravação ou somente aprovação final, conforme o cliente;
- projetos Tech possuem fases, documentos de proposta/especificação e atualizações honestas visíveis ao cliente; o adapter GitHub para issues/PRs continua separado, mantendo contrato, contexto e acompanhamento canônicos no Bioma;
- itens de escopo registram quantidade, unidade, cadência e critério de aceite;
- conclusão de entrega não presume aceite do cliente;
- progresso/ritmo consideram concluídas, atrasadas e bloqueadas;
- ClickUp fica temporariamente apenas como importador legado, sem UI de sync e sem nova credencial;
- não existe integração bidirecional ClickUp.

## Decisões de escopo - 2026-07-10

Decisões do Eduardo nesta rodada (contexto: HM é referência de escopo, não produto a ser vendido; a plataforma é da EG):

- **Auth/perfis:** manter apenas `eg_admin` e `client_user` por enquanto; sem perfil "social media".
- **CRM:** o backend mínimo do funil solicitado no caso HM existe e a tela mínima já está integrada. Ele atende o MVP operacional, não pretende substituir um CRM completo. A direção futura preferida é uma **bridge Kommo** (espelho do funil por cliente, no padrão do ClickUp Bridge), pois a EG revende Kommo.
- **Brand book:** ~~geração LLM, aprovação e versionamento adiados~~ — **decisão revertida em 2026-07-24**: o ClickUp foi aposentado (INT-CU-RETIRE-001) e a EG decidiu que o Bioma absorve o all-in-one de gestão de projetos, incluindo o que antes seria "entrega da HM". Módulo nativo versionado implementado (`MOD-MARCA-001`, ver `EXECUCAO-MVP.md` Onda 5).
- **Calendário editorial/social:** ~~a produção de conteúdo permanece no ClickUp~~ — **decisão revertida em 2026-07-24** pelo mesmo motivo acima. Calendário editorial nativo implementado (`MOD-CALENDARIO-001`, estágios ideação→...→publicado), sem dependência do ClickUp.
- **Dashboards/BI:** **port completo do BIAds** para a stack do Bioma (ver `bioma/PLANO-PORT-BIADS.md`). Google (Ads/GA4/GSC/GTM) primeiro; **Meta e LinkedIn depois**.
- **Financeiro:** backend e tela mínima concluídos; integração com a fonte financeira real ainda pendente.
- **LinkedIn:** orgânico e Ads precisam ser incorporados antes de afirmar aderência integral à proposta HM.
- Notion: depois.

As decisões sobre ClickUp, calendário e rigidez dos fluxos acima foram superseded pela decisão de 2026-07-22 e pelo ADR 0002 revisado.

## Decisões de produto — 2026-07-22

- **Fonte de verdade operacional:** Bioma, não ClickUp.
- **ClickUp:** cancelar a dependência paga após snapshot/reconciliação; adapter permanece somente durante a migração controlada.
- **Contratos/escopo:** primeira classe por projeto, com vigência, versão, quantidade/cadência e aceite separados da conclusão.
- **Acompanhamento Tech:** fases ordenadas, entregas por fase, links de proposta/especificação e atualizações de progresso, bloqueio, teste ou release. Um dia de depuração sem entrega é publicado como atualização honesta, não como avanço fictício.
- **GitHub:** projetos Tech podem mapear `owner/repository` e consultar issues, PRs e commits em modo leitura. O Bioma ainda não cria nem altera itens externos; escrita exigirá idempotência, auditoria e confirmação humana (HITL).
- **Cofre de acessos:** substituir planilhas; segredos cifrados, listagem sem valores, revelação auditada e RBAC.
- **SleekFlow:** descoberta de parceria; possível adapter omnichannel, sem compromisso de implementação antes do contrato oficial de API/dados.
- **Kommo/CRM:** manter adapter onde fizer sentido e evoluir CRM nativo pelo uso real.
- **IA aplicada:** priorizar Estúdio IA, geração de posts, imagens, brand book versionado, metodologia e score visível ao cliente.
- **Deploy e validação humana:** postergados por decisão do produto; continuar apenas validações locais essenciais durante o desenvolvimento.

## Decisões de escopo - 2026-07-14

Decisões do Eduardo (rodada de brainstorm com Claude; contexto: deploy em produção via integração Git da Vercel + Railway, dev local):

- **Multi-tenant:** v1 fica flat (EG → clientes), mas preparada para hierarquia white-label: adicionar `parent_organization_id` nullable em `organizations` e não hardcodar `eg` em código novo. Hierarquia completa (agência → clientes dela) fica para quando houver demanda real.
- **Cliente piloto:** dar acesso a 1 cliente real em 2–4 semanas. Isso torna AUTH-001, LGPD-001 e assets finais P0 imediato.
- **AUTH-001 (convite):** mecânica escolhida = link de convite copiável com token expirável de uso único; EG admin envia por WhatsApp; usuário define a própria senha. Provedor de e-mail pluga depois no mesmo token.
- **Escopo do piloto:** cliente vê Hub + Conteúdo + Arquivos. Analytics fica oculto até haver sync Google real do próprio cliente — primeiro uso prático do feature-gating.
- **Feature-gating:** criar agora a noção de módulos habilitados por organização (campo/JSON no banco + checagem no backend). Stripe/billing só depois.
- **LGPD:** Eduardo decidiu LGPD-001 completo ANTES do acesso do piloto (não o mínimo viável). O checklist precisa começar imediatamente, em paralelo ao código, para não virar gargalo das 2–4 semanas.
- **Domínio de produção:** `bioma.evergreenmkt.com.br` (web) + `api.bioma.evergreenmkt.com.br` (API), `SESSION_COOKIE_DOMAIN=.bioma.evergreenmkt.com.br`, SameSite=Lax.
- **Storage:** fonte de verdade dos arquivos = bucket S3-compatible (Railway Buckets agora; código FILE-001 já é agnóstico via env `STORAGE_S3_*`). Cloudinary não entra como storage primário; se o módulo de social media precisar de transformação de imagem, entra camada na frente do bucket (imgproxy self-hosted ou Cloudinary fetch mode) — alinhado à visão mega-plataforma de infra própria.
- **Tailwind:** removido (tinha sido instalado sem ativação). Design system continua nos tokens CSS de `styles.css`; Tailwind só volta como decisão deliberada de redesign.

## Decisões de arquitetura de produto - 2026-07-18

Decisões alinhadas com Eduardo após revisar a escala por carteiras, times e white-label:

- **Hierarquia canônica:** `Bioma Platform → Tenant/Agência → Workspaces`; workspace pode ser `agency_internal` ou `client`.
- **EG tem dois papéis:** dona/control plane do produto e agência usuária do próprio sistema. A Operação EG não pertence à Carteira de Clientes.
- **Mesmos motores, escopos distintos:** CRM, financeiro, métricas e demais módulos devem ser reutilizados por contexto explícito, sem duplicar código nem compartilhar dados.
- **Navegação em escala:** o Topbar mostra somente o contexto atual e abre navegador pesquisável; a Sidebar não contém uma lista longa de clientes. “Minha carteira”, times, favoritos e visões salvas entram quando houver atribuições reais.
- **Rotas com profundidade fixa:** módulos operacionais vivem no workspace corrente; a URL não deve materializar toda a árvore plataforma/agência/cliente.
- **Ponte temporária:** `EverGreen Internal` pode fornecer o `client_id` legado para a organização EG, mas nunca aparece na carteira, nunca é fallback e não pode ser removido antes da migração de Performance/endpoints.
- **White-label:** `parent_organization_id` é apenas preparo inicial, não implementação concluída de tenancy, equipes ou autorização hierárquica.

## Próximos passos priorizados

### P0 - Fechar MVP testável

- [x] Criar documento vivo de execução do MVP.
- [x] Corrigir CORS local e sessão.
- [x] Criar CRUD mínimo de cliente.
- [x] Criar CRUD mínimo de artefatos.
- [x] Criar CRUD mínimo de entregáveis.
- [x] Criar endpoint/retorno para estados de sync e auditoria.
- [x] Adicionar smoke test básico de API.
- [x] Validar build frontend.
- [x] Separar constantes, helpers e componentes comuns para reduzir `App.tsx`.
- [x] Separar router HTTP do serviço do Client Hub no backend.
- [x] Separar SQL do Client Hub em repositório de persistência.
- [x] Criar backend mínimo de CRM/funil de leads da proposta HM.
- [x] Criar backend mínimo de financeiro da reunião HM.
- [x] Criar backend mínimo de métricas manuais para Analytics honesto.
- [x] Corrigir contrato de `sync_runs` para `queued/running/ok/partial/error`.
- [x] Criar solicitação de aprovação EG → cliente sem depender do seed.
- [x] Fazer smoke visual assistido em desktop e mobile, sem overflow nas rotas principais.
- [ ] Fazer QA visual humano em notebook com DevTools aberto e assinar o checklist.
- [x] Criar checklist manual de QA (seção "Checklist de QA visual"; assinatura ainda pendente).

### P1 - Aproximar da entrega HM

- [ ] Aplicar logos/assets finais da EG e, quando houver autorização, da HM; os SVGs atuais são placeholders.
- [x] Criar experiência específica de Briefing além do artefato textual.
- [x] Criar Estúdio IA por workspace para gerar lotes de posts a partir de briefing, canais e referências metodológicas, sempre com revisão humana.
- [x] Renderizar documentos estratégicos estruturados de forma genérica, incluindo brand book quando cadastrado.
- [x] Implementar geração, aprovação e versionamento específicos de Brand Book (`MOD-MARCA-001`, 2026-07-24).
- [x] Criar calendário editorial semanal navegável alimentado por entregas reais.
- [x] Criar calendário editorial nativo com estágios (`MOD-CALENDARIO-001`, 2026-07-24); visão mensal segue como melhoria futura de UI.
- [x] Criar visão de Analytics honesta, sem fingir dados reais.
- [x] Conectar Analytics principal aos endpoints reais de Performance.
- [x] Refinar UI para ficar mais próxima da proposta visual HM sem abandonar branding EG.
- [ ] Concluir QA visual assinado e ajustes finais de responsividade com assets definitivos.
- [x] Criar primeira área de Projetos e Contratos no Hub, com contrato, escopo, entregas e indicador de ritmo.
- [x] Criar primeira área de Acessos com cofre cifrado, depósito pelo cliente, RBAC e auditoria de revelação/cópia.
- [x] Cobrir o formato mínimo operacional de acessos: plataforma, conta, usuário, e-mail, senha, outro método e link, sem segredos em listagens.
- [x] Aplicar migrations 0021/0022/0023 e executar `smoke_vault.py`/`smoke_projects.py` em Postgres local.
- [x] Adicionar acompanhamento Tech: fases, vínculo de entregas, links de proposta/especificação e feed de atualizações com visibilidade por cliente.
- [x] Integrar projetos Tech ao GitHub em leitura (repositório, issues, PRs e commits, com BOLA por workspace e configuração auditada).
- [x] Implementar escrita GitHub idempotente e auditada com confirmação HITL para criação/alteração externa (PROJECT-GH-002, 2026-07-24).
- [x] Evoluir IA: imagens, brand book versionado, metodologia e score do cliente (cluster Onda 5, 2026-07-24).

### P1.5 - Port do BIAds / Performance

Spec e histórico de decisão em `bioma/PLANO-PORT-BIADS.md`.

### P1.4 - Operações e FinOps de IA

- [x] Criar catálogo interno versionado para proposta, onboarding nativo no Bioma, LinkedIn e entrega Tech.
- [x] Persistir definições, execuções idempotentes, etapas ordenadas, custos e checkpoints HITL.
- [x] Criar dashboard financeiro EG para assinaturas/API, equivalência mensal em centavos e renovação.
- [x] Registrar cotas com origem explícita (`api`, `manual`, `configured`, `unavailable`) e nunca estimar saldo a partir de login/subscrição.
- [x] Registrar automaticamente tokens do Estúdio IA no ledger; custo permanece desconhecido até existir preço confiável.
- [ ] Conectar adapters de execução aos workflows; qualquer escrita externa continua bloqueada por HITL e idempotência.
- [ ] Adicionar tabelas de preço versionadas por provedor/modelo e conversão cambial auditada.

- [x] Portar tabelas diárias de Google Ads, GA4 e Search Console para o Postgres do Bioma.
- [x] Portar snapshots e auditoria de Google Tag Manager.
- [x] Unificar logs de sincronização em `sync_runs`.
- [x] Criar `performance_connections` por cliente sem armazenar segredo em texto puro.
- [x] Criar endpoints de overview, campanhas, aquisição GA4, consultas GSC e snapshots GTM.
- [x] Criar fila durável `queued/running/ok/partial/error` com lock no Postgres.
- [x] Portar o coletor para worker Python com `google-auth` e providers isolados.
- [x] Criar execução manual e agendada incremental (`--enqueue-all --drain`).
- [x] Criar smokes de normalização, autorização, fila e falha auditável.
- [x] Criar `TrendChart` no frontend com Recharts e tokens da marca.
- [ ] Validar cada provider com credenciais reais de uma conta Google controlada pela EG.
- [ ] Comparar amostras coletadas com as interfaces de Google Ads, GA4, GSC e GTM.
- [ ] Configurar segredos e jobs no staging Railway após validar contas Google controladas.
- [x] Conectar a visão principal de Analytics aos endpoints reais de Performance; dados sem sync real continuam marcados como demo.
- [x] Criar páginas profundas de Performance: Ads, GA4, GSC e GTM.
- [ ] Portar/conectar LinkedIn orgânico e LinkedIn Ads conforme o escopo de referência HM.

### P2 - Encerramento controlado do ClickUp

- [x] Implementar importador tenant-scoped e idempotente para preservar dados legados.
- [x] Remover sincronização ClickUp das superfícies operacionais do frontend.
- [x] Revisar ADR 0002 e fixar o Bioma como fonte de verdade operacional.
- [ ] Reconciliar listas/tarefas importadas com projetos e itens de escopo nativos.
- [ ] Gerar snapshot final e relatório de itens sem correspondência.
- [ ] Remover endpoint/configuração/adapter ClickUp após a reconciliação.
- [ ] Remover colunas e tabelas legadas em migration posterior, somente após confirmar ausência de consumidores.

### P3 - Segurança e qualidade

- [x] Smoke test de autorização entre `eg_admin` e `client_user`.
- [x] Smoke test básico de BOLA/IDOR para outro cliente.
- [x] Matriz de autorização de tarefas para EG admin, operator, viewer e client_user, incluindo cliente A contra cliente B.
- [x] Validar assignee, owner e dependencies no mesmo tenant/workspace e rejeitar ciclos.
- [x] Tornar recorrência idempotente e cobrir CRUD/subtarefas/dependências no `smoke_tasks.py`.
- [x] Tornar smokes de API/workspace/tarefas independentes do cliente HM no banco compartilhado.
- [x] Substituir delete físico cotidiano de cliente por archive e purge confirmado com auditoria/limpeza S3.
- [x] Teste de CORS local.
- [x] Teste de sessão revogada.
- [x] Teste de sessão expirada.
- [x] Teste mínimo de validação de payload com massa inválida.
- [ ] Teste básico de carga.
- [ ] Burp/ZAP ou pentest automatizado.
- [ ] Checklist LGPD antes de qualquer dado real sensível.
- [x] Dividir o bundle principal do frontend; Clientes, Conteúdo, Integrações e Engenharia agora são lazy-load, reduzindo o chunk inicial para aproximadamente 227 kB antes de gzip (era 243 kB).
- [x] Criar convite/provisionamento de usuário cliente sem seed (link copiável de uso único; `smoke_invites.py`).
- [x] Feature-gating de módulos por organização com toggle no AdminDock; analytics/comercial bloqueados por default para cliente.
- [x] Criar recuperação/rotação segura de senha (link de uso único 2h gerado pelo admin + troca de senha logado revogando sessões; `smoke_password.py`).
- [x] Implementar rate limit de login em processo único.
- [x] Migrar rate limit para Postgres antes de múltiplas réplicas (migration 0026, `login_attempts` com chave `sha256(ip:email)`, purga no `cleanup.py`).
- [x] Gerar tipos do frontend a partir do OpenAPI para impedir drift de contrato (CONTRACT-001: `export_openapi.py` + `npm run types:api` + trava de compilação em `contract-conformance.ts`; CI falha se `openapi.json`/`api-schema.d.ts` divergirem).
- [x] Criar retry/reaper para jobs que ficarem presos em `running` (QUEUE-001: migration 0025 com `heartbeat_at`/`attempts`, `reclaim_stalled_jobs` no início de cada ciclo do worker, lease de 900s e 3 tentativas).
- [ ] Medir conexões e decidir pool Postgres antes de aumentar carga.
- [x] Separar a Operação EG da Carteira sem remover seus módulos: `/operacao` e cada Hub reutilizam CRM, financeiro e métricas com contexto explícito.
- [x] Criar navegador de workspaces pesquisável com recentes e atalho global, sem dropdown longo na Sidebar.
- [x] Aplicar feature gate das rotas filhas ao cliente atual, em vez de unir módulos de todas as organizações do usuário.
- [x] Especificar em ADR a hierarquia `Platform → Tenant/Agência → Workspaces`, inclusive limites de white-label e billing.
- [x] Persistir a identidade de workspace, provisionar junto com novos clientes e alimentar o navegador por endpoint autenticado.
- [x] Criar times, memberships e atribuições de workspace para “Minha carteira” e carteiras por gestor/time.
- [x] Separar `platform_admin`, `tenant_admin` e papéis operacionais antes de liberar white-label.
- [x] Migrar endpoints e tabelas de Performance de `client_id` para `workspace_id`, com adapter e dual-read/write durante a transição.
- [ ] Migrar/remover com segurança o registro técnico legado `EverGreen Internal` somente após eliminar todas as dependências e FKs em cascata.
- [x] Adicionar favoritos e visões salvas ao navegador depois do modelo de times/atribuições.

### P4 - Staging

- [x] Criar runbook de deploy e rollback.
- [x] Criar Config as Code Railway para API/worker; jobs entram depois da validação de integrações reais.
- [x] Criar configuração Vercel para o app Vite.
- [x] Criar GitHub Action para deploy Vercel usando token do dono/admin, sem exigir seat Vercel de todo colaborador.
- [x] Criar readiness check com Postgres.
- [x] Bloquear seed demo fora de ambiente autorizado.
- [x] Criar bootstrap seguro de EG admin.
- [x] Criar smoke remoto não destrutivo.
- [x] Criar CI para build e smokes.
- [ ] Subir API e Postgres no Railway.
- [ ] Subir Web na Vercel.
- [ ] Configurar variáveis por ambiente.
- [ ] Rodar seed apenas em ambiente local/staging controlado.
- [ ] Corrigir e validar domínio temporário de staging: web `staging.bioma.evergreenmkt.com.br`, API `api-staging.bioma.evergreenmkt.com.br` atualmente retornam `404`.

## Checklist de QA visual (manual)

Executar com API + seed locais rodando e frontend em `npm run dev`, logado como EG admin e depois como cliente. Larguras de referência: desktop 1440px+, notebook com DevTools aberto (~1100px úteis) e mobile 390px.

Para cada largura:

- [ ] Login: hero e cartão legíveis, formulário utilizável, erro de credencial visível.
- [ ] Cockpit: métricas, fila de trabalho e sinais sem overflow ou texto cortado.
- [ ] Clientes: carteira + hub, selects de status e ações de aprovação acessíveis.
- [ ] Conteúdo: briefing estruturado, brand book e calendário legíveis; calendário rola na horizontal sem quebrar a página.
- [ ] Analytics: banner de demonstração visível e badge "exemplo" em todos os cards.
- [ ] Integrações e Engenharia: listas e health rows sem overflow.
- [ ] Modal de artefato: abre, edita, fecha; scroll interno funciona.
- [ ] Contraste: nenhum texto creme sobre fundo claro nem texto escuro sobre fundo escuro.
- [ ] Estados vazios honestos em todas as views; nenhum dado fake apresentado como real.
- [ ] Paleta EG (musgo/baunilha/menta/âmbar) sem cores fora da marca.

Smoke assistido executado em 2026-07-10:

- [x] Login e Cockpit em 1440x900 e 390x844 sem overflow horizontal.
- [x] Rotas Clientes, Conteúdo, Analytics, Integrações e Engenharia abrem sem alerta de erro ou sessão ausente.
- [x] Sessão EG admin, API online e dados do seed apresentados após login.
- [ ] Interações detalhadas, notebook com DevTools, assets finais e assinatura humana continuam pendentes.

Assinatura:

- [ ] QA desktop assinado por: ______ em ______
- [ ] QA notebook com DevTools assinado por: ______ em ______
- [ ] QA mobile assinado por: ______ em ______

## Critério de pronto do MVP v0

O MVP v0 pode ser considerado funcional localmente quando:

- EG admin consegue entrar, ver clientes, criar/editar cliente, criar/editar entregáveis e artefatos.
- Cliente consegue entrar e ver apenas o próprio hub.
- Aprovações funcionam ponta a ponta.
- ClickUp registra import/sync de forma visível sem escrita externa.
- A UI funciona em desktop e largura reduzida sem quebrar layout.
- Não há dados fake apresentados como se fossem reais.
- Há smoke test básico de API e build frontend passando.

O MVP v0 só pode ser considerado pronto para cliente real quando, além disso:

- ClickUp real lê tarefas de pelo menos uma pasta/lista.
- Assets reais de EG/HM estão aplicados.
- Staging está publicado.
- QA visual/manual foi assinado.
- Checklist LGPD foi revisado.

Para aderir ao escopo comercial de referência HM, também faltam:

- QA humano das telas CRM, financeiro e Analytics;
- páginas profundas de Performance conectadas aos endpoints reais;
- integração de LinkedIn orgânico e LinkedIn Ads;
- validação real de ClickUp e dos providers de BI;
- staging, assets finais e aceite visual humano.

## Status de testes

Suíte unitária (nova em 2026-07-23, CONTRACT-001/qualidade): `apps/api/tests/`
com **58 testes pytest sem banco** cobrindo a política de acesso compartilhada
(`access.py`), as derivações de Performance (divisão por zero), o mapa de status
ClickUp, as validações de deploy do `Settings` (cookie cross-site) e a chave do
rate limit. Rode com `python -m pytest` em `apps/api`. Os `smoke_*.py` continuam
sendo o teste de integração contra Postgres real; a suíte unitária cobre a borda
que smoke não alcança de forma barata. A CI ganhou o job `api-unit`.

Validações executadas em 2026-07-23 (blocos de hardening 1 e 2):

- `python -m compileall bioma_api scripts` (API) e `bioma_worker scripts` (worker)
- `python -m pytest` (58 passaram, sem banco)
- `python scripts/export_openapi.py --check`
- `npx tsc -b` e `npm run build` (web) — trava de conformidade de contrato ativa
- **Migrations 0025/0026 aplicadas e smokes executados contra Postgres local
  (localhost:5433)**: `migrate.py`, `seed_dev.py`, `smoke_api.py`,
  `smoke_performance.py`, `smoke_worker.py`, `smoke_queue.py`, `smoke_vault.py`,
  `smoke_reaper.py` (novo), `smoke_invites.py`, `smoke_workspace_authz.py`,
  `smoke_tasks.py`, `smoke_password.py` — todos passaram. Os smokes mutáveis
  rodaram em banco isolado `bioma_smoke` provisionado à parte.

Validações executadas na remediação de 2026-07-21:

- `python -m compileall bioma/apps/api/bioma_api bioma/apps/api/scripts`
- `python -m compileall bioma/apps/worker/bioma_worker bioma/apps/worker/scripts`
- `python scripts/migrate.py`
- `python scripts/smoke_api.py`
- `python scripts/smoke_clickup.py`
- `python scripts/smoke_workspace_authz.py`
- `python scripts/smoke_workspace_navigation.py`
- `python scripts/smoke_tasks.py`
- `npx tsc -b`
- `npm.cmd run build`
- `npm.cmd audit --omit=dev` — 0 vulnerabilidades
- `git diff --check`
- build web a partir de `git archive HEAD`, reutilizando somente as dependências instaladas
- `graphify update .`

Os testes atuais são funcionais e smoke tests de desenvolvimento. Eles não substituem auditoria de segurança, pentest, teste de carga ou revisão LGPD.

## Como registrar progresso

Ao concluir uma tarefa, adicione uma linha em "Log de execução".

Formato:

```text
- YYYY-MM-DD - IA/sessão - commit/hash - resumo - validação executada - pendências
```

## Log de execução

- 2026-07-09 - Codex - 4d3502d - Corrigido CORS local, responsividade e área de assets - build front, compile backend, preflight/login CORS - pendente QA visual completo.
- 2026-07-09 - Codex - ver git log - CRUD mínimo de cliente/artefato/entrega, auditoria no portal, smoke API e UI revisada - compile backend, migrate, seed, smoke API, tsc, build frontend - pendente assets reais, ClickUp real, QA visual e staging.
- 2026-07-09 - Codex - ver git log - Refatoração estrutural inicial do frontend: constantes, helpers, componentes comuns e CockpitView extraídos do App - tsc, build frontend, smoke API - pendente refatorar backend Client Hub e views restantes.
- 2026-07-09 - Codex - ver git log - Router Client Hub separado da camada de serviço - compile backend e smoke API - pendente quebrar SQL em repositório/testes unitários.
- 2026-07-09 - Codex - ver git log - SQL do Client Hub extraído para repositório de persistência - compile backend e smoke API - pendente testes unitários e integração ClickUp real.
- 2026-07-09 - Codex - ver git log - ClickUp Bridge preparado para leitura real de listas/tasks e upsert local de entregáveis, mantendo HITL para escrita externa - compile backend, smoke API e smoke ClickUp mockado - pendente token/mapeamento real e staging.
- 2026-07-10 - Codex - ver git log - Backend mínimo para CRM/funil, financeiro e métricas manuais da proposta HM - compile backend, migrate, seed, smoke API e smoke ClickUp - pendente frontend consumir endpoints e QA visual.
- 2026-07-10 - Codex - ver git log - Port backend do BIAds: schema, API, fila Postgres e worker Google Ads/GA4/GSC/GTM - compile, migrate, seed, smokes API/ClickUp/Performance/worker/fila - pendente credenciais reais, comparação com Google, frontend e cron de staging.
- 2026-07-09 - Antigravity - c52349e - Refatoração UI/UX: views extraídas do App (Login, Clients, Content, etc.), experiências de Brand Book, Calendário e Analytics, placeholders de logo - tsc, build frontend - pendências corrigidas na rodada seguinte (contraste, dados demo sem rótulo).
- 2026-07-10 - Claude (Fable) - ver git log dcd2941..HEAD - Tema escuro musgo com tokens EG, assets de marca aplicados, Analytics/calendário com rotulagem honesta e dados reais, briefing/brand book estruturados por seções, ArtifactModal extraído e tipos sem any, checklist de QA visual criado - tsc, build frontend a cada commit - pendente QA visual assinado, visão mensal do calendário e assets finais de marca.
- 2026-07-10 - Claude (Fable) - bccaf50/c9707e4 - Decisões de escopo registradas (CRM=Kommo bridge futuro, brand book adiado, calendário fica no ClickUp, port BIAds), documentos estratégicos generalizados sem hardcode de brand book, TrendChart recharts no Analytics com paleta validada, PLANO-PORT-BIADS.md criado - tsc, build frontend - pendente consolidação das worktrees pelo Juiz e execução do port (P1.5).
- 2026-07-10 - Codex/Juiz - c143c7a - Worktrees de API e UI consolidadas no develop, conflito de roadmap resolvido e port backend do BIAds incorporado - tsc, build, migrations, seed, smokes API/ClickUp/Performance/worker/fila e smoke visual desktop/mobile - pendentes frontend CRM/financeiro/Performance, LinkedIn, integrações reais, staging, assets e aceite humano.
- 2026-07-10 - Codex - ver git log - Hardening para deploy, CI, Config as Code, bootstrap admin, smoke remoto, fluxo real de solicitação de aprovação e fila operacional multi-LLM - pendente criar staging externo, conectar credenciais e executar os gates de produção.
- 2026-07-11 - Codex - ver git log - Deploy do MVP redirecionado para Railway/Vercel, CRM/funil e financeiro ligados ao frontend, Analytics conectado ao backend de Performance e hardening mínimo de auth/payload/rate-limit - tsc, build web, compile backend/worker, smokes API/ClickUp/Performance/worker/fila - pendente staging externo, credenciais reais, páginas profundas de Performance, QA humano e LGPD.
- 2026-07-11 - Codex - ver git log - GitHub Action para deploy Vercel via token admin, code-splitting de Analytics/Comercial e smoke de sessão expirada - tsc, build web, smoke API - pendente secrets GitHub/Vercel, URLs públicas para smoke remoto e validação humana.
- 2026-07-11 - Codex - ver git log - URLs de staging registradas e smoke HTTP público tentado - `api-staging.bioma.evergreenmkt.com.br` e `staging.bioma.evergreenmkt.com.br` retornaram 404 - pendente associar domínios aos projetos corretos ou aguardar propagação DNS.
- 2026-07-11 - Codex - ver git log - Railway API start trocado para `python scripts/start.py` e GitHub Action Vercel passou a fazer build local + `vercel deploy dist` para evitar erro de output `dist` no fluxo prebuilt - compile/smokes API, build web e smokes worker executados - pendente redeploy Railway/Vercel e smoke remoto.
- 2026-07-11 - Claude Code (Sonnet 5) - CLAIM WEB-PERF-002 - Páginas profundas de Performance (Google Ads, GA4, Search Console, GTM) como abas dentro de Analytics, consumindo os endpoints reais já existentes do backend (`api.ts`: `ga4Acquisition`, `gscQueries`, `gtmSnapshots`), com estados de carregamento/vazio/erro e banner de freshness por provedor quando a fonte não tem sync real - `npx tsc -b`, `npm run build` (chunk principal mantém ~243 kB, `AnalyticsView` isolado em chunk lazy) - pendente QA visual das novas abas e validação com credenciais Google reais.
- 2026-07-11 - Claude Code (Sonnet 5) - CLAIM WEB-BUNDLE-001 - Lazy-load das views Clientes, Conteúdo, Integrações e Engenharia em `App.tsx` (mesmo padrão `React.lazy`/`Suspense` já usado em Analytics/Comercial), reduzindo o chunk principal de ~243 kB para ~227 kB antes de gzip - `npx tsc -b`, `npm run build` - pendente nenhuma; próxima folga de bundle viria de dividir o chunk pesado do `AnalyticsView` (recharts).
- 2026-07-17 - Claude Code (Fable 5) - CLAIM AUTH-003 + revisão Gemini - Google como vínculo deslinkável (decisão: social login nunca cria conta nem prende a conta; usuário logado vincula/desvincula em Configurações; "Entrar com Google" só para vínculo existente; migration 0007 `identities`, OIDC code flow + userinfo, state cookie), jobs de limpeza LGPD no boot (sessões 7d, convites/resets 30d), aviso de privacidade público `/privacidade` linkado nas telas de login/convite/reset. Revisão do trabalho do Gemini: mantida a UI (Sidebar/Settings/admin views), corrigidos admin_legacy sem auth + path traversal + corruptor de metadados + pyyaml ausente do requirements, Phaser tirado do bundle inicial (1,77 MB→333 kB via lazy), LoginView honesta (Apple removido, "100% Seguro"→"LGPD", esqueci-senha via WhatsApp) e 4 variáveis CSS usadas sem definição (aliases criados) - compileall, migrate, cleanup, smoke_oauth (novo), smoke_api/invites/password, tsc, build - pendente credenciais Google reais no ambiente (Cloud Console) e rate limit dos endpoints públicos de token.
- 2026-07-15 - Claude Code (Fable 5) - CLAIM AUTH-002 - Reset de senha por link copiável de uso único (2h, gerado pelo EG admin no AdminDock, página pública `/redefinir/:token`, e-mail mascarado na validação, confirmação revoga todas as sessões antigas e abre sessão nova) + troca de senha logado (modal na topbar, exige senha atual, revoga demais sessões) - migration 0006, compileall, smoke_password (novo), smoke_api, smoke_invites, tsc, build web - pendente aviso de privacidade nas telas públicas e rate limit nos endpoints públicos de token antes de escalar.
- 2026-07-15 - Claude Code (Fable 5) - CLAIM AUTH-001 + GATE-001 - Convite de usuário cliente por link copiável de uso único (token hasheado, expira em 7 dias, aceite público cria usuário+sessão, página `/convite/:token`, painel no AdminDock) e feature-gating por organização (`enabled_modules` jsonb + `parent_organization_id` na migration 0005, gates de analytics/commercial/files no backend, nav e rotas filtradas no frontend, toggles no AdminDock); fix da regressão do form de edição de cliente que perdeu o pré-preenchimento na migração p/ zustand; release-please com bump automático de `version.ts` via extra-files; proxy Vite revertido p/ 8000; rascunho `LGPD-001.md` criado - compileall, migrate, seed, smokes API/invites/performance/files (MinIO real)/ClickUp, tsc, build web - pendente LGPD-001 assinado, AUTH-002 (reset de senha) e aviso de privacidade na tela de convite.
- 2026-07-12 - Claude Code (Sonnet 5) - CLAIM FILE-001 - Upload/storage de documentos com visibilidade por cliente: migration `client_files`, router/service/repository `files` seguindo o padrão de `performance`/`client_hub` (EG admin sobe/exclui, `client_user` só lê arquivos `visibility=client`), cliente S3-compatible (`services/storage.py`, boto3, endpoint configurável para funcionar com R2/B2/MinIO/AWS), limite de tamanho configurável (`STORAGE_MAX_UPLOAD_MB`), download via URL assinada com expiração curta, painel `FilesPanel` no front dentro de Conteúdo, perfil `storage` (MinIO) no `docker-compose.yml` para dev local sem depender de credencial de nuvem - compile backend, `scripts/smoke_files.py` (upload/list/autorização/limite de tamanho/download real via URL assinada/exclusão) rodado de ponta a ponta contra MinIO local, smokes API/ClickUp/Performance sem regressão, `npx tsc -b`, `npm run build`, fluxo completo testado manualmente no navegador (upload, download do conteúdo real, exclusão) - pendente credenciais de bucket real (R2/B2/S3) em staging/produção; AUTH-002 (rotação de senha) e AUTH-001 (convite sem seed) seguem TODO.
- 2026-07-16 - Antigravity - (local) - Refinamento da UI/UX: Sidebar e Topbar extraídos do App.tsx, estética premium glassmorphic aplicada via styles.css (inspirado na HM, mas preservando tokens EG), responsividade mobile da sidebar ajustada (slide-in menu) e LoginView alinhado estruturalmente com as referências visuais - pendente QA visual (manual) assinado e staging.
- 2026-07-17 - Antigravity - (local) - Ajustes visuais em configuracoes: ocultacao de badge em abas irrelevantes, implementacao de crop em foto de perfil com react-easy-crop, integracao do avatar na sidebar esquerda e refinamento do botao Google connect nas configuracoes - build web validado - pendente staging.
- 2026-07-18 - Codex - ver git log - Concluída a migração das telas Engenharia, Arquitetura e Escritório de `/api` para o cliente central `/backoffice`, eliminando respostas HTML interpretadas como JSON e adicionando contratos tipados/erro visível - `npx.cmd tsc -b`, `npm.cmd run build` - pendente QA visual humano e decisão de produto sobre separar a operação interna EG da carteira de clientes externos.
- 2026-07-18 - Codex - ver git log - Separada a Operação EG da Carteira no frontend; CRM, financeiro, métricas, documentos e integrações agora operam somente sob `/clientes/:clientId/...`, com rotas globais fechadas e `EverGreen Internal` oculto do Hub - `npx.cmd tsc -b`, `npm.cmd run build` - pendente migração backend do registro técnico legado e QA visual humano.
- 2026-07-18 - Codex - ver git log - Corrigida a separação anterior: restaurada a Operação EG como workspace próprio em paralelo aos hubs, criado navegador pesquisável com recentes e documentado o modelo `Platform → Tenant/Agência → Workspaces` - `npx.cmd tsc -b`, `npm.cmd run build` - pendentes migração `client_id`→`workspace_id`, times/atribuições, favoritos e QA visual humano.
- 2026-07-18 - Codex - ver git log - Entregue a primeira etapa persistente de workspaces: ADR aceito, migration/backfill e provisionamento transacional, `GET /workspaces`, navegador alimentado pelo contexto autorizado, invariantes de tenant/slug e resolvedor ativo compartilhado por Client Hub, Files, Performance e Kommo - migration/seed, `compileall`, smoke API (membership, convite e archive), smoke Performance, smoke da fila, `npx.cmd tsc -b` e `npm.cmd run build` passaram - pendentes adapters dos demais domínios, migração canônica de Performance, RBAC/times e QA visual humano.
- 2026-07-18 - Codex - ver git log - DATA-WS-001B concluído: rotas canônicas `/workspaces/{id}` com adapter legado, frontend operando por `workspace.id`, Performance backfilled com UUID canônico, `gtm_workspace_id` desambiguado e dual-write protegido por trigger - migrations, `compileall`, smoke API, smoke Performance, smoke da fila e `npx.cmd tsc -b` passaram - ponte `EverGreen Internal` ainda necessária até remover as FKs/client adapters restantes.
- 2026-07-18 - Codex - ver git log - AUTHZ-WS-001 concluído e TEAM-001 iniciado: papéis de tenant/workspace, times, membros e atribuições de carteira persistidos; resolução central de acesso aplicada ao Client Hub, Files, Performance e Kommo - migration, `compileall`, smoke de matriz RBAC, smoke API e smoke Performance passaram - pendente gestão visual de times e favoritos/visões da carteira.
- 2026-07-18 - Codex - ver git log - WEB-NAV-002 concluído: favoritos persistentes, filtro “Minha carteira” derivado de assignments e visões salvas por usuário integrados ao navegador premium de workspaces - migration, smoke de navegação e `npx.cmd tsc -b` passaram - pendente QA visual humano em desktop/mobile.
- 2026-07-18 - Codex - ver git log - AI-CONTENT-001 concluído: Estúdio IA no Hub do Cliente, fila Postgres compartilhada sem starvation, auditoria em `ai_runs`, prévia local honesta e adapter OpenAI Responses API com Structured Outputs - migration, compile API/worker, smoke preview + provider mock e `npx.cmd tsc -b` passaram - geração externa real depende de `OPENAI_API_KEY` no worker e QA humano.
- 2026-07-18 - Codex - ver git log - Estratégia ClickUp/Kommo consolidada no ADR 0002 como integration-first e INT-CU-002 concluído com classificação Social/Growth/Tech e tradução configurável de status - migration, compile e smoke ClickUp mockado passaram - tokens, listas e conta Kommo reais continuam bloqueados até staging controlado.
- 2026-07-18 - Codex - ver git log - TEAM-001 concluído com gestão visual de times, membros habilitados e distribuição de workspaces em Configurações; “Minha carteira” passa a ter uma administração organizacional separada dos hubs dos clientes - `npx.cmd tsc -b` e `npm.cmd run build` passaram - convite/provisionamento de novos colaboradores permanece como evolução independente.
- 2026-07-21 - Codex - ver git log - Remediação da auditoria: segredo ClickUp revogado e removido do histórico local, tarefas protegidas por workspace/capability, recorrência idempotente, projeção ClickUp tenant-scoped somente leitura, archive/purge seguro de clientes, smokes independentes da HM e arquivos antes não rastreados versionados - migrations, compile API/worker, smokes API/authz/navegação/ClickUp/tasks, tsc, build normal e rastreado, audit npm, diff-check e Graphify passaram - pendente apenas validação ClickUp ao vivo futura com novo token efêmero em staging controlado.
- 2026-07-23 - Claude Code (Opus 4.8) - ver git log - Hardening blocos 1 e 2: (1) deduplicação de acesso — `_is_platform_admin`/`_accessible_client` removidos de client_hub/files/performance/invites e colapsados em `access.resolve_accessible_client`, fonte única do isolamento multi-tenant; (2) QUEUE-001 reaper — migration 0025 (`heartbeat_at`/`attempts`), `reclaim_stalled_jobs` no início do ciclo do worker, heartbeat entre providers, lease 900s/3 tentativas; (3) rate limit em Postgres — migration 0026 (`login_attempts`, chave `sha256(ip:email)`), registro fora da transação do 401, purga no `cleanup.py`; (4) CONTRACT-001 — `export_openapi.py` gera `openapi.json` versionado, `npm run types:api` gera `api-schema.d.ts`, `contract-conformance.ts` trava drift em compile, CI valida os dois lados; (5) suíte pytest `apps/api/tests/` (58 testes sem banco) + job `api-unit` na CI. Placeholder de contrato removido - compileall API/worker, pytest 58/58, export_openapi --check, tsc -b e build web passaram; drift injetado/revertido para provar a trava - migrations 0025/0026 aplicadas e suíte de smokes (api, performance, worker, queue, vault, reaper, invites, authz, tasks, password) executada contra Postgres local em localhost:5433, com banco isolado `bioma_smoke` para os mutáveis; todos passaram.
- 2026-07-25 - Antigravity - af524a8 - primeira versão visual de radar, custos e métricas. Auditoria posterior identificou três fontes RSS reais, persistência indevida de token, integração financeira incompatível e geração que ignorava a saída do squad; o item voltou a `IN_PROGRESS`.
- 2026-07-26 - Antigravity - 307f86c - Motor financeiro de ROI, CAC e custo por proposta por plataforma integrado ao Big Data e ao Repositório de Propostas - `npx tsc --noEmit` + 51/51 pytest sem erros.

