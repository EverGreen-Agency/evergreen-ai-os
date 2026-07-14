# Banco de Stack EG — Tech Radar

Catálogo vivo de tecnologias para os **projetos que desenvolvemos** (entregas de cliente). Modelo: [Technology Radar da ThoughtWorks](https://www.thoughtworks.com/radar). Responde "essa tecnologia, a gente usa, testa, investiga ou evita?".

## Arquivos

- **`stack.json`** — fonte da verdade.
- **`stack.md`** — view legível, gerada a partir do JSON. Não editar à mão.
- **`README.md`** — este arquivo.

## Os 4 anéis

| Anel | Significado | Quando usar |
|---|---|---|
| **Adopt** | Padrão da casa | Usar sem pensar. Já provado em produção. |
| **Trial** | Testando agora | Vale apostar em projeto real; ainda coletando evidência. |
| **Assess** | Vale investigar | Promissor, sem compromisso. Experimento, não produção. |
| **Hold** | Evitar | Não começar nada novo com isso (legado ou risco). |

## Os 4 quadrantes

**Linguagens** · **Frameworks** · **Ferramentas** · **Plataformas-Infra**.

## Schema de uma tech

| Campo | Valores |
|---|---|
| `id` | slug-kebab único |
| `name` | nome da tecnologia |
| `quadrant` | languages · frameworks · tools · platforms-infra |
| `ring` | assess · trial · adopt · hold |
| `note` | por que está nesse anel (uma a duas frases, PT) |
| `adr` | link/id do ADR que registrou a decisão (quando houver) |
| `fonte` | onde a tech é usada/foi vista |

## Relação com ADR e com o Guardião

- **ADR (Architecture Decision Record):** quando uma tech promove de **Trial → Adopt** dentro de um projeto, o **squad `eg_engenharia`** escreve um ADR explicando contexto → opções → escolha → consequência. O campo `adr` aqui aponta para ele. O radar diz *em que anel*; o ADR diz *por quê*.
- **Guardião (`eg_guardiao`):** no Gate de Stack, lê este radar. Tech proposta em Adopt/Trial = ok; em Assess = "experimento, não produção"; em Hold ou ausente = levanta bandeira.

## Movimento

Anel não é permanente — é uma fotografia. Uma tech sobe (Assess→Trial→Adopt) conforme ganha evidência, ou desce para Hold quando envelhece. Toda mudança de anel atualiza `atualizado_em` e idealmente registra o porquê (num ADR, se for decisão de projeto).
