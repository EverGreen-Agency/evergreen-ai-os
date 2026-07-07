Reuniao HM Conexoes
Sumário Fathom:
___
Impromptu Google Meet Meeting - June 02
VIEW RECORDING: https://fathom.video/share/D_ExLdbhrk7swozyTwqp-7ewPGUJz2y5
Propósito da reunião

Definir requisitos para uma plataforma de automação personalizada para a H&M.

Principais conclusões

  - Objetivo: Consolidar o fluxo de trabalho fragmentado da H&M (Notion, Docs, planilhas) em uma única plataforma personalizada para automatizar tarefas manuais e permitir que o Henrique foque na aquisição de clientes.
  - Escopo: A plataforma irá automatizar o processo de onboarding de clientes (briefing → livro de branding → calendário editorial) e gerar relatórios mensais de performance para mídia orgânica e paga.
  - Financeiro: Um módulo financeiro irá acompanhar contratos, faturas e pagamentos, com follow-up manual para contas em atraso a fim de manter o relacionamento com os clientes.
  - Próximos passos: O Gustavo entregará uma proposta detalhada e uma Prova de Conceito (POC) até o fim do dia de amanhã, pendente pesquisa sobre a API para extração de dados do LinkedIn Ads.

Tópicos

O problema: fluxo de trabalho fragmentado e tarefas manuais

  - O fluxo de trabalho atual da H&M é ineficiente, apoiando-se em ferramentas díspares (Notion, Docs, planilhas) que exigem transferência manual constante de dados.
  - Isso força o Henrique a gastar tempo em tarefas repetitivas em vez de aquisição de clientes, que é o principal motor de crescimento do negócio.
  - O objetivo é automatizar esses processos manuais, melhorando a eficiência e a retenção de funcionários.

A solução: uma plataforma de automação personalizada

  - A plataforma centralizará todo o ciclo de vida do cliente, da qualificação do lead ao relatório de performance.
  - Funcionalidades principais:
      - CRM: Um hub central para gerenciamento de leads e clientes.
      - Onboarding automatizado:
          - Preenchimento do formulário de briefing → geração automática de um Livro de Branding Pessoal (com base em um template fornecido).
          - Livro de Branding → geração automática de um rascunho de calendário editorial para o gerente de social media.
      - Relatórios de performance:
          - Relatórios mensais automatizados para mídia orgânica e paga (Meta, Google Ads, LinkedIn Ads).
          - Observação: A disponibilidade da API do LinkedIn Ads para extração de dados requer pesquisa.
          - Pré-requisito: O Henrique consolidará todas as contas de Google Ads dos clientes em um único MCC (My Client Center) para simplificar as coletas de dados.
      - Módulo financeiro:
          - Acompanhar contratos de clientes (datas de início/fim).
          - Gerenciar vencimentos de faturas e status de pagamento.
          - Acionar follow-up manual para contas em atraso, preservando o toque pessoal.
  - Acesso e infraestrutura:
      - Papéis de usuário: Dois níveis de acesso — um para o Henrique (admin) e outro para o gerente de social media.
      - Infraestrutura: Requer uma VPS (~R$200/mês) e um domínio.
      - Cronograma: Estimativa de 30–45 dias para desenvolvimento.

Contexto: o negócio do Henrique e o sucesso na prospecção

  - A H&M está em rápido crescimento, com dificuldade para encontrar funcionários.
  - Uma nova ferramenta de prospecção com IA no LinkedIn está gerando resultados significativos:
      - Custo: R$390/mês (substitui uma ferramenta anterior que custava ~R$2.000/mês).
      - Desempenho: Gera reuniões altamente qualificadas.
      - Conversão: Mantém uma taxa consistente de 1 em 3 de reunião para venda.
      - Volume de leads: 7–10 reuniões qualificadas por 100 contatos.
  - O Henrique também atende clientes em Portugal, faturando em euros via Wise.

Próximos passos

  - Gustavo:
      - Pesquisar a disponibilidade da API do LinkedIn Ads para extração de dados.
      - Entregar uma proposta detalhada e uma POC até o fim do dia de amanhã.
  - Henrique:
      - Consolidar todas as contas de Google Ads dos clientes em um único MCC.
Action Items
  - Send LinkedIn AI prospecting tool link + prompts to Gustavo - WATCH (5 secs): https://fathom.video/share/D_ExLdbhrk7swozyTwqp-7ewPGUJz2y5?timestamp=1249.9999
  - Research LinkedIn Ads API for reporting; update Henrique - WATCH (5 secs): https://fathom.video/share/D_ExLdbhrk7swozyTwqp-7ewPGUJz2y5?timestamp=2018.9999

___

Transcrição Fathom:
___
Impromptu Google Meet Meeting - June 02
VIEW RECORDING - 40 mins (No highlights): https://fathom.video/share/D_ExLdbhrk7swozyTwqp-7ewPGUJz2y5

---

6:14 - Gustavo F. S. da Silva
  Thank you much. Fala comigo.

8:30 - Henrique Miranda
  Fala irmão, como que você tá?

8:32 - Gustavo F. S. da Silva
  Caralho, tá muito estourado, calma aí. Tudo bem e você, velho? Tudo ótimo. Caralho, tá deixando barbinha, né?

