# ADR-0009: Internacionalização e Tradução (i18n)

**Módulo:** `mod-multitenant` (Decisão Transversal P9)
**Data:** 2026-07-07
**Status:** Proposto

## 1. Contexto
A Mega Plataforma tem o potencial de ser comercializada internacionalmente (SaaS/White-label global). O usuário levantou a necessidade de oferecer o painel em múltiplas línguas, questionando se devemos usar a API de Tradução, o Google Tradutor automático ou arquivos locais.

## 2. Decisão Proposta
A tradução de um SaaS premium deve ser híbrida para manter a velocidade e a percepção de alto valor:

1. **Para Interface Estática (Menus, Botões, Avisos):**
   *   **Proibido usar "Google Tradutor Plugin" no navegador:** Ele quebra a estrutura do React (React Hydration Error) e destrói o design.
   *   **Solução escolhida:** Usar **`next-intl`** ou **`i18next`** com **arquivos locais (`.json`)** dentro do repositório (ex: `pt-BR.json`, `en-US.json`). É instantâneo, seguro, amigável para SEO e a nossa IA (no VSCode) pode gerar os arquivos de tradução automaticamente.
2. **Para Conteúdo Dinâmico (Relatórios, Prompts e Diagnósticos):**
   *   Não vamos traduzir isso no frontend nem usar API do Google (muito cara para blocos gigantes de texto).
   *   **Solução escolhida:** Usaremos a nossa camada **LLM-Agnostic (ADR-0008)**. Se o tenant estiver setado em Inglês, os workers em background (bullmq) já vão gerar os relatórios do cliente diretamente em Inglês chamando a IA. O texto já nasce traduzido no banco de dados.

## 3. Consequências e Trade-offs
*   A equipe de engenharia precisará criar as strings como chaves (ex: `t("dashboard.welcome_message")`) em vez de *hardcodar* texto em PT-BR direto no código.
*   Garante uma experiência "nativa" e profissional (Premium) em qualquer país, sem atrasos de rede para traduzir a interface (já vem pronta do servidor).
