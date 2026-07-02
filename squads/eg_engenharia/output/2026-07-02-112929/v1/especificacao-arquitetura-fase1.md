# Documento de Especificação, Arquitetura e Escopo — Fase 1
## Automação de Protocolo no PJe — TRF1

- **Cliente:** Rian Palheta — escritório de advocacia (previdenciário), jurisdição TRF1
- **Fornecedor:** EverGreen (EG)
- **Data:** 2026-07-02 · **Versão:** 1.0 · **Status:** rascunho para validação do cliente
- **Natureza:** este documento é **anexo do contrato**. Ele define o escopo acordado da Fase 1. Qualquer item fora dele entra como fase posterior / aditivo — não como "ajuste de corredor". Revisões e novas funcionalidades após o aceite são tratadas em fases seguintes.

> **Como validar:** leia cada seção e confirme. Itens marcados **[A CONFIRMAR]** dependem de uma resposta sua. As decisões de tecnologia são de responsabilidade da EG (você não precisa validar a stack — apenas ciência); estão aqui por transparência e para constar no contrato.

---

## 1. Objetivo
Reduzir o tempo de protocolo de processos no PJe/TRF1 de **~10 minutos para 2–3 minutos por processo**, através de uma **aplicação web** que reproduz o fluxo do PJe com **modelos reutilizáveis**, mantendo o advogado no controle e a assinatura por certificado digital.

## 2. Contexto
O escritório atua em direito previdenciário na jurisdição do **TRF1** e protocola hoje **4–8 processos/dia (~60/mês)** manualmente no PJe, repetindo os mesmos campos — a maior parte é idêntica dentro de um mesmo tipo de ação (ex.: salário-maternidade, aposentadoria); muda basicamente a parte (autor), o valor da causa e os documentos.

O escritório testou o **LegalMail** (legalmail.com.br — cobrado por pacote de processos): funciona, mas o custo cresce com o volume. A decisão é ter uma **solução própria** para controlar custo e poder estender no futuro. O projeto originalmente publicado (app desktop, IA local, leitura de pasta) foi **repensado na reunião de 02/07** e passou a ser **web, sem IA, sem OCR, com foco exclusivo no protocolo do TRF1**.

## 3. Escopo da Fase 1 (o que **será** entregue)
1. **Aplicação web** self-hosted, acessível por navegador (desktop e celular).
2. **Fluxo de protocolo do PJe/TRF1** reproduzido na ferramenta: matéria → jurisdição → classe judicial → assunto → partes → valor da causa → tutela → características do processo.
3. **Lógica dinâmica encadeada** do PJe: a escolha de um campo atualiza as opções dos seguintes (escolher a matéria muda a jurisdição, que muda a classe judicial), espelhando o sistema.
4. **Campos condicionais** conforme as características: pessoa física/jurídica, assistência, justiça gratuita, sigilo, informação pública.
5. **Motor de modelos definidos por você:** salvar um formulário preenchido como "modelo" nomeado por tipo de ação (ex.: "Salário-maternidade") e reutilizá-lo — auto-preenche os campos repetitivos. **Novos modelos são criados pela própria interface, sem mexer em código.**
6. **Upload dos documentos** (petição inicial + comprobatórios) com definição da **ordem de anexação**.
7. **Tratamento de PDF:** validar cada arquivo, detectar corrupção e **dividir/comprimir automaticamente** os que passam de **10 MB**, antes de anexar.
8. **Autenticação por certificado digital A1 (.pfx)** e assinatura do peticionamento pelo próprio fluxo do PJe.
9. **Automação do preenchimento e anexação** na ordem correta, com você no controle: **pré-visualização (dry-run)** antes de enviar e **confirmação explícita** para o envio.
10. **Captura e guarda do comprovante** de protocolo.
11. **Retomada em caso de falha** no meio do protocolo (sem reenviar/duplicar).
12. **Detecção de sessão expirada** e reautenticação.
13. **Log em arquivo** + **resumo pós-protocolo** legível.
14. **Arquitetura modular por tribunal:** o TRF1 é o primeiro; outros tribunais entram como novo módulo, sem reescrever o núcleo.

## 4. Fora de Escopo da Fase 1 (fica para fases seguintes / aditivo)
- **Outros tribunais** além do TRF1.
- **Inteligência artificial** / classificação automática de documentos.
- **OCR** e **leitura de pasta local** da máquina (documentos entram por upload).
- **Certificado A3** (token físico) — inviável em servidor remoto; ver §6.
- **Múltiplos autores / litisconsórcio.**
- **Perfis e permissões** (advogado × estagiário) — o protocolo é tarefa padronizada.
- **Módulo de consulta de processos** (baixar autos, manifestações, acompanhamento).
- **App desktop** (.exe/.deb).

## 5. Requisitos Funcionais
| Nº | O sistema deve… |
|----|------------------|
| RF1 | Autenticar no PJe/TRF1 com **certificado A1 (.pfx)** fornecido por você. |
| RF2 | Iniciar um protocolo por um formulário que reproduz os campos do PJe (matéria, jurisdição, classe, assunto, partes, valor da causa, tutela, características). |
| RF3 | Aplicar a **lógica dinâmica encadeada** entre os campos, espelhando o PJe. |
| RF4 | **Salvar** um formulário como **modelo** e **reutilizá-lo**, auto-preenchendo os campos comuns. |
| RF5 | Fazer **upload** dos documentos e definir a **ordem de anexação**. |
| RF6 | **Validar** cada PDF e **dividir/comprimir** automaticamente os > 10 MB; barrar corrompidos. |
| RF7 | Oferecer **dry-run** (mostra o que será enviado sem enviar). |
| RF8 | Exigir **confirmação explícita** antes do envio real. |
| RF9 | Executar o protocolo (preenchimento + assinatura + anexação) e **capturar o comprovante**. |
| RF10 | Permitir **retomar** um protocolo interrompido sem duplicar. |
| RF11 | Detectar **sessão expirada** e reautenticar. |
| RF12 | Registrar **log** e apresentar **resumo pós-protocolo**. |
| RF13 | Ser **modular por tribunal** (novo tribunal = novo módulo). |