8:39 - Henrique Miranda
  A namorada goedor tem que obedecer, né, cara? E aí, mano, como que tá o trampo, faculdade, velho? Tá bem, graças a Deus, a faculdade tá acabando agora, velho.

8:51 - Gustavo F. S. da Silva
  Esse ano, né, mano? É, não, mas agora também, tipo, meio que acabou o semestre, tá ligado, velho? Falta só mais um.  E aí, tá, sulan, tá?

9:00 - Henrique Miranda
  Graças a Deus.

9:01 - Gustavo F. S. da Silva
  E você tá trampando muito?

9:03 - Henrique Miranda
  Nossa, velho. Trampando, velho. Você não tem noção da brutalidade que tá aqui.

9:07 - Gustavo F. S. da Silva
  Sério? Nossa, velho.

9:09 - Henrique Miranda
  Graças a Deus, né? E o foda é Tchani, né, velho? Difícil achar funcionário, né, cara? As minas saiu?

9:16 - Gustavo F. S. da Silva
  Saiu. Caralho.

9:19 - Henrique Miranda
  Saiu uma, aquela que era boa, que vocês viram lá no... Ah, aquela no bar?

9:24 - Gustavo F. S. da Silva
  Aham, sei.

9:25 - Henrique Miranda
  Saiu, foi morar lá em Portugal. Aí ela ainda ficou um tempo.

9:28 - Gustavo F. S. da Silva
  Caralho.

9:30 - Henrique Miranda
  Aí... Só que lá não compensa, né? Ela ainda ficou, tipo, uns quatro meses comigo, depois que ela mandou em Portugal.  É que, mano, é...

9:36 - Gustavo F. S. da Silva
  Dividido por seis, né, quase, que ela recebia, né, velho? Vamos dizer assim. Exatamente.

9:42 - Henrique Miranda
  E eu tô com uns clientinhos lá em Portugal, cara.

9:44 - Gustavo F. S. da Silva
  Ah, da hora, velho. Tá ganhando em euro? É. Você tá trazendo pela... Mas você tá trazendo a grana, tipo, pela Wise?  É. Por onde você tá fazendo?

9:53 - Henrique Miranda
  Pela Wise, emita nota e isso é uma Wise. Aí sim, velho. Da hora, hein, mano? É, tem que, velho.  Tem que bater pra si. pra si.

10:00 - Gustavo F. S. da Silva
  Acho que aquele dia lá que você tava era de Portugal, né, caralho? Ah, Aquilo lá era de Portugal. Verdade, verdade.  Era de Portugal. E deu certo aquele bagulho lá?

10:10 - Henrique Miranda
  Qual? Eu não tô sabendo, mas eu tinha um dia que era. Captação de lead, ah, é verdade. Era um evento, eu acho, mano.

10:18 - Gustavo F. S. da Silva
  Era um evento. Era algum bagulho de A lá, de evento. Era um evento, eu acho.

10:22 - Henrique Miranda
  Cara, eu gerei lead pra cacete pra eles. Tipo assim, velho, o custo por lead ficou em torno de, tipo, 10, menos de 10 euros, menos de 10 euros.  E a gente tirou mais de 200 leads pro evento. Caralho. É, foi assim, do caralho. Só que, velho, a conversão do lead deles não foi top.  Mas aí, mano, é mais problema da... Ah, mas aí não tem o que você fazer, né, mano? Tipo assim, o CRM dos caras deu pau, aí depois o cara foi...  Eles começaram a ligar pros leads. Caralho. Dois dias antes do evento. É aquele desespero, né? Aquele desespero, 200% para ligado.  Então, o foda de trabalhar com empresa pequena é que ela não está...

11:14 - Gustavo F. S. da Silva
  Não tem estrutura, mano. Não tem estrutura.

11:17 - Henrique Miranda
  Agora, eu estou com uma outra lá que também é de inteligência artificial, só que é só de automação para a área comercial.  Velho, os caras estão faturando 60 mil euros por mês.

11:27 - Gustavo F. S. da Silva
  Legal.

11:28 - Henrique Miranda
  Cara, dois amigos, velho. Me lembro você e o Matos, cara.

11:33 - Gustavo F. S. da Silva
  Velho, os caras loucam pra caralho. Mano, esses bagulho de ar é sempre assim, velho.

11:37 - Henrique Miranda
  A maioria das empresas é isso, Não, e os moleques é igual vocês, velho. Dois moleques loucos, velho. Um, ele aparece na reunião sem camiseta.  Outro, escuta. Não, aí também é esculacha, porra.

11:48 - Gustavo F. S. da Silva
  Não, aí escuta, eles são nomadigital, né?

11:50 - Henrique Miranda
  Então, não é porque eles estão na Indonésia e depois eles estão de novo em Portugal.

11:55 - Gustavo F. S. da Silva
  Mano, isso é muito foda, na moral, velho. É tipo, mano, é a minha meta vida. a minha meta de vida.

12:00 - Henrique Miranda
  Imagine, você tá ganhando 60 mil euros com 24, 23 anos. É, minha meta de vida, velho.

12:07 - Gustavo F. S. da Silva
  E aí, ganho de comer agindo nos países. Eles são gente boa pra caramba, velho. tô estudando pra acabar a faculdade, mano.

12:14 - Henrique Miranda
  Em português é burro pra caralho, né, velho. E aí você fala assim, eu não entendi, essa cópia não faz sentido.  Tipo assim, uns negócios que é muito normal pra brasileiro, tipo assim...

