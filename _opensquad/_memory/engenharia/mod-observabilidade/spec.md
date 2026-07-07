# Spec: mod-observabilidade (Monitoramento, APM e Uptime)

- **Cliente:** Interno (DevOps) e Externo (Status Page) — *Nova Ideia* (part_of `mega-plataforma`)
- **Fase:** 0/1 (Transversal, nasce junto com a fundação)
- **Status:** rascunho
- **Data:** 2026-07-07

## 1. Objetivo
Garantir que a Mega Plataforma nunca caia de forma silenciosa. A EG e o cliente precisam saber o status em tempo real da aplicação, do banco de dados, dos workers e de todos os provedores externos (Stripe, APIs do Meta/Google, Provedor de Email, Vercel). É a diferença entre um projeto amador (onde o cliente avisa que caiu) e um SaaS premium (onde a equipe de engenharia é alertada 3 segundos após a queda e o cliente vê uma *Status Page* transparente).

## 2. Contexto (A Ideia e Opinião)
**Opinião do Arquiteto:** Uma plataforma B2B/SaaS não sobrevive apenas de código bonito. Se um token OAuth do Facebook expirar, ou a API da Stripe parar de confirmar pagamentos (webhooks falhando), o prejuízo é financeiro imediato. Precisamos de **Observabilidade Ativa** (APM - Application Performance Monitoring) e **Monitoramento Sintético** (robôs externos pingando o nosso sistema).

## 3. Escopo Funcional (O que será construído/integrado)
1. **Health Checks Nativos (`/api/health`):**
   *   Uma rota leve e desprotegida na nossa API que responde `200 OK`.
   *   O payload dessa rota testa rapidamente a conexão com o PostgreSQL, o status do Redis (filas) e a saúde do storage.
2. **Monitoramento Sintético (Externo):**
   *   Uso de uma ferramenta externa como **BetterStack** (antigo UptimeRobot) ou Datadog Synthetics.
   *   Essa ferramenta "pressiona" a plataforma a cada 1 minuto. Se a Vercel cair, a ferramenta nos liga (PagerDuty/SMS/WhatsApp) imediatamente.
3. **Sentinela de Terceiros (Dependências):**
   *   Rastreador de status das APIs que usamos: Stripe, Supabase/Auth.js, LiteLLM.
   *   Se a Stripe estiver fora do ar, o frontend exibe um banner: "O sistema de pagamentos está em manutenção pela Stripe".
4. **Log de Erros (Crash Reporting):**
   *   Integração com **Sentry** no frontend e backend. Se um usuário clicar em um botão e der um erro não-tratado em produção, o Sentry captura a linha do código e nos alerta.
5. **Status Page Transparente:**
   *   Uma página pública (`status.evergreen.com.br`) e um widget embedado no `client-hub` mostrando bolinhas verdes ou amarelas para: "Painel", "Integrações de Ads", "Pagamentos".

## 4. Integrações Críticas (ADRs Futuros)
*   **ADR-OBS1 (Sentry vs Datadog):** Escolher a ferramenta de captura de erros. O Sentry é o padrão ouro e tem um tier gratuito generoso para Next.js.
*   **ADR-OBS2 (Uptime Monitor):** Escolher o provedor que vai fazer o *ping* e a *Status Page* pública (BetterStack é a recomendação).
