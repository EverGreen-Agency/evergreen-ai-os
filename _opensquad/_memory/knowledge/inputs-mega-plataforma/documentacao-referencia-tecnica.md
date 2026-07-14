Eu:
___
https://www.youtube.com/watch?v=bUt1WpDlI6E&pp=ugUEEgJlbg%3D%3D
https://www.youtube.com/watch?v=i0VOpLIv5g8&pp=ugUHEgVwdC1CUg%3D%3D
https://www.youtube.com/watch?v=JPqf8kTin_4&pp=ygUIY2hhdHdvb3Q%3D
https://www.youtube.com/watch?v=m-f56P_L660&t=48s
https://www.youtube.com/watch?v=0o0ZVy0qvZo&pp=ygUQY3JtIGNvbSB3aGF0c2FwcNIHCQlOCwGHKiGM7w%3D%3D
Tem um vídeo ai que é especificamente sobre cuidados até para se tomar. Seja bem detalhado para eu adicionar de contexto para meu time de devs e para uma IA onde ela irá fazer diversas ressalvas. Se você conseguir apenas trazer elevados nível de aprofundamento e tamanho de resposta retornando um artefato/docs, pode fazer assim!

Eu passei isso para minha IA e devs:
___
Não sei se consegue pesquisar mas cada dia surgem mais criadores de conteúdos, vídeos no youtube mostrando como se fosse coisa de outro mundo como “crie seu próprio CRM com whatsapp…”. Por que ficarmos de fora… quando todos fazem a mesma coisa, que é usar IA para programar!

Vou anexar esses vídeos e contextos deles para você entender. Entender como eles fazem, e para entender como é simples. As vezes, que nem o Kelvin, fazem até na duração do vídeo (menos de 1h).

Outra coisa que eu queria que você analisasse como possibilidade de absorção e uso (ou reaproveitamento) são justamente os projetos opensource, como o chatwoot, e a possibilidade de usa-los ou modifica-los.

Também penso em deixarmos disponíveis (talvez na parte de recursos gratuítos) alguns exemplos de sites lindos e de alta qualidade. Já fizemos um bem legal para a ElectROM, o nosso próprio mas tava pensando em um de e-commerce de alto padrão/luxo. Assim teriamos um site de serviços (b2b), outro de engenharia/indústria e outro de varejo como referência. Não sei se deixa até baixável. Mas todos sites que conseguimos fazer, e cada vez também estão sendo até mais acelerados com IA também, assim como vou lhe entregar no contexto. Mas também vou lhe trazer o nível que é possível entregar.
Muitos estão integrando Claude (code ou normal) com o higgsfield e fazendo sites muito imersivos com animações 3D, rolagens dinâmicas… vou pedir para o gemini analizar a imagem para você ver/entender!
O que você acha? Acha válido? 
___

Que estou fazendo agora contigo é justamente lhe enviando esses vídeos e você irá retornar todo o contexto para eles.
Não quero que responda o que passei para os devs, mas que entregue os contextos para eles me responderem e referências (esses vídeos ou outros).

Os arquivos em vídeo eu lhe envio depois para você extrair só a parte gráfica dos sites que mostram os vídeos (são dois dos que lhe enviei acima)
___


Gemini:
___
# Documentação de Referência Técnica: Arquitetura, Segurança e Soluções Growth

Este documento consolida as referências técnicas, operacionais e de segurança exigidas para o desenvolvimento de soluções web, CRMs e plataformas imersivas. O material a seguir serve como base de conhecimento estrita para a equipe de desenvolvimento e agentes de IA, com o objetivo de alinhar as entregas aos altos padrões de um modelo boutique e às diretrizes de Growth Business da agência.

---

## 1. Segurança da Informação em Códigos Gerados por IA (Prioridade Crítica)
**Referência base:** *Hackeando site criado por IA na prática (Geraldo Alcantara)*