12:25 - Gustavo F. S. da Silva
  É a cultura, né, mano?

12:26 - Henrique Miranda
  É a tipo, eu sugeri uma cópia lá pra eles, que era o seguinte. Pra falar que o seu time comercial não precisa de ter um herói.  Que salva o time todas as vezes. Se ele tá doente ou se ele falta, você não consegue bater a meta.

12:40 - Gustavo F. S. da Silva
  Aham.

12:41 - Henrique Miranda
  E aí, como assim, herói? Não faz sentido aqui, herói. Então, você fala o Ah, tá.

12:45 - Gustavo F. S. da Silva
  É que eles são... Pessoal muito literais. É, isso aí. Eles são muito literais, né, velho.

12:51 - Henrique Miranda
  É, essa minha funcionária, a Maria, que tava morrendo lá, ela falou, cara, exatamente isso. Tipo, ela falou assim, é um negócio assim.  Nossa, eu vou... É... Me matar de estudar. Aí a moça, ué, como assim você vai se matar de estudar?  Tipo, eu não quero me matar de estudar! Caralho, Que doideira, velho!

13:11 - Gustavo F. S. da Silva
  É foda, né?

13:13 - Henrique Miranda
  Bom, mas fala aí o você tá precisando, velho. Então, velho, eu quero integrar aqui e deixar tudo mais rápido e mais fácil.  Hoje é, cara, mistureba todo o meu sistema aqui. Uma parte no Notion, uma parte no Docs, outra parte nas planilhas, tudo separado.  Qual que era a minha ideia, tá? Não deixar de usar, tipo, Notion, Docs, mas ter tudo integrado em um lugar só.  Então, como se eu tivesse um CRM que eu conseguisse deixar, por exemplo, o formulário de briefing tá dentro do CRM.  Tem todo o CRM da qualificação do lead que eu pego lá no Kanban. É como se fosse um Notion, só que mais organizado pra minha empresa, pra H&M.  Pra gerenciar o lead. Pra gerenciar o gerenciar o lead. Então, ele fez o briefing, eu já jogo o formulário lá, ele já...  E aí desse Forms, já fica tudo lá do lead, eu tava fazendo até um esquema aqui com o Cloud, aí por exemplo, depois do briefing eu passo pra marca pessoal, e aí, porque eu sempre faço um book de marca pessoal dos meus leads, de quem eu contrato, então o branding book eu faço pro diretor, aí eu jogo de lá, eu tenho um agente que eu fiz no GPT, que ele já faz tudo pra mim, só fica faltando depois da parte do lead.  Então, ele automaticamente, a partir do momento que eu já jogo lá, ele já monta pra mim, eu não preciso ficar mandando ele fazer tudo e tal, então eu queria automatizar...

14:38 - Gustavo F. S. da Silva
  O que? Um documento?

14:41 - Henrique Miranda
  É, ele faz em texto, é um documento, na verdade é um Notion, tá?

14:44 - Gustavo F. S. da Silva
  um Markdown, o Markdown você importa no... É tipo um texto puro e você importa no Notion, é isso?

14:52 - Henrique Miranda
  É, na verdade eu vou pegando, vou dando Ctrl C, Ctrl V ali.

14:56 - Gustavo F. S. da Silva
  Eu sei que teria como fazer isso de forma mais inteligente. Tá, tá.

15:00 - Henrique Miranda
  Mas eu já tenho o agente, ele já está criado. Eu preciso atualizar ele porque ele é um pouco antigo, tem algumas coisas que eu mudo ali.  E aí eu vou... Então você quer basicamente manter tudo no Notion, né? É, tudo no Notion, tudo na plataforma própria.  Eu não quero excluir o Notion, porque eu utilizo muito ele para os meus clientes. E para eles faz sentido, para eles entrarem, a maioria já sabe mexer.  O que eu queria é a gente automatizar todo esse processo, que para mim é muito maçante e... Essa parte é onboarding.  É, essa parte é onboarding, exatamente. Ok.

15:35 - Gustavo F. S. da Silva
  Você tem esse processo todo documentado? Tenho.

15:40 - Henrique Miranda
  E aí tipo...

15:41 - Gustavo F. S. da Silva
  Sabe como que a agência, né?

15:44 - Henrique Miranda
  Mas daria para estruturar tudo.

15:47 - Gustavo F. S. da Silva
  É, porque tipo assim, o que que pode foder uma automação em empresa? É não ter nada documentário, tipo, vou fazendo o der na cabeça.  Isso aí que fode automação. Se você tem tipo... Você precisaria de um Dash online simples, que seria mais visual, que seria mais integrado, e ele integra nas outras plataformas.  isso, é isso, deixa eu te falar.

16:15 - Henrique Miranda
  Outra coisa que me interessa também, que eu tô vendo um monte de gente fazendo, mas eu tô vendo gente fazer isso pra Instagram.  Mas, por exemplo, o relatório que eu faço, eu faço todo manual dos clientes. Dá pra automatizar isso, não dá pra fazer um relatório pro...

16:29 - Gustavo F. S. da Silva
  Ah, velho, já vi puxando por... É um protocolo de comunicação que chama MCP, é novo, que eu vi que já tem gente puxando, tipo...  Na verdade, é novo não, assim, já tem desde o ano passado, só que agora que tá todo mundo começando a usar por causa do cloud, mas daí já existe, já tem um ano, mais ou menos.  Que aí você puxa, você consegue puxar todas as informações e meio que você integra as ferramentas. É isso, basicamente, né?

