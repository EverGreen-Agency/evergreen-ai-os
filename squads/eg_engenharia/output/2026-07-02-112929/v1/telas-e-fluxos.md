# Mapa de Telas e Fluxos — Fase 1
## Automação de Protocolo no PJe (TRF1) · complemento do Documento de Especificação

- **Cliente:** rian-pje-trf1 · **Data:** 2026-07-02 · **Versão:** 1.0 · **Status:** rascunho para validação
- **Para que serve:** tirar a subjetividade das "telas e funcionalidades". Aqui cada tela, cada campo e o fluxo passo-a-passo estão desenhados — é a base concreta para o Rian validar e para fechar prazo/valores sem achismo.
- **Fidelidade:** baixa (wireframe / esqueleto). O objetivo é **layout e comportamento**, não identidade visual. Cor, tipografia e polimento entram na etapa de UI.

---

## 1. Inventário de telas (Fase 1)

| # | Tela | Função | Telas seguintes |
|---|------|--------|-----------------|
| **T1** | Login / Certificado | Sobe o certificado A1 (.pfx) + senha e autentica no PJe/TRF1 | T2 |
| **T2** | Painel / Lista de protocolos | Fila de protocolos (rascunho / em andamento / concluído / erro); status da sessão PJe | T3, T4 |
| **T3** | Novo Protocolo (formulário) | Formulário dinâmico do PJe; começar de um modelo ou em branco; salvar como modelo | T4, T5 |
| **T4** | Gestão de Modelos | Criar / editar / duplicar / excluir modelos de auto-preenchimento | T3 |
| **T5** | Documentos | Upload da petição + comprobatórios, ordem de anexação, resultado do tratamento de PDF | T6 |
| **T6** | Revisão / Dry-run | Resumo do que será enviado; simular ou protocolar de verdade (confirmação por digitação) | T7 |
| **T7** | Execução / Progresso | Acompanhamento das etapas do protocolo; retomada em falha | T8 |
| **T8** | Resultado / Comprovante | Nº do protocolo, comprovante, resumo pós-protocolo, log | T2 |

## 2. Fluxo principal (feliz)

```
T1 Login/Cert ─► T2 Painel ─► [Novo Protocolo] ─► T3 Formulário
                                   │                   │
                                   │              (Salvar modelo ⇄ T4)
                                   ▼                   ▼
                             T4 Modelos          T5 Documentos ─► T6 Revisão/Dry-run
                                                                      │
                                                      ┌───────────────┴───────────────┐
                                                      ▼ (simular)                       ▼ (protocolar)
                                                 volta T6 c/ preview              T7 Execução ─► T8 Comprovante ─► T2
```

**Regras de fluxo:**
- Sessão PJe expirada em qualquer ponto → banner de reautenticação (RF11); retoma de onde parou.
- Falha no meio do protocolo (T7) → estado salvo; botão **Retomar** reexecuta só o que faltou (RF10, sem duplicar).
- Envio real (T6) exige **confirmação por digitação** (ação crítica, RF8).

---

## 3. Wireframes (ASCII)

### T1 — Login / Certificado
```
┌───────────────────────────────────────────────────────────┐
│  ⬤ EG · Protocolo PJe — TRF1                               │
├───────────────────────────────────────────────────────────┤
│                                                            │
│     Autenticação no PJe (certificado A1)                   │
│                                                            │
│     Certificado (.pfx)   [ Selecionar arquivo… ]  cert.pfx │
│     Senha do certificado [ •••••••••••• ]                  │
│                                                            │
│     [ Autenticar no PJe/TRF1 ]                             │
│                                                            │
│     Status: ○ não conectado                                │
└───────────────────────────────────────────────────────────┘
```