O uso de IA (como Cursor, Claude Code, Lovable) para acelerar a geração de SaaS e MVPs exige uma **Definição de Pronto (DoD) rigorosa** voltada à segurança. Soluções de IA focam na funcionalidade e, frequentemente, negligenciam proteções básicas, deixando os sistemas expostos a ataques de escalada de privilégio. A IA responsável pela revisão de código da equipe deverá usar os tópicos abaixo como heurística mandatória.

### 1.1 Vulnerabilidades Críticas e Vetores de Ataque Identificados
A cadeia de exploração demonstrada no material expõe falhas severas que comprometem a aplicação em menos de 10 minutos:

1. **Exposição de Arquivos de Ambiente (`.env`):**
   * **O ataque:** Ferramentas automatizadas de varredura (como o *Dirsearch*) encontram diretórios ocultos e expõem o arquivo `.env` publicamente.
   * **Impacto:** Vazamento de chaves da Stripe, chaves secretas (Secret Keys), credenciais de banco de dados e usuários de teste deixados hardcoded em produção.

2. **Insecure Direct Object Reference (IDOR):**
   * **O ataque:** A aplicação confia no ID fornecido pelo front-end sem validação de autorização. O atacante acessa a URL de seu próprio pedido (ex: `/pedido/7`) e altera sequencialmente na URL (ex: `/pedido/1`).
   * **Impacto:** Acesso a dados sensíveis de outros clientes, incluindo e-mails, endereços de entrega e tokens de download de produtos digitais.

3. **Account Takeover (ATO) via Exposição de Chaves de Integração:**
   * **O ataque:** No painel de perfil (`/profile`), o sistema retorna uma "chave de integração" usada para requisições em uma rota `POST /api/login`. Através de um novo IDOR (alterando o ID do perfil na URL), o atacante obtém a chave de integração de outros usuários. Utilizando o *Intruder* do Burp Suite, é possível realizar uma enumeração (ex: IDs de 1 a 15) buscando na resposta o parâmetro `"role": "admin"`.
   * **Impacto:** Ao identificar o ID do Administrador, o atacante extrai a sua chave de integração e a envia ao `/api/login`, sequestrando a sessão administrativa e recebendo o cookie de Admin.

4. **Remote Code Execution (RCE) via Uploads Não Validados:**
   * **O ataque:** Com acesso ao painel de plugins/admin, o atacante utiliza uma função de upload de arquivos que valida a extensão/MIME type apenas no front-end. O atacante faz o upload de um plugin malicioso (script executável).
   * **Impacto:** O script é executado no servidor (RCE), abrindo um terminal remoto onde comandos como `ls`, `pwd` e `cat /etc/passwd` são executados. O servidor inteiro é comprometido.

### 1.2 Diretrizes de Mitigação (DoD de Segurança Obrigatório)
Nenhum código gerado pode ser movido para produção sem cumprir integralmente as ressalvas abaixo:
* **Isolamento de Arquivos:** Bloquear no servidor web o acesso público a qualquer arquivo ou diretório iniciado com ponto (ex: `.env`, `.git`). Utilizar o arquivo `.gitignore` religiosamente a partir do commit zero.
* **Validação Transacional de Identidade (Zero Trust):** O back-end nunca deve confiar cegamente no ID do recurso enviado na requisição (URL ou Body). É obrigatório cruzar e validar se o usuário autenticado na sessão ativa (cookie/token) tem permissão de leitura/escrita sobre aquele recurso em específico.
* **Sanitização de Uploads:** Todo upload deve possuir validação severa de MIME type e extensão diretamente no back-end. Os arquivos devem ser salvos fora de diretórios públicos ou de execução (preferencialmente em buckets isolados como S3/Supabase Storage) e a execução dinâmica de arquivos enviados pelo usuário deve ser estritamente bloqueada.
* **Processos CI/CD e Revisão:** A IA auxiliar deve revisar cada Pull Request visando especificamente falhas do top 10 da OWASP. Devem ser implementadas varreduras de análise estática e dinâmica (ex: OWASP ZAP) em ambientes de homologação.

---

## 2. Soluções e Ecossistema Open-Source (CRM e Multicanal)
A construção de infraestrutura de aquisição, qualificação e suporte via WhatsApp através do uso inteligente de plataformas baseadas em código aberto, visando eliminar custos recorrentes com plataformas terceiras.