16:54 - Henrique Miranda
  Isso, e aí já fazia o dashboard, tipo assim, ó, quanto você cresceu de seguidor, de um mês pro outro, quanto que você...  É um BIzão né?

17:04 - Gustavo F. S. da Silva
  Tem uns caras usando muito para tráfego Pagos, acho que é isso. Já ouviu falar? Já, já ouviu falar. Ele faz basicamente essas centralizações que é só para tráfego pago né, não tem nada a ver com geração de conteúdo, copy, tudo o que você faz né.  Mas eu acho que é mais ou menos essa linha de ter tudo integrado no mesmo lugar. Isso, tudo integrado no mesmo lugar.  o do GPT o que que dá pra fazer você não precisa nem acessar mais o GPT também, tipo dá pra fazer de uma forma que o que você for gerando com o GPT tipo, meio que você joga já direto pro Notion, tá ligado dentro da própria plataforma, tá ligado a gente só usar a API, ou da OpenAI ou de outro outra LLM que vai fazer a mesma função porque o que vai mandar mais ou menos é o prompt  Então o custo é meio... E o custo é meio irrelevante também. A gente tá falando de centavos ali por milhão de tokens, né?  Dá um textão, um documento de cinco páginas dá, sei lá, dez centavos, tá ligado? Mais ou menos essa linha.  E aí você já faz tudo dentro da sua plataforma própria, tá ligado? É uma opção também.

18:27 - Henrique Miranda
  Cara, do caramba. E... E aí era mais ou menos isso que eu tava pensando, sabe? Tipo, tudo que der pra automatizar, eu queria automatizar, porque aí eu consigo reter funcionário, eu tenho menos trabalho no meu dia a dia, e o meu foco é na captação, né, cara?  Que é o que...

18:47 - Gustavo F. S. da Silva
  Que é o que pega todo mundo, É, é o que o negócio faz.

18:51 - Henrique Miranda
  E eu tô com uma estratégia nova que tá dando certo pra caralho pra mim, né? Que eu peguei uma inteligência artificial de prospecção do LinkedIn.  LinkedIn. peguei inteligência Que E cara, ele tá me dando um resultado, velho. Fudido.

19:04 - Gustavo F. S. da Silva
  Mas como que ela funciona?

19:07 - Henrique Miranda
  É um prospecto pra mim, eu coloco lá a minha Instagram. mandando, disparando mensagem?

19:11 - Gustavo F. S. da Silva
  Disparando mensagem, como se fosse uma automação, só que com inteligência artificial.

19:15 - Henrique Miranda
  Aí é o seguinte, eu disparo mensagem, a reunião a responde, aí ela responde o lead.

19:20 - Gustavo F. S. da Silva
  E aí, qual que é esquema, velho?

19:23 - Henrique Miranda
  A galera é tudo muito filerzinho, ai, vamos qualificar o lead antes de fazer o pitch e tal. O cara percebe que ele tá conversando com o Miá.  Então, velho, a Miá, tipo, coisa, velho, é hard selling pra caralho. E, mano, e... É papum e é isso, aí.

19:39 - Gustavo F. S. da Silva
  É papum, velho.

19:40 - Henrique Miranda
  E aí, cara responde pá e aí ela já vai. E aí tá me gerando o lead pra caramba, velho.  Tá funcionando muito.

19:46 - Gustavo F. S. da Silva
  E a conversão, mano? Você acha que, tipo, converte bem? Eu nunca testei, assim, por mensagem no Nakedinho.

19:52 - Henrique Miranda
  Mano, tá me gerando reunião qualificadíssima, velho. Gente muito qualificada. E a conversão tá uma conversão normal, assim. Eu nunca tive isso aí, cara.  Minha conversão sempre foi, a cada três reuniões, uma venda. Sempre.

20:12 - Gustavo F. S. da Silva
  Caralho. Não, mas eu dividi contato, tipo, dez a cada cem contatos, sete, tipo, responde, vai pra reunião e aí a conversão, tá ligado?

20:21 - Henrique Miranda
  Cara, eu posso até pegar aqui pra te mostrar como que tá. Mas não é assim, cara. maior que... Aqui, ó.  É mais ou menos isso aí. A cada cem, dez.

20:34 - Gustavo F. S. da Silva
  É mais ou menos isso aí. então, é padrão, acho, disparamento. Acho que, tipo, de WhatsApp também é mais ou menos nessa linha.  A cada cem, converte sete a dez, e de sete a dez, tipo, vai pra reunião e aí converte na reunião, sabe?
  ACTION ITEM: Send LinkedIn AI prospecting tool link + prompts to Gustavo - WATCH: https://fathom.video/share/D_ExLdbhrk7swozyTwqp-7ewPGUJz2y5?timestamp=1249.9999  É mais ou menos isso aí. É mais ou menos isso aí.

20:53 - Henrique Miranda
  Eu tô também com os clientes, cara, e a gente tá tendo resultado bem rápido com os clientes também, cara.  Muito louco. Depois, se você quiser, eu posso até te passar a ferramenta, os propos que eu estou usando e você só replica ainda para você, porque gerando vídeo de fácil, gerando vídeo de fácil.

