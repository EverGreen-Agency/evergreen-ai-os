# Spec: Automação de Protocolo PJe — TRF1 (Fase 1)

- **Cliente:** Rian Palheta — escritório de advocacia (previdenciário), Amapá (jurisdição TRF1)
- **Autor:** Especificador EG
- **Data:** 2026-07-02
- **Status:** rascunho (aguardando validação do cliente)
- **Versão:** 1.0

> Esta spec é o **contrato** do projeto. Código e tarefas derivam dela. Mudança de escopo = nova versão da spec, não decisão de corredor.
> **Como ler:** itens marcados `[SUPOSIÇÃO: ...]` precisam da sua confirmação, Rian. O resto reflete o que foi alinhado na reunião de 02/07.

## 1. Objetivo
Reduzir o tempo de protocolo de processos no PJe/TRF1 de **~10 min para 2–3 min por processo**, via uma aplicação web que reproduz o fluxo do PJe com **modelos reutilizáveis**, mantendo o advogado no controle e a assinatura por certificado digital.

## 2. Contexto
Escritório previdenciário atuando na jurisdição do **TRF1** (Amapá, Amazonas, Pará e demais). Hoje protocola **4–8 processos/dia (~60/mês)** manualmente no PJe, repetindo os mesmos campos — a maior parte é idêntica dentro de um mesmo tipo de ação (ex.: salário-maternidade, aposentadoria); muda basicamente a parte (autor), o valor da causa e os documentos.

O escritório testou o **LegalMail** (legalmail.com.br — SaaS cobrado por pacote de processos): funciona bem, mas o custo cresce com o volume. Quer uma **solução própria** para controlar custo e poder estender no futuro. O projeto original publicado (app desktop + IA/Ollama + scan de pasta local) foi **repensado na reunião de 02/07**: virou **aplicação web, sem IA, sem OCR, com foco exclusivo no protocolo do TRF1**. O post é antigo e muitas premissas mudaram — esta spec segue a reunião.

## 3. Escopo (o que **será** construído)
- **Aplicação web** self-hosted (Docker), acessível remotamente por navegador (desktop e celular).
- **Fluxo de protocolo do PJe/TRF1** reproduzido na ferramenta: matéria → jurisdição → classe judicial → assunto → partes → valor da causa → tutela → características do processo.
- **Lógica dinâmica encadeada** do PJe: a escolha de um campo atualiza as opções dos seguintes (ex.: escolher a matéria muda a jurisdição disponível, que muda a classe judicial), espelhando o comportamento do sistema.
- **Campos condicionais** conforme as características: pessoa física/jurídica, assistência/assistente, justiça gratuita, sigilo, informação pública — cada opção habilita/altera o que aparece.
- **Motor de modelos (templates) definidos pelo usuário:** salvar um formulário preenchido como "modelo" nomeado por tipo de ação (ex.: "Salário-maternidade") e reusá-lo — auto-preenche os campos repetitivos; muda só autor, valor da causa e documentos. Novos modelos são criados **pela interface** (salvar o formulário), sem tocar em código.
- **Upload de documentos** do processo (petição inicial + comprobatórios) pelo usuário, com definição da **ordem de anexação**.
- **Tratamento de PDF:** validar cada arquivo, detectar corrupção e **dividir/comprimir automaticamente** os que passam de **10 MB** antes de anexar (limite do PJe).
- **Autenticação no PJe por certificado digital A1 (.pfx)** e assinatura do peticionamento pelo próprio fluxo do PJe.
- **Automação do preenchimento e anexação** na ordem correta via navegador, com o usuário no controle: **pré-visualização (dry-run)** antes de submeter e **confirmação explícita** para o envio.
- **Captura e armazenamento do comprovante** de protocolo gerado pelo PJe.
- **Checkpoint / retomada** em caso de falha no meio do protocolo (sem duplicar envio).
- **Detecção de sessão expirada** e reautenticação.
- **Log em arquivo** (silencioso) + **resumo pós-protocolo** legível.
- **Arquitetura modular por tribunal:** TRF1 é o primeiro módulo; outros tribunais entram como configuração/novo módulo, sem reescrever o núcleo.