### 2.1 CRM de WhatsApp Baseado em Node.js e API Oficial da Meta
**Referência base:** *CRM para WhatsApp Gratuito e Open-Source (Thalena Lima)*

* **Arquitetura Técnica:** Aplicação Node.js conectada a um banco de dados PostgreSQL (hospedado no Supabase), consumindo diretamente a API Oficial do WhatsApp (Meta). Deploy projetado para plataformas que suportam web apps em Node.js.
* **Configuração da Infraestrutura:** Envolve o fork do repositório base, instalação de dependências locais (npm) e edição do `.env` com as chaves e URL do Supabase. A estruturação do banco de dados depende da execução dos comandos SQL pré-configurados no repositório.
* **Gestão da API Oficial:** A aplicação recebe e envia requisições através de um Webhook configurado no portal do desenvolvedor da Meta. Uma chave extra gerada no `.env` é utilizada para criptografar o token de acesso do WhatsApp antes de ser salvo no banco, garantindo que o token não vaze em caso de dump do banco de dados.
* **Recursos Absorvíveis:** Possibilidade de rodar Live Chat, pipelines de vendas com estágios customizáveis, disparo de templates aprovados, e a estruturação de fluxos automatizados ativados pelo recebimento de mensagens.

### 2.2 Plataforma Omnichannel Chatwoot (Novidades 2026)
**Referência base:** *O Que Mudou no Chatwoot em 2026 (Astra Online)*

* **Arquitetura de Deploy:** O sistema open-source é homologado preferencialmente no Ubuntu 22.04 utilizando Docker Swarm (via Portainer) exigindo PostgreSQL v16+ (com a extensão *pgvector*) e Redis.
* **Customização White-Label:** Evitar o mapeamento direto de volumes da pasta `public` devido a instabilidades recentes. O modelo maduro de personalização das logomarcas, favicons e e-mails transacionais (HTML) exige a criação de um arquivo `Dockerfile` customizado que realize o *build* de uma nova imagem docker a partir do código fonte original (`public/brand_essence`).
* **Novas Ferramentas de Automação:**
  * **Fluxos Nativos:** Novas automações permitem resolver tickets automaticamente baseando-se em tempos de ociosidade, enviar mensagens baseadas no volume da fila ou designar retornos diretamente para o último agente que tratou o atendimento.
  * **Distribuição:** Adoção de políticas granulares de distribuição, podendo ser baseada na lógica *Round-robin* (rodízio igualitário) ou em *Capacidade Operacional* restrita por agente.
  * **Agente IA (Captain):** Integração aprimorada de IA nativa, permitindo não apenas a leitura de PDFs, mas também a invocação de ferramentas (*Tools* / *API Calls*), permitindo que a IA dentro do Chatwoot busque dados de sistemas externos (ex: 2ª via de faturas) sem depender do n8n para queries simples.

---

## 3. Interfaces Web Cinematográficas (Desenvolvimento de Alto Padrão)
**Referências base:** *This AI Agent Builds $15K Cinematic Websites (Jay E)* / *Claude Fable 5 Built a $10K Website (Zubair Trabzada)*

A construção de interfaces premium, que transmitem alto padrão e sofisticação (substituindo a dependência excessiva em WordPress/templates genéricos) utilizando pipelines orquestrados por IA.

