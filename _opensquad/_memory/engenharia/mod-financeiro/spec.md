# Spec: mod-financeiro (Backoffice Financeiro)

- **Cliente:** Interno (`target: internal`) — ideia `mod-financeiro` (part_of `mega-plataforma`)
- **Fase:** 2 (Dogfood e Operação Base)
- **Status:** rascunho
- **Data:** 2026-07-07

## 1. Objetivo
Centralizar toda a previsibilidade de caixa, emissões e modelagem financeira da EverGreen. Eliminar o uso de múltiplas planilhas isoladas, trazendo a filosofia de orçamento "70/10/20" e a gestão de metas financeiras corporativas para dentro da Mega Plataforma.

## 2. Contexto
A EG possui modelos de excel muito refinados (Planilha-Orcamentaria.xlsx) criados no núcleo Fóton (pessoal), que validam a viabilidade de projetos e orçamentos. O objetivo é generalizar essa lógica para a tesouraria corporativa, unindo a visão de cobrança dos clientes SaaS/Agency com a estrutura de custos fixos, folha de pagamento e distribuição de lucros.

## 3. Escopo Funcional
1. **Forecasting e Viabilidade:**
   *   Motor de simulação de novos contratos (MRR) versus custos de aquisição, calculando o ponto de equilíbrio.
2. **Orçamento Base (70/10/20):**
   *   Alocação automática das receitas do mês nos potes: Operação (70%), Reserva/Risco (10%) e Lucro/Distribuição (20%).
3. **Painel de Inadimplência e Cobrança:**
   *   Ligado ao módulo de Contratos. Listagem de notas pendentes.
4. **Integração Fiscal:**
   *   Sincronização cadastral (CNPJ/Situação) e gatilho de emissão de NFS-e (Notas Fiscais de Serviço) automatizadas, integrado à prefeitura/ferramenta contábil.

## 4. Requisitos Não-Funcionais
*   Segurança militar sobre acessos: Apenas a *role* `financeiro_admin` pode acessar.
*   Cálculos matemáticos devem usar bibliotecas de precisão (`decimal.js`) e armazenamento no banco em centavos (`integer`) para evitar bugs de arredondamento de float points.

## 5. Integrações Críticas (ADRs Futuros)
*   **ADR-FIN1 (Integração Bancária/Contábil):** Construir as emissões fiscais usando API da Conta Azul, Omie, ou construir integrações diretas (NFE.io)?