## 4. Fora de Escopo (Fase 1)
Explicitamente **não** entra agora (evita retrabalho e briga; a maioria é candidata a Fase 2 / aditivo):
- **Outros tribunais** além do TRF1 (TJSP, TJPA, TJAM, etc.) — Fase 2 / contrato aditivo.
- **IA / LLM local (Ollama) / classificação automática** de documentos — cortado.
- **OCR e scan de pasta local** da máquina do usuário — cortado (docs vão por upload).
- **Certificado A3 (token físico)** — Fase 2, com ressalva técnica (servidor remoto headless não acessa token plugado; exige repensar a topologia).
- **Multi-autor / litisconsórcio** — Fase 2.
- **Permissionamento / perfis** (advogado vs. estagiário) — Fase 2. O protocolo é tarefa padronizada; qualquer pessoa do escritório executa.
- **Módulo de consulta de processos** (baixar autos, manifestações, acompanhamento) — Fase 2 (o "LegalMail completo").
- **App desktop (.exe/.deb)** — descartado em favor da web.
- **Matérias não-previdenciárias como aceite:** o motor é genérico e, por ser dinâmico, aceita outras matérias; mas o **aceite da Fase 1 é validado em previdenciário** (ver §7).

## 5. Requisitos Funcionais
- **RF1** — Autenticar no PJe/TRF1 com **certificado A1 (.pfx)** fornecido pelo usuário (upload seguro da credencial).
- **RF2** — Iniciar um novo protocolo por um formulário que reproduz os campos do PJe: matéria, jurisdição, classe judicial, assunto, partes, valor da causa, tutela e características (pessoa física/jurídica, assistência, gratuidade, sigilo, informação pública).
- **RF3** — Aplicar a **lógica dinâmica encadeada**: selecionar a matéria atualiza as opções de jurisdição; jurisdição atualiza a classe judicial; e demais dependências, espelhando o PJe. *(Como isso é obtido — lendo as opções ao vivo do PJe vs. tabela mapeada — é decisão de stack do próximo step, o Arquiteto.)*
- **RF4** — **Salvar** um formulário preenchido como **modelo** nomeado e **reusá-lo**, auto-preenchendo os campos comuns em novos protocolos.
- **RF5** — Fazer **upload** dos documentos (petição inicial + comprobatórios) e definir a **ordem de anexação**.
- **RF6** — **Validar cada PDF**: barrar/avisar corrompidos; **dividir ou comprimir automaticamente** os > 10 MB para caber no limite do PJe.
- **RF7** — **Dry-run**: preencher e exibir tudo que será enviado, **sem submeter**.
- **RF8** — **Confirmação explícita** do usuário antes do envio real (ação crítica).
- **RF9** — Executar o protocolo no PJe (preenchimento + assinatura via certificado + anexação na ordem) e **capturar o comprovante** gerado.
- **RF10** — **Checkpoint**: se falhar no meio, permitir **retomar** de onde parou sem refazer nem duplicar.
- **RF11** — Detectar **sessão expirada** e reautenticar.
- **RF12** — Registrar **log em arquivo** e apresentar **resumo pós-protocolo** (o que foi enviado, nº/comprovante, erros).
- **RF13** — **Modularidade**: adicionar um novo tribunal é configuração/novo módulo, sem reescrever o núcleo.