* **Stack e Ferramentas:** Utilização de agentes de desenvolvimento autônomos (Claude Code local ou Claude Fable 5) integrados ao protocolo **MCP (Model Context Protocol)**. O MCP conecta o ambiente de programação diretamente a agregadores de modelos (como o Higgsfield ou APIs do Google), acionando LLMs multimodais para interface.
* **Fluxo de Trabalho de Geração (Codificação com IA):**
  1. O agente de codificação avalia a identidade da marca, extraindo ou deduzindo paletas de cores, topografia e copy.
  2. Aciona modelos de imagem (ex: NanoBanana Pro, GP2) para criar cenas fotorrealistas ou tridimensionais do produto.
  3. Aciona modelos de *Image-to-Video* (ex: Kling v3, Cance 2.0) enviando a imagem gerada e os prompts de animação (zoom, explosão de elementos, estabilização) via API.
  4. **Componentização (O "Efeito Cinematográfico"):** O agente extrai os frames do vídeo gerado e constrói em HTML/CSS/React a lógica de *scroll-bound animation* (amarrando o avanço e retrocesso dos frames à posição do scroll do mouse do usuário). Isso confere um visual pesado em detalhes 3D e renderizações premium, mantendo a performance e o aspecto responsivo no navegador.
  5. Acopla bibliotecas cinemáticas complementares para elementos gráficos (textos cinéticos, efeitos de glitch, *SVG draws*) e encerra realizando o deploy contínuo na Vercel de forma autônoma.
___

Eu:
___
Segue um dos vídeos (do Jay E) em arquivo. analise frame a frame. Foque em specs e detalhamento de funcionalidades. Foque no que é visível! Quero que você analise esse vídeo frame a frame e crie toda uma descrição bem detalhada de funcionalidades e campos, ui/ux para que um programador possa entender como replicar a plataforma e dashboard só pelo texto! Não precisa definir stacks. Não deixe detalhes de fora. Melhor ficar a mais do que faltando! 
Veja se vai precisar alterar ou acrescentar no documento.
___

Gemini:
___
O vídeo apresenta a criação autônoma de múltiplos sites cinematográficos utilizando um agente de IA operando via Claude Code com a integração (skill) "Cinematic Sites".

Como o objetivo é detalhar as funcionalidades visuais, interações e layouts gerados pelo agente (especialmente para replicação por desenvolvedores), realizei uma análise estrutural e de UI/UX baseada nos frames apresentados. A ferramenta em si atua como um construtor, mas os sites gerados compartilham um framework arquitetural muito claro focado em animações atreladas ao scroll (*scroll-driven animations*).

Abaixo está o detalhamento completo frame a frame (focado nos layouts e componentes visuais) estruturado para o seu time de desenvolvimento:

### 1. Painel de Controle (Console da Plataforma Rubric)

A interface usada pelo narrador (Jay E) para operar o agente possui as seguintes características de UI:

* **Menu Lateral (Sidebar):** Fundo escuro (Dark Mode). Contém ícones indicando o status de diferentes agentes (Robo, Devo, Eddo, Bizo, Como, Asto) com tags como "Idle" (Ocioso). Há links para "Framework" (Sprint, Docs, Timeline, Q2 Revenue, Projects, Generations, Backlog).
* **Área Principal (Canvas de Fluxo):** Exibe um fluxograma (Flow) que ilustra o processo do agente de forma visual. O título "RUBRIC Flows - The command center for AI agents" no topo.
* **Fluxograma:** 4 etapas circulares conectadas por linhas de progresso verdes (quando concluídas). As etapas são:
* **Step 1:** Brand Analysis (Análise de Marca)
* **Step 2:** Scene Generation (Geração de Cenários)
* **Step 3:** Website Build (Construção do Site)
* **Step 4:** Deploy to Vercel (Publicação no Vercel)


* **Painel Direito (Detalhes do Agente):** Mostra os detalhes do "Agent Kit" selecionado: *Cinematic Sites*. Há uma descrição da tarefa ("Transform any website into a cinematic experience...") e as *skills* (habilidades) incluídas mapeadas para os passos do fluxograma.
* **Interface de Chat (Terminal do Agente):** Uma janela sobreposta imitando um terminal/chat onde o usuário interage via texto com o agente (Robo). O agente reporta o status em tempo real de cada passo, exibindo extração de paletas de cores em HEX, descrições de imagens geradas (com o tempo levado - ex: "takes 2-3 min"), e links gerados (ex: links da Vercel). O usuário também pode usar botões de ação rápida no chat, como aprovar a direção de arte antes de prosseguir.
* **Aba "Generations" (Estúdio de Fluxo):** Um painel em formato de grade (grid) exibindo cartões com as imagens e vídeos gerados pelos modelos de IA (Nano Banana, Kling). Possui filtros no topo: "All, Images, Videos, Generations, References, Demo, All Models". Ao passar o mouse sobre o vídeo, a UI permite copiar o caminho (Path copied!) ou fazer o download.

