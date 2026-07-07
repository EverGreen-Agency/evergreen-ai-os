# Spec: client-hub (Área do Cliente e Portal Premium)

- **Cliente:** externo (`target: external`) — ideia `client-hub` (part_of `mega-plataforma`)
- **Fase:** 1 (O que o cliente vê)
- **Status:** rascunho
- **Data:** 2026-07-06

## 1. Objetivo
Criar o "palco" principal de interação entre a EverGreen e os clientes corporativos. O `client-hub` é um portal white-glove acessado por gestores e CEOs de clientes para acompanhar o retorno do investimento (BIs), a saúde da marca (Raio-X), entender os gargalos da operação (SLA) e contratar novas soluções de forma friction-less, unificando todo o output da agência em um ecossistema estilo Apple.

## 2. Contexto e Gatilhos
A EverGreen entrega relatórios, brand books, setups, tráfego e conteúdo. Historicamente, essas entregas vivem dispersas em PDFs, Notion e grupos de WhatsApp, gerando atrito e dificultando a percepção de valor. O Hub resolve isso centralizando o output.
*   **Acesso Mágico:** O cliente recebe um kit logístico (onboarding) com um cartão NFC. Ao bater o celular no cartão, ele é autenticado magicamente e cai no Hub.
*   **Depende de:** `mod-multitenant` (para isolar os clientes) e `mod-bi-dashboards` (para renderizar os gráficos).
*   **Reaproveita:** O Blueprint PDF HM (telas do dashboard geral), a `skill-raiox` e as lógicas de Score. Também reaproveitará ativamente o repositório BIAds e utilizará o CodeGraph para mapear as integrações já existentes.

## 3. Escopo Funcional (O que será construído)
1. **Página Inicial (Visão Executiva):**
   *   Métricas de estrela-guia agregadas.
   *   Status de saúde (Health Score) da parceria (SLA, entregas atrasadas/em dia).
   *   Acesso rápido aos artefatos da marca (linkando para o `mod-marca-artefatos` futuramente).
2. **Motor de Score e Raio-X:**
   *   Gamificação do negócio do cliente, avaliando maturidade em Oferta, Demanda e Conversão.
   *   O cliente responde check-ins periódicos e vê a nota dele (Score) subir ou descer.
3. **Módulos Bloqueados (Funil Kotler 5A e Upsell):**
   *   Seção mostrando as "árvores de crescimento" do cliente.
   *   Módulos cinzas/bloqueados (Ex: "Aceleração de Branding", "Omnichannel") que o cliente ainda não comprou, com a explicação do porquê o negócio dele precisa daquilo, liberando para pedido imediato (Upsell guiado pelo Score).
4. **Dashboards Integrados:**
   *   Abas chamando os relatórios do `mod-bi-dashboards` de forma embarcada (sem o cliente saber que está num BI), focando em CPL, CAC e ROI.
5. **Comunicação Centralizada:**
   *   Resumo das últimas reuniões, aprovações pendentes (redirecionando para o clickup sync/aprovador).

## 4. Requisitos Não-Funcionais
*   **Design Cinematográfico:** O UI/UX deve ser absurdamente responsivo, limpo, usando dark mode, tipografia moderna (Inter/Outfit), micro-interações de hover e gradientes suaves. A sensação deve ser a de usar um software premium do Vale do Silício.
*   **Zero-Friction:** A UX deve focar no C-level. Executivos não querem dezenas de cliques; querem ver a meta, o gasto e o que precisam aprovar em 5 segundos.

## 5. Integrações Críticas (ADRs Futuros)
*   **ADR-CH1 (Acesso via NFC):** Como lidar com o magic link / tag NFC para garantir segurança sem forçar o cliente a lembrar de senhas.
*   **ADR-CH2 (Desbloqueio Dinâmico):** Como a plataforma valida no banco quais módulos a conta do cliente possui para renderizar componentes desativados/bloqueados na UI.
