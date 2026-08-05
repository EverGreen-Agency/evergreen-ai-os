# Decisões abertas — Bioma

Atualizado em 2026-08-02.

Cada bloco tem **contexto**, **opções**, **minha recomendação** e uma linha
`RESPOSTA:` para você preencher. O que estiver respondido eu implemento sem
voltar a perguntar; o que ficar em branco continua parado.

Decisão respondida sai daqui e vira comentário no código, que é onde alguém a
encontra quando importa. O histórico fica no git. Este arquivo é só o que ainda
trava — se ele encolhe, é sinal bom.

---

## 1. Campos do Radar Local

**Contexto.** Hoje o prospect guarda: nome, endereço, telefone, site, URL do
Maps, nota, número de avaliações, `presence_score`, `presence_gaps`, e o diff
contra o scan anterior (`changes`).

**Minha lista de lacunas** (palpite meu, você é quem sabe):

- **segmento/subnicho** — "clínica odontológica" é o termo da busca, não o que o
  negócio é; hoje isso se perde
- **ticket estimado** — muda quem vale abordar
- **já é atendido por concorrente** — muda o argumento inteiro
- **observação da call** — campo livre, para o que você aprendeu falando com eles
- **origem do contato** — indicação vs. frio muda a taxa de resposta

`RESPOSTA (quais campos faltam de verdade):`

---

## 2. Idioma e tradução

**Contexto.** Você prospecta em plataformas gringas e pode ter cliente
estrangeiro. Hoje o Bioma é 100% pt-BR: interface, e-mails, propostas públicas e
as respostas do copiloto.

São **três problemas diferentes**, e tratá-los como um só é o erro comum:

| Camada | O que é | Custo |
|---|---|---|
| **A. Interface** | rótulos, botões, mensagens de erro | ~2.000 strings hoje espalhadas em JSX; extrair é o trabalho, traduzir é barato |
| **B. Conteúdo gerado** | proposta, briefing, resposta do copiloto | quase de graça: é um parâmetro no prompt |
| **C. Conteúdo do cliente** | nome de tarefa, comentário, entrega | ninguém deveria traduzir automaticamente — muda o que a pessoa escreveu |

**Recomendo fazer B agora e A depois**, nesta ordem, por um motivo prático: B
resolve o caso que você tem hoje (proposta para cliente gringo, mensagem de
prospecção em inglês) com um campo de idioma no workspace e uma linha no prompt.
A é semanas de trabalho mecânico que só paga quando existir um usuário
estrangeiro logado no Bioma — e hoje não existe. C não deve ser feito nunca de
forma automática; no máximo um botão "traduzir" sob demanda, que deixa claro que
o original é o original.

Para A, quando for a hora: `react-i18next` é o padrão, e a migração pode ser
incremental (arquivo por arquivo) sem parar o resto.

`RESPOSTA (fazer só B agora? incluir A? quais idiomas?):` Cara, faça o B agora, mas tem uma questão, teria como ter o conteúdo geral no idioma origianal (supondo que seja para um lead americano, logo em inglês) e em português (para nossa equipe)? Só que sem precisar gerar dois materiais? tipo, dentro da nossa plataforma, só um botão de troca de idioma ou algo similar ao google tradutor automático que tem em todos sites. E o A deixe para depois para não consumir muita cota agora.

**Resposta (2026-08-04).** Dá, e o desenho certo não é "gerar dois materiais" —
é **um artefato, um idioma canônico, traduções em cache**.

O material nasce num idioma só: o do destinatário. Inglês, se o lead é
americano. Esse é o **original**, e é ele que sai pelo link público — o cliente
nunca vê tradução.

Para a equipe, um botão "ver em português" na tela interna. Na primeira vez ele
traduz e **guarda**; da segunda em diante é leitura de banco, custo zero. Como
proposta muda pouco depois de enviada, na prática você paga uma tradução por
proposta, não uma por visualização.

Três coisas que precisam ficar explícitas na tela, e é onde o "Google Tradutor
automático" erra:

- **a tradução é marcada como tradução**, com o idioma original ao lado. Uma
  cláusula comercial lida em tradução e assumida como original é o tipo de erro
  que aparece na renegociação;
- **editar só vale no original.** Se alguém corrige um valor na versão traduzida,
  ou a correção se perde ou o original passa a mentir. Tradução é somente
  leitura, e editar o original invalida o cache;
- **o widget do Google traduz a interface junto** e mistura rótulo do sistema com
  conteúdo. Aqui é o inverso: traduz só o conteúdo, e a interface (item A) fica
  para depois, como você pediu.

Custo: usa a mesma cota da assinatura pelo plano de roteamento. Não é chamada
nova de provedor.

---

