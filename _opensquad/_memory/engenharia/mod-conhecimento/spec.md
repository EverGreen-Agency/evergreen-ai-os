# Spec: mod-conhecimento (RAG, Segundo Cérebro e Curadoria)

- **Cliente:** Interno (`target: internal`) — ideia `mod-conhecimento` (part_of `mega-plataforma`)
- **Fase:** 2 (Dogfood e Inteligência Base)
- **Status:** rascunho
- **Data:** 2026-07-07

## 1. Objetivo
Transformar o histórico morto de operações da EverGreen (reuniões, áudios do whatsapp, relatórios passados e cases) em um "Segundo Cérebro" vivo e consultável via RAG (Retrieval-Augmented Generation). Não se trata de jogar tudo no banco, mas de **curadoria inteligente** para nutrir as IAs da plataforma com o contexto exato do que funciona e do que dá errado para cada cliente.

## 2. Contexto
As IAs sofrem de "amnésia" se não forem alimentadas. Hoje temos as lógicas de `vector-store` e `stack-memoria-zep` mapeadas no banco de ideias. Este módulo materializa a infraestrutura de vetores dentro da Mega Plataforma para permitir que o "Arquiteto" ou o "Juiz" consultem o passado antes de tomar uma decisão, ou que a Fábrica de Entregáveis extraia o tom de voz correto do cliente (Voz do Cliente) a partir de transcrições de calls passadas.

## 3. Escopo Funcional
1. **Infraestrutura de Vetores:**
   *   Tabelas no banco de dados capazes de armazenar embeddings textuais gerados por modelos (ex: `text-embedding-3-large`).
2. **Pipelines de Ingestão e Curadoria:**
   *   Não teremos um "conhecimento infinito" desordenado. Apenas artefatos específicos passam pelo pipeline (ex: Docs de Cases de Sucesso, Transcrições Ouro de Reuniões, Propostas Fechadas).
3. **Mecanismo de "Context Decay":**
   *   Regras de obsolescência: uma informação sobre "Algoritmo do Facebook" de 2024 deve ter um peso (relevância) muito menor na busca vetorial do que uma de 2026.
4. **Endpoint de RAG Centralizado:**
   *   Os outros módulos chamam o `mod-conhecimento` passando a query e o `tenant_id` ("Como o cliente X gosta dos relatórios?"), e o módulo devolve os *chunks* de texto mais relevantes em menos de 100ms.

## 4. Requisitos Não-Funcionais
*   **Isolamento Rígido:** A busca vetorial DEVE, obrigatoriamente, incluir um filtro de `tenant_id`. Uma query jamais pode retornar um embedding de uma reunião de um cliente diferente.
*   Conexão direta com a camada `llm-agnostic` (ADR-0008) para geração dos embeddings.

## 5. Integrações Críticas (ADRs Futuros)
*   **ADR-CON1 (Banco de Vetores):** Utilizar a extensão `pgvector` acoplada ao nosso PostgreSQL primário (reduzindo complexidade de infra) versus usar um banco dedicado (Pinecone, Qdrant)?
*   **ADR-CON2 (Memória de Conversação):** Adotar o Zep (engine de memória e decay) ou construir lógica proprietária de decaimento de embeddings no banco?