21:11 - Gustavo F. S. da Silva
  É legal, é interessante. E o custo dela, como que é?

21:16 - Henrique Miranda
  R$390,00 por mês. Mas aí tem qual que é a alimentação?

21:23 - Gustavo F. S. da Silva
  Tem a alimentação.

21:24 - Henrique Miranda
  Você usa o quanto você quiser. É a alimentação do próprio LinkedIn. Sério?

21:30 - Gustavo F. S. da Silva
  Caralho, velho.

21:31 - Henrique Miranda
  Aí os limites do próprio LinkedIn, para você não tomar ban na sua conta, né? Sim.

21:36 - Gustavo F. S. da Silva
  Mas qual que é a alimentação?

21:38 - Henrique Miranda
  Porque antes eu usava o Deepfy, que era uma automação, só que era sem inteligência artificial. Era só o disparo.  Só o disparinho, E aí era em dólar, né, velho? Aí era aquela facada, né, cara? Era, tipo, R$2.000,00 mais caro se for pegar tipo, entendeu?

21:53 - Gustavo F. S. da Silva
  Caralho.

21:56 - Henrique Miranda
  Então, cara, eu cortei custo e eu aumentei conversão. Eu aumentei... O que importa, né, mano?

22:03 - Gustavo F. S. da Silva
  O que importa, né, cara? Não, legal pra caralho. Mas, tipo, tem mais alguma demanda que tu precisa, que aí eu monto a proposta pra ti, e aí eu pego ali do, tipo, mais ou menos, se quiser mandar algum docs do que, tipo, do que você precisa, assim, estruturado, também ajuda pra montar proposta, e aí a gente vê, pô.  Fechou?

22:28 - Henrique Miranda
  Quer já ir montando aí? Pra gente falando tudo que eu imagino aqui?

22:33 - Gustavo F. S. da Silva
  É, pode ser, é que eu ia pegar a transcrição da gravação, né? Ah, mas que mais fácil você já ir separando aí.  Ó. Tá, vai. Calma aí. Deixa eu pegar um docs aqui.

22:47 - Henrique Miranda
  Então o primeiro é um CRM. Peraí, peraí, peraí.

22:56 - Gustavo F. S. da Silva
  Tá, primeiro, então basicamente o primeiro é ter um CRM, né? O CRM, é um CRM normal, tá?

23:05 - Henrique Miranda
  Aí, do CRM, o lead, ele qualificou, certo? Aí, o que a gente vai fazer? É a reunião de briefing, que o formulário.  Do formulário, ele automaticamente, eu já queria que ele pegasse, fizesse análise, fizesse análise do formulário e ele construísse um book de marca pessoal, que eu já tenho esse book, que é simples, né?  Aham. E aí, de lá, ele já vai, eu queria que ele já desse uma proposta para o meu social media, o que ele vai fazer de calendário editorial.  Então, você já gerou conteúdo com o Cloud?

23:54 - Gustavo F. S. da Silva
  Já.

23:55 - Henrique Miranda
  É do caralho que ele dá os dias certinhos, tudo e tal, sei lá. Isso é legal se ele já desse...  Eu quero que depois que eles gerem, a gente vai passar para o cliente, a gente vai aprovar com o cliente, certo?  Eu queria que aparecesse para mim ali um fluxo, tipo assim, o dessa semana aqui já foi aprovado com o cliente, então o conteúdo dessa semana está aprovado, só para a gente ter um acompanhamento semana por semana, tipo o que está acontecendo com os clientes, tá?  No calendário editorial aprovado, aí depois ele vai para a publicação, né? Aí, na publicação, o que eu acho que vale a pena?  É a gente ter o relatório de resultados, então, no mês, o que cresceu, o que baixou, o que tal, e aí eu acho  Eu que seria interessante a gente ter isso para a parte de tráfego orgânico e para a parte de tráfego pago também, o que você acha?  Eu estou vendo bastante gente fazendo isso para meta, então mostra qual que a campanha que deu mais resultado, eu tenho até um cliente meu, ele mesmo fez isso na mão.

25:15 - Gustavo F. S. da Silva
  Da meta dá para puxar de boa, da meta do Google dá para puxar bem tranquilo. Então, só que quando tem que ser do LinkedIn, tem que ver o que...  Então, aí tem que ver, tem que só ver a API deles, se eles liberam esses dados. Se a API deles liberar, suave.  Tá. É só puxar.

25:33 - Henrique Miranda
  Tá.

25:33 - Gustavo F. S. da Silva
  Tipo, você tem uma, vamos dizer assim, uma MCC e aí você fica gerenciando os clientes, você entra em cada cliente.

25:41 - Henrique Miranda
  Tá, fechado.

25:43 - Gustavo F. S. da Silva
  Não, Você tem uma MCC e aí, tipo, vamos dizer assim, uma MCC e aí você entra... Gerenciar as contas dos clientes por lá ou você entra em cada conta de cliente por cada...

26:02 - Henrique Miranda
  As contas dos clientes, depende do cliente. Tem cliente que eu entro pelo login dele e tem o cliente que o gerenciador de anúncios tá na minha conta e eu consegui entrar.

