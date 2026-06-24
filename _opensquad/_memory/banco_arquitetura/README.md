# Banco de Arquitetura EG

Inventário vivo da estrutura **que já existe** na EverGreen — código, framework, squads, integrações, plataformas. É o **corpus do Guardião** (squad `eg_guardiao`): a referência contra a qual ele audita toda ideia ou projeto interno.

## Arquivos

- **`arquitetura.md`** — o inventário em si. Fonte da verdade da nossa estrutura atual.
- **`README.md`** — este arquivo.

## Diferença para o Banco de Ideias

| | Banco de Ideias | Banco de Arquitetura |
|---|---|---|
| Pergunta | "o que queremos construir?" | "o que já temos construído?" |
| Conteúdo | visão, desejos, futuro | presente, factual |
| Dono | Curador (`eg_banco_ideias`) | Guardião (`eg_guardiao`) |
| Tempo verbal | futuro | presente |

Uma ideia nasce no Banco de Ideias. Quando vira realidade, vira linha no Banco de Arquitetura.

## Como mexer

- **Manualmente:** quando algo material muda (novo squad ativo, nova integração/skill, nova plataforma), atualize `arquitetura.md` na seção correspondente. É um documento curto e estável de propósito.
- **Via Guardião:** ao auditar, o Guardião pode propor atualizações — mas só grava com aprovação humana (Write/Read barrier).
- **Camada de código (seção 1):** quando o `codegraph` (Banco de Ideias) for adotado, essa seção passa a ser auto-indexada via MCP; até lá, é manual.

## Por que existe

Sem este banco, toda avaliação de "precisamos de um squad novo pra isso?" seria feita de memória — e a memória inventa. Com ele, o Guardião tem um chão factual: o catálogo de squads (seção 3) responde na hora se uma capacidade já é coberta, evitando retrabalho e redundância — o mesmo papel que as conexões `depende_de`/`habilita` fazem no Banco de Ideias.
