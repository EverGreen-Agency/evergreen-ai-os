# ADR-0008: Camada LLM-Agnostic e Benchmark de Modelos

**Módulo:** `mod-multitenant` (Decisão Transversal P8)
**Data:** 2026-07-06
**Status:** Proposto

## 1. Contexto
A Mega Plataforma terá IA enraizada na operação inteira (geração de diagnósticos qualitativos, BI narrativo, Raio-X interativo, análise de áudios). Travar o produto inteiro diretamente na API pública da OpenAI (GPT) ou Anthropic (Claude) cria um risco insustentável de custos flutuantes, indisponibilidade temporária e vendor lock-in. Pior ainda, dificulta drasticamente o compliance de privacidade da LGPD.

## 2. Decisão Proposta
Implementar uma camada arquitetural **LLM-Agnostic** estrutural (utilizando proxy como o LiteLLM) para que os módulos da aplicação conversem com um intermediário interno, e não com a provedora final.

*   **LiteLLM (Self-hosted):** Proxy principal para produção, garantindo que as requisições, rate-limits e chaves de API sejam geridas do nosso lado.
*   **Juiz / Ensemble:** Tarefas críticas terão seus prompts rodados simultaneamente em 2 ou 3 modelos diferentes (GPT, Claude, Gemini), e um modelo Juiz determinará o melhor resultado, guardando as métricas de performance.

## 3. Estrutura de Banco de Dados Sugerida
*   `llm_providers`: Registra quais chaves de API estão ativas e seus saldos.
*   `llm_tasks`: O contrato da tarefa (ex: "Analisar Score"). Define qual modelo primário chamar, e qual é o "fallback" automático caso a API da OpenAI caia.
*   `llm_runs`: Histórico obrigatório de execução. Salva de forma auditável o custo real em frações de centavo, a latência do request, a versão exata do prompt usado e o output.

## 4. Consequências e Trade-offs
*   Os módulos de aplicação (frontend ou API) **nunca** executam comandos tipo `fetch("https://api.openai.com")`. Eles chamam a biblioteca local ou a API interna que faz o roteamento inteligente.
*   **Mascaramento de Dados (Data Masking):** A camada LLM-Agnostic tem o poder de interceptar o prompt e mascarar/criptografar PIIs (nomes reais, CPFs, finanças) ANTES de bater nos servidores gringos, blindando a EverGreen juridicamente contra infrações de LGPD.
*   Custo maior de engenharia e modelagem relacional na largada, porém elimina aprisionamento e otimiza radicalmente a conta de IA da agência.