26:13 - Gustavo F. S. da Silva
  então, isso aí, o MCC, é tipo criar uma conta matriz gerente de contas. Ah, isso eu posso fazer, isso é simples.  É, porque eu acho que simplifica a extração dos dados, tá ligado? Porque aí você consegue acessar todas as contas, né?  Isso eu consigo, isso é simples.

26:31 - Henrique Miranda
  E aí, eu acho que seria mais ou menos isso, tá?

26:37 - Gustavo F. S. da Silva
  Aham. Você só faz o LinkedIn, né, mano? Só o LinkedIn. Esse booking você tem o modelo, né? Então já vai...  E basicamente tá treinado, o formulário também é, você vai tipo, você envia por Whatsapp, você envia pelo Linkedin, como é que é?

27:08 - Henrique Miranda
  Então, normalmente eu faço ele por reunião, aí eu mesmo tenho que fazer, não teria como automatizar. tá, então suave.

27:13 - Gustavo F. S. da Silva
  Não, beleza. Só pra saber se, tipo, entra alguma API aí pra automatizar essa parte. Não, faz na reunião. Você vai entrar na reunião e vai preenchendo com o cara, né?  Isso.

27:23 - Henrique Miranda
  Aí se ele quiser, mas é raramente a pessoa pede pra fazer, ah, manda aqui que eu faço, tipo, muito rápido.  Eu sei, esse cara tem tudo preguiça, mano.

27:31 - Gustavo F. S. da Silva
  Muito obrigado como é que é. Aí, beleza, informes, análise informes. Então foi o cara que eu te indiquei e fez a reunião com você?  Mano, ele fez, aí ele falou, tipo, tava meio, ele tava meio preso ao outro programador lá que fez. Aí falou, não, vou ver com outro programador e aí eu te falo, aí sumiu.  Ah, tá bom.

27:57 - Henrique Miranda
  Eu, tipo, falei mais ou menos aqui que ele ia precisar pra...

28:01 - Gustavo F. S. da Silva
  O que que ia precisar fazer, corrigir assim, tipo, por cima, né? Não dei o bagulho, mas aí, acho que sei queria corrigir alucinação, tipo, ele falou que a IA lá, que tipo, eles tinham construído no N8N, tava, tinha umas horas que tava alucinando e dando umas respostas meio bunda, assim, sabe?  Ele queria corrigir essa parte aí.

28:26 - Henrique Miranda
  Era o cara da Ice Brands? Eu não lembro, o Gabriel da Ice Brands, era o Gabriel? É, o Gabriel, era esse aí, o Gabriel.

28:33 - Gustavo F. S. da Silva
  Ele é só pra Odonto, né? É, ele queria, ele tava só pra clínica, só pra...

28:41 - Henrique Miranda
  É, então, ele é bem nichado.

28:43 - Gustavo F. S. da Silva
  É. Tá, beleza, daí, envia proposta pra, assim, envia de proposta pra social media, como que você faz? Você faz pro WhatsApp, você faz um documento, o que que é?

28:55 - Henrique Miranda
  Não entendi, repete.

28:57 - Gustavo F. S. da Silva
  Tipo, que você falou, é... faz você faz Depois de construir o Booking em Marco Pessoal, de acordo com o modelo, vai para fabricação de conteúdo, daí você falou de enviar uma proposta para a social media de um calendário editorial, como que você faz esse envio?

29:13 - Henrique Miranda
  Isso, na verdade, hoje a social media pega o briefing, joga na IA e manda a IA criar um calendário editorial alinhado às tendências do mercado, tá?  E aí, o que eu imagino? Pegar a IA e pedir para ela fazer essa proposta de conteúdo e ela já mandar para mim a social media, entendeu?  Tá. Então, mas mandar pelo WhatsApp, por onde?

29:34 - Gustavo F. S. da Silva
  Ou deixa um, tipo, ela tem um login na plataforma?

29:38 - Henrique Miranda
  Pensei, tipo, isso, tem um login lá na plataforma. Tá, tá. E aí, tipo assim, tudo que for dos clientes, como vai ser um CRM, isso uma plataforma integrada.  Então, tipo, tudo que tem lá de cliente, ele entrou lá com o cliente, já abre o login dele para a gente deixar, tipo, documento.  Cara, CRM mesmo, como se fosse um CRM.

29:55 - Gustavo F. S. da Silva
  Abre o booking e... Tá. Preciso ter um acesso para a social media também. Você tem, você já tem domínio, algum tipo de infra, né?  Como que você tem? Você tem alguma infraestrutura em cloud? Em cloud não tem nada. Eu tenho o cloud pago, né?  Não, não, não. É tipo, porque para rodar um sistema, a gente vai precisar de uma infraestrutura de web, né?  Acho que dá para funcionar web e mobile ali, se você consegue acessar por web mobile, mas aí vai precisar de uma estruturazinha, tipo um domínio...  Uma VPSzinha, tripadão, tá ligado? Tá ligado. É, o custo, assim, não é alto não, é um custo de cento e pouquinho por mês, eu acho, mais ou menos.  Uns duzentos contos por mês. Tem mais algum processo, alguma coisa que você precisa dentro da plataforma?

31:24 - Henrique Miranda
  Cara, acho que não, acho que esses são os principais processos, assim, sabe?

31:30 - Gustavo F. S. da Silva
  Tá. Tecnologia não precisa, né? Pra deixar, a gente decide, né? A gente deixa aberto. É, deixa aberto. Tá, beleza, eu escolho a tecnologia.  Como que tá de prazo?

