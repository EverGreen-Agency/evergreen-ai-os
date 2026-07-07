# Auditoria Técnica + GEO — Site EverGreen (evergreenmkt.com.br)

**Data:** 21/06/2026
**Escopo:** SEO técnico · GEO (otimização para IA generativa) · Inventário de conteúdo vs. novo posicionamento
**Natureza:** Diagnóstico apenas — nenhum arquivo do site foi alterado, nenhum commit/publicação realizado.

---

## ⚠️ Nota de método e limitação de acesso (leia primeiro)

Este relatório foi rodado em um ambiente de execução remoto cujo **egress de rede está bloqueado** para o domínio. Na prática:

- **`curl` / acesso direto ao HTML:** bloqueado pelo proxy de rede (`host_not_allowed`). Não consegui ler o `view-source`, headers HTTP completos, `robots.txt`, `sitemap.xml`, `llms.txt` nem rodar Lighthouse.
- **WebFetch (fetcher da Anthropic):** retornou 403 para **qualquer** URL neste ambiente (testado inclusive em `example.com`), ou seja, está globalmente indisponível nesta sessão — não é bloqueio específico do site.
- **WebSearch (índice de busca):** **funcionou.** É a fonte de tudo abaixo.

**O que isso significa para a confiabilidade dos achados:**

| Tipo de achado | Confiabilidade | Fonte |
|---|---|---|
| Existência de páginas e URLs | Alta | URLs retornadas pelo índice |
| **Title tags** | Alta | Títulos retornados pelo índice (texto literal) |
| Conteúdo/posicionamento das páginas | Média-alta | Snippets + resumos do índice (paráfrase, não 100% literal) |
| Meta descriptions (texto exato e tamanho) | **Não verificável** | Exige fonte/HTML |
| H1, hierarquia de headings, alt text | **Não verificável** | Exige fonte/HTML |
| Canonical, schema/JSON-LD, viewport | **Não verificável** | Exige fonte/HTML |
| Velocidade (Lighthouse), peso, nº de requests | **Não verificável** | Exige fetch/crawler |
| `robots.txt`, `sitemap.xml`, `llms.txt` | **Não verificável** | Exige fetch direto |

**Como destravar os ~40% técnicos que faltam:** rode este mesmo prompt no **Claude Code local (terminal/desktop com internet)**, OU adicione `evergreenmkt.com.br` à allowlist de egress deste ambiente. Com acesso ao HTML eu fecho schema, canonical, alt text, headings, `robots/sitemap/llms.txt` e Lighthouse. Onde um item é não verificável, ele está marcado **[VERIFICAR NA FONTE]** — não inventei valores.

---

## Páginas localizadas (inventário de URLs)

Seis páginas confirmadas no índice. Não há sinal de páginas legais (privacidade/LGPD, termos) nem de landing pages dedicadas.

| # | URL | Title tag (verificado) |
|---|---|---|
| 1 | `https://evergreenmkt.com.br/` (home) | **Máquina de Vendas - EverGreen MKT - Máquina de Vendas** |
| 2 | `https://www.evergreenmkt.com.br/sobre` | Evergreen MKT \| Growth, Tecnologia e Resultados |
| 3 | `https://www.evergreenmkt.com.br/servicos` | Evergreen MKT \| Growth, Tecnologia e Resultados |
| 4 | `https://www.evergreenmkt.com.br/equipe` | Evergreen MKT \| Growth, Tecnologia e Resultados |
| 5 | `https://www.evergreenmkt.com.br/blog` | Evergreen MKT \| Growth, Tecnologia e Resultados |
| 6 | `https://www.evergreenmkt.com.br/contato` | Evergreen MKT \| Growth, Tecnologia e Resultados |

> **Sinal técnico imediato:** a home indexa no **apex** (`evergreenmkt.com.br`, sem www) enquanto as internas indexam em **www** — indício de inconsistência de canonicalização (www vs. não-www). E **5 das 6 páginas compartilham o título idêntico**. Ambos detalhados na seção SEO.

---

## 1. Resumo executivo — Top 5 problemas mais urgentes

