# **Objetivo Principal e Contexto Inicial**

Quero teu auxílio pra gente fazer uma mega plataforma (Não decidi ainda um nome apropriado para esse projeto), um sistema  (e aqui não se limita a um mesmo projeto mas ao conceito da interconectividade de aplicações e tecnologias e da nossa arquitetura e dos processo manuais e automáticos, humanos e não humanos) pra EverGreen. Segue em anexo um documento de proposta que já foi inicialmente até especificado algumas stacks, tecnologias, requisitos técnicos, regras de negócios, specs, para o projeto de um lead, que era criar uma plataforma para agência dele. Junto segue também resumo e transcrição da reunião. O nome desse anexos são Proposta\_EverGreen\_HM\_Conexoes\_Poderosas\_v3.pdf e Reuniao-HM\_Conexoes.md, respectivamente.  
Uma dúvida, eu anexando e comendando aqui o arquivo em pdf, você consegue analisar as imagens que a gente colocou das tela dentro do documento? Foram telas esquematizadas para o projeto dele.  
A agência dele é focada em social media e LinkedIn.   
A nossa plataforma é mais ampla, como você tem o contexto da EverGreen. O projeto do cliente não prosseguiu pra frente, mas esses documentos servirão bastante de base para esse nosso projeto. Essas necessidades dele, são também necessidades nossas.

# **Estrutura de Retenção e Modelo White Label**

É uma necessidade de realmente criar uma estrutura, uma infra que até prenda o cliente. Algumas agências fazem isso: elas pegam o GoHighLevel, que é um white label, implementam a marca delas e jogam pra os seus clientes. Além de ser “crucial” nos nossos projetos, na parte da Conversão (um dos nossos pilares de análise do score), nos dando mais controle sobre o projeto e resultado, também prendem o cliente na estrutura, assim o cliente não quer sair da consultoria, e se sair, ainda não vai querer ter todo trabalho de migrar para outra plataforma, e assim podemos cobrar o CRM/plataforma a parte.   
Eu quero fazer isso pra gente.  
Segue aí o contexto do Kelvin Cleto (em Gemini-analise-kelvin-cleto.md), ele tá montando também uma plataforma similar a isso e todo um modelo de negócio em volta disso, que também segue o contexto dele em anexo.  
Se baseie nele. Também quero implementar, nem que seja por fora, essa estratégia dele de negócio. Tanto as fontes de renda quanto de leads/clientes. Mas podemos deixar para focar depois, só focar agora no que vai demandar planejamento da nossa infraestrutura e backoffice.

# **Planejamento e Fases de Implementação**

Então basicamente eu vou jogar um monte de ideias e citar as necessidades hoje da EG e de clientes (e até minhas pessoais) e módulos que a gente precisa integrar aqui na plataforma. Daí depois a gente tem que desenhar as specs de cada um, e acho interessante até separar em fase 1, fase 2, fase n de implementação.   
Acho válido também a gente fazer aqui um ICE score, uma organização e orientação por prioridade de implementação.   
E após finalizar tudo, documentação, ADRs, SDD, planejamento, TUDO… a gente gera novas ideias e sugestões.  
Vou também ir listando e dando contexto de o que temos (por exemplo, usar plataforma Prisma BI para…) pois não sei até onde você vai ter esse raciocínio e pesquisar. Mas quero tente, fazer as pesquisas.   
Depois que finalizarmos e formos para fase de implementação e programação, vou jogar no modelo do Fable 5 e ainda com comandos para dividir em sub agentes. 

# **Refatoração do Site e Backoffice**