31:44 - Henrique Miranda
  Tranquilo também, sem pressa. Sem pressa, beleza.

31:50 - Gustavo F. S. da Silva
  É, porque tipo assim, eu já deixo mais ou menos uns quarenta cinco dias, por aí, tá? Que é um prazo mais ou menos seguro, só pra você ter uma ideia, assim.  Trinta, quarenta e cinco...

32:22 - Henrique Miranda
  Eu vi um anúncio de um cara no Instagram, venderam mais ou menos uma plataforma. Uma dessa. Ele tava cobrando uns 4,5.  Eu não sei se esse é o valor ou tal, não tenho... É, ou menos o valor, sim.

32:45 - Gustavo F. S. da Silva
  Era mais ou menos isso aí. Por conta das integrações. O que complica não é o web, é mais as integrações com as plataformas que vai encarecendo a solução, sabe?

32:58 - Henrique Miranda
  Que é o web, eu O web é fácil.

33:00 - Gustavo F. S. da Silva
  O que aumenta a complexidade é as integrações.

33:08 - Henrique Miranda
  Beleza.

33:09 - Gustavo F. S. da Silva
  Mas acho que a gente está mais ou menos alinhado, acho que era mais ou menos isso aí mesmo. Tem alguma dúvida, cara, que eu posso te esclarecer?

33:21 - Henrique Miranda
  Acho que para mim está claro, ficou claro. Acho que depois você me apresenta um projeto de como você imagina isso.

33:27 - Gustavo F. S. da Silva
  Eu vou te montar a proposta, o eu vou fazer agora, tá? Até amanhã, final do dia, eu te monto a proposta e eu te monto uma POC.
  ACTION ITEM: Research LinkedIn Ads API for reporting; update Henrique - WATCH: https://fathom.video/share/D_ExLdbhrk7swozyTwqp-7ewPGUJz2y5?timestamp=2018.9999  Fechado. que pode vir fazer. Daí eu já vou pesquisar também da API para ver se tem a viabilidade. Fechado.  E aí tudo na proposta eu vou detalhando passo a passo. Fechado, tamo junto.

33:59 - Henrique Miranda
  Fechado. Fechou. Valeu, mano. E de resto, tá tudo bem aí, velho?

34:03 - Gustavo F. S. da Silva
  Família?

34:04 - Henrique Miranda
  Graças a Deus, tudo bem, cara. Minha avó aqui tinha internado.

34:08 - Gustavo F. S. da Silva
  que que... Mano, caralho, velho. Que merda, hein, velho? Foda, mas agora ela já tá bem melhor, cara. Ela já tá...  Mano, infecção urinária é um bagulho idiota, mas às vezes pode evoluir, né, velho?

34:19 - Henrique Miranda
  Então, e diz que em doso, cara, não dá muito sintoma, tá ligado? Que nem a gente fica com...

34:25 - Gustavo F. S. da Silva
  Que dói o saco.

34:26 - Henrique Miranda
  Continua a urinar, tá ligado? Mija com sangue, tá no doso, tipo... Pode acontecer de não ter nenhum sintoma. E aí foi isso que foi foda, porque a infecção foi subindo, foi subindo e chegou no sangue, tá ligado?  Aham. Mas ela tratou, ficou lá internado uns dias, tudo tratou, mas... Tá bem, meu irmão tá bem também, meus pais estão...  Ele também forma esse ano, né?

34:48 - Gustavo F. S. da Silva
  Forma esse ano, velho. Caralho. Da hora.

34:52 - Henrique Miranda
  E eu acho que ele vai pra marketing também. É, vai seguir o caminho da família, né?

34:56 - Gustavo F. S. da Silva
  Vai seguir o caminho da família.

34:58 - Henrique Miranda
  E...

34:59 - Gustavo F. S. da Silva
  E...

35:00 - Henrique Miranda
  Ele tá aprendendo a mexer nos negócios, tipo... Já vai botar ele de estagiário aí, né? É, no Lobo, ele tá fazendo uns paradigmas legais no Lobo, mano.

35:08 - Gustavo F. S. da Silva
  É, velho. O Lobo é foda, mano. Segurança, assim, é zero, velho. É zero, né, velho? Dependendo do que for lançar, dependendo do que ele tá fazendo aí, mano, é...

35:21 - Henrique Miranda
  É, mas aí ele tá... É mais pra ele brincar mesmo, aprender, sabe?

35:26 - Gustavo F. S. da Silva
  É que tem, mano, tem uns caras, tipo, é que tô no MBA lá de IA, né? Aham. Mano, tem uns caras que fazem uns bagulhos no Lobo e acham que é, tipo, mano...  O gênio do... É, exatamente, sou piroca do desenvolvimento aqui, eu sou foda. Daí, mano, você entra, assim, na solução do cara, velho, e você consegue hackear em 30 segundos, tá ligado?  Ah, Aí você fala, mano... E isso daí dá mau problema, mano, porque se você lança um bagulho na internet...  Mudeu, né, velho? Tipo, você tem que tá indo de acordo certinho com a LGPD, porque senão a... Tchau. Tchau.  Acho que é a NAC. Ela fica vistoriando essas paradas. Se você tiver desacordo, mano, você toma processo, tio. E processo é, mano, a multa é grave, tá?  A multa é grande, mano. É foda, né?