## 3. Follow-up ativo — formato do resumo diário

**Contexto.** Você aprovou o resumo diário único (sem push por evento). Falta
decidir o **canal** e o **horário**, que mudam a implementação:

| Opção | Como é | Implicação |
|---|---|---|
| **A. Dentro do Bioma** | card no cockpit ao abrir | zero infra nova; só vê quem entrar |
| B. WhatsApp | usa o provedor que já existe | precisa do seu número cadastrado e de opt-out |
| C. E-mail | resumo às 8h | precisa de provedor de e-mail transacional (não temos) |

**Recomendo A para começar** — funciona amanhã e não depende de infra nova. B é
o passo natural depois, porque o canal já existe no Bioma.

`RESPOSTA (canal e horário):` Opção A, como recomendou.

---

## 4. Custo de IA — preço vem de onde

**Contexto.** Você perguntou se não existe endpoint para puxar preço de modelo.

A resposta separada em duas partes, porque são coisas diferentes:

- **Preço por token: não existe API pública.** OpenAI, Anthropic e Google
  publicam preço em página web, não em endpoint versionado. Qualquer coisa que
  "puxe preço automaticamente" estaria raspando uma página de marketing — que
  muda de layout sem aviso e quebraria calado, gravando custo errado no banco.
  Por isso a tabela está em `bioma_api/model_pricing.py`, versionada em git: o
  histórico de preço fica auditável junto com o código, e atualizar é um commit
  de uma linha.