---

### 2. Padrões de UI/UX dos Sites Gerados (O "Framework Cinematic Sites")

Todos os sites gerados pelo agente (Ichiraku, Verace Pizzeria, Room Craft, Baked by Melissa, Compartes, Aurum, Byredo, etc.) compartilham uma fundação técnica focada em manipulação de scroll.

#### 2.1. O Efeito de Hero Cinematográfico (Scroll-driven Video)

Esta é a funcionalidade principal que deve ser replicada.

* **Comportamento:** O fundo da seção inicial (Hero) não é apenas uma imagem ou vídeo rodando em loop. É um vídeo em que os frames avançam ou retrocedem de acordo com a posição do scroll do mouse do usuário.
* **Especificação Técnica Apresentada (Código Extraído):** A lógica utiliza a biblioteca de animação **GSAP (GreenSock Animation Platform)** combinada com um `canvas` HTML5. O código (`Skill.md`) especifica: `HERO -> Scroll-driven canvas, sticky inner, Jpeg frame sequence via gsap.to + snap`.
* **Visual:** O usuário rola para baixo e a ação do vídeo ocorre quadro a quadro. Ex: O caldo de ramen é derramado na tigela, a cama salta de dentro de uma caixa, um frasco de perfume explode em flores douradas.
* **Camada de Texto:** O título principal e a CTA (Call to Action) ficam ancorados ("Sticky") no centro da tela sobrepostos ao vídeo enquanto a animação do scroll acontece.

#### 2.2. Card de Aprovação de Marca (Brand Card)

Antes de construir o site final, o agente gera um painel estático para aprovação visual.

* **Layout:** Fundo preto. Tipografia limpa.
* **Paleta de Cores:** Exibida como uma linha de blocos coloridos (swatches). Cada bloco possui o nome do uso (Background, Card, Accent, Secondary, Text, Muted, Border) e o código HEX abaixo.
* **Tipografia:** Exibe a hierarquia de fontes, muitas vezes mesclando a fonte principal com caracteres da temática (ex: caracteres japoneses).
* **Key Copy:** Campos para Headline (Título), Tagline, e CTAs sugeridos.
* **Theme Direction:** Um parágrafo resumindo a "vibe" do site (ex: dark, warm, moody lighting).

#### 2.3. Os Módulos Cinematográficos (Seções de Conteúdo Interativas)

Além do Hero em scroll, os sites exibem componentes modulares na descida da página (as seções "About", "Menu", "Features"). Estes componentes integram o pacote referenciado no vídeo como "31 cinematic modules". Os principais exibidos em ação são:

* **Accordion Image Slider (O Menu de Pizzas / Menu de Ramen):**
* **Vertical/Horizontal Variant:** Uma galeria de painéis ou tiras estreitas (slices).
* **Interação (Hover):** Ao passar o mouse (hover) sobre uma fatia, o painel se expande suavemente (ease curve), revelando a imagem completa do prato e, na parte inferior (ou lateral), o título, preço e a descrição detalhada do item. Os outros painéis se comprimem proporcionalmente para dar espaço.


* **Kinetic Marquee (Texto em movimento):** Uma faixa que cruza a tela horizontalmente (como um letreiro digital contínuo) com texto. Ele "acelera" (Scroll to accelerate) conforme o usuário rola a página.
* **Glitch / Channel Split:** Um efeito de hover (mouse sobre) em um texto grande (Heading) onde o texto se divide em canais RGB (vermelho, verde, azul), criando um efeito de distorção digital momentânea.
* **SVG Draw (Animação de Flor e Trilhas):**
* **Efeito:** Conforme o usuário rola a página (scroll), uma linha vetorial (Stroke) é desenhada na tela, moldando gradualmente uma forma (como o contorno de uma flor simples ou um caminho serpenteante).