36:13 - Henrique Miranda
  Principalmente esses negócios do cadastro, né, velho?

36:15 - Gustavo F. S. da Silva
  Então, mexe com o dado de pessoa, cara. É tensa, bem... Tem que tomar bastante cuidado. Mas é isso, mano.  Não vou tomar muito tempo, não. Eu vou montar... Falei, mano.

36:28 - Henrique Miranda
  Vou te falar só outra coisa que seria interessante também, cara. Se tivesse uma área de controle financeiro, aí, é claro, coloquei só pra mim.  Então, tipo, pra eu registrar, eu coloco lá qual que são os clientes, qual que é o dia que inicia o contrato, qual que é dia que termina o contrato.  O dia que eu tenho que... Se tivesse um negócio que eu, tipo, o dia que eu tenho que emitir a nota, e aí eu tenho que pegar pra falar que eu recebi o dinheiro.  Se eu não receber o dinheiro, eu tenho que cobrar o cliente do... O pagamento, aí claro, não automatizar a cobrança, né, que isso aí, desligante, né, porque cada cliente tem um, tem um que vai ligar, tem outro que você vai fazer uma pressão, né, tá ligado como que é, né, tem outros que você sabe que vai pagar, vai pagar atrasado todo mês, então.  É, que dá aquelas canseiras pra pagar pra caralho. Aquelas canseiras, aí cada um, começa a ligar a função, parte financeira, assim.  Tá, não, fechou.

37:24 - Gustavo F. S. da Silva
  É, eu já tinha pensado aqui em fazer um, é um, tipo, um acesso de mim e um acesso só pra social media.  Isso. E a designer, você abandonou?

37:34 - Henrique Miranda
  Não, não tem a designer ainda, só que aí, isso, o que eu tenho? Eu tenho um calendáriozão no Notion, que aí eu faço tudo aí, eu acho que é melhor manter o processo que já funciona, né.  Eu acho que ali seria só pra ter organizado, tipo assim, o que que já foi feito, o que que falta e, tipo, cliente, acho que é mais fácil do que ir.

37:50 - Gustavo F. S. da Silva
  Não, fechou, só pra ter uma ideia mesmo de, dos acessos, né, basicamente dois acessos e tá resolvido, né. É.

37:57 - Henrique Miranda
  Cara, eu conheci um cara, velho. que ele tinha uma agência que era 100% Cuiar e ele só vendia para a Europa, olha como que bagulho dele era um negócio de retardado cara, ele criava aqueles e-mail marketing, só que tá ligado tipo por a vida que é uma imagem zona gigante?  Sei, tipo um HTMLzão. Tipo um HTMLzão, e ele fazia essa porra para a Yara e ele ficava vendendo aquela porra só para o europeu velho, e ganhando mano uma puta grana só fazendo isso, e velho o cara não tinha nenhum funcionário.  Era tudo Yara, e aí a única coisa que ele falou para mim que ele não tinha automatizado era a resposta do cliente, porque ele falou que tipo assim, o cara perguntava, ah por que que você usou laranja em vez de usar verde?  Aí a Yara dava uma puta bugada e falava tipo assim, ah não, porque o laranja é uma cor da natureza, que importa sei lá o que, etc.

38:51 - Gustavo F. S. da Silva
  E aí o cliente saca que, mano, essa filha da puta é Yara, tá ligado? Não tá fazendo nada igual.

38:56 - Henrique Miranda
  É, e que porra, ele falou que só tem uma pessoa que fica respondendo tá ligado? E

39:00 - Gustavo F. S. da Silva
  Caralho, mano. Mano, essa é a visão que eu vejo, mano. É tipo, cada vez mais automatizar o processo. Tipo, tem processo que dá para automatizar.  Tipo, manual, repetitivo. Mano, dá para automatizar. Não tem porque ficar perdendo tempo com isso. Mas tem algumas coisas ainda que dependem muito de um ano, mano.  É foda.

39:17 - Henrique Miranda
  Tipo assim, para produto funciona bem o time de sucesso diferente para IA. Porque o produto é aquilo, ele só faz aquilo em qualquer coisa.

39:23 - Gustavo F. S. da Silva
  exatamente.

39:24 - Henrique Miranda
  Agora, para serviço, a IA ainda dá uma bugada para... É, dependendo da, tipo...

39:32 - Gustavo F. S. da Silva
  É porque não tem a mesma cabeça, o mesmo conhecimento, tá ligado? Não é como se a gente tivesse, tipo...  Tá ligado? Obsidian, segundo cérebro? Sim, tá ligado. Então, tem algumas que já estão integrando com Obsidian. Aí já fica interessante, porque aí ela coleta, tipo, todo o seu conhecimento.  Faz um bancozão de dados vetorial e aí ela fica consultando o teu conhecimento. Daí fica mais... Fica melhor as respostas.  Sim, sim..ииos A.

39:59 - Henrique Miranda
  P. É. Obrigado. Mas, mano, é muita evolução, velho.

40:03 - Gustavo F. S. da Silva
  É muita coisa. Mas fechou, velho. Eu vou montar a proposta e até amanhã, fim da tarde, eu mando.

40:11 - Henrique Miranda
  Fechado, velho. Fica lá, mano.

40:15 - Gustavo F. S. da Silva
  Fala, mano. Até mais.
___