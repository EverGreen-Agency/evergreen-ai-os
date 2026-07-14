# Parecer Codex - Mega Plataforma EG

**Data:** 2026-07-06  
**Status:** revisao tecnica em rascunho, nao decisao aprovada  
**Uso pretendido:** insumo para Eduardo, Juiz e proximas rodadas de especificacao/ADR

## 1. Minha leitura da plataforma

A Mega Plataforma EG e o sistema operacional proprietario da EverGreen. Ela nao transforma a EG em agencia 360 comum e nao contradiz a boutique premium: a plataforma e o moat operacional que permite entregar boutique com mais padrao, velocidade, inteligencia e retencao.

Ela deve nascer em camadas:

1. **Uso interno EG:** cockpit, bancos, squads, playbooks, kits, BI, operacao, gestao de clientes, financeiro, juridico e memoria institucional.
2. **Uso EG com clientes:** client hub, dashboards, Raio-X, aprovacoes, entregaveis, roadmap, SLA, visibilidade de valor e experiencia premium.
3. **Uso do cliente:** portal e ferramentas em que o cliente opera partes do proprio crescimento com governanca da EG.
4. **White-label/SaaS:** a mesma base modular pode atender parceiros, agencias ou clientes com marca propria, respeitando isolamento, billing, permissoes e limites comerciais.

O foco inicial correto e dogfooding: a EG usa primeiro para operar melhor. Depois o que estiver maduro vira interface de cliente. Por ultimo, o que provar valor e seguranca pode virar produto/white-label.

## 2. O que foi avaliado

Artefatos de engenharia lidos nesta rodada:

- `_opensquad/_memory/engenharia/mega-plataforma/PLANO-MESTRE.md`
- `mega-plataforma-classificacao-EG.md`
- `_opensquad/_memory/engenharia/mod-multitenant/spec.md`
- `_opensquad/_memory/engenharia/mod-multitenant/adr/ADR-0001-stack-base.md`
- `_opensquad/_memory/engenharia/mod-multitenant/adr/ADR-0002-auth.md`
- `_opensquad/_memory/engenharia/mod-multitenant/adr/ADR-0003-banco-isolamento.md`
- `_opensquad/_memory/engenharia/client-hub/spec.md`
- `_opensquad/_memory/engenharia/mod-bi-dashboards/spec.md`
- `_opensquad/_memory/banco_arquitetura/arquitetura.md`
- `_opensquad/_memory/banco_ideias/docs/mega-plataforma.md`
- codigo atual do `dashboard/` via CodeGraph

Anexos de contexto avaliados por leitura direta, busca estrutural ou extracao:

- `Mega-Plataforma-parte-1.md`
- `abstracao-bi.md`
- `auditoriaevergreenseogeo.md`
- `analise-gemini-onboarding-deepseek.md`
- `Gemini-analise-kelvin-cleto.md`
- `meta_ads_dashboard_prompt.md`
- `Reuniao-HM_Conexoes.md`
- `documentacao-referencia-tecnica.md`
- `_opensquad/_memory/knowledge/EG_Playbook_Metodologia.md`
- `_opensquad/_memory/knowledge/EG_Raio-X_Comercial.md`
- `_opensquad/_memory/knowledge/Documento-Mestre_EG.md`
- `_opensquad/_memory/knowledge/EG_Producao_de_Kits.md`
- `Planilha-Orcamentaria.xlsx` por abas/amostras estruturais
- `Proposta_EverGreen_HM_Conexoes_Poderosas_v3.pdf` por extracao textual; imagens internas do PDF ainda nao foram avaliadas visualmente

## 3. Avaliacao dos artefatos existentes

O `PLANO-MESTRE.md` esta correto como trilho principal. Ele separa bem: ideia guarda-chuva, fundacao multitenant, client-hub, BI e demais modulos. Tambem acerta ao exigir spec + ADR antes de codigo.