1. **🔴 O site inteiro ainda é o posicionamento ANTIGO ("Máquina de Vendas" / agência de growth).** O produto/metodologia exibido é "Máquina de Vendas", com linguagem de funil de aquisição (ads → conversão → retenção) e "growth/tecnologia/IA". **Nada do novo posicionamento aparece**: sem "Sistema Raiz", sem "Raio-X Comercial", sem "boutique de previsibilidade comercial", sem níveis Semente/Muda/Árvore/Floresta, sem a escada de oferta paga. *(Técnico + conteúdo — estratégico)*

2. **🔴 O site promete FATURAMENTO/resultado financeiro do cliente — viola a garantia de cadência/execução.** Copy recorrente: "método que faz as empresas aumentarem seu faturamento", "foco total em resultado financeiro", "aumentar vendas com previsibilidade", "relatórios e conversas diárias centradas em crescimento de receita". Isso é **risco de expectativa/jurídico** e contradiz diretamente a regra da EG. *(Conteúdo — risco)*

3. **🔴 Cinco páginas com o MESMO title tag genérico** ("Evergreen MKT | Growth, Tecnologia e Resultados") + home com título duplicado ("Máquina de Vendas - EverGreen MKT - Máquina de Vendas"). Títulos são o ativo de SEO/GEO nº 1 e estão desperdiçados, sem keyword nem diferenciação por página. *(Técnico — alta)*

4. **🟠 Para uma IA generativa, hoje a EverGreen é "uma agência de máquina de vendas que aumenta faturamento com ads e IA".** Não existe uma definição categórica limpa ("EverGreen é uma consultoria boutique de previsibilidade comercial que faz X para Y"). Perguntada "o que é a EverGreen MKT?", a IA reproduz o posicionamento velho — exatamente o oposto do que o reposicionamento quer. *(GEO — alta)*

5. **🟠 Sinais de autoridade/E-E-A-T fracos e divergentes.** A página de equipe lista só **"Eduardo"** e **"Gustavo"** (primeiros nomes, sem sobrenome/cargo/LinkedIn). **"Guilherme Camacho" não aparece em lugar nenhum do site** — divergência a esclarecer. Sem cases com números, sem datas, blog aparentemente vazio. *(GEO + conteúdo — alta)*

---

## 2. SEO técnico — por página + site-wide

### Achados site-wide

| Problema | Severidade | Detalhe |
|---|---|---|
| **Títulos duplicados** em `/sobre`, `/servicos`, `/equipe`, `/blog`, `/contato` | 🔴 Alta | Todas com "Evergreen MKT \| Growth, Tecnologia e Resultados". Cada página precisa de título único e descritivo. |
| **Título da home duplicado/quebrado** | 🟠 Média | "Máquina de Vendas - EverGreen MKT - Máquina de Vendas" repete o termo — típico de conflito entre tema e plugin de SEO (título setado 2×). |
| **Títulos sem keyword do novo posicionamento** | 🔴 Alta (estratégico) | Nenhum título contém "previsibilidade comercial", "consultoria", "Sistema Raiz" etc. |
| **Inconsistência www vs. não-www** | 🟠 Média | Home indexada no apex, internas no www → risco de conteúdo duplicado/diluição de canonical. **[VERIFICAR NA FONTE]** se há 301 forçando um host. |
| **Páginas legais ausentes** (privacidade/LGPD, termos) | 🟠 Média | Não localizadas no índice. LGPD recomenda política de privacidade publicada. **[VERIFICAR NA FONTE]** |
| **Meta descriptions, canonical, schema, viewport, alt text, headings** | ⚪ [VERIFICAR NA FONTE] | Não recuperáveis sem HTML. Ver nota de método. |
| **Velocidade / Lighthouse / peso / requests** | ⚪ [VERIFICAR NA FONTE] | Lighthouse não pôde ser executado neste ambiente. |
| **Schema markup** (Organization, LocalBusiness, Service, FAQPage) | ⚪ [VERIFICAR NA FONTE] | Nenhum confirmável. Provável ausência (nenhum rich result observado); priorizar criação (ver GEO). |

### Por página (o que é verificável hoje)

