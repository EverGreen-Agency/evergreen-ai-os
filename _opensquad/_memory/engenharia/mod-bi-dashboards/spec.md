# Spec: mod-bi-dashboards (Motor de BI e Dados)

- **Cliente:** interno e externo (`target: mixed`) — ideia `mod-bi-dashboards` (part_of `mega-plataforma`)
- **Fase:** 1 (Visão do Cliente e Operação)
- **Status:** rascunho
- **Data:** 2026-07-06

## 1. Objetivo
Criar o "motor visual" e de processamento analítico que alimenta tanto a equipe interna (gestores de tráfego, SDRs) quanto a visão do cliente final no `client-hub`. Este módulo integra as lógicas já rascunhadas no repositório BIAds, centralizando dados de Meta Ads, Google Ads e LinkedIn Ads, atrelando UTMs aos funis dinâmicos de vendas.

## 2. Contexto
Historicamente, as agências montam Looker Studio ou planilhas estáticas que quebram com facilidade e não passam a sensação premium. A Mega Plataforma deve tratar dados como um ativo de software. O desafio principal é lidar com o isolamento de dados (cada tenant vê apenas as suas campanhas), o mapeamento das credenciais OAuth (cada cliente tem seu próprio token do Meta/Google atrelado ao seu `tenant_id`) e **a personalização da UI baseada nos serviços que o cliente possui** (ex: um cliente com contrato de SEO vê integrações orgânicas e mapas de calor; um cliente focado em Performance verá as campanhas de Google Ads. A visualização depende da assinatura/produto ativado).
*   **Depende de:** `mod-multitenant` (infraestrutura de dados isolados) e `ads-api-skills` (camada de coleta da API das Big Techs).
*   **Reaproveita:** Repo BIAds (Código de base/POC), o artefato mandatório `@abstracao-bi.md` (modelo mental dos 3 dashboards) e `meta_ads_dashboard_prompt.md`.

## 3. Escopo Funcional
1. **O Motor de Ingestão (ETL/Cron):**
   *   Workers assíncronos (CRON jobs) buscando dados (gastos, cliques, leads) das APIs diariamente ou por demanda.
   *   Normalização dos dados: O clique do Facebook precisa "falar a mesma língua" do clique do Google em uma tabela unificada no banco.
2. **Camada de Visualização (Dashboards):**
   *   Componentes React reutilizáveis de gráficos (linhas, funis de conversão, barras, medidores de ROI).
   *   O módulo renderiza o dashboard dentro do `client-hub` de forma nativa e ultra-rápida.
3. **Gestão de Conexões (OAuth):**
   *   Página no onboarding ou nas configurações onde o cliente (ou o CS interno) clica em "Conectar com Meta" e "Conectar com Google Ads", armazenando o token seguro vinculado àquele tenant (RF6 do mod-multitenant).

## 4. Integrações Críticas (ADRs Futuros)
*   **ADR-BI1 (Build vs Embed):** Decidir entre embutir iframes de ferramentas maduras (Looker, Metabase, Superset) — mais rápido mas menos controle de design — versus construir os gráficos do zero (usando Recharts/Tremor) no frontend Next.js — UX imbatível, mas esforço maior de dev.
*   **ADR-BI2 (Estratégia de Coleta):** Como e onde os dados brutos ficarão salvos. Vamos salvar todas as métricas históricas no nosso PostgreSQL, ou vamos bater na API do Meta em tempo real toda vez que o cliente abrir a tela? (A recomendação é o motor ETL salvando no nosso banco para queries rápidas e cruzamento de UTMs).