* **Cursor Shift / Image Trails:** Em uma tela interativa, o cursor do mouse se transforma em fotografias dos produtos conforme o usuário se move (um rastro de imagens que seguem a posição do cursor).
* **Sticky Stack (Seção de Processos/Features):**
* **Efeito de "Cartas de Baralho":** Cartões de conteúdo (Step 01, Step 02, etc.) que rolam de baixo para cima. Quando o primeiro cartão chega ao topo da tela, ele fica ancorado (sticky). O próximo cartão desliza e se sobrepõe ligeiramente a ele (como se fossem páginas grossas caindo umas sobre as outras), acumulando na tela.


* **Split Screen (Tela Dividida):** A tela divide-se na vertical. Um lado fica fixo com texto descritivo e no outro lado as imagens rolam com base no scroll.

### 3. Exemplo Prático de UI - O Site do Ramen (Ichiraku)

Para que os desenvolvedores tenham um modelo prático do site final gerado no vídeo:

* **Navegação (Header):** Simples, transparente, no topo direito (Menu, Our Story, Visit). Um logo/branding no topo esquerdo com texto temático sutil vertical na lateral.
* **Seção Hero (100vh):** Fundo escuro (Dark theme). Vídeo com frames em canvas manipulado por scroll. Um camarão caindo no caldo enquanto a fumaça sobe. Texto central: "The Art of Ramen", um subtítulo "SLOW-SIMMERED SINCE 1987", e um botão sólido vermelho "EXPLORE THE MENU".
* **Seção "Our Story" (Transição de Conteúdo):** O fundo rola revelando o texto "Our Story" escrito em tipografia elegante (Serifa), centralizado. Há uma faixa de navegação de texto estilo Marquee sutil (ingredientes rolando em japonês). O botão de Menu rola suavemente para baixo via script.
* **Seção "The Menu" (Componente Accordion):** Fundo preto com 4 painéis de Imagem (Tonkotsu Classic, Spicy Miso, Ebi Shio, Bubble Tea). Quando nada está em foco (hover), as 4 imagens são mostradas parcialmente. Quando o usuário para o mouse sobre a primeira imagem, ela expande, exibindo a foto do prato inteiro e trazendo o texto do título, preço e descrição para o primeiro plano, encolhendo as outras três abas.
* **Seção "Visit / Footer":** Layout em 3 colunas simples com ícones vermelhos em vetor para o Endereço (Address), Horários (Hours) e Telefone (Phone). Botão retangular largo "RESERVE A TABLE". Rodapé inferior simples com direitos autorais.

**Conclusão para os Programadores:**
Se eles desejam replicar essa estrutura, eles devem focar em combinar bibliotecas de manipulação de scroll e manipulação de classes CSS (como **GSAP**, incluindo o plugin *ScrollTrigger*). O truque central de UX nestes sites B2B/Varejo é ancorar o tempo do vídeo HTML ou sequências de JPG ao evento de Scroll da página, mantendo os painéis de conteúdo de texto "Sticky" na tela durante a animação principal.

A documentação atual não requer alteração de base de segurança, apenas a adição destas lógicas estruturais ao repositório de UX do time! O que acha?
____

Eu:
___
Segue o outro vídeo.
___

Gemini:
___
Excelente! Analisei o vídeo fornecido detalhadamente, dissecando frame a frame as interfaces geradas pela IA. O que vemos nos exemplos é o uso massivo de **Scroll-Bound Animations** (animações ancoradas na rolagem do mouse), onde o usuário não apenas lê a página, mas "controla" a linha do tempo de um vídeo 3D renderizado em segundo plano.

Preparei este adendo ao documento anterior. Ele foi formatado com especificações visuais, comportamentais (UX) e estrutura de campos para que seus desenvolvedores front-end possam replicar a lógica exata de cada um dos três arquétipos (Varejo de Luxo, Serviços B2B e Indústria/Engenharia).

Aqui está o complemento para a sua documentação:

---

