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

`RESPOSTA (fazer só B agora? incluir A? quais idiomas?):`

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

`RESPOSTA (canal e horário):`

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

`RESPOSTA (fico em A por enquanto, ou já quer C?):`

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

`RESPOSTA (escopo de memória, e soul.md em código ou editável?):`

---

## 6. Nome do repositório

**Contexto.** Você concordou em renomear depois da faxina, e observou que ao
renomear a pasta local seus chats e copilots perdem o contexto.

Fica registrado aqui só para não se perder: **primeiro** a faxina (Opensquad
apagado), **depois** a pasta local, **depois** o remoto.

`RESPOSTA (nome final):`

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