A spec de `mod-multitenant` esta no caminho certo. Ela entende que o problema inicial nao e "tela bonita", e sim identidade, organizacoes, permissoes, isolamento de dados, auditoria e fronteira entre memoria interna em JSON/git e produto com banco.

Os ADRs 0001-0003 sao bons rascunhos, mas precisam de uma rodada de higiene antes de aprovacao: alguns textos estao com encoding quebrado, e o ADR de auth faz afirmacoes de custo/regiao que devem ser checadas em fontes oficiais antes de virar decisao.

As specs de `client-hub` e `mod-bi-dashboards` sao bons primeiros rascunhos, mas chegaram cedo. Elas devem continuar como fase 1, dependentes de decisao da fundacao. O risco e o projeto pular para UX premium sem antes resolver tenant, auth, credenciais OAuth, auditoria e dados.

O arquivo `mega-plataforma-classificacao-EG.md` deve ser tratado como referencia historica/draft de outra IA. Ele e util para comparar raciocinio, mas a fonte operacional deve ser `ideas.json`, `mega-plataforma.md`, `arquitetura.md` e os artefatos de engenharia.

## 4. Lacunas e riscos

- **Fonte da verdade:** existe conflito entre `Platform` em alguns documentos e o schema v1.1 do banco de ideias, que aparentemente usa categorias existentes como `Infra`, `Cockpit`, `Skill`, etc.
- **Encoding:** varios documentos novos aparecem como mojibake. Antes de aprovar como base permanente, vale normalizar para UTF-8.
- **Pesquisa externa:** decisoes sobre Auth, hosting, regiao, custo, DPA e data residency precisam de fontes oficiais atualizadas.
- **PDF HM:** o texto foi extraido e entendido como blueprint tecnico/funcional. As imagens/telas do PDF ainda precisam de inspecao visual separada se forem virar referencia de UI.
- **Financeiro/readiness:** a planilha mostra restricao real de caixa/metas. Isso reforca faseamento lean: nada de grande time ou plataforma externa cara antes de validar P0/P1.
- **Escopo:** modulos como trading, telecom/chips, CMS, juridico e RH devem ficar separados ou em backlog ate a fundacao provar valor.

## 5. Proximos passos recomendados

1. Fechar ADRs P1-P8 de `mod-multitenant`.
2. Corrigir ou anexar notas de validacao aos ADRs 0001-0003, sem sobrescrever trabalho paralelo.
3. Eduardo aprova/rejeita as decisoes P1-P8.
4. Gerar `tasks.md` e `scaffold.md` de `mod-multitenant`.
5. So depois disso, formalizar specs completas de `client-hub` e `mod-bi-dashboards` no template do `eg_engenharia`.
6. Rodar benchmark das respostas das LLMs com uma matriz comum: mesma entrada, mesma lista de fontes, extracao de decisoes, conflitos, lacunas, riscos, proximos passos e nota cega do Juiz.

## 6. Benchmark das LLMs

O benchmark deve ser processado como avaliacao de decisao, nao como "qual texto ficou mais bonito".

Formato sugerido:

- **Input fixo:** mesmo prompt, mesmos documentos e mesma regra de nao inventar fonte.
- **Output padrao:** resumo da plataforma, mapa de modulos, riscos, ADRs sugeridos, specs sugeridas e lacunas.
- **Extracao cega:** uma tabela separa as decisoes de cada LLM sem nome do modelo.
- **Rubrica:** coerencia com EG, aderencia aos documentos, risco tecnico, pragmatismo financeiro, sequenciamento, originalidade util e capacidade de apontar incertezas.
- **Juiz:** compara divergencias e gera uma decisao consolidada, mantendo "empate tecnico" onde faltar dado.

Minha recomendacao: nao escolher a LLM por voto. Escolher por qualidade das decisoes aproveitaveis e por capacidade de nao atropelar premissas da EG.