| Página | Title | Meta description | H1 | Observação SEO |
|---|---|---|---|---|
| `/` home | "Máquina de Vendas - EverGreen MKT - Máquina de Vendas" | [VERIFICAR] — snippet sugere copy sobre "transformar caos comercial em previsibilidade / máquina de vendas" | [VERIFICAR] | Título duplicado; posicionamento antigo; apex sem www. |
| `/sobre` | duplicado (genérico) | [VERIFICAR] | [VERIFICAR] | Título precisa virar algo como "Sobre a EverGreen — consultoria de previsibilidade comercial". |
| `/servicos` | duplicado (genérico) | [VERIFICAR] | [VERIFICAR] | Página-chave de conversão com título genérico; descreve oferta antiga. |
| `/equipe` | duplicado (genérico) | [VERIFICAR] | [VERIFICAR] | Oportunidade de E-E-A-T desperdiçada no título. |
| `/blog` | duplicado (genérico) | [VERIFICAR] | [VERIFICAR] | Sem posts indexados — blog vazio/raso (ativo SEO/GEO ocioso). |
| `/contato` | duplicado (genérico) | [VERIFICAR] | [VERIFICAR] | CTA atual = "Sessão Estratégica / diagnóstico gratuito". |

> **Itens do checklist que exigem a fonte para concluir:** unicidade de H1, hierarquia H2–H6, alt text em imagens, links internos quebrados/redirects em cadeia, âncoras vazias, canonical tags, HTTPS/SSL (provável OK — índice serve via https), viewport/responsividade, tamanho de página e nº de requests. Todos marcados **[VERIFICAR NA FONTE]**.

---

## 3. GEO — Otimização para IA generativa (ChatGPT, Perplexity, Gemini, AI Overviews)

### O que existe
- A metodologia exibida ("Máquina de Vendas") **está em texto indexável** (bom mecanicamente) — o problema é que é a metodologia **errada/antiga**.
- A marca é citável por IA hoje — mas com o **enquadramento velho** (testei: as IAs descrevem a EG como agência de máquina de vendas/growth que aumenta faturamento com ads + IA).

### O que falta (lacunas de GEO)
| Lacuna | Prioridade | Por quê |
|---|---|---|
| **`llms.txt` ausente** | 🟠 Média | [VERIFICAR NA FONTE], mas quase certamente inexistente. Criar depois de fixar o posicionamento. |
| **Definição categórica explícita** ("EverGreen é uma consultoria boutique de previsibilidade comercial que faz X para integradoras de energia solar") | 🔴 Alta | Sem isso, a IA continua citando o posicionamento antigo. É o item GEO mais importante. |
| **Conteúdo fragmentável** (frases autocontidas, definições, listas citáveis isoladamente) | 🔴 Alta | Copy atual é prosa de marketing genérica ("transformar caos em previsibilidade", "soluções integradas", "destravar o próximo nível") — pouco citável. |
| **FAQ estruturado + FAQPage schema** | 🟠 Média | Nenhum FAQ localizado. É o formato que mais alimenta AI Overviews/Perplexity. |
| **Metodologia própria nomeada e indexável** (Sistema Raiz: Raiz/Tronco/Ramos/Copa; Raio-X Comercial) | 🔴 Alta | Hoje **ausente** do site → invisível para busca E para IA. A IP da EG não existe para os modelos. |
| **E-E-A-T:** nomes reais c/ sobrenome e credenciais, cases com números, datas de publicação/atualização | 🔴 Alta | Hoje só "Eduardo"/"Gustavo" (1º nome); sem Guilherme Camacho; sem cases numéricos; sem datas. |
| **Schema Organization/Service** | 🟠 Média | Ajuda IA a desambiguar a marca (há várias "Evergreen" no Brasil — risco de confusão de entidade). |

### Linguagem genérica (prejudica SEO **e** GEO)
Termos recorrentes de baixa especificidade detectados: "soluções integradas", "resultados reais", "qualidade", "destravar o próximo nível", "growth/tecnologia". Substituir por especificidade (nicho solar, números, nomes próprios, metodologia nomeada) melhora as duas frentes simultaneamente.