### T2 — Painel / Lista de protocolos
```
┌───────────────────────────────────────────────────────────┐
│  ⬤ EG · Protocolo PJe    Sessão PJe: ● conectada   [sair]  │
├───────────────────────────────────────────────────────────┤
│  [ + Novo Protocolo ]        [ Modelos ]     buscar 🔍___  │
│                                                            │
│  Apelido/Nº     Tipo ação        Autor      Status    Data │
│  ─────────────────────────────────────────────────────────│
│  Maria-mat.     Salário-matern.  M. Silva   ● Concl.  02/07│
│  Joao-apos.     Aposentadoria    J. Souza   ◐ Andam.  02/07│
│  rasc-003       —                —          ○ Rascu.  02/07│
│  Ana-mat.       Salário-matern.  A. Lima    ✕ Erro    01/07│
│                                                            │
│  (clicar numa linha → abre no ponto onde parou)            │
└───────────────────────────────────────────────────────────┘
```

### T3 — Novo Protocolo (formulário dinâmico)
```
┌───────────────────────────────────────────────────────────┐
│  Novo Protocolo                         passo 1 de 4 ▸ Doc │
├───────────────────────────────────────────────────────────┤
│  Iniciar de:  (•) Modelo [ Salário-maternidade ▾ ]         │
│               ( ) Em branco                                │
│  ─────────────────────────────────────────────────────────│
│  Matéria           [ Previdenciário            ▾ ]         │
│  Jurisdição        [ Seção Judiciária do Amapá ▾ ] ← muda  │
│  Classe judicial   [ Procedimento Comum Cível  ▾ ] ← muda  │
│  Assunto           [ Salário-maternidade       ▾ ]         │
│  ─────────────────────────────────────────────────────────│
│  Autor (parte)     [ ____________________ ] CPF [ ______ ] │
│  Valor da causa    [ R$ __________ ]                       │
│  Tutela de urgência ( ) sim  (•) não                       │
│  ─────────────────────────────────────────────────────────│
│  Características:  ☑ pessoa física   ☐ assistência          │
│                   ☑ justiça gratuita ☐ sigilo  ☐ info públ.│
│                   (marcar altera campos exigidos)          │
│  ─────────────────────────────────────────────────────────│
│  [ 💾 Salvar como modelo ]              [ Avançar ▸ ]       │
└───────────────────────────────────────────────────────────┘
```

### T4 — Gestão de Modelos
```
┌───────────────────────────────────────────────────────────┐
│  Modelos de auto-preenchimento              [ + Novo ]     │
├───────────────────────────────────────────────────────────┤
│  Nome                 Matéria/Assunto        Campos  Ações │
│  ─────────────────────────────────────────────────────────│
│  Salário-maternidade  Prev. / Sal.-matern.    8     ✎ ⧉ 🗑 │
│  Aposentadoria idade  Prev. / Aposentadoria   9     ✎ ⧉ 🗑 │
│  BPC/LOAS             Prev. / Assist. social  7     ✎ ⧉ 🗑 │
│                                                            │
│  Modelo = fotografia dos campos comuns. No protocolo,      │
│  muda só autor, valor da causa e documentos.               │
└───────────────────────────────────────────────────────────┘
```

### T5 — Documentos
```
┌───────────────────────────────────────────────────────────┐
│  Novo Protocolo · Documentos            passo 2 de 4 ▸ Rev │
├───────────────────────────────────────────────────────────┤
│  [ ⬆ Enviar arquivos ]   (arraste PDFs aqui)               │
│  ─────────────────────────────────────────────────────────│
│  Ordem  Arquivo               Tam.    Tratamento           │
│  ─────────────────────────────────────────────────────────│
│  ⠿ 1    peticao-inicial.pdf   3,2 MB  ● OK                 │
│  ⠿ 2    procuracao.pdf        0,8 MB  ● OK                 │
│  ⠿ 3    provas.pdf           14,1 MB  ◐ dividido em 2 (<10)│
│  ⠿ 4    laudo.pdf             —        ✕ corrompido (barra)│
│         (arraste ⠿ para reordenar a anexação)              │
│  ─────────────────────────────────────────────────────────│
│  ⚠ 1 arquivo barrado. Resolva ou remova antes de avançar.  │
│                                       [ Avançar ▸ ]        │
└───────────────────────────────────────────────────────────┘
```