## 6. Requisitos Não-Funcionais
- **Hospedagem:** aplicação em **Docker**, rodando no seu próprio servidor; acesso via navegador (desktop/celular). **[A CONFIRMAR: você hospeda no servidor de casa, como citado na reunião — a EG entrega a imagem + instruções de instalação.]**
- **Escala:** ~60 protocolos/mês, uso do escritório. Não exige alta escala.
- **Segurança:** dados sensíveis (documentos sob sigilo, credenciais, certificado). Certificado e senhas **nunca em texto claro**; **sem dados sensíveis no log**. **NDA assinado pela EG.**
- **Confiabilidade:** falhas recuperáveis (retomada); nunca deixar protocolo "meio-enviado" sem status claro.
- **Automação responsável:** acesso **autorizado** (login/certificado fornecidos por você), **sem burlar** proteções do PJe.
- **Certificado A3:** fora da Fase 1. Motivo técnico: o token físico precisa estar plugado na máquina onde o navegador roda; num servidor remoto isso não é acessível. Suporte a A3 exige repensar a topologia — Fase 2.

## 7. Arquitetura e Stack (responsabilidade técnica da EG)
> A tecnologia que constava no anúncio original (app desktop, Python/TUI, IA local, empacotamento) foi revista: como combinado na reunião, a **EG redefine a stack** conforme o projeto passou a ser web. Cada decisão abaixo tem seu registro técnico (ADR) arquivado.

| Camada | Escolha | Por quê (resumo) |
|--------|---------|------------------|
| **Backend** | **Python + FastAPI**, monólito modular por tribunal | Ecossistema maduro de automação e PDF; simples e adequado à escala. (ADR-0001) |
| **Automação do PJe** | **Playwright** com o **certificado A1** apresentado ao navegador | Robusto, sessão persistente (viabiliza retomada/reautenticação), dentro do uso legítimo do sistema. (ADR-0002) |
| **Interface** | **React + Vite + TypeScript** | Ideal para o formulário dinâmico encadeado e o dry-run. (ADR-0003) |
| **Dados** | **SQLite** na Fase 1 (migra para PostgreSQL na Fase 2) | Simplicidade máxima para um servidor único; cresce quando entrar multi-usuário. (ADR-0004) |
| **Entrega** | **Docker (docker-compose)** no seu servidor | Você já usa Docker; dados sob seu controle; instalação reproduzível. (ADR-0005) |

## 8. Critérios de Aceite (como sabemos que a Fase 1 está pronta)
- **CA1** — Com o certificado A1 do escritório, o sistema autentica no PJe/TRF1.
- **CA2** — Um usuário protocola **1 processo real de salário-maternidade** no TRF1 ponta-a-ponta pela ferramenta (login → preenchimento via modelo → upload/ordenação → assinatura → envio → comprovante), com **≤ 3 min de operação ativa**.
- **CA3** — Mudar a matéria muda coerentemente as opções seguintes (validado contra o PJe real).
- **CA4** — Salvar e reusar um modelo auto-preenche corretamente os campos comuns.
- **CA5** — PDF > 10 MB é dividido/comprimido e aceito; PDF corrompido é barrado antes do envio.
- **CA6** — O dry-run mostra o envio sem submeter; o envio real só ocorre após confirmação.
- **CA7** — Um protocolo interrompido é retomado sem duplicar.
- **CA8** — Há comprovante salvo, resumo legível e log da operação.

## 9. Premissas e Dependências
**Travado com a EG (base do orçamento):** Fase 1 só com certificado **A1**; tratamento automático de PDF incluído; aceite validado em **1 ação de referência** (salário-maternidade); litisconsórcio na Fase 2.

**Depende de você, Rian:**
- **[A CONFIRMAR]** Acesso a **ambiente de homologação/teste** do PJe TRF1 + **certificado A1** para testes controlados.
- **[A CONFIRMAR]** **1 caso real anonimizado** de salário-maternidade (petição + documentos) para a validação end-to-end.
- **[A CONFIRMAR]** Mapa das **particularidades do TRF1** que mudam o formulário (pessoa física/jurídica, assistência, gratuidade, sigilo).
- **[A CONFIRMAR]** Definição do **servidor/infra** onde a aplicação vai rodar.
- **NDA** assinado (a EG confirma que assina).

**Riscos principais e mitigação:**
- Mudança de layout/fluxo do PJe pode quebrar a automação → arquitetura modular, testes em homologação.
- Particularidades do certificado A1 / assinatura → testar cedo com o certificado real.
- Limites do PJe (10 MB, corrupção, timeouts) → tratamento de PDF, retries controlados, retomada.

## 10. Próximos Passos
1. Você valida este documento (ou aponta ajustes).
2. Com o aceite, ele vira **anexo do contrato** (escopo travado da Fase 1).
3. A EG envia a **proposta comercial** (prazo e investimento) alinhada a este escopo.

---
*Documento gerado pela Engenharia EG (Spec-Driven Development). Registros técnicos: ADR-0001 a ADR-0005.*