# Anexo Visual: Arquitetura de UI/UX Imersiva (Referências Cinematográficas)

Este documento destrincha as especificações de interface e experiência de usuário (UI/UX) focadas em páginas de alta conversão e imersão 3D. As referências abandonam o layout estático tradicional em favor de narrativas visuais guiadas pelo scroll (Scroll-Telling).

## Arquétipo 1: Varejo de Luxo / E-commerce de Alto Padrão

**Referência do Vídeo:** *Aurum & Noir (Marca de Relógios)*
**Objetivo:** Transmitir exclusividade, foco cirúrgico nos detalhes do produto e engenharia fina.

### 1. Identidade Visual e Tematização

* **Background:** Preto profundo/Cinza chumbo constante, com efeito sutil de partículas flutuantes (poeira dourada) movendo-se lentamente para dar profundidade.
* **Tipografia:** * Títulos e Destaques: Fonte serifada clássica, de alto contraste.
* Números e Especificações: Fonte *sans-serif* limpa, geométrica, com espaçamento amplo (*letter-spacing*).


* **Cores:** Fundo escuro texturizado com fontes brancas/cinzas claras e botões/detalhes em dourado metálico.

### 2. UX & Interatividade (Mecânica Principal)

* **Efeito Explode/Implode (Scroll-Bound):** O componente principal da tela é uma renderização 3D do produto. Conforme o usuário faz o scroll para baixo, o produto "desmonta", separando suas peças (engrenagens, vidro, pulseira) na tela para mostrar a parte interna. Ao continuar o scroll, a câmera entra nas engrenagens girando.
* **Fade-in Assíncrono:** Os blocos de texto não sobem com a tela; eles surgem em *fade-in* sobre o fundo dinâmico em momentos exatos do scroll, fixando-se (*sticky*) temporariamente antes de sumirem em *fade-out*.

### 3. Estrutura de Campos e Componentes

* **Header (Sticky):** Menu minimalista superior com âncoras ("01 - PROVENANCE", "02 - THE DIAL", "03 - ENGINEERING", "04 - EDITION").
* **Seção de Especificações Técnicas (Top Bar Grid):** Uma barra horizontal com dados diretos do produto:
* `[Tamanho]` (Ex: 42 mm) + Subtítulo (Grade-5 Titanium)
* `[Duração]` (Ex: 72 h) + Subtítulo (Power Reserve)
* `[Quantidade]` (Ex: 217) + Subtítulo (Components)
* `[Resistência]` (Ex: 30 m) + Subtítulo (Water Resistance)


* **Seção "The Dial" / Engenharia:** Textos curtos laterais flutuantes com manchetes (Ex: "The tourbillon breathes", "Engraved by hand").

---

## Arquétipo 2: Serviços B2B / Portfólio de Agência

**Referência do Vídeo:** *Zubair Trabzada (Portfólio Pessoal / Ferramentas AI)*
**Objetivo:** Gerar autoridade imediata, provar capacidade de entrega (Social Proof) e guiar para conversão (Comunidade/Contato).

### 1. Identidade Visual e Tematização

* **Background:** Escuro, mas iluminado dinamicamente com luzes de estúdio quentes (âmbar, laranja e vermelho neon), criando uma atmosfera "Cyberpunk elegante".
* **Tipografia:** Letras em *All-Caps* (maiúsculas) gigantes, muito grossas (Bold/Black), preenchendo quase toda a largura da tela. Algumas fontes vazadas (apenas o contorno/stroke).

### 2. UX & Interatividade (Mecânica Principal)

* **Camadas em Profundidade (Z-Index):** A imagem recortada do profissional ou do time fica no centro da tela. A tipografia gigante com o nome da agência ou pessoa passa *por trás* do sujeito, gerando uma forte sensação de 3D.
* **Hover Effects em Cards:** Elementos de portfólio reagem quando o mouse passa por cima, com leve expansão (scale) ou iluminação das bordas.

### 3. Estrutura de Campos e Componentes

* **Hero Section:** * Título Gigante (Nome/Marca) vazado ou sólido.
* Foto do sujeito/produto centralizada.
* Subtítulo descritivo em itálico abaixo: *"I build & sell AI tools..."*.