### T6 — Revisão / Dry-run
```
┌───────────────────────────────────────────────────────────┐
│  Novo Protocolo · Revisão               passo 3 de 4 ▸ Env │
├───────────────────────────────────────────────────────────┤
│  Vai ser enviado ao PJe/TRF1:                              │
│   • Classe: Proc. Comum Cível · Assunto: Sal.-maternidade  │
│   • Autor: Maria Silva · Valor: R$ 8.400,00 · gratuita     │
│   • Documentos (ordem): 1 petição, 2 procuração, 3-4 provas│
│  ─────────────────────────────────────────────────────────│
│  Modo:  (•) Simulação (dry-run) — NÃO envia                │
│         ( ) Protocolar de verdade                          │
│                                                            │
│  Para protocolar de verdade, digite  PROTOCOLAR :          │
│  [ _______________ ]                                       │
│                                                            │
│  [ ◂ Voltar ]                       [ Simular / Protocolar]│
└───────────────────────────────────────────────────────────┘
```

### T7 — Execução / Progresso
```
┌───────────────────────────────────────────────────────────┐
│  Protocolando…                                             │
├───────────────────────────────────────────────────────────┤
│  ✔ Login/sessão PJe                                        │
│  ✔ Preenchimento do formulário                            │
│  ◐ Assinatura (certificado A1)          ▓▓▓▓▓▓░░░░  60%    │
│  ○ Anexação dos documentos                                │
│  ○ Envio / geração do comprovante                         │
│  ─────────────────────────────────────────────────────────│
│  log: assinando documento 2 de 4…                          │
│                                                            │
│  (em caso de falha aqui → [ Retomar ] continua do ponto)   │
└───────────────────────────────────────────────────────────┘
```

### T8 — Resultado / Comprovante
```
┌───────────────────────────────────────────────────────────┐
│  ✔ Protocolo concluído                                     │
├───────────────────────────────────────────────────────────┤
│  Nº do processo:  1002xxx-xx.2026.4.01.3100                │
│  Comprovante:     [ ⬇ baixar PDF ]  [ 👁 visualizar ]      │
│  ─────────────────────────────────────────────────────────│
│  Resumo:                                                   │
│   • 4 documentos anexados (3 originais, 1 dividido)         │
│   • Tempo de operação ativa: 2 min 40 s                    │
│   • Assinado com certificado A1 do escritório              │
│                                                            │
│  [ log completo ]                    [ ◂ voltar ao painel ]│
└───────────────────────────────────────────────────────────┘
```

---

## 4. Detalhe do formulário dinâmico (T3)

**Cascata (a escolha de cima muda as opções de baixo — RF3):**
1. **Matéria** → filtra **Jurisdição** disponível.
2. **Jurisdição** → filtra **Classe judicial**.
3. **Classe judicial** → filtra **Assunto**.

**Campos fixos por protocolo:** autor (nome + CPF), valor da causa, tutela (sim/não).

**Campos condicionais (marcar altera o que é exigido):**
- **Pessoa física / jurídica** → muda os campos de identificação da parte.
- **Assistência / assistente** → habilita dados do assistente.
- **Justiça gratuita** → marca o pedido de gratuidade.
- **Sigilo** → marca o processo como sigiloso.
- **Informação pública** → ajusta a visibilidade.

**O que o modelo guarda:** matéria, jurisdição, classe, assunto e as características marcadas (os campos que se repetem). **O que nunca vem do modelo:** autor, valor da causa, documentos (mudam a cada processo).

---

## 5. Fora desta Fase (telas que NÃO entram agora)
- Consulta de processos / baixar autos / manifestações.
- Perfis e permissões (advogado × estagiário).
- Painéis de outros tribunais.
- Configuração multiusuário.

> Estas telas estão mapeadas como Fase 2 apenas para orientar a arquitetura modular — não são construídas na Fase 1.