## 6. Requisitos Não-Funcionais
- **Deploy:** imagem **Docker**, self-hosted; acesso via navegador (desktop/celular). `[SUPOSIÇÃO: o Rian hospeda no próprio servidor de casa (Docker), como citado na reunião; a EG entrega a imagem + documentação de instalação.]`
- **Escala:** 4–8 protocolos/dia (~60/mês), uso do escritório (poucos usuários simultâneos). Não requer alta escala.
- **Segurança / dados:** dados sensíveis (documentos sob sigilo, credenciais, certificado A1). Certificado e senhas **nunca em texto claro**; **sem dados sensíveis no log** (log silencioso). **NDA assinado pela EG.**
- **Resiliência:** o protocolo é operação sensível — falhas devem ser recuperáveis (checkpoint) e nunca deixar um protocolo "meio-enviado" sem status claro.
- **Automação responsável:** acesso **autorizado** (login/certificado fornecidos pelo cliente), **sem burlar proteções** do PJe; uso dentro do padrão normal do sistema.
- **Prazo:** a fechar na proposta comercial (ordem de grandeza discutida: MVP recortado). `[SUPOSIÇÃO: cronograma detalhado sai na proposta, condicionado a homologação do PJe disponível e janelas de validação.]`

## 7. Critérios de Aceite
Testável, não subjetivo:
- **CA1** — Com o certificado A1 do escritório, o sistema **autentica no PJe/TRF1** com sucesso.
- **CA2** — Um usuário do escritório **protocola 1 processo real de salário-maternidade** no TRF1 ponta-a-ponta pela ferramenta (login → preenchimento via modelo → upload/ordenação de docs → assinatura → envio → comprovante capturado), com **≤ 3 min de operação ativa**.
- **CA3** — O formulário reflete a **lógica dinâmica** do PJe: mudar a matéria muda coerentemente as opções subsequentes (validado contra o PJe real).
- **CA4** — **Salvar um modelo** e reusá-lo em um novo protocolo **auto-preenche corretamente** os campos comuns.
- **CA5** — Um PDF **> 10 MB é dividido/comprimido** automaticamente e aceito pelo PJe; um PDF **corrompido é detectado** e barrado antes do envio.
- **CA6** — O **dry-run** mostra exatamente o que seria enviado sem submeter; o **envio real só ocorre após confirmação** explícita.
- **CA7** — Interrompendo o processo no meio (ex.: queda), a **retomada continua sem duplicar/reenviar**.
- **CA8** — Ao final há **comprovante salvo** e **resumo legível**; o **log em arquivo** registra a operação.

## 8. Riscos e Dependências
- **Risco:** fragilidade da automação — o PJe/TRF1 muda layout/fluxo e quebra a automação. → **Mitigação:** arquitetura modular, seletores resilientes, testes em homologação.
- **Risco:** certificado A1 e assinatura no fluxo do PJe têm particularidades (validade, cadeia ICP-Brasil). → **Mitigação:** testar cedo com o certificado real do escritório.
- **Risco:** limites/instabilidade do PJe (10 MB, corrupção, fila de protocolo, timeouts). → **Mitigação:** tratamento de PDF (RF6), retries controlados, checkpoint (RF10).
- **Risco:** A3 desejado no futuro é inviável em servidor remoto headless. → **Mitigação:** Fase 1 = A1; A3 exige repensar a topologia (navegador na máquina com o token) — Fase 2.
- **Dependência (Rian):** acesso a **ambiente de homologação/teste do PJe TRF1** + credenciais/**certificado A1** para testes controlados. `[SUPOSIÇÃO: a confirmar — ficou em aberto na proposta.]`
- **Dependência (Rian):** **1 caso real anonimizado** de salário-maternidade (petição inicial + docs) para a validação end-to-end.
- **Dependência (Rian):** mapa das **particularidades do TRF1** que muda o formulário (pessoa física/jurídica, assistência, gratuidade, sigilo).
- **Dependência (Rian):** **NDA** assinado (EG confirma que assina) e definição do **servidor/infra** onde a aplicação roda.
- **Dependência (EG):** decisão de **stack** (framework web + motor de automação) fica com o Arquiteto de Decisões (próximo step) — fora desta spec.

---
<!-- Suposições pendentes de confirmação do cliente estão marcadas no corpo como [SUPOSIÇÃO: ...] -->
<!-- Decisões travadas com Eduardo (02/07): A1-only Fase 1; PDF split/validação auto; aceite = motor genérico + 1 ação de referência (salário-maternidade); litisconsórcio Fase 2. -->