* **Barra de Estatísticas (The Numbers):** Grid contendo blocos numéricos grandiosos em cor contrastante (ex: Vermelho), seguidos da métrica:
* `[Métrica 1]` (Ex: 136K+) -> Label: YouTube Subscribers
* `[Métrica 2]` (Ex: 6.5M+) -> Label: Views
* `[Métrica 3]` (Ex: 199) -> Label: Skills/Projetos Entregues


* **Seção de "Proof of Work" (Portfólio):** Grid de cards contendo:
* Thumbnail/Vídeo de fundo reproduzindo em loop.
* Título do Case (Ex: "CITEVUE").
* Parágrafo descritivo em fonte pequena.


* **Call to Action (CTA) Extremo:** Tela limpa, com uma pergunta provocativa gigante em duas fontes diferentes ("WANT TOOLS LIKE THESE **FOR YOUR BUSINESS?**"). Dois botões primários lado a lado (Ex: "JOIN THE COMMUNITY" / "WATCH ON YOUTUBE").

---

## Arquétipo 3: Indústria / Engenharia de Produto (Saas/Hardware)

**Referência do Vídeo:** *Abyssal (Mergulho e Exploração Submarina)*
**Objetivo:** Storytelling técnico, progressão de ambiente e demonstração de atributos de engenharia pesada.

### 1. Identidade Visual e Tematização

* **Background:** Vídeo contínuo que sofre uma transição gradual e programada de cor. Começa na superfície do oceano (Azul claro/luz do sol) e escurece conforme a rolagem avança, até chegar ao preto total absoluto.
* **Tipografia:** Fontes mono-espaçadas ou sans-serif técnicas, que remetem a painéis de instrumentos, radares ou terminais de dados.

### 2. UX & Interatividade (Mecânica Principal)

* **Veículo/Hardware Fixo:** O maquinário principal (um submarino no exemplo) fica centralizado e fixo na tela. É o fundo que se move para cima, criando a ilusão de que a máquina está descendo ou avançando.
* **Iluminação Dinâmica e Elementos Secundários:** Animações são acionadas em marcos específicos do scroll. (Ex: Ao chegar na área escura, os faróis da máquina se acendem iluminando o cenário 3D. Criaturas biológicas passam pela tela).
* **Marcador de Progresso (Sticky Side-Tracker):** O grande diferencial de UX. Uma régua vertical na margem direita da tela acompanha o usuário do topo ao fundo da página, mostrando dados dinâmicos: `0000m`, `0200m`, `1000m`, `4000m`.

### 3. Estrutura de Campos e Componentes

* **Hero Section:** Título provocativo grande ("HOW DEEP WILL YOU GO?"), máquina em repouso.
* **Seções de História Guiada por Dados (Data-Storytelling):** Conforme o marcador lateral avança, surgem textos descritivos relacionados àquele estágio:
* `[Marco 200m]:` "At 200 meters, 99% of sunlight is gone."
* `[Marco 1000m]:` "At 1,000 meters, pressure is 100x the surface."
* `[Marco Fundo]:` "Fewer people have stood here than have walked on the moon."


* **Blueprint / Especificações Técnicas do Maquinário (The Vessel):** A câmera para e a interface desenha linhas conectando partes da imagem a textos técnicos:
* Linha apontando para o casco: "Titanium Personnel Sphere (90mm wall / 8 occupants)".
* Painel numérico tipo Dashboard com specs críticos do hardware:
* `[Capacidade 1]` (4,000) -> Label: M DEPTH RATING
* `[Capacidade 2]` (96H) -> Label: LIFE SUPPORT
* `[Capacidade 3]` (12KW) -> Label: FLIGHT ARRAY




* **Tela Final (Pricing e Urgência):** Dados diretos para gerar ação B2B/High-ticket.
* `8 SEATS.`
* `$250,000.`
* `DEPARTING MARCH 2027.`
* Botão primário: "REQUEST A SEAT / MANIFEST".
___