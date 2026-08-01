# Decisões abertas — Bioma

Atualizado em 2026-08-01.

Cada bloco tem **contexto**, **opções**, **minha recomendação** e uma linha
`RESPOSTA:` para você preencher. O que estiver respondido eu implemento sem
voltar a perguntar; o que ficar em branco continua parado.

Decisões já fechadas não voltam para cá — elas viram comentário no código, que é
onde alguém as encontra quando importa. Este arquivo é só o que ainda trava.

---

## 1. Migração dos binários para o S3

**Contexto.** O que sobrou de material fora do banco é menor do que parecia:

| Arquivo | Tamanho |
|---|---|
| `_opensquad/_memory/knowledge/EverGreen - Manual de Marca.pdf` | 14,7 MB |
| `_opensquad/_memory/knowledge/inputs-mega-plataforma/Proposta_HM_Conexoes_v3.pdf` | 10,2 MB |
| `squads/eg_engenharia/output/.../referencia-prototipo-rian-pjebot.html` | 1,9 MB |
| `squads/eg_engenharia/output/.../Entregavel-PJe-TRF1-Fase1.pdf` | 0,5 MB |

Todo o resto é markdown e já está no Postgres. Os 30 MB de
`_opensquad/_browser_profile/` são cache do Playwright, gitignored — apaga sem dó.

O módulo de arquivos do Bioma já fala S3 via `boto3` com endpoint configurável
(`STORAGE_S3_*`). Falta só **provisionar o bucket** — nenhum ambiente tem hoje,
por isso `smoke_files` está na lista de exclusões da CI.

**O passo a passo, quando você decidir o provedor:**

1. Criar o bucket e gerar as chaves.
2. Preencher `STORAGE_S3_BUCKET`, `STORAGE_S3_REGION`, `STORAGE_S3_ENDPOINT_URL`,
   `STORAGE_S3_ACCESS_KEY_ID`, `STORAGE_S3_SECRET_ACCESS_KEY` no ambiente da API.
3. Rodar `python scripts/smoke_files.py` e tirar `smoke_files` do `SKIP` em
   `bioma/scripts/run_smokes.py` — a partir daí a CI cobre upload de verdade.
4. Subir os 4 arquivos pelo produto (Manual de Marca em Brand Book do workspace
   EG; os dois da proposta e o entregável do PJe em Arquivos do cliente).
5. Só então apagar `_opensquad/` e `squads/`, num commit separado.

A ordem importa: enquanto o arquivo não estiver no produto, apagar do repo é
perder. E a subida é manual de propósito — são 4 arquivos, escrever um script de
migração para isso custaria mais que fazer.

**Opções de provedor.**

| Opção | A favor | Contra |
|---|---|---|
| **Railway Buckets** | mesma plataforma do deploy, isolado por ambiente, sem conta nova | mais novo, menos rodagem |
| Cloudflare R2 | sem custo de egress, maduro | mais uma conta e mais uma fatura |
| AWS S3 | padrão de mercado | egress caro, console pesado |

**Recomendo Railway Buckets** — o ganho de não ter outra conta e outra fatura
vale mais que a diferença técnica, e trocar depois é mudar variável de ambiente.

`RESPOSTA:`

---

## 2. Campos do Radar Local

**Contexto.** Hoje o prospect guarda: nome, endereço, telefone, site, URL do
Maps, nota, número de avaliações, `presence_score`, `presence_gaps`, e o diff
contra o scan anterior (`changes`). O import de planilha entende as colunas por
alias em pt/en e ignora coluna não reconhecida — nunca chuta valor.

**Minha lista de lacunas** (palpite meu, você é quem sabe):

- **segmento/subnicho** — "clínica odontológica" é o termo da busca, não o que o
  negócio é; hoje isso se perde
- **ticket estimado** — muda quem vale abordar
- **já é atendido por concorrente** — muda o argumento inteiro
- **observação da call** — campo livre, para o que você aprendeu falando com eles
- **origem do contato** — indicação vs. frio muda a taxa de resposta

`RESPOSTA (quais campos faltam de verdade):`

---

## 3. Painel do copiloto — formato

