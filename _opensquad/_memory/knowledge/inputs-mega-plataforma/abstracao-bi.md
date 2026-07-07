Segue a abstração de três frontend que o Gemini puxou de vídeos. Também segue no @meta_ads_dashboard_prompt.md outras instruções/versões.
Lembrando isso aqui são instruções, dicas que outros gestores de tráfego passaram. Estou lhe passando para nos ajudar na hora de construir nossos dashboard e BIs, tnato interno quanto para os clientes e ver o que a gente altera do que já temos programado no BIAds (repo).

Plataforma/Gestor de tráfego 1:
___
Com base na análise minuciosa do vídeo, frame a frame, elaboramos uma documentação técnica detalhada focada em UI (Interface do Usuário), UX (Experiência do Usuário) e especificações funcionais. Este escopo serve como um guia direto para o time de desenvolvimento (Front-end e Back-end/Dados) replicar a plataforma.

Documentação de Especificação: Dashboard de Tráfego Pago
1. Visão Geral de Design e Tema (UI)
Estilo Visual: O dashboard utiliza um tema "Dark Mode" absoluto e moderno. O design é focado em alta densidade de dados sem parecer poluído.

Paleta de Cores:

Fundo Principal: Preto ou cinza muito escuro (ex: #101010 ou #121212).

Cor Primária (Destaque): Amarelo vibrante/Neon (ex: #FFD700 ou similar). Usado para ícones ativos, valores monetários principais, gráficos de destaque e etapas do funil.

Cor Secundária (Contraste de Dados): Roxo (usado em gráficos de linha, gráficos de rosca e barras de progresso para contrastar com o amarelo).

Texto Principal: Branco.

Texto Secundário/Rótulos: Cinza claro/médio (para títulos de cards e eixos de gráficos).

Superfícies (Cards): Cinza escuro levemente mais claro que o fundo, ou fundos pretos com bordas cinza muito sutis para separação de escopo.

Tipografia: Fonte Sans-serif limpa e moderna (estilo Inter, Roboto ou San Francisco). Pesos variados: Bold para números e métricas essenciais, Regular para rótulos e tabelas.

2. Estrutura Global de Layout
A tela é dividida em três áreas principais:

Sidebar (Menu Lateral Esquerdo): Fixo, estreito.

Header (Cabeçalho Superior): Título, data e filtros globais.

Main Content (Área de Widgets): Um grid complexo, responsivo (como visto na versão mobile do celular físico no vídeo). No desktop, parece organizado em colunas (Esquerda: KPIs e Gráfico de Linha; Centro: Funil; Direita: Demográficos e Criativos; Rodapé: Tabelas extensas).

3. Detalhamento de Componentes e Funcionalidades
3.1. Sidebar (Navegação Esquerda)
Logotipo: No topo, ícone de um foguete amarelo.

Itens de Menu (Ícones empilhados verticalmente):

Dashboard / Início (Ativo - destacado com uma pequena barra amarela à esquerda).

Pasta / Projetos / Contas.

Usuários / Audiência.

Relatórios / Documentos (Refere-se à feature "Relatórios automáticos" citada no vídeo).

Engrenagem (Configurações, fixado na parte inferior).

Comportamento: Retrátil (apenas ícones por padrão, expansível ao passar o mouse - presumido por padrões de UX).

3.2. Header e Filtros Globais
Esta área controla os dados exibidos em todos os widgets da tela simultaneamente.

Título da Página: "Dashboard | Geral" acompanhado do ícone do foguete.

Date Picker (Seletor de Data):

Dropdown com ícone de calendário.

Exibe o período selecionado (ex: "1 de jan. de 2025 - 31 de jan. de 2025").

Filtros em Cascata (Dropdowns Múltiplos):

Ícone de funil + "Campanha"

Ícone de funil + "Conjunto" (Ad Set)

Ícone de funil + "Anúncios" (Ads)

Lógica: A seleção em um deve filtrar as opções do próximo (ex: ao escolher uma campanha, o dropdown de conjuntos mostra apenas os conjuntos daquela campanha).

3.3. Área de KPIs (Cards Superiores Esquerdos)
Um grid de 6 cards (3 colunas x 2 linhas) contendo métricas cruciais de tráfego (Meta/Google Ads).

Estrutura de cada Card: Ícone à esquerda do título (cinza), Valor principal em destaque (branco ou amarelo).

Métricas:

Investimento: Ícone de cifrão ou dinheiro. Valor em Amarelo (ex: R$ 12,35mil).

Resultado: Valor em branco (ex: 11). Subtítulo cinza indicando a meta da campanha (ex: Mensagens com ícone do WhatsApp).

Custo/Resultado: Ícone de alvo. Valor em branco (ex: R$ 6,31).

Retorno (ROAS/Receita): Valor em branco (ex: R$ 52,65mil).

CPM: Valor em branco (ex: R$ 15,26).

CTR: Valor em porcentagem (ex: 2,00%).

3.4. Gráfico "Linha do Tempo"
Gráfico de evolução temporal posicionado abaixo dos KPIs.

Tipo: Gráfico de linhas suavizadas (Spline chart) com área preenchida sob a linha com gradiente.

Eixo X: Datas (dias do mês, ex: jan. de 2025).

Eixo Y: Valores numéricos automáticos baseados na seleção.

Séries (Legendas selecionáveis no topo do gráfico):

Linha Amarela: Leads (TOTAL)

Linha Roxa: Custo por Leads

UX: Hover/Tooltip esperado ao passar o mouse sobre os pontos para ver os valores exatos do dia.

3.5. O Core da Plataforma: "Funil Dinâmico" (Coluna Central)
Esta é a peça central do software. Uma representação visual detalhada do comportamento do usuário desde a impressão até a compra.

Header do Funil: Título "Funil Geral" com um dropdown para trocar o tipo de funil (ex: indica "Tipo: E-commerce").

Visual: Blocos amarelos no formato de trapézios invertidos, empilhados verticalmente, diminuindo de largura conforme descem.

Lógica de Dados do Funil:
Cada etapa exibe o Nome da Etapa e o Volume Total.
Entre uma etapa e outra, à direita, há linhas/setas exibindo métricas derivadas de "Quebra" (Drop-off rate) e "Custo por Ação".

Campos exatos exibidos no vídeo (De cima para baixo):

Impressões: 50.000

Métricas laterais: CPM R$ 0,02 | CTR 2,00%

Cliques no Link: 1.000

Métricas laterais: Custo/Clique no Link R$ 1,00 | Quebra/Page View 10%

Page View: 900

Métricas laterais: Custo/Page View R$ 1,11 | Quebra/View Item 50%

View Item: 450

Métricas laterais: Custo/View Item R$ 2,22 | Quebra/Add to Cart 90%

Add to Cart: 45

Métricas laterais: Custo/Add to Cart R$ 22,22 | Quebra/Checkout 40%

Iniciou Checkout: 27

Métricas laterais: Custo/Checkout R$ 37,04 | Quebra/Compra 59,26%

Compras: 11 (Este número reflete o número no card "Resultado" de mensagens, mas no funil e-commerce é tratado como compra).

Métricas laterais finais: Custo/Compra R$ 90,91

Lógica de Programação necessária (Back-end/Frontend Math): O sistema deve ser capaz de calcular automaticamente a % de perda (quebra) dividindo o valor da etapa inferior pela etapa superior. O custo é calculado dividindo o "Investimento Total" pelo número de ações daquela etapa.

3.6. Gráficos de Composição (Coluna Direita Superior)
Dois gráficos menores para análise qualitativa.

Gráfico 1: Demográficos

Tipo: Donut Chart (Gráfico de Rosca).

Cores: Amarelo e Roxo.

Centro do donut exibe um ícone (ex: silhuetas de pessoas).

Legenda lateral interativa.

Gráfico 2: Funil de Vídeo (Retenção)

Tipo: Donut Chart (Amarelo e Roxo) com ícone de "Play" no centro.

Barra de Progresso abaixo do gráfico mostrando a retenção por quartis:

VV 25% | VV 50% | VV 75% | VV 100% (Video Views).

3.7. Tabela de "Criativos Destaques" (Coluna Direita Inferior)
Uma tabela com barra de rolagem (scroll) interna.

Objetivo: Mostrar o desempenho visual de anúncios específicos.

Colunas:

Criativo (Imagem): Renderiza o thumbnail real da imagem/vídeo do anúncio (ex: foto de Papai Noel, caixa de presente). Isso exige conexão com a API da Meta/Google para puxar a URL da mídia.

Compras: Valor inteiro absoluto.

Custo por Compra (CPA): Valor monetário.

CTR: Porcentagem.

Ordenação: A tabela parece estar ordenada por volume de compras ou menor CPA por padrão.

3.8. Tabelas Inferiores (Scroll down no dashboard)
Abaixo dos widgets principais, há seções de dados tabulares mais granulares.

Tabela 1: Visão Geral (Esquerda)

Lista o desempenho das campanhas.

Colunas visíveis: Campanha, Impressões, Leads, Custo por Lead, CTR.

Tabela 2: Rastreio de UTMs (Direita/Centro)

Funcionalidade Crítica: Permite ver exatamente de qual anúncio veio a venda usando as tags UTM da URL.

Design da Tabela: Estilo "Accordion" (linhas expansíveis com ícone de seta >).

Colunas:

Conteúdo do anúncio manual da sessão: Exibe a string UTM complexa (ex: AD11++[REELS]+[M]++Depoimento+Júnior+[V1]). O backend precisa capturar e limpar essas UTMs.

Sessões: Tráfego recebido.

Compras: Vendas atribuídas àquela UTM.

Finalizações de compra: Checkouts iniciados.

Receita de compra: Valor financeiro gerado pela UTM.

Rodapé da Tabela: Linha de "Total Geral" (Grand Total) somando as colunas.

4. Requisitos Não-Funcionais e Integrações Implícitas
Para que este layout funcione conforme o vídeo:

Múltiplas Contas & Integração de API: O sistema precisa de autenticação OAuth com Meta Ads API e Google Ads API (citados no vídeo), além de ferramentas de Analytics (como Google Analytics 4) para o rastreio de UTMs e Page Views (já que o Facebook/Google sozinhos perdem dados no iOS14+).

Versão Mobile: Mencionada no vídeo (aparece um celular na mesa). O layout grid deve ser quebrado em coluna única flex-direction: column para mobile, priorizando: Filtros > KPIs > Funil > Gráficos > Tabelas.

Atualização de Dados: Sendo "Automática", requer rotinas (CRON jobs ou Webhooks) para buscar dados atualizados das plataformas de ads em intervalos regulares.

(Nota ao programador: Comece a estruturação usando CSS Grid para o esqueleto principal e Flexbox para os componentes internos dos cards. O componente do funil pode ser construído usando SVGs dinâmicos ou divs clip-path em CSS combinado com uma biblioteca de visualização de dados como Recharts, Chart.js ou D3.js para os gráficos radiais e de linha).
___

Plataforma/Gestor 2:
___
Com base na análise detalhada do vídeo, elaboramos a documentação técnica desta segunda plataforma.

**Ponto de Atenção Crucial para os Desenvolvedores:** O próprio narrador do vídeo revela a arquitetura do sistema: **trata-se de um dashboard construído no Looker Studio (antigo Google Data Studio), que foi incorporado (via iframe/embed) dentro de um painel do ClickUp.**

Portanto, a UI/UX observada possui duas "camadas": o sistema hospedeiro (ClickUp) e o dashboard de dados propriamente dito (Looker Studio). A documentação abaixo detalha como replicar essa interface do zero em uma aplicação própria.

---

# Documentação de Especificação: Dashboard Meta Ads (Estilo Looker Studio)

## 1. Visão Geral de Design e Tema (UI)

* **Estilo Visual:** Design focado em "Dark Mode" com tons de azul profundo, lembrando interfaces de painéis de controle de dados analíticos.
* **Paleta de Cores (Dashboard):**
* **Fundo Principal do Dashboard:** Azul marinho muito escuro (ex: `#0F172A` ou `#1E293B`).
* **Fundo dos Cards (Superfícies):** Azul um pouco mais claro que o fundo para criar relevo (ex: `#1E2235` com leve transparência ou bordas sutis).
* **Cores de Destaque (Gráficos e Indicadores):**
* Ciano/Azul Claro (para funil e gráficos de linha primários).
* Verde Neon (para indicadores de crescimento positivo/lucro).
* Rosa/Magenta (para gráficos secundários, como o ROAS).
* Vermelho (para indicadores de queda/prejuízo).


* **Texto:** Branco para dados principais; cinza claro/azulado para rótulos e eixos.



---

## 2. Estrutura de Layout (Camadas)

### 2.1. O Container Externo (Inspirado no ClickUp)

Se o objetivo for recriar a plataforma inteira (e não apenas o dashboard), o layout externo possui:

* **Sidebar Esquerda (Navegação Global):** Fundo cinza escuro/preto. Contém itens de menu agrupados por espaços de trabalho (ex: "Favoritos", "Operacional", "CRM", "Marketing"). O item "Marketing" está expandido e ativo.
* **Header Superior (Navegação de Contexto):** Exibe o Breadcrumb (`Marketing > Marketing > Visualização`) e um menu de abas em formato de pílulas: `Lista`, `Quadro`, `Dash Meta Ads` (Aba Ativa) e `Visualização`.

### 2.2. A Área do Dashboard (Área Útil)

O conteúdo interno (o relatório em si) possui sua própria navegação lateral estreita e uma área principal de visualização de dados (Grid).

---

## 3. Detalhamento de Componentes (Aba "Visão Geral")

A primeira tela exibida possui uma estrutura robusta de análise geral da conta.

### 3.1. Navegação Interna do Relatório (Esquerda)

Um mini-menu lateral azul escuro contendo três botões/ícones para alternar as páginas do próprio relatório:

1. **Visão Geral** (Ativo - Ícone de gráfico de barras).
2. **Detalhamento** (Ícone de documento com lupa).
3. **Mobile** (Ícone de celular).

### 3.2. KPIs Superiores (Cards de Destaque)

Uma linha horizontal com 5 blocos (cards) mostrando as métricas financeiras cruciais. Cada card possui um título, o valor absoluto e um indicador de tendência (variação percentual com seta).

* **Investimento:** R$ 1.122,86 (Tendência de queda em vermelho, ex: `↓ -64.7%`).
* **Faturamento:** R$ 3.556,00 (Tendência de alta em verde, ex: `↑ 36.8%`).
* **Compras:** 19 (Tendência de alta em verde).
* **ROAS Médio:** 3,17 (Tendência de alta em verde).
* **Custo por Compra (CPA):** R$ 59,10 (Tendência de queda em verde, pois CPA menor é positivo, ex: `↓ -75.8%`).

### 3.3. Funil de Tráfego (Centro-Esquerda)

Uma representação gráfica de um funil em formato 3D (vários discos empilhados formando um cone azul claro a escuro).

* **Dados no centro do funil (descendo):**
1. `Cliques: 294`
2. `Page Views: 9`
3. `Checkouts: 97`
4. `Compras: 19`


* **Métricas de Conversão (À direita do funil):** Exibe as taxas entre as etapas.
* `Taxa de Cliques: 0,61%`
* `Connect Rate: 3,06%`
* `Taxa de Checkout: 1.077,78%` *(Nota para o dev: Este número no vídeo parece um erro de configuração de métrica no Looker Studio do usuário, mas o campo de texto deve existir)*.
* `Taxa de Compra: 19,59%`.


* **Métricas de Apoio (Acima e abaixo das taxas):** Cards menores mostrando `Checkouts Iniciados (97)` e `Custo por Checkout (R$ 11,58)`.

### 3.4. Gráficos de Linha/Área (Direita)

Gráficos que mostram o desempenho ao longo do tempo (Eixo X = Datas como `6 de out. de 2025`).

* **Gráfico 1 (Faturamento vs Compras):** Gráfico de área preenchida. A linha verde exibe o volume com um pico no centro do período selecionado.
* **Gráfico 2 (ROAS / Compras):** Outro gráfico de área, em cor azul ou magenta, exibindo a curva de desempenho isolada.

### 3.5. Gráfico de Rosca (Direita, Centro)

* **Título:** "Melhores Anúncios (Conversões)".
* **Visual:** Donut chart fatiado, exibindo a representatividade de cada anúncio no total de conversões (ex: fatias de 42.1%, 31.6%, 10.5%).
* **Legenda Lateral:** Uma lista colorida com o nome das UTMs/Nomes dos anúncios (ex: `AD - dancinha`, `AD 02 - Dudu`).

### 3.6. Tabela de Performance Analítica (Rodapé)

Uma tabela horizontal extensa listando os dados granulares por linha.

* **Colunas Identificadas:** `Campanhas` | `Conjuntos` | `Anúncios` | `Investimento` | `Custo por Compra` | `Compras`.
* **UX da Tabela:** Possui uma barra azul clara marcando o fundo do item selecionado/em hover. O layout é denso, estilo planilha.

---

## 4. Detalhamento de Componentes (Aba "Detalhamento Geral")

Quando o usuário clica em "Detalhamento" no menu interno (aos 0:45 do vídeo), a tela muda para métricas focadas em criativos e demografia.

### 4.1. Gráficos de Velocímetro (Gauge Charts)

Localizados no canto superior esquerdo, medem metas percentuais.

* **Taxa de Conversão:** Arco verde marcando o progresso, valor em destaque no centro (ex: `3,6%`).
* **Conversão de Checkout:** Outro velocímetro, valor no centro (ex: `16,88%`).

### 4.2. Gráficos Demográficos (Parte Superior Direita)

Gráficos de rosca simples.

* **Gênero:** Fatias azuis separando `male`, `female`, `unknown`.
* **Faixa Etária:** Fatias detalhando a idade (ex: `25-34`, `35-44`).

### 4.3. Galeria de Criativos / Anúncios Thumbnail (Base da tela)

Uma funcionalidade muito visual para analisar peças de anúncio.

* **Estrutura:** Um grid ou tabela horizontal contendo imagens reais dos vídeos/imagens rodando nos anúncios da Meta.
* **Títulos das Colunas (por Imagem):** Exibe o nome do anúncio acima da imagem (ex: `AD - dancinha`, `AD 02 - Dudu`).
* **Métricas embutidas:** Abaixo de cada thumbnail de vídeo/imagem, há linhas exibindo os resultados exatos daquele criativo: `Impressões`, `Compras`, etc. (ex: O criativo "dancinha" tem 25.422 impressões e 4 compras).
* **Tabela de Região:** Logo ao lado dos criativos, uma tabela simples listando `Região` (ex: Mato Grosso) e `Alcance` (ex: 50.652).

---

## 5. Requisitos Lógicos e Integrações para o Back-end

Para o programador construir a funcionalidade por trás dessa interface:

1. **Sincronização em Tempo Real (Real-time Data):** O usuário enfatiza que o sistema mostra dados *em tempo real* (ou o mais próximo disso). Isso exige integrações robustas (API Graph do Facebook / Meta Business Manager) rodando rotinas de atualização contínuas.
2. **Renderização de Mídia (Thumbnails):** Para a galeria de anúncios, o sistema precisa capturar a `image_url` ou `video_thumbnail_url` direto da API de criativos da Meta e renderizá-las no front-end.
3. **Estruturação de Embeds (Opcional):** Se o objetivo for criar a plataforma hospedeira, será necessário desenvolver um sistema de *iFrames* flexível que aceite links do Looker Studio, PowerBI ou Metabase de forma segura, permitindo que a agência apenas "cole" o link do relatório para seus clientes verem dentro do sistema logado.
___

Plataforma 3:
___
Com base na análise minuciosa frame a frame deste terceiro vídeo, elaboramos a documentação técnica detalhada desta plataforma ("Command Center").

Esta ferramenta possui uma proposta de valor diferente das anteriores: ela atua como um ERP/Hub centralizado (All-in-One) focado em criadores de conteúdo e agências, integrando finanças, tráfego pago, análise de concorrência, inteligência de conteúdo (AI) e produtividade.

---

# Documentação de Especificação: "Command Center" (All-in-One Dashboard)

## 1. Visão Geral de Design e Tema (UI)

* **Estilo Visual:** Design "Dark Mode" moderno e sofisticado, com forte apelo visual de "ferramenta de Inteligência Artificial". O layout é fluido e utiliza painéis com cantos arredondados.
* **Paleta de Cores:**
* **Fundo Principal:** Azul noturno muito escuro/Quase preto (ex: `#0B0C10`).
* **Cor Primária (Destaque e Interatividade):** Roxo vibrante/Violeta (ex: `#6B46C1` ou `#8B5CF6`). Usado em botões principais, abas ativas, e gráficos.
* **Cores Secundárias:** Azul elétrico e gradientes (misturando roxo e azul) para preenchimento de gráficos de área/barra.
* **Alertas/Status:** Vermelho (para tarefas atrasadas), Verde (para indicativos de "LIVE" ou sucesso).
* **Tipografia:** Sans-serif limpa (estilo Inter ou SF Pro). Textos principais em branco sólido, subtítulos e rótulos de dados em cinza médio (`#9CA3AF`).



---

## 2. Estrutura de Navegação Global (Sidebar Esquerda)

A barra lateral é fixa e atua como o menu principal de todos os módulos do negócio. Está dividida em categorias (labels em caixa alta e fonte menor):

* **Logo:** "TEN FOLD MARKETING" (com ícone gráfico à esquerda).
* **MAIN**
* `Overview` (Visão Geral)


* **$ REVENUE**
* `Financials` (Finanças)


* **CONTENT**
* `Hook Intelligence` (Inteligência de Ganchos)
* `Competitor` (Concorrentes)
* `Content` (Conteúdo Próprio)
* `Hooks` (Ganchos Salvos)


* **PRODUCTIVITY**
* `Tasks` (Tarefas - com badge numérico de notificações, ex: "1")
* `Calendar` (Calendário)
* `Email` (Caixa de Entrada)


* **MARKETING**
* `Facebook Ads` (Tráfego Pago)


* **PUBLISHING**
* `Schedule` (Agendamento de Posts)


* **Ações de Base:** `Settings` (Configurações).

---

## 3. Detalhamento de Módulos e Funcionalidades (Telas)

### 3.1. Tela Inicial: Overview (Visão Geral)

O painel de entrada que consolida o status diário da operação.

* **Header:** Saudação personalizada ("Good afternoon, Marc") com um badge verde indicando status de conexão: `🟢 LIVE`. Data atual à direita (ex: Tuesday, April 21, 2026).
* **KPIs Superiores (4 Cards):**
1. `REVENUE THIS MONTH`: Valor financeiro em destaque (ex: `$2.0K`) com meta/progresso abaixo (`$964 net`).
2. `AD SPEND TODAY`: Gasto diário (ex: `$0.39`).
3. Card numérico genérico (ex: `20`).
4. Card numérico genérico (ex: `0`).


* **Quick Actions (Botões de Ação Rápida):** Abaixo dos KPIs, botões delineados: `+ New Task` e `📅 Schedule Post`.
* **Gráfico Principal:** `REVENUE TREND` (Últimos 30 dias). Gráfico de linha roxa suavizada com preenchimento gradiente na base.
* **Painéis Secundários (Metade inferior da tela):**
* `RECENT PAYMENTS`: Lista de transações recentes (Nome do cliente, descrição do serviço, valor pago).
* `UPCOMING EVENTS`: Lista de próximos compromissos da agenda.
* `TASKS ASSIGNED TO YOU`: Lista rápida de afazeres.



### 3.2. Módulo $ REVENUE: Financials

Focado na integração com gateways de pagamento (explicitado como Stripe).

* **KPIs de Destaque:**
* `TOTAL REVENUE`: Receita do mês atual.
* `MRR`: Receita Mensal Recorrente.


* **Gráfico "Revenue":** Gráfico de barras largas (com gradiente vibrante) mostrando o faturamento do período selecionado.
* **Tabela "Transactions":** Lista detalhada de histórico financeiro.

### 3.3. Módulo MARKETING: Facebook Ads

* **Filtros de Data (Estilo "Pills"):** `Yesterday`, `Today`, `Last 7 Days` (Ativo - botão fica roxo), `Last 30 Days`, `Last 90 Days`.
* **KPIs Gerais da Conta:** `TOTAL SPEND` ($) e `CPM` ($ + volume de impressões).
* **Lista "TOP ADS":** Exibe o ranqueamento dos melhores criativos.
* **Visualização:** Thumbnail do vídeo do anúncio à esquerda.
* **Dados:** Nome interno do anúncio (ex: `adcopy1_video4911`), `Spend` (Gasto), `CPL` (Custo por Lead), `CTR` (%), e `Impressions`.



### 3.4. Módulo CONTENT: Análise e "Hook Intelligence"

Este é um diferencial da plataforma (focado em vídeos curtos e engenharia reversa de conteúdo).

* **Aba Competitor (Conteúdo de Terceiros):**
* Filtros de ordenação: `Recent`, `Views`, `Likes`, `Shares`.
* Visualização em Grid de cards verticais (formato Reels/Shorts).
* Cada card exibe: Thumbnail do vídeo, nome do criador (ex: `@cooper.simson`), e contagem de views em destaque (ex: `218.0K VIEWS`).


* **Aba Content (Seus Posts):** Similar à visão de concorrentes, mas mostrando a performance das próprias postagens, incluindo mini-gráficos de barras abaixo de cada vídeo mostrando retenção ou engajamento.
* **Tela Hook Intelligence (Ganchos Virais):**
* **Header:** "Proven viral hooks from your niche - templated and ready to use."
* **KPIs:** `TOTAL HOOKS` (101), `TEMPLATES` (27), `YOUR HOOKS` (16).
* **Filtros de Organização:** `Templates`, `All Hooks`, `By Creator`.
* **Filtros de Dados:** `Views`, `Outlier Ratio` (Métrica exclusiva de performance relativa), `Recent`, `All Types`.
* **Lista de Ganchos (Accordion):** Exibe frases em formato de texto. Quando o usuário clica em um gancho (ex: `"This [PERSON/ENTITY] used [TOOL] to commit..."`), a linha se expande para mostrar os dados da postagem original que usou aquele gancho (Views, Caption original e botão "View original post").



### 3.5. Módulo PRODUCTIVITY: Email, Calendar & Tasks

Integrado diretamente com contas do usuário.

* **Email:** Lista padrão de caixa de entrada (Semelhante ao layout do Gmail escuro), exibindo Remetente, Assunto truncado e data/hora.
* **Calendar (Calendário):**
* Visualização em lista cronológica (Today, Wednesday, Thursday...).
* **UX Crítica (Painel "Quick Create"):** Um painel lateral "slide-out" (Drawer) abre à direita para criar um evento sem sair da tela.
* **Campos do formulário:** `Title`, `Date` (com datepicker), `Start` time, `End` time, `Description` (campo de texto livre), `Invite people` (input de e-mail). Botão primário roxo `Create Event`.




* **Tasks (Tarefas):**
* Layout Kanban simples ou em colunas verticais largas (`TO DO`, `IN PROGRESS`).
* Cards de tarefas contêm: Título, Tag de categoria (ex: `Content` com cor específica), e status de prazo (ex: tag vermelha dizendo `19d overdue`).



### 3.6. Módulo PUBLISHING: Schedule Post

* **UX Principal:** Abre como um grande Modal/Popup centralizado sobrepondo a tela atual.
* **Funcionalidades de agendamento:**
1. **Preview de Mídia:** Exibe o nome do arquivo (ex: `Edits_160...mp4`) e um botão `Regenerate` (provavelmente conectado a IA para regravar/editar).
2. **Caption:** Área de texto para escrever a legenda.
3. **Seletor de Plataformas (Toggles):** Botões para ativar o envio simultâneo para `Instagram`, `TikTok`, `YouTube` e `Facebook`. As plataformas ativas ficam coloridas com suas respectivas cores de marca.
4. **Campos Específicos por Plataforma:** Se YouTube estiver selecionado, aparece um campo extra condicional: `YouTube Shorts Title`.
5. **Agendamento:** Inputs nativos de `DATE` e `TIME`.
6. **CTA (Call to Action):** Botão primário longo e roxo detalhando a ação (ex: `Schedule to 4 platforms`).



---

## 4. Requisitos Sistêmicos e Lógicos (Back-end)

Para que os desenvolvedores construam esta aplicação, as seguintes infraestruturas de sistema serão necessárias:

1. **Integrações Universais via API:** A plataforma não é apenas de leitura, mas de *ação*. Exigirá autenticação bidirecional com:
* *Stripe/Gateways* (Leitura de dados financeiros).
* *Meta/Facebook Ads API* (Leitura de anúncios).
* *Google Workspace / Outlook* (Leitura e gravação de Emails e Calendário).
* *Redes Sociais (Graph API, YouTube Data API, TikTok API)* (Para publicação e coleta de dados analíticos de concorrentes).


2. **Web Scraping / Data Mining Inteligente:** O módulo de "Hook Intelligence" e "Competitors" exige um motor no back-end que varra plataformas de vídeos curtos, extraia transcrições (Speech-to-Text), analise o volume de visualizações e classifique os vídeos como "Outliers" para sugerir templates aos usuários.
3. **Sistema de Agendamento (CRON):** Um microserviço dedicado para disparar os vídeos agendados nos horários definidos pelo usuário para múltiplas redes sociais simultaneamente.
___


E abaixo segue também mais uma perspectiva nessa linha de produção e construção de BIs e Dashboards com código e Claude para tráfego pago. É copiado e colado de um site (https://castilhoia.com/blog/como-criar-dashboard-de-conteudo-com-claude-code):
___
Como Criar um Dashboard de Conteúdo com Claude Code
20 de março de 2025
10 min de leitura
Neste artigo


01
Antes de Começar

02
Etapa 1 — Estrutura Inicial

03
Etapa 2 — Gestor de Instagram

04
Etapa 3 — Analytics

05
Etapa 4 — Calendário de Conteúdo

06
Etapa 5 — Rastreador de Concorrentes

07
Etapa 6 — Consolidador de Notícias

08
Como Usar da Forma Certa
Se você trabalha com conteúdo, marketing ou operação, um dashboard bem feito pode te ajudar a visualizar tudo em um só lugar: ideias, posts agendados, métricas, calendário, concorrentes e notícias do nicho.

Com o Claude Code, dá para construir esse sistema de forma incremental — um módulo por vez, validando cada etapa antes de avançar para a próxima. Este guia organiza essa jornada em 6 etapas com prompts prontos para copiar.

Antes de Começar
O que você vai precisar
→
Claude Code instalado e configurado
→
Um novo projeto criado do zero
→
Next.js como framework base
→
Tailwind CSS para estilos
→
shadcn/ui para componentes prontos
Como usar este guia
Não mande todos os prompts de uma vez. O ideal é seguir a ordem: estrutura, módulos, refinamentos. Envie um prompt, valide o resultado e só depois avance para a próxima etapa.

Cada etapa é independente. Construir por partes garante que você entenda o que foi criado, consiga ajustar o visual e mantenha o código organizado ao longo do projeto.

Etapa 1 — Estrutura Inicial do Projeto
Esse é o passo zero. Sem uma base bem configurada, as próximas etapas tendem a ficar inconsistentes. Abra um novo projeto no Claude Code e envie este prompt:
´´´
Você está criando um dashboard de gestão de conteúdo.

Use Next.js, Tailwind CSS e shadcn/ui para os componentes.

Configure a estrutura inicial do projeto com as seguintes seções:
- Gestor de Instagram
- Analytics
- Calendário de Conteúdo
- Rastreador de Concorrentes
- Consolidador de Notícias

Use tema escuro globalmente em toda a aplicação.

Crie páginas iniciais placeholder para cada seção, com uma
navegação lateral compartilhada entre elas.

Quando a estrutura inicial estiver pronta, crie também um arquivo
CLAUDE.md documentando:
- a stack utilizada
- a estrutura de pastas
- os padrões de componentes
- e qualquer decisão importante tomada durante a configuração inicial
´´´
Esse prompt cria a base completa: estrutura, menu lateral, páginas iniciais e o arquivo CLAUDE.md que vai servir como memória do projeto para todas as próximas sessões.

Etapa 2 — Gestor de Instagram
Depois que a estrutura estiver pronta, é hora de montar o primeiro módulo funcional — o painel de gestão de posts.
´´´
Crie um dashboard de gestão de conteúdo para Instagram.

Ele deve exibir:
- posts agendados
- rascunhos
- conteúdos publicados
- backlog de ideias

Inclua a possibilidade de adicionar novas ideias de posts com:
- legenda
- tipo de post
- status
- data de agendamento

Use uma interface escura, limpa e moderna, com layout baseado em cards.
´´´
Essa área funciona como um painel operacional de conteúdo. Após a primeira versão, você pode pedir refinamentos como filtros por status, busca por legenda e tags por formato (Reel, Carrossel, Story).

Etapa 3 — Dashboard de Analytics
´´´
Crie uma página de analytics com gráficos de barras e gráficos
de linha mostrando métricas de performance de conteúdo das minhas
redes sociais.

Use o Metricool como fonte de dados.

Inclua:
- total de impressões
- taxa de engajamento
- crescimento de seguidores
- posts com melhor desempenho

Use tema escuro e inclua um seletor de datas.
´´´
Mesmo sem integração real ainda, essa etapa monta toda a estrutura visual do dashboard. Você pode conectar os dados reais depois — o importante agora é ter o painel funcionando visualmente.

Quer um sistema como este funcionando na sua operação?

A Castilho IA cria dashboards e automações sob medida para escalar marketing e conteúdo sem contratar mais pessoas.

Falar com especialista
Etapa 4 — Calendário de Conteúdo
´´´
Crie uma página de calendário de conteúdo que exiba posts
agendados e posts já publicados em uma visualização mensal.

Cada dia deve poder conter múltiplos conteúdos exibidos como
chips coloridos.

Inclua filtros por plataforma, como Instagram, YouTube e outras.

Use uma interface escura, limpa e organizada.
´´´
Essa etapa transforma o dashboard em algo muito mais visual. Com o calendário mensal, você consegue ver a distribuição de posts, identificar dias vazios e planejar melhor a frequência de publicação.

Etapa 5 — Rastreador de Concorrentes
´´´
Crie um dashboard de rastreamento de concorrentes.

Ele deve permitir adicionar perfis, usuários ou canais de
concorrentes e exibir:
- posts recentes
- engajamento
- frequência de postagem
- tendências de crescimento

Deve acompanhar esses concorrentes em múltiplas redes sociais.

Puxe dados publicamente disponíveis e apresente tudo em uma
tabela ordenável com tema escuro.
´´´
Esse módulo adiciona inteligência estratégica ao dashboard. Ele deixa de ser só operacional e passa a ser também analítico — o que impressiona muito quando bem executado visualmente.

Etapa 6 — Consolidador de Notícias
´´´
Crie um consolidador de notícias que agregue as últimas notícias
sobre [SEU NICHO] a partir de feeds RSS.

Exiba:
- manchete
- fonte
- data de publicação
- pequeno resumo

Adicione filtros por tópico, como:
- ferramentas
- pesquisa
- negócios

Use uma interface limpa, com cards em tema escuro.
´´´
Substitua [SEU NICHO] pelo seu mercado: inteligência artificial, marketing digital, creator economy, saúde, imobiliário etc.

Com as 6 etapas concluídas, o dashboard já tem cara de produto real. O que transforma um bom dashboard em algo verdadeiramente impressionante são os prompts de refinamento visual abaixo.

Como Usar da Forma Certa
As 6 etapas acima montam a estrutura. Os prompts abaixo são para quando você quiser elevar o nível visual do projeto inteiro.

Visual premium
´´´
Agora refine todo o dashboard para deixá-lo mais premium,
moderno e visualmente impressionante.

Quero um visual de software de alto nível, com:
- melhor hierarquia visual
- espaçamentos mais elegantes
- cards mais refinados
- melhor uso de contraste
- gráficos mais bonitos
- tabelas mais limpas
- aparência geral de produto SaaS premium

Mantenha o tema escuro e preserve a estrutura já criada.
´´´
Consistência da UI
´´´
Revise todo o projeto e padronize:
- espaçamentos
- tamanhos de fonte
- bordas e sombras
- cores e botões
- badges, tabelas e cards
- formulários

Quero consistência visual em toda a aplicação,
mantendo tema escuro e aparência moderna.
´´´
Dados fictícios para apresentação
´´´
Adicione dados fictícios realistas em todas as páginas para que
o dashboard fique visualmente completo e pronto para apresentação.

Os dados devem parecer reais, coerentes e bem distribuídos
entre as seções.
´´´
O que você vai ter ao final

Estrutura Inicial

Navegação lateral, páginas placeholder e CLAUDE.md para manter consistência em todo o projeto.

Gestor de Instagram

Posts agendados, rascunhos, publicados e backlog de ideias em cards visuais organizados.

Dashboard de Analytics

KPIs, gráficos de barras e linha, seletor de datas e posts com melhor desempenho.

Calendário de Conteúdo

Visualização mensal com chips coloridos por plataforma, filtros e status dos posts.

Rastreador de Concorrentes

Tabela ordenável com engajamento, frequência de postagem e tendências de crescimento.

Consolidador de Notícias

Feeds RSS filtrados por tópico para identificar tendências e gerar ideias de conteúdo.

Checklist para não errar

Envie um prompt por etapa — nunca todos de uma vez
Valide o resultado visualmente antes de avançar para a próxima etapa
Peça refinamentos após cada etapa (espaçamento, contraste, cards)
Use o CLAUDE.md como memória e consistência do projeto
Adicione dados fictícios realistas para apresentação
Priorize impacto visual antes de integrar dados reais
Rode o prompt extra de consistência para padronizar toda a UI
___

Olha também como esse post de blog (que foi encaminhando para mim a partir do direct do Insta - que foi de comentar em um post) se interliga com parte da conversa/contexto do Kelvin Cleto sobre estratégias de atrair leads e é um funil...
Não sei como aproveitar ainda esse conhecimento ou deixar registrado... 
Mas achei válido levantar esse ponto.