---

## 4. Inventário de conteúdo — página por página (classificação)

**Legenda:** MANTER · ATUALIZAR · CORTAR · SEM CONTEXTO

| Página / elemento | Classificação | Justificativa (1 linha) |
|---|---|---|
| **Home `/`** | 🔴 CORTAR/REESCREVER | Construída sobre "Máquina de Vendas" + promessa de faturamento + funil de ads = modelo de agência antiga; reescrever para Sistema Raiz/previsibilidade. |
| **`/servicos`** | 🔴 CORTAR/REESCREVER | Descreve "consultoria de máquina de vendas", "full-stack acquisition", "diagnóstico gratuito"; substituir pela escada paga (Raio-X → Sprint → Retainer → Growth Partnership). |
| **`/sobre`** | 🟡 ATUALIZAR | Conceito válido, mas narrativa "Growth, Tecnologia e Resultados" é genérica/antiga; reposicionar como boutique de previsibilidade + história do reposicionamento. |
| **`/equipe`** | 🟡 ATUALIZAR | Manter a página (bom para E-E-A-T), mas só há "Eduardo"/"Gustavo" (1º nome); incluir sobrenomes, cargos, credenciais e **esclarecer ausência de Guilherme Camacho**. |
| **`/blog`** | 🟡 ATUALIZAR / SEM CONTEXTO | Existe mas sem posts indexados; se vazio = oportunidade GEO; se tiver conteúdo antigo de "máquina de vendas" = atualizar. **[VERIFICAR NA FONTE]** |
| **`/contato`** | 🟢 MANTER (com ajuste) | Página em si é neutra; só trocar o CTA "diagnóstico gratuito/sessão estratégica" pelo Raio-X Comercial pago. |
| Promessas de **faturamento/receita** (em toda parte) | 🔴 CORTAR | Viola a regra "garantia só de cadência/execução"; risco de expectativa. |
| Linguagem de **funil de ads** (atração via ads → conversão → retenção, A/B de anúncios, "vender mais com a internet") | 🔴 CORTAR | Remanescente direto da agência 360/performance; incompatível com boutique estratégica. |
| **IA / automações** como entrega atual (Gustavo "entrega resultados em escala com IA") | 🟠 CORTAR/VERIFICAR | Você sinalizou squads de IA/automações como possivelmente aspiracionais; só manter o que já está em produção. **[VERIFICAR INTERNAMENTE]** |
| **Plataforma própria (BI + login)** | ⚪ SEM CONTEXTO | Não localizada no índice; se existir em alguma página/PDF, classificar como CORTAR se ainda for projeto futuro. **[VERIFICAR NA FONTE]** |
| **"IPC"** (termo antigo do diagnóstico) | ⚪ SEM CONTEXTO | Não localizado no índice; confirmar na fonte se ainda aparece e substituir por "Raio-X Comercial". |
| Foco em **ICP de integradoras solares / persona Ricardo** | 🟡 ATUALIZAR (estratégico) | Site fala genérico "diversos segmentos B2B"; se a aposta é nichar em solar, comunicação precisa refletir. |

### Matriz: novo posicionamento × o que está no site

| Elemento do posicionamento ATUAL | No site? | Observação |
|---|:---:|---|
| Categoria "boutique de previsibilidade comercial" | ❌ | Site se descreve como "máquina de vendas" / hub de "growth, tecnologia, IA". |
| Slogan "crescimento previsível, escalável e tecnológico" | ⚠️ parcial | Usa "Growth, Tecnologia e Resultados" + linguagem de "previsível e escalável". |
| **Sistema Raiz EG** (Raiz/Tronco/Ramos/Copa) | ❌ | Ausente. Metodologia exibida = "Máquina de Vendas". |
| **Raio-X Comercial EG** | ❌ | Site oferece "Diagnóstico Gratuito". |
| Termo antigo "IPC" | ❓ | Não localizado no índice — **[VERIFICAR NA FONTE]**. |
| Escada de oferta paga (Sprint R$10–18k / Retainer R$7–8k/mês / Growth Partnership) | ❌ | Não exibida; diagnóstico aparece como **grátis** (conflita com R$2–3k pago). |
| Níveis Semente → Muda → Árvore → Floresta | ❌ | Ausentes. |
| ICP integradoras de energia solar / persona "Ricardo" | ❌ | Comunicação genérica "diversos segmentos". |
| Garantia só de **cadência/execução** (nunca faturamento) | ❌ **(risco)** | Site promete faturamento/resultado financeiro do cliente. |
| Sócio **Guilherme Camacho** | ❌ | Equipe lista "Eduardo" e "Gustavo" (só 1º nome). |
| Plataforma própria (BI + login) | ❓ | Não localizada — **[VERIFICAR NA FONTE]**. |
| Squads de IA / automações como entrega atual | ⚠️ | IA citada como capacidade atual — confirmar se já lançado. |