- **Gasto real: existe, sim.** A OpenAI tem a Costs API
  (`GET https://api.openai.com/v1/organization/costs`), que devolve o gasto
  diário — o número da fatura, não uma conta nossa. Duas pegadinhas: exige uma
  **chave de admin da organização**, diferente da chave de projeto que o Bioma
  usa hoje; e só um **Organization Owner** consegue criar essa chave.
  ([referência da API](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/usage/methods/costs),
  [cookbook](https://developers.openai.com/cookbook/examples/completions_usage_api),
  verificado em 2026-08-02)

Isso abre uma terceira opção melhor que as duas anteriores:

| Opção | Como é |
|---|---|
| A. Manter como está | preço em código; modelo desconhecido fica sem custo |
| B. Estimar pela família | número aproximado, marcado como tal |
| **C. Reconciliar com a fatura** | mantém A **e** puxa o gasto real da Usage API, mostrando os dois lado a lado |

**Recomendo C**, mas em duas etapas: A já está no ar e funciona; C entra quando
você gerar a chave de admin. O valor de C não é o custo por execução — é
descobrir que a soma do que o Bioma achou que gastou não bate com a fatura, que
é exatamente o erro que ninguém percebe sozinho.

`RESPOSTA (fico em A por enquanto, ou já quer C?):`Podemos ir para C porém uma coisa, esqueci mas não estamos usando o cobrança por subscrição/cota das assinaturas? Então basicaemnte não seria ver nossa assintatura, quantidade usada da cota por requisição e calcular a combase no que pagamos de assinatura?

**Resposta (2026-08-04).** Você está certo, e isso derruba a premissa das três
opções acima. Elas assumiam cobrança por token, que é o modelo da chave de API.
Com assinatura, **o token não custa nada na margem** — você já pagou o mês. O
que custa é a **cota**, que é finita e não acumula.

Então a pergunta certa não é "quanto essa execução custou", é **"quanto dessa
cota essa execução consumiu, e quanto sobrou até o reset"**. São coisas
diferentes: a primeira é contabilidade, a segunda é operação. Estourar a cota na
terça-feira para pela metade da semana; um relatório de custo não avisa isso.

O modelo certo, então:

| Camada | O quê |
|---|---|
| **Custo de referência** | `preço da assinatura ÷ cota do período` = quanto vale uma unidade. Serve para comparar execuções entre si e responder "vale a pena rodar isso 200 vezes?" |
| **Cota restante** | o número que importa no dia a dia — quanto sobrou e quando reseta |
| **Chave de API** | só aí o custo é dinheiro de verdade, e a tabela de preços vale |

Duas coisas que a infraestrutura já tem e ninguém está usando:
`ai_provider_subscriptions` (com o valor pago) e `ai_quota_buckets` (com
`remaining_percent` e `resets_at`, alimentado por `quota_collectors.py`).

O que falta é ligar: registrar as unidades consumidas por execução no bucket, e
derivar o custo de referência. Com isso o painel deixa de mostrar "US$ 0,0032" —
que é ficção quando a cobrança é assinatura — e passa a mostrar "3% da cota
semanal do Claude Code, reseta quinta".

**Implementado em 2026-08-04.** `copilot_runs` liga cada execução à conta que
respondeu; a trilha lê a cota ATUAL dessa conta (`ai_quota_buckets`, que já
integra com o contrato oficial `account/rateLimits/read` do Codex — reportado
pelo próprio provedor, não estimativa). `/copilot/usage` mostra `routed_runs` e
`routed_accounts` com a cota de cada uma. Não implementei o "custo de
referência" (preço da assinatura ÷ cota do período) que eu tinha sugerido: sem
um número confiável de unidades-por-dólar publicado pelo provedor, seria outro
número inventado — melhor mostrar a cota real, que existe de verdade, do que
uma conversão para dólar que não existe. A Costs API da OpenAI (opção C)
continua valendo só para o que roda por chave de API, não por assinatura.

De quebra, achei e corrigi um bug: execução roteada por assinatura podia
ganhar um custo em dólar FALSO quando o `model_id` da conta coincidia por acaso
com um nome precificado na tabela. Corrigido — execução de assinatura nunca
aplica preço por token.

Falta só você registrar as contas (Operação EG → IA) para isso ganhar vida —
hoje `ai_provider_accounts` está vazia, então o painel não mostra nada ainda.

---

## 5. Memória e alma do agente — escopo e personalização

**Contexto.** Sua pergunta: como a memória (`memory.md`) e a identidade
(`soul.md`) do agente são gerenciadas, e como ele se comporta por
local/workspace/cliente e por usuário.

**O que já existe hoje** (tabela `agent_memories`, migração 0070):

- **Memória global** (`workspace_id = NULL`) — vale em toda a EG. É o mais
  próximo de `soul.md`: tom de voz, princípios, o que nunca fazer.
- **Memória de workspace** — vale só naquele cliente. "A Univet prefere reunião
  na sexta" não deve vazar para outro cliente, e não vaza (tem smoke provando).
- **Toda escrita gera revisão** (`agent_memory_revisions`) — dá para ver o que
  mudou e quando.
- **Habilidades** (`agent_skills`) — procedimento aprendido, com o mesmo escopo,
  e que **só entra em uso depois de aprovação humana**.

**O que NÃO existe, e é a sua pergunta de verdade: memória por usuário.** Hoje a
memória é da EG e do cliente, nunca sua. Se você e outra pessoa da EG usarem o
copiloto, os dois recebem o mesmo dossiê.

| Opção | Como é | A favor | Contra |
|---|---|---|---|
| **A. Três escopos: global + workspace + usuário** | acrescenta `user_id` na memória | ele aprende seu jeito sem impor aos outros | uma pessoa pode "ensinar errado" e ninguém vê |
| B. Manter dois escopos | como está | tudo é auditável por todos | ele nunca personaliza para você |
| C. Escopo de usuário só para preferência | fato e diretriz continuam coletivos | separa "como falar comigo" de "o que é verdade" | mais um conceito para entender |

**Recomendo C.** A distinção que importa não é quem escreveu, é **o que é
preferência e o que é fato**. "Prefiro resposta curta, sem introdução" é seu.
"O contrato da Univet vence em março" é da EG, e não pode depender de quem
perguntou. C dá personalização sem fragmentar a verdade.

Sobre `soul.md`: hoje a identidade está em código (as instruções do modelo, em
`bioma_worker/copilot.py`). Movê-la para memória global editável te deixaria
ajustar o tom sem deploy — mas também deixaria alguém quebrar o copiloto por
acidente. Recomendo **manter em código** e usar memória global para o que é
ajuste fino.

`RESPOSTA (escopo de memória, e soul.md em código ou editável?):`pode manter o soul em código por enquanto. E o escopo da memória, não entendi bem a diferença de A para C. Acho interessante saber o que cada usuário fez com o copiloto também, mas acho que independente dessas opções, é rastreável.

**Resposta (2026-08-04).** A diferença é **o que pode ser privado**, e o exemplo
deixa claro. Suponha que você diga ao copiloto: *"a Univet vence o contrato em
março, e me responda sempre sem introdução"*. São duas coisas numa frase.

**Opção A — escopo por usuário, sem distinção.** As duas viram memória sua. O
copiloto passa a responder curto **para você** (certo) e a saber do vencimento
**só quando você pergunta** (errado). Outra pessoa da EG abre a mesma tela e o
copiloto não sabe do contrato. Um fato da empresa virou segredo pessoal por
acidente — porque quem digitou foi você.

**Opção C — separa por natureza.** "Responda sem introdução" é preferência e
fica sua. "A Univet vence em março" é fato e vai para a memória do workspace,
que todo mundo enxerga. O critério não é **quem escreveu**, é **o que é**.

Concordo com sua observação de que rastreabilidade é ortogonal: a trilha já
registra quem rodou o quê, com qual memória, em `copilot_runs` — e isso vale nas
duas opções. Não é argumento para nenhuma.

Fica **C**, então, salvo objeção sua. Implicação prática: a memória ganha um
campo de escopo pessoal, e o copiloto classifica ao gravar — com você podendo
corrigir a classificação, porque ele vai errar às vezes.

**Implementado em 2026-08-04.** `agent_memories` ganhou `owner_user_id`
(banco recusa em qualquer categoria que não seja `preference` — não confia só
no código). O dossiê de cada pessoa traz fato/diretriz sempre, e preferência só
a dela; a listagem administrativa continua mostrando tudo, com selo de quem é
o dono — rastreabilidade não é a mesma coisa que vazar no dossiê de outra
pessoa. Tem botão pra corrigir a classificação quando o copiloto errar.

---

## 6. Nome do repositório

**Contexto.** Você concordou em renomear depois da faxina, e observou que ao
renomear a pasta local seus chats e copilots perdem o contexto.

Fica registrado aqui só para não se perder: **primeiro** a faxina (Opensquad
apagado), **depois** a pasta local, **depois** o remoto.

`RESPOSTA (nome final):`

---

## 7. Context Engine — por onde começar

**Contexto.** `EG_CONTEXT_ENGINE_FEATURE_HANDOFF.md` define a feature inteira em
4 fases. Não comecei porque construir metade dela é pior que não começar: uma
base de conhecimento que responde sem citar direito, ou que vaza entre
organizações, destrói a confiança em tudo que ela devolver depois.

**O que o Bioma já tem, e que encurta bastante a Fase 1:**

| Peça do contrato | O que já existe |
|---|---|
| object storage | `services/storage.py` (S3, configurado na Railway) |
| extração de texto | `attachment_text.py` — txt, md, csv, json, PDF via pypdf |
| índice lexical | Postgres full-text, nativo |
| ledger de runs | o padrão de `copilot_runs` (etapas, tokens, duração, fontes) |
| tenancy | `organization_id`/`workspace_id` em todo o esquema |
| adaptadores de modelo | plano de roteamento com cota de assinatura |

Falta, de verdade: `knowledge_bases` / `documents` / `versions` / `chunks`, o
chunking que respeita estrutura, a busca com citação que abre na origem, e a
tela de inspeção de fragmentos.

**O corte vertical que proponho** (Fase 1 do handoff, sem Fase 2-4):

1. criar base → 2. enviar Markdown/PDF → 3. extrair e fragmentar → 4. inspecionar
e desativar fragmento → 5. buscar por texto → 6. abrir a citação na origem →
7. run registrado.

Sem embeddings, sem persona, sem reranker — e a API já devolvendo
`modeActuallyUsed: "lexical"` com `capabilities.dense: "unavailable"`, para a
Fase 3 entrar sem quebrar contrato e sem ninguém achar que houve busca híbrida.

**A pergunta que trava:** a primeira base é do **cliente** (documentos da Univet,
consultáveis no hub dela) ou da **EG** (políticas, processos, contratos-modelo)?
Muda quem enxerga por padrão, e a decisão errada aqui é cara de desfazer.

`RESPOSTA (começar pela base da EG ou do cliente?):`

---

## Fechadas — implementadas, não precisam voltar

- **S3**: já configurado na Railway. Falta subir os 4 arquivos e apagar
  `_opensquad/` + `squads/`.
- **Painel do copiloto**: painel lateral colapsável + `Ctrl+K`, conversa
  acompanha a troca de tela, fechado no primeiro acesso e depois lembra o
  estado. Implementado.
- **Follow-up**: resumo diário único, sem push por evento. (Canal na decisão 3.)
- **Score de fit**: removido. Nulo até "Avaliar com IA".
- **Inventário de gaps**: Tech Radar + inventário comercial + projetos
  concluídos, cada item com sua evidência.
- **Ações do copiloto**: reversível executa com dica de desfazer; visível ao
  cliente sempre pede confirmação.
- **Busca na web**: permitida, sempre com fonte — inclusive quando o dado é do
  Bioma (cita tabela/tela).
- **Escopo do copiloto**: só EG.
- **Skill proposta pelo agente**: só vale depois de aprovação humana.
- **Flexibilidade**: configuração sim, composição sim, definição não.
- **Guia de integração**: virou modal; o "PDF" quebrado (que imprimia a
  aplicação inteira) foi removido.
- **Memória por natureza**: preferência é pessoal, fato/diretriz são
  compartilhados. Corrigível quando o copiloto classificar errado.
- **Custo por cota**: execução roteada por assinatura mostra a cota real da
  conta, nunca preço por token inventado. Falta cadastrar as contas para
  ganhar vida.