**Contexto.** Hoje o copiloto está em três lugares e nenhum é uma porta de
entrada: Operação EG → IA, dentro do workspace do cliente, e `/` na caixa de
comentário de uma tarefa. Você pediu algo fixo, que percorra a operação com
você, na linha do Gemini dentro do Google Docs.

Já está pronto no backend: conversa contínua (`copilot_threads`), histórico
entre turnos, e trilha auditável por execução.

| Opção | Como é | A favor | Contra |
|---|---|---|---|
| **A. Painel lateral fixo, colapsável** | ocupa uma coluna à direita; a tela principal encolhe | contexto sempre visível; some da frente do conteúdo; é o padrão que você citou | come largura em tela pequena |
| B. Drawer sobreposto | abre por cima do conteúdo | não muda o layout | tapa justamente o que você está discutindo |
| C. Barra de comando (`Cmd+K`) | modal que abre e fecha | rápido para pergunta solta | não acompanha; volta ao problema de hoje |

**Recomendo A + C juntos**, que é o que Gemini/Docs e Cursor fazem: o painel é a
casa da conversa, e o `Cmd+K` é o atalho que abre o painel já com o foco no
campo. Não são alternativas — C é a porta, A é a sala.

Dois detalhes que valem decisão sua:

- **O painel lembra a conversa ao trocar de tela?** Recomendo que sim, com o
  escopo mudando junto: você continua o assunto, e ele passa a enxergar a tela
  nova. A alternativa (conversa por tela) faz perder o fio a cada navegação.
- **Ele aparece por padrão aberto ou fechado?** Recomendo fechado no primeiro
  acesso e depois lembrando seu último estado.

`RESPOSTA:`

---

## 4. Follow-up ativo — com que frequência ele pode te interromper

**Contexto.** O copiloto já consegue perceber coisa que merece sua atenção
(entrega atrasada, aprovação parada, conexão de dados velha). Falta decidir como
ele te avisa. É a diferença entre assistente e notificação chata.

| Opção | Como é |
|---|---|
| **A. Resumo diário único** | uma vez por dia, tudo junto, sem push individual |
| B. Push por evento | avisa na hora de cada coisa |
| C. Só quando você perguntar | zero interrupção |

**Recomendo A.** B vira ruído em uma semana e você desliga; C desperdiça o fato
de ele já saber.

`RESPOSTA:`

---

## 5. Nome do repositório

**Contexto.** `evergreen-ai-os` contendo `bioma/` está invertido — o produto é o
Bioma. Renomear o remoto quebra remotes locais, CI e o link do Vercel até serem
reapontados.

**Recomendo renomear depois da faxina** (decisão 1), num momento sem sessão
paralela com trabalho pendente.

`RESPOSTA (nome e quando):`

---

## 6. Custo de IA — o que fazer quando o modelo não tem preço

**Contexto.** A trilha do copiloto registra token e custo por execução. O preço
vem de `bioma_api/model_pricing.py`, uma tabela em código, versionada em git.
Modelo que não está lá fica com **custo em branco** — e a execução aparece em
`runs_without_cost` no resumo de consumo, em vez de virar zero e sumir da conta.

Foi escolha minha não estimar. Custo estimado que ninguém consegue conferir
contra a fatura é pior que campo vazio: ele parece conferido.

**Se você preferir o contrário**, dá para estimar pelo preço da família do
modelo e marcar o número como aproximado na interface.

`RESPOSTA (manter em branco ou estimar marcado):`

---

## Já respondido e implementado

- Score de fit por palavra-chave: **removido**. `fit_score` fica nulo até alguém
  pedir "Avaliar com IA"; nulo é "não avaliado", diferente de zero.
- Inventário de gaps: saiu da lista fixa de sete termos. Agora é a união de Tech
  Radar (anéis adopt/trial), inventário comercial e projetos concluídos, e cada
  item vai com a evidência de onde veio.
- Ações do copiloto: reversível executa direto com dica de desfazer; visível ao
  cliente sempre pede confirmação.
- Busca na web: permitida, sempre com fonte — inclusive quando o dado é do Bioma
  (cita tabela/tela).
- Escopo do copiloto: **só EG**.
- Skill proposta pelo agente: só vale depois de aprovação humana.
- Flexibilidade: configuração **sim**, composição **sim**, definição **não**.