---

## 5. Quick wins vs. decisões estratégicas

### ✅ Quick wins (rápidos, sem decisão estratégica pendente)
1. **Corrigir o título duplicado da home** ("Máquina de Vendas - EverGreen MKT - Máquina de Vendas") — provável conflito tema×plugin de SEO. *(minutos)*
2. **Escrever title tags únicos por página** (mesmo provisórios). Ex.: `/sobre` → "Sobre a EverGreen — consultoria de previsibilidade comercial"; `/contato` → "Fale com a EverGreen — agende seu Raio-X Comercial". *(rápido; depende só de definir as palavras)*
3. **Escrever meta descriptions únicas por página** após verificar as atuais na fonte. *(rápido)*
4. **Resolver www vs. não-www** com 301 para um host único + canonical consistente. *(config)*
5. **Remover/reescrever as promessas explícitas de faturamento** ("aumentar seu faturamento", "foco total em resultado financeiro") → trocar por linguagem de cadência/execução/previsibilidade. *(quick win de risco — alto impacto)*
6. **Publicar política de privacidade/LGPD** se ausente. *(rápido)*
7. **Adicionar schema Organization** (nome, logo, sameAs para LinkedIn/Instagram) para desambiguar a marca. *(rápido)*
8. **Substituir "IPC" por "Raio-X Comercial"** caso ainda apareça. *(rápido — após verificar)*

### 🧭 Exige decisão estratégica ANTES de mexer no site
1. **Reescrita de posicionamento da home e `/servicos`** para Sistema Raiz / Raio-X / previsibilidade — depende de copy aprovada (não dá para finalizar títulos/metas sem isso). *(grande)*
2. **Nichar ou não em integradoras de energia solar** (persona Ricardo) — muda toda a comunicação e as keywords.
3. **Expor publicamente a escada de oferta e preços?** E o diagnóstico vira pago (Raio-X R$2–3k) em vez de grátis?
4. **Expor o Sistema de Níveis (Semente/Muda/Árvore/Floresta)?** Decisão de transparência de modelo.
5. **O que de IA/automação/plataforma já está em produção** e pode ser comunicado sem ser aspiracional. *(input interno)*
6. **Identidade pública dos sócios** — quem são os nomes oficiais (Eduardo/Gustavo vs. Guilherme Camacho)? Resolver a divergência antes de reforçar E-E-A-T.
7. **Estratégia de blog/GEO** — definir pauta (definições, FAQ, cases numéricos com data) para alimentar busca e IA.

---

## Próximo passo recomendado
Para fechar a camada técnica que ficou como **[VERIFICAR NA FONTE]** (schema, canonical, alt text, headings, `robots/sitemap/llms.txt`, Lighthouse), rode este prompt no **Claude Code local com internet** ou libere o domínio no egress deste ambiente. Com isso eu entrego o crawl técnico completo e um Lighthouse real, somados a esta camada de conteúdo/posicionamento — que é a mais crítica e já está mapeada.

---
*Fontes do índice consultadas: páginas indexadas de evergreenmkt.com.br (home, /sobre, /servicos, /equipe, /blog, /contato) via WebSearch, 21/06/2026. Conteúdo das páginas obtido de snippets/resumos do índice — não do HTML ao vivo (egress bloqueado neste ambiente).*