Vou falar de várias necessidades, não necessariamente elas estão na ordem de prioridade. Mas, por exemplo, a gente tem uma necessidade de refatorar o site da EverGreen. Como você vai perceber até nesse relatório que eu vou te entregar que a gente fez, e talvez depois a gente possa comentar e refinar melhor essas necessidades de refatoração do site, mas você vai notar por exemplo que tem uma página de cases. Eu gostaria que isso fosse já inteligente e interligado pela parte interna, pelo backoffice da plataforma, onde a gente faz a gestão dos clientes. Então em vez de toda hora eu ter que ficar indo lá no CMS, lá no WordPress criando um case novo, seria talvez já até mais interessante ele já tá integrado com nosso backoffice. De quando eu fizer um, talvez um onboarding de um cliente, ele já puxa isso.  
Notei que no site tem muito Evergreen (com o “g” minúsculo). Tem que ser EverGreen igual nosso logo.  
A análise/auditoria que o claude code (screping) fez do site está como [auditoriaevergreenseogeo.md](http://auditoriaevergreenseogeo.md). Veja se ajuda na refatoração. Tem um arquivo de auditoria dentro do repo do site mas ele é uma auditoria prévia. Um screping puro.

## **Estruturação de Cases e Interligação de Dados**

Uma ideia que eu tive aqui para o site também, que nem eu estou fazendo para um cliente. A gente está separando cases de clientes. Por exemplo, estou fazendo um site para esse cliente de engenharia (ElectROM) e ele tem mais de um projeto, mais de um case por cliente. O mesmo cliente fez com ele uma usina/projeto fotovoltaico e ele também fez dois projetos elétricos de restaurantes. Então, até onde vale a pena a gente estar fazendo isso? Não vale a pena a gente fazer isso também pro nosso? E daí talvez criar como se fosse interligações que nem tem no Obsidian, onde tem correlação as notas, como que a gente poderia fazer isso? Vale a pena ou não?  
E também tem um mapa nesse site que fizemos para a ElectRom. Mapa de clientes ja atendidos. Acho que seria legal adicionarmos no nosso.  
Esse cliente na verdade é o meu pai, a empresa dele, tô dando uma ajudada nele, porque é o que eu faço. No futuro, quando se tornar realmente um negócio e deixar de ser uma eu-empresa, vai ser minha empresa também e vai entrar como uma das empresas da Quark.

## **Subdomínio de POCs**

Já atrelado a essa ideia de refatoração, foi criado, e você tem isso na sua memória, um subdomínio que é poc.evergreen.com.br que serve pra gente basicamente rotear pequenas POCs, pequenos HTMLs, páginas estáticas que a gente envia junto da proposta para os clientes de, de projeto e site. Pra eles terem uma ideia melhor e aumentar a percepção de valor.  
No subdomínio em questão, não tem nada, então ele meio que tá pelado. Se alguém navegar pra ele ou apagar o prefixo, que por exemplo clienteX.poc, se ele apagar esse prefixo e ir só ir direto pro poc.evergreen não vai ter nada. Entende? Então talvez eu tava pensando em também já integrar isso junto a outra área do nosso site (EG Lab) que é justamente a área de projetos que foram feitos. Não chega a ser talvez cases, (considero cases só cliente fechado), mas POCs e projetos, pode servir para os clientes/leads terem talvez até uma noção do que que a EverGreen faz ao vistar nosso site, né? Não sei se isso vai entrar na refatoração do site ou não. Digo como que devemos pensar no poc.evergreen… e nesse EG Labs…  
A gente vai eliminar muita coisa que tava em ideação e coisas que não valem mais a pena estarem expostas, mas isso tem que entrar no planejamento acho. Pois acredito que a Mega plataforma está altamente interligada com a refatoração do site.

## **Escopo e Evolução do BPO (Business Process Outsourcing)**

A parte de BPO que a gente tinha criado, o EG-OS que tá no site, era realmente pra tentar atrair pra esses serviços de chatbot de atendimento, DRE automático, automação n8n… que acelerassem as PMEs. Na verdade, estávamos mirando nem no nosso ICP ainda, era um estágio anterior. Era para os MEIs e empresas começarem a entender a gente como uma validação, pra depois que tiverem estrutura, já escolher a gente como infraestrutura, como a escolha óbvia. Era mais um gancho pras nossas ofertas. Eu acho que também seja importante você rodar o squad de vigilância interna dos nossos documentos-core pra analisar essa parte também de negócios quando for fazer as validações e tudo mais. Basicamente o braço de BPO era isso. Não sei se a gente continua ou não.

# **Documentação e Refinamento**

Eu com certeza vou repetir muita coisa dos documentos que eu te enviei, até a proposta pra a HM Conexões, até realmente dentro dessa sessão... Mas qualquer dúvida, qualquer buraco em lógica ou qualquer contradição que possa ser feita, você tem que vir, questionar e a gente decidir junto.

# **Módulos de Gestão, Financeiro e Jurídico**

A gente precisa criar, módulos financeiros, módulo de gestão de clientes, isso integrado com as ferramentas que a gente tem. Você tem acesso às ferramentas e o nosso banco de stack e arquitetura interna, de projetos que já foram feitos e ferramentas que a gente usa em paralelo. É válido você fazer o questionamento e pontuações de até que ponto a gente faz essas implementações. Por exemplo, vale a pena a gente criar um módulo de CRM se a gente já usa o Kommo? E se a gente revende o Kommo? Até que ponto? Nessa mesma linha, é pensar e pesquisar também outras ferramentas para revendermos, (e comparar com produzir interno com todos os demais critérios comentados ao longo desse documento) e ver sefazemos isso invés de implementar, mas sinceramente prefiro implementar e cobrar o nossos preços. Mas um exemplo, quase que não vale a pena, é uma conta de ManyChat (posso estar muito desatualizado mas ainda parece ser a melhor ferramenta para automação nos post do insta, principalmente para desenhar funis de interação no post e iscas digitais \- topos de funil \- estratégia que até vai aparecer aqui nessa conversa), que podemos também “revender” ou hospedar ou como a que tem a opção….  
Um squad financeiro integrado também pros nossos planejamentos e também cobrança dos clientes. Não sei até que ponto vale a pena integrar realmente os bancos e as plataformas que a gente tem, e ter um squad contábil pra emissão direta das nossas das notas fiscais e uma vigilância realmente da nossa situação cadastral e contábil mesmo e tributarista.

Outro módulo também é a gestão de pagamentos e ERP. Não sei como faríamos a gestão disso. Emissão de notas, a parte contábil em si que comentei. Estou quase jogando aqui todas as minhas necessidades, mas meio que tudo se interliga a todo o resto. Um princípio meu, uma coisa se interliga a todo o resto.

## **Módulo Financeiro e Viabilidade**

Detalhe do módulo financeiro que pensei. Quero também ter uma parte de viabilidade, de planejamento, de metas, de forecasting.  
Vou te encaminhar uma planilha financeira (Planilha-Orcamentaria.xlsx) minha de uso pessoal que uso. Não sei como você vai interpretar ela, se é por imagem, se você vai escovar bit dela e entender as funções, ou se vai analisar o que tem em cada célula, se você vai tirar a formatação das células... Não sei como você vai interpretar (Qualquer coisa, pode tirar dúvida comigo de funcionamento dela também), mas tem uma área de metas e de planejamento. Consigo entender se, por exemplo, eu começar a ganhar X e separar dinheiro para isso e aquilo, se eu adicionar mais um custo, entendo qual vai ser o impacto de cada fator e variável. Criei um lugar de planejamento. É quase que um aplicativo inteiro de finanças.

## **Referências de Mercado e Transição**

Tem algumas ferramentas como o Pierre ([https://lp.pierre.finance/](https://lp.pierre.finance/)) ou o Mobills, Minhas Economias, que fazem essa gestão financeira pessoal. Mas eu queria integrar isso a nível corporativo, empresarial.

## **Planejamento Financeiro e Decisões de Infraestrutura**

Não sei se ficou claro, mas voltando um pouco aos módulos financeiros. O motivo pelo qual fiz todo aquele questionamento foi porque, por exemplo, quando quisermos criar a empresa de micro AWS, quanto invisto no servidor? Vai trazer quanto de retorno? Tem a capacidade?  
Precisamos trazer toda uma análise anterior. Talvez métricas, KPIs, travas, Definition of Done…  
Por exemplo, se quero assinar agora uma ferramenta, tem um porquê? A gente absorve essa demanda ou não? Todas essas análises precisavam ser trazidas.

# **Arquitetura LLM e Open Squad**

Também tem a necessidade da gente desvincular ou desengessar do OpenSquad pra a gente poder usar mais frameworks e mais LLMs, né? Porque acredito que a gente consiga um potencial bem maior e um custo e eficiência bem melhor, do que ficar no framework do OpenSquad onde ele basicamente escreve skills e ele se segue de uma forma bem cadenciada cada agente. Meu receio também é que basicamente, prompts e contexto grandes como este, acabem falhando as instruções do squad ou até o fazendo alucinar e sair do comportamento esperado.

# **Dashboards e WhatsApp**

A gente também precisa integrar os dashboards. A gente já teve um início ali, tem um repositório, chamado BIAds (ele está dentro da pasta da EG, pasta pai/mãe onde este projeto evergreen-ai-os está), mapeado também com CodeGraph que teve início na produção dos BIs. O arquiteto precisa identificar isso, mas como eu já falei, não tem como saber se ele iria perceber isso ou não.   
Segue um documento em anexo também de abstrações que fizemos de vídeos e materiais de outras agências e gestores de tráfego pago que fizeram BIs bem interessantes. Tentei incluir nesses documentos ao máximo detalhes de funcionalidades e detalhes gráficos, mas podemos depois ir especificando parta a parte (não só dos BIs mas de todo esse projeto, sistema e plataforma). Está em [abstracao-bi.md](http://abstracao-bi.md)  
Existem empresas grandes como a mLabs que oferecem um plano low-ticket para gerar relatórios quase infinitos na parte de social media. Precisamos incorporar isso principalmente no nosso módulo de social media para a gestão das postagens, algo que já estava descrito na proposta que fizemos para a HM Conexões.  
Não sei se tem a necessidade no momento, mas pensar para o futuro em uma área, pra integrar o WhatsApp (talvez na modalidade de Coexistence) para os nossos clientes. Só se isso trouxer realmente mais dados.   
E também podemos nos posicionar como um provedor de tecnologia do Facebook/Meta. Aquela área do desenvolvedor deles. Mas não sei se isso por si é um diferencial. Ou também como parceiros do whatsapp, tentar entrar dentro do programa deles… que nem o [Assis.co](http://Assis.co). Foi um CRM que entrei em contato uma vez pois um cliente estava interessado neles. E a integração dele se diferenciava de uma coexistence, tanto que nós integramos através de Conectar Dispositivos e só escaneávamos o QR Code, mas ele disseram que não corria riscos de ban ou block por estarem dentro de um programa lá específico do WhatsApp. Pode ser interessante também.

## **Integração Co-existence e Mensalidade de VoIP/Chips**

Tô pensando e acho que talvez vai ter essa necessidade, para integrarmos o coexistence na nossa plataforma (mais o WhatsApp, não exatamente a Coexistance). Mais para um módulo de whatsapp e permitir os clientes integrarem o whatsapp.   
A gente pode pensar em criar talvez um VoIP ou hub de chips e até cobrar uma mensalidade à parte para a gestão de números de WhatsApp pro CRM. O objetivo de ter mais números, mais chips é contra-atacar as mudanças da Meta, da API dela, da Coexistence que toda hora cai e daí quando ela atualiza às vezes dá um bug no Kommo. Às vezes dá um bug no Baileys (motor por trás da Evolution) ou na Evolution API. Pensar em como que a gente poderia fazer uma tecnologia ou pegar o framework/projeto desses caras e a gente alterar com a nossa tecnologia, com as nossas lógicas, pra nossa estrutura e qualidade.

## **Hub de Chips e White Label de Telecom**

Uma outra ideia bem antiga que tive, foi criar uma empresa de telecom porque parece que boa parte da telefonia brasileira não está na mão das grandes corporativas, de TIM, Vivo, Claro, Nextel. Não, tem empresas white label. Então a gente poderia pegar essas empresas e criar uma empresa voltada justamente para marketeiros, Black Hat, nicho Black, e também para Devs, ou focado em apenas um público-alvo. De novo, não pesquisei essa ideia. Mas a gente poderia talvez integrar essa ideia junto à plataforma, como falei, cobrar uma mensalidade e oferece esse roteamento de chips pra não ficar refém da Meta.   
Ou até criar uma empresa a parte des chips, operadora e telecom e integrar diretamente dentro da nossa plataforma da EG na funcionalidade de CRM e afins.

## **Integração com IA e WhatsApp API (Co-piloto e Janela de 24h)**

Não ficar refém da Meta e das suas regrinhas chatas, como a da janela de 24 horas e afins. Não sei, acho isso bem ruim ficar refém dela, principalmente nessa parte de Dev. Eu entendo que ela (e muitas outras empresas com a Apple) também é refém da LGPD e da leis, mas acho que a gente poderia contra-atacar isso de alguma forma.   
A partir de outubro, acho que vão começar também a cobrar a janela de 24 horas, aquelas mensagens gratuitas que a gente conseguia enviar quando o cliente que iniciava. Então eu acho que a gente pode também colocar isso na nossa infra e vai ser quase que uma empresa de tecnologia (na verdade já somos). Então ia ser um baita diferencial.

## **Atualização de Políticas (Meta e Google) e Stacks (Python/Linguagens)**

Como eu já mencionei, para o blog da ElectROM, precisará ter um pesquisador de leis, e políticas Como por exemplo políticas da Meta e Google (e afins), justamente para atualizar os squads também (squad do Meta/ads).  
Ou como quais são as novas políticas de anúncio do Google.  
Ou até de APIs, de ferramenta que a gente tá usando em algum projeto.  
Basicamente aqui já são no mínimo dois tipos de pesquisa.  
Outra vertente, como que a gente encara atualizações de stacks? Por exemplo, o Python tem uma atualização e agora o comportamento de uma lógica de uma função específica parou de funcionar. Como que a gente encara isso, tem que ter uma manutenção nos códigos constantes, tem alguma coisa que a gente pode colocar pra meio que automatizar essas atualizações? Isso seria o CI/CD ou não? Ou até em projeto de cliente, tem uma atualização de alguma API, de alguma stack, de alguma linguagem, algum framework, e para de funcionar. A gente não fica sabendo? Como que a gente contra-ataca essa parte?

# **Certificados**

Eu não sei se é válido uma área de gestão de certificações de funcionários e da da EG em si, por exemplo, certificado do Google, certificado da Meta, de Ads, certificado do Salesforce, do Hubspot.

# **Hub de Clientes** 

Essa área do cliente em si vai ser, o hub pra onde o cartão NFC do kit vai apontar.  
A gente tem que ter também, dentro da área do cliente, a gente tem que ter a função do score.

# **Banco de conhecimento**

Lembrando a necessidade de um banco de conhecimento que consiga entender vídeos, assim como a gente faz no Gemini ou no NotebookLM, seria legal a gente conseguir só jogar o link do YouTube e ele transcrever. A gente queria poder jogar o link do YouTube e ele baixar o vídeo e entender o vídeo. O Gemini ele só interpreta o vídeo e as imagens, frame a, frame, a partir de quando é enviado o vídeo em arquivo  
Queria que não nos limitássemos ao youtube, mas pode fazer isso com o instagram também. Assim como existe página de download de vídeos do youtube e do insta, poder ter isso de forma automática dentro do nosso banco de conhecimento.

Também seria legal se nossa IA/banco de conhecimento tivesse atrelado a parte de banco de cases fracassados. E banco de cases de sucesso. Assim ajustamos melhor nossos planejamentos e afins.

## **Curadoria de Dados e Bases de Conhecimento**

Uma dúvida também agora. Até que ponto vale a pena a gente estar fazendo, por exemplo, armazenar e extrair conhecimento de diversas pessoas.   
Exemplo, quero extrair estratégias de social media. Então eu extraio quanto de outros influenciadores e creators?   
Treinamentos e comunidades, até onde? Porque eu não acho que conhecimento infinito seja a solução. Por exemplo, eu queria talvez, eu não sei até que ponto, o squad fazer scraping de informações e contexto, conhecimento, e daí ele passa: isso aqui vale a pena você pessoalmente assistir. Ou não, isso aqui pode deixar na minha base, ou isso aqui não vale a pena entrar na minha base de conhecimento. Tem todas essas questões que eu queria trazer.

## **Gestão de Contexto e Limites em Modelos de IA**

Por exemplo, eu queria ir criando, quando a gente criar nosso banco de conhecimento, ou o segundo cérebro da EG talvez, ou o segundo cérebro pessoal meu, extrair por exemplo toda uma comunidade no Skool que fala sobre IA ou Hermes Agent, a gente adiciona aqui. Ou não adiciona… esse nível de configuração e aprofundamento técnico devemos entrar.  
Quanto mais conhecimento melhor para os nossos LLMs? Ou não. Porque tem um paradoxo: Contexto demais, ou como que a gente vai saber que falta contexto, buraco nos conhecimentos. Mas não sei se é uma pergunta que agrega muito à nossa conversa aqui.

## **Base de Conhecimento, Clonagem de Mentores e Políticas**

Voltando ao questionamento de até onde vale a pena a gente ficar trazendo conteúdo, montando a nossa base de conhecimento, pegando conhecimento de creators e tudo mais, era mais justamente pensando numa feature de segundo cérebro, para eu clonar o Lucas Félix, o meu mentor. Até onde eu puxo todos os conhecimentos dele, todos os cursos dele, todas as aulas gravadas, eu analiso imagem e transcrição, para então criar o clone dele e integrar esse cérebro e toda essa base de conhecimento, todo esse RAG na nossa estrutura. Ou criar o squad nisso, ou até fazer o questionamento dos nossos princípios e arquiteturas, dos nossos \[squads\]. Aquela autovigilância, o arquiteto, o engenheiro, o \[squad\] de engenheiro. Todo esse questionamento é o que eu queria trazer. Não sei se é o momento ou não, mas acho importante, porque também não sei se é legal e até onde a gente pode, pensando em questão de políticas de privacidade, \[LGPD\], de ética mesmo, baixar esses conteúdos. Porque eu já baixei diversos cursos, baixei todos os vídeos, materiais e separei num \[Drive\]. Eu tenho do \[Alan Nicolas\], do \[Lucas Félix\], do \[Daniel Penin\]. E, por exemplo, não sei se eu disponibilizo no futuro, quando a gente criar um braço de educação e de comunidade que nem o \[Lucas Félix\] e o \[Kelvin\]. Disponibilizar esses cursos para os nossos assinantes dentro das nossas plataformas, nossos seguidores, para os nossos funcionários ou para nós, criar \[clones\] deles dessa base de conhecimento. Ou até um risco que eu quero saber: até onde não está desatualizado o conhecimento, principalmente em inteligência artificial, que cada vez está mudando muito rápido. Era esse questionamento que eu queria levantar.

# **Transição de Módulos para Uso Pessoal**

Alguns questionamentos que eu quero levantar. Você acha que ao eu fazer essa transição, por exemplo, eu querer quando formalizar em parte da plataforma, os módulos, eu querer transferir pro uso pessoal, principalmente a parte do planejamento financeiro, de base de conhecimento, gestão do banco de ideias, de projetos. E por exemplo, quando eu quiser montar o segundo cérebro, que eu tenho um projeto que é um projeto bem quase similar, que tem bastante integração com IA e esses módulos à parte.  
Como que eu faria? Eu pediria por exemplo pro squad arquiteto ou de engenharia, ele separar as pastas e arquivos como se fosse dentro de um repositório dentro desse mesmo, como que você acha que a gente pode fazer? Você acha que eu devo te mandar a minha ideia da plataforma que eu tenho (chamada Fóton)?

# **Projeto Prisma BI**

O Prisma BI, não sei se você vai acessar pelo CodeGraph, mas ele foi uma iniciativa de um projeto que eu tinha, que era basicamente uma plataforma, uma empresa de gerar relatórios automaticamente ou muito rápidos.  
Relatórios bem complexos, bem completos. Como due diligence de influenciador, Auditoria de SEO/GEO, ESG, financeiro e contábil de empresas…  
Essa foi uma ideia bem inicial, está bem prematuraainda. Mas vê, por exemplo, até onde que a gente pode implementar e roubar do que foi programado (acredito que nada) ou se vale a pena avançar nesse modelo de negócio.  
Uma coisa do Prisma BI é que fui pensando no futuro. Vai ter uma holding que vai englobar todas as empresas (batizei de Quark), diversos negócios, diversas frentes. Mas a gente começou com a EG pra ser o motor de crescimento dessa holding futura.  
E na Prisma eu pensei, poderia ser incrível se fosse depois um selo de qualidade de empresas. “Óh, essa empresa foi validada pela Prisma BI”. Criar podcasts altamente sinceros, trazendo pessoas e lacrando elas, derrubando elas se a gente descobrir sujeira. Eu tive essa ideia um pouco quando teve um escândalo de uma empresa de suplementos, a Soldiers Nutrition.  
Seria criar todo um negócio em volta disso, derrubar e trazer realmente diversas verdades à tona que estavam escondidas. Escândalos do Brasil e coisas como essas. Basicamente fazer uma empresa de relatórios e de auditoria nas mais diversas áreas. Mas começando por due diligence de influenciadores.  
Realmente eu não fiz uma análise de negócio, se vale a pena ou não, mas eu não sei se vale a pena a gente comentar isso aqui também. Tô trazendo todo o cenário quase que da EverGreen e demandas e projetos iniciados, não iniciados… 

# **Arquitetura Modular e Reaproveitamento de Código**

Tem que pensar essa parte da estruturação dos módulos, como blocos/peças de Lego mesmo. Como que a gente pode depois, por exemplo, se for implementar para um cliente, ele não vai colocar na nossa estrutura, ele vai colocar na estrutura dele, ou ele nem quer que a gente crie um módulo específico só pra ele dentro do nosso ecossistema, ele quer realmente a estrutura dele, como que a gente reaproveitar os códigos em futuros projetos?  
Como que a gente faria isso de forma inteligente? A gente faz isso com CodeGraph ou é realmente na estruturação da arquitetura, pastas, a forma como vai ser programado o projeto e tudo mais (no planejamento com o squad de engenharia)?

# **Gestão Operacional e Automação de Squads por Cliente**

Uma ideia por exemplo que tive para esse caso da ElectROM, que eu acho que também seria interessante, mas não sei como a gente pode fazer isso, se você ativa como se fosse um serviço, uma funcionalidade para o cliente, mas seria a parte operacional em si no dia a dia. Eu ainda tô pensando como que vai funcionar exatamente.   
Pega esse cenário: Eu quero ativar pra ele uma automação já direto no blog dele, que é criar posts de blogs recorrentes ou já fazer pesquisas de quando sai uma nova lei, uma nova PL no ramo dele, que pode interferir, nos projetos fotovoltaicos, em tributação... Pensar em como que a gente pode ativar os squads e funções e IAs e tecnologias para cada cliente. Então esse cliente a gente ativa uma automação de post de blog. Ativa para outro cliente a parte de criativos, para outro a de post no Instagram e stories.  
Como que a gente vai fazer esse gerenciamento das entregas com os squads e o backoffice?

# **Pesquisa e Desenvolvimento de CMS**

Outro ponto também. Quero fazer uma pesquisa depois de CMS. A gente hoje usa o WordPress, integra dentro do código dos sites que fazemos.   
Mas tinha que pensar algum se não tem um CMS melhor, o Framer ou outra tecnologia de CMS, que tá valendo mais a pena. Ou se a gente também integra ou faz o nosso próprio CMS, já geração e gestão dos posts e blogs dentro dos sites dos clientes e isso também os amarra à nossa estrutura.

# **Radar e Integração de Novas Tecnologias**

Outro ponto interligado a isso. Pesquisa de tecnologia. A gente tem que implementar essa parte pra ficar por dentro das tecnologias que saem. Como um report automático.   
Por exemplo, com Hugging Face, quando, sai uma nova tecnologia ou uma nova LLM, interligar isso talvez com o “There's An AI For That” e outros bancos de tecnologia como o Product Hunt. Podemos integrar isso com o Perflexity, e pesquisa em redit, x e até mesmo de repositórios no github que ganham popularidade, como o Docling. Empresas como a Asimov Academy, outra que me inspiro bastante, faz isso de olhar bibliotecas que estão explodindo e ajudam bastante no desenvolvimento…  
Essa parte de pesquisa irá aparecer muitas vezes e aplicadas a diversos fatores.

## **Validação de APIs**

Pensando no squad de buscas, é importante quando buscar stacks e documentações, ver as possibilidades das APIs, a documentação da API, tudo certinho, se a IA ou MCP está trazendo a documentação calibrada… fazer testes com o Postman previamente, antes de implementar, para ver se está trazendo o response no formato que procuramos e precisamos. Se os dados que está trazendo são realmente os que queremos. Para quando montarmos a parte do squad de proposals, sabermos se está trazendo as propostas corretamente, acessando as plataformas de forma correta.

# **Sistema Multi-tenant e Gestão de Acessos**

Temos que pensar na parte sistemica do multi-tenant. Tanto por exemplo no ambito do uso para a EG, uso realmente da plataforma e aplicativo para gestão da EG, quanto para os demais usos.. Como que a gente vai diferenciar a área de produção da EG e uso interno, para uso com os clientes, para uso realmente de gestão da plataforma em si e das subscrições e o uso de outras agências e os clientes delas. Como que a gente vai fazer para gerir o acesso de todos níveis de usuários. Qual que vai ser o perfil de cliente, vai ser uma pessoa ou CNPJ sempre?   
Temos que planejar bem isso.

# **Infraestrutura, Mobile e Integração de Contratos**

Também quero já fazer um descritivo também da infra em si. Vai ser Railway? Vai ser Vercel? o que que vai sustentar essa aplicação? Pensar também a quantos usuários e requisições por segundo vai ter essa aplicação, pensando em escalabilidade e segurança…  
Quase que temos que fazer um overdesing, um overengeneering do projeto…  
Queria depois a gente vai fazer mobile também.   
E tem que adicionar também ao documento de arquitetura a parte realmente do Autentique, que eu esqueci de comentar, que a gente usa para gestão dos contratos. A gente vai absorver isso também para nós?

## **Hospedagem e Criação de Servidores Próprios**

Voltando um pouco na parte de infra e pensado um pouco no futuro, quando a gente tiver o nosso home lab, nossos próprios servidores, quando a gente tiver uma empresa mais estruturada, que quiser fazer fine-tuning de modelo, ter os nossos próprios modelos rodando localmente, quando o uso de APIs pararem de valer a pena, ou quando aumentar os serviços de hospedagem na nossa estrutura.  
Por exemplo, a gente tem um site de algum cliente que tá na nossa hospedagem da Hostgator, ou algo do tipo. A gente pensou em criar como se fosse uma micro AWS. Então ter os nossos próprios servidores e serviços web.  
Então aqui dessa ideia eu quero divergir duas. A gente tem que ter uma área também no nosso back office, talvez de planejamento de futuras empresas, futuros negócios, compra e venda de negócios.  
Mas também quero divergir justamente essa ideia. Pensar em como que a gente faz ou vai fazer valer a pena essa parte de \[infra\] realmente, hospedar \[site\] de cliente na nossa infraestrutura, hospedar serviços, quando que vai valer criar uma própria micro AWS e serviços digitais de TI. Isso envolve o módulo financeiro que tinha comentado justamente essa parte de planejamento e viabilidade.

# **Inspiração de Ecossistema Corporativo**

Você vai perceber, mas eu me inspiro muito nas grandes empresas como a JHSF, a Huawei, o próprio Elon Musk, que tem diversas empresas sob o seu guarda-chuva. O cara domina aeroespacial, energia, carro, redes sociais, IA, telecom e internet... Tem a Boring Company também. Então o cara tem um ecossistema de empresas que se retroalimentam (um flywheel), eu me inspiro demais nele e quero fazer basicamente isso que ele faz. No futuro a ideia da holding é basicamente ser o que o Elon Musk tem.  
Pensar em moldar não só o Kelvin, mas também o Grupo Rugido. Como a Rugido fez e se instaurou. Se não tiver contexto deles, depois eu passo mas facilmente você consegue analisando os vídeos e lives do Canal do Lucas Felix, porém faz parte da estratégia dele deixar por pouco tempo as lives e deixar as lives antigas dentro da comunidade e infoproduto dele.

Devemos nos basear na China no quesito de tecnologia. Isso servirá muito quando estivermos falando de negócios e de como ela olha para a tecnologia para o futuro. Ir de acordo com o movimento que ela está fazendo ajudará bastante na visão de negócios, no squad de negócios e no squad de pesquisas. Refiro-me a pesquisas de forma geral: pesquisa de tecnologia, pesquisa de stack, pesquisa de documentação e pesquisa de negócios. Ela entra junto da referência da JHSF.

Para o squad de investimento e trade, devemos olhar grandes fundos, como a BlackRock, e as movimentações que ela faz para investir. Basicamente não tem erro olhar esses grandes fundos e onde eles estão comprando grandes quantidades de ações. O squad de investimento estará altamente atrelado à parte do backoffice da EG na plataforma, junto ao financeiro, conforme mencionei no meu controle de metas e objetivos.  
Essa análise de onde vale a pena investir ou se vale a pena assinar mais uma plataforma, esse squad de investimento vai ditar. Vale a pena investir em ações como empresa? É um ponto importante. Eles precisam ter ciência da lei tributária no Brasil. Muitas pessoas dizem que não vale a pena comprar ações como PJ pela carga tributária, mas penso que vale a pena esse squad analisar: vale a pena investir, comprar tal ação, avaliar o dividend yield, o retorno e a valorização, ou contratar mais um funcionário?

# **Automação e Clonagem de Perfil**

Também acho importante, mas não sei se isso já deixo para a plataforma de uso pessoal (que é o Fóton), ou para essa mesmo da EG, mas uma forma de automatizar clones de IA. Clonar personas e clonar o conhecimento delas, a forma como elas pensam, respondem, quase que um fine-tuning de modelo só que clonando esta pessoa. A lógica desta pessoa.  
Para, por exemplo, eu poder clonar o Elon Musk, poder clonar o Alex Hormozi, essas pessoas assim. Nos ajudaria enormemente e melhoria, acredito eu, no uso do banco de conhecimento (direcionando os conteúdos de uma persona para seu clone, ex: livros do Alex Hormozi não ficarão soltos, serão usado apenas pelos seus clones/avatares/agentes) e também nós poderíamos criar mais facilmente concelhos com esses empresários e telos a nossa disposição.

# **Ferramentas de Gestão e Captação**

Também algo que eu queria dentro do nosso backoffice, talvez ter ferramentas de gestão de funil, como o ClickFunnels, o Funnelytics.

# **Área do Cliente, Dashboards e Integração de Dispositivos**

Para a área do cliente em si, acho muito importante estar inteiramente ligado com a nossa metodologia. As coisas mais urgentes agora para o cliente é ele poder analisar as campanhas, métricas, dashboards, BIs e o score. Criar o hub, que vai ser diretamente programado nos cartões NFCs dos kits que a gente for montar.

## **Expansão de Escopo de Atuação e Níveis de Score**

Pensando nas duas fases do score, também precisamos integrar micrométricas ou micro scores. Por exemplo, como está o branding dessa empresa?  
A análise não está (ou não estará, mais para frente) apenas nos três pilares de score. Será que expandimos depois esses nossos scores igual ao Lázaro Ramos? O Lázaro é um grande empresário que entra nas empresas com a nossa oferta high-end, que cobra percentual de crescimento do faturamento. Ele entra mexendo desde lista de fornecedores, no RH, nas cadeiras de diretores, em contratação, até o contábil e tributário. Similar ao Flávio Augusto. Esses altos empresários não mexem simplesmente nesses três pilares.   
Deixamos isso para uma conversa futura? Qual é o seu posicionamento sobre isso?

# **Módulos Bloqueados, Upsell e Bancos de IA**

Sobre o exemplo do branding, podemos ir desbloqueando módulos. O cliente tem a análise do branding ou não tem?  
Conforme a pontuação, a gente usa o squad, usa as skills de branding nele.  
Falando nisso, temos umas skills que ainda precisamos implementar ou registrar, que retirei do próprio Claude e de outros lugares.  
Podemos também fornecer bancos de skills como produto no nosso lado de tech, não sei se é interessante ou não. Ou banco de prompts, mas acho que já está documentado dentro do banco de ideias.

## **Travas de Acesso e Marketing de Entregáveis**

Não sei até onde a gente trava essas coisas. O cliente não vai poder fazer uma análise de branding sozinho porque não contratou ou não tem autonomia para analisar. Isso serve até como um serviço, um marketing dos nossos entregáveis. Se o cliente perguntar: "Vocês também fazem análise de branding? Podem rodar?", dizemos: "Não, só se você contratar", ou "Isso está no entregável, mas não está planejado para esse sprint". Isso pode ser interessante.   
Às vezes, podemos dizer que "rodou sem querer", rodamos de teste ou liberamos uma notificação para ele. É interessante como estratégia de marketing.

# **Referências de Intuitividade e Ecossistemas de Tecnologia**

Ao mesmo tempo, quero focar na alta intuitividade. Quero ser igual ao Android no desenvolvimento de tecnologia. A Samsung avança em alta tecnologia muito mais que a Apple, mas quero a essência da Apple na questão de qualidade, interatividade e simplicidade e branding, na qualidade gráfica e perfil premium que os usuários tem. Essa integração entre os ecossistemas faz com que o usuário que nasceu no IPhone não consiga sair dele.

# **Gestão Logística e Kits** 

Esqueci de abordar a parte de gestão dos nossos kits. Precisamos controlar quantas peças de cada kit temos, os fornecedores, valores e custos atuais. Quantos clientes receberam, quais kits receberam e a quais níveis isso está atrelado. Seria interessante ter essa abordagem no backoffice para a gestão logística. Um cliente high-end recebe uma outra caixa, enquanto o retainer recebe outra. Precisamos saber quais já foram entregues, quais não foram e quais estão em produção. Algo que não seja mirabolante, nem muito simples, apenas o suficiente.  
Depois vou desenvolver também kits e peças para onboarding dos funcionários. Se quiser já desenvolver ou começar a mapear essas parte, ok. E já integrar com o módulo de RH para saber quem recebeu ok e quanto de cada coisa (garrafinha, camiseta, caneta…).  
Também seria interessante podermos gerenciar os campos que queríamos acompanhar de cada elementos dos kits, por exemplo, se uma camiseta gostaria de acompanhar ciclos de uso ou de lavagem, para acompanhar a durabilidade e qualidade do fornecedor…  
Para canecas térmicas, quanto tempo dura as impressões, ou quanto tempo fica aquecida… não sei. Foram exemplo superficiais, mas entra no princípio de estar altamente engessado a regras de negócio e hardcode…

# **Gestão de Acessos e Permissões no Backoffice**

Tem que pensar realmente com muito carinho e muito aprofundamento na parte de como que a gente vai gerir esse backoffice, até onde que a gente vai.   
Como que a gente, por exemplo, vai gerenciar BIs, dashboards, insights e dados de cliente, em comparação com a parte realmente administrativa da agência com uso interno…  
Como que a gente vai distinguir essa parte de: “estou analisando agora BIs de campanhas da EG”. De “E agora estou analisando realmente dados do uso do backoffice dos clientes” Ou até de uso dos funcionários. De “agora estou analisando BIs dos clientes”. E “agora estou analisando BIs dos usuários, dos funcionários das empresas dos meus clientes”. Por exemplo, eu não estou analisando nem campanha dos meus clientes, eu estou analisando realmente os funcionários dos meus clientes (que são empresas). Tem que ter muito carinho na hora de a gente pensar em todos esses detalhamentos, multi-tenant, permissividade, pensar em tudo isso.

# **Módulo de Investimentos e Automação de Trading**

No  módulo de investimento, penso primeiro no pessoal para gerir melhor minha carteira de investimentos, tenho essa necessidade. Pensando primeiro no pessoal, que é o que já está funcionando e rodando, a gente pode depois pensar em como aplicar isso no empresarial para a EG. Ou não, se a gente faz o fluxo inverso: como já estamos produzindo tudo para a EG, depois quando for migrar para o Fóton, pensamos no uso pessoal.  
Mas enfim neste módulo  estava pensando em ter uma IA, um squad. Penso em integrar a Portfel e outras casas de análise, porque tenho acesso à Finclass, à Portfel do grupo Primo, onde eles trazem uma análise de carteira em dois vieses: de rentabilidade (focando em dividendos) e de valorização. Queria analises de ação por ação, analisar preço médio, quanto a carteira valorizou, registrar a compra e venda dos papéis e as datas de compra das ações. Dar sugestões de investimento, trazer análises de mercado, e integrar isso.   
Já vi diversas thumbnails de vídeos de trader usando Claude e IA para codar bots de \[trade\] que se auto melhoram, que têm histórico melhorando com o tempo, para auto-trade.

Acho que é uma oportunidade interessante que quero explorar no futuro para uso pessoal, para fazer trade e ter mais uma fonte de renda. Meu irmão, que faz trade, comentou de uma oportunidade onde pessoas codam bots, inscrevem esses scripts em challenges de traders, ganham a conta e depois a vendem. É algo que eu gostaria de tocar em paralelo, no lado pessoal. Não sei se vale a pena comentar depois, se jogamos isso como banco de ideias no Fóton, na minha parte pessoal.  
(E quando falo squad, entenda que não penso só em times de agentes; pode ser só uma IA, alguma ativação, algum agente específico. Uma feature de ativação da IA, da LLM, dá na mesma.  
Depois a gente pensa exatamente na spec como funcionaria melhor, ou até no framework. Não se limite apenas ao que a gente tem configurado agora. Vamos pensar em outros frameworks se for necessário, outras stacks, micro-serviço, monolito, outros design systems, outra arquitetura, enfim, o que for melhor.)

# **Arquitetura de Ecossistema e Projetos Paralelos**

Estou comentando bastante sobre as necessidades que vão surgir no futuro. Por exemplo, eu, como CEO da EverGreen, quero pegar todas as minhas demandas, tarefas de cada projeto de cliente atreladas a mim, reuniões, e jogar isso que está no meu ClickUp (ou no Fóton) para ver tudo de uma vez só no meu sistema pessoal. Além das tarefas da EG, tenho tarefas de outra empresa e reuniões externas marcadas. Estou montando todo esse ecossistema da EG para rodar sem mim. Mas tudo que condiz a mim, precisa ser fácil de acessar de forma que não seja interna, truncada ou travada em mim e na EG. Tem que ser algo externo. Eu não vou colocar tudo o que é pessoal na EG agora, não faz sentido. Não faz sentido eu colocar o que é do Gustavo, o CTO, que está tocando um outro projeto paralelo que não é comigo, que é de uma outra empresa, e incluir as reuniões e negócios dessa outra empresa ali. Ele precisa ter essa flexibilidade. Até depois pensar em como vamos fazer essa conectividade, essa transição e conectar plataformas pessoais (por exemplo o Gustavo usa o Notion, eu uso o Obsidian \- por enquanto até eu modifica-lo e criar meu Fóton) facilmente.

# **Segurança Sistêmica e Gestão Financeira**

Comentei anteriormente da parte tecnológica, da atualização das stacks e tudo mais. Também penso que a gente pode talvez colocar backdoors para travamento e segurança nossa. Por exemplo, o cliente parou de pagar, não pagou todo o projeto, a gente joga algum código, algum backdoor ali, trava o sistema dele até ele pagar.

# **Estrutura de Retenção e Modelo de Negócio**

Vamos começar a falar pensando em como a gente distribui esse aplicativo, ou pensando num cliente que quer sair da consultoria, mas não quer sair do sistema. Não quer ter o prejuízo de ter que sair do sistema. Temos que criar um sistema com pagamentos? (Stripe)  
Realmente como se fosse um SaaS. Não sei se chega a ser um SaaS, ou até um Service as a Software (o que o Kelvin prega).   
Outra necessidade da plataforma é que temos que criar de forma que não seja altamente atrelado às regras de negócio para não termos que ficar codando toda vez. Por exemplo, se o cliente que não pagava o uso do ecossistema e saíu da consultoria, ele começa a pagar. Como vamos fazer a gestão disso?   
Cupons, por exemplo: fazemos um lançamento para a comunidade, eles têm um tipo de oferta diferente, têm um cupom. Como vamos pensar nessas coisas. Ou temos clientes legado, que vieram na primeira fase e pagam uma mensalidade; aumentamos o valor no futuro, haverá atualizações de cota. Enfim, pensar em tudo isso. As diferentes possibilidades.  
Ou até a gente faz uma parceria com alguma empresa que quer oferecer contas e cotas a preços diferenciados…  
Tem que pensar nos mais diversos casos.

# **Níveis de Acesso e Módulo de Recursos Humanos**

Outro módulo interno que temos que pensar, já abrangendo um dos pilares que está no documento mestre, são níveis de clientes, níveis de cultura, níveis de funcionário. Tratar isso talvez num módulo de RH, talvez seria interessante. E aproveitar, não sei se uma \[skill\], uma MCP, uma API, do squad de propostas, onde ele faz a busca automática dentro das plataformas que temos cadastradas. Ele faz a busca de projetos para enviarmos propostas. Também integrar isso para quando formos submeter vagas. Talvez seja interessante um squad de RH.  
E também na parte de gestão dos clientes, como será feito o nível de gestão dos níveis de clientes? (sementes, floresta…)

# **Triagem de Dados e Integração com CRM**

Pensando nisso, quero que a squad de propostas já analise as propostas, faz um \[parse\] de todas as propostas das plataformas. Por exemplo, não sei se por webhook: proposta nova no freelancer.com.br, proposta nova no 99freelas, a cada proposta nova em geral das plataformas…  
Ou já filtramos por parâmetros: quero só propostas de marketing, de growth, de site. Ele já traz essas propostas certinhas para nós. E daí tem uma alta avaliação: essa proposta vale a pena ou não vale? Se vale a pena, já vou montar uma proposta para ela. E só espera chegar no CRM, um humano validar ou editar a proposta. Temos que fazer isso também.

# 

# **Posicionamento de Tecnologia e Escada de Ofertas**

Outro módulo é a parte que quero discutir do nosso documento central, porque abordamos muita parte de growth, da boutique de crescimento, mas não comentamos muito da parte de tecnologia. Parece que foi esquecida, como se a gente não fizesse. E a EG tem um braço tecnológico. O Kelvin Clayton aborda muito isso num lado interessante que eu queria fazer, que é quase a mesma escada de ofertas do growth, só que para tecnologia. Começar com uma análise, entregar para o lead, e daí ter os níveis: ele faz por conta, a gente faz com ele, a gente faz por ele. E daí tem o high-end, que é cobrando porcentagem. Queria aplicar isso. Pensar em como vamos montar isso no backoffice também. Como podemos estar fazendo essas partes?

# **Flexibilidade e Metodologia de Scores**

Agora talvez eu me contradiga um pouco, mas como eu falei, não quero ficar preso a regra de negócio ou até metodologia. Mas tem uma área de score, de analisarmos por cliente os scores deles, até as tarefas e entregáveis, o planejamento e o projeto. Nós temos a metodologia do funil e isso vai bater também na parte de quando formos fazer os BIs.

# 

# **Especificações do Dashboard e Funil de Vendas**

Terá a especificação do dashboard para mostrar um funil, com leads por etapa, e não quero etapas genéricas, etapas que o Meta Ads ou o Google Ads entrega, a não ser que seja extremamente obrigatório e não tenha como fugir disso.  
Nós montamos o funil. Quero uma área para montar o funil, as etapas que o cliente passa, e mostrar os canais de onde vêm, as estratégias que estamos montando, empilhamento de funil, o inbound e outbound (all-bound) de todas as camadas e diversas plataformas. Por isso eu tinha comentado de absorvermos um Funnelytics ou o ClickFunnels.  
Até onde não vamos nos enrijecer em código para o cliente? Como faríamos isso? Se nós montássemos, não sei se ficam duas visualizações ou dois gráficos, mas nós montamos um funil. Pensando no nosso funil do Kotler, o funil de cinco etapas: Assimilação, Atração, Arguição, Ação e  Apologia. Eu estava pensando em montar as estratégias e mostrar: temos o seu score aqui, e como já estamos atacando o pilar de conversão, vamos atacar essas ações que correspondem a essas etapas do funil.  
A primeira etapa de Assimilação do lead possui essas ações e estratégias que estamos implementando. O planejamento da busca do cliente, da entrega do conteúdo X, a parte de tráfego pago, estamos aplicando essas campanhas nesta etapa (ex: arguição) e outras campanhas para outra etapa. Parcerias com influenciadores correspondem a outras etapas.  
Como você acha que podemos fazer isso? Você acha que são duas visualizações diferentes (para mostrar de onde vem cada lead e dos funis e estratégias de cada etapa do funil)?  
Exemplo: O lead do Instagram foi para o whatsapp e comprou. Mas não sei se faz sentido, porque parte do princípio de que, no final das contas, fica quase impossível metrificar tudo. O cliente do Instagram, não sabemos se ele veio primeiro do Instagram, do site, se ele foi e voltou, depois viu um vídeo do YouTube, depois comprou, ou se veio por indicação e depois viu o Insta e o WhatsApp. São questionamentos que estou levantando de funcionalidades e de como aplicamos isso no dia a dia, alinhando com nossos documentos de scores, nossos princípios e nossa metodologia.

## **Visualização de Funil e Análise de All-bound**

Essa parte que eu comentei das duas visualizações de funil, dos canais e jornada dos leads, dos negócios, das oportunidades, das negociações para os nossos clientes, eu queria também pensar para nós. Então a gente ter uma visualização do nosso allbound, o que está sendo feito, por exemplo, para depois analisar granularmente se essa estratégia ou esse post do LinkedIn foi feito com sucesso e  quais dados trouxe.

Voltando para página do score e para a parte visualização do mapa de leads, a visualização em funil para nossos clientes, pensando na nossa metodologia, não seria legal também “gerar” uma visualização da nossa analogia da árvore e do crescimento da empresa? (entenda olhando os documentos core) Mas ao mesmo tempo, isso não enrijeceria na regra de negócio?

# **RH e Rampagem de Funcionários**

Olhando para a parte de rampagem de funcionários, no módulo de funcionários do RH, temos que analisar o plano de rampagem de treinamento. Vamos montar isso mais para a frente, mas já tivemos mentoria sobre os marcos de integração do funcionário nos 15, 30, 60 e 90 dias. Precisamos ter isso mapeado. De novo, isso será hardcode, programado ou flexível?  
Se um funcionário que é vendedor já teve determinados treinamentos, como vamos metrificar e acompanhar isso para os níveis de cultura e pontuação?  
Penso também na importância, como a gente vem falando, da rampagem dos funcionários, mas também no gerenciamento da performance deles, metrificação. Por exemplo, um gestor de projetos, eu quero também depois saber qual é a carteira de clientes deles. Quais são os clientes e os projetos que eles estão gerindo. Como está a evolução desses projetos. Como está a satisfação, o NPS dos clientes. Ou outra métrica de satisfação.

# **Centralização de Dados, Infraestrutura e Benchmarks**

E depois também tem a parte ali que a gente tem até mapeado a ideia, de benchmark. Que é justamente ali pequenas vitórias, a captura automática dessas pequenas vitórias. Seja através dos dashboards, seja através dos dados. Seja através das transcrições das reuniões.

E isso é importante também na área do cliente, eu quero também ir centralizando todos os registros de relatórios enviados, comunicações do WhatsApp. E-mails, reuniões…

Sobre o benchmark, tem uma seção no nosso site também que é de \[benchmark\], que é ser um selo de qualidade da EG. E isso talvez se interligue com selos de qualidade do Prisma BI, mas enfim, depois a gente conversa sobre isso.  
Mas, por exemplo, ter um selo de qualidade EverGreen. A gente conseguir ir automaticamente já criando esse benchmark e esse selo de qualidade. Ou criar diversos selos de qualidade da EverGreen como selos de qualidade nível bronze, prata e ouro. Ou até selo de qualidade em tráfego, selo de qualidade em gestão de projetos, selo de qualidade em funil comercial, enfim, tem que entender se faz sentido e depois planejar isso também.

Atrelado a ideia do benchmark e pesquisa acadêmica, penso também, fomentando nosso diferencial de tecnologia e afins, desenvolver áreas de telecom, big data e ML e deep learning e IoT. Principalmente, mas não exclusivamente a nossa área e modelo (core) de negócios. 

# **Estrutura do Time Comercial e Testes de ICP**

Falando um pouco mais, talvez de estrutura de time. Eu pensei, como a gente vai ser uma boutique, algo enxuto, eu queria, por exemplo, criar dois times comerciais. E depois deles rampados, eu divido esses dois times para um de controle e um de teste. E ir documentando isso, por exemplo, a gente tem um time que já prospecta o nosso ICP fixo, que é, por exemplo, só solar, só instaladores solares. E um outro time que faz diversos testes, teste de ICP, teste de público, teste de abordagem, teste de comunicação. Queria fazer isso depois. E pensando em metrificar e talvez isso já na plataforma, mas é uma ideia muito crua ainda.