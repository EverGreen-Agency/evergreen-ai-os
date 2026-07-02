# ADR-0002: Automação do PJe via Playwright (Python) + certificado A1 como client-cert

- **Status:** aceita
- **Data:** 2026-07-02
- **Projeto / Cliente:** rian-pje-trf1
- **Decisores:** Eduardo (EG) + Arquiteto de Decisões EG

## Contexto
RF1 (login A1), RF9 (protocolo + assinatura + anexação), RF10 (checkpoint), RF11 (sessão expirada) e o RNF de **automação responsável** (§6: acesso autorizado, sem burlar proteções). O PJe não oferece API pública de protocolo — a via é automação de browser autorizada, com o certificado do próprio escritório.

## Opções Consideradas
1. **Playwright (Python)** com certificado A1 (.pfx) carregado como *client certificate* no browser context — prós: sessão persistente (viabiliza checkpoint/reautenticação), auto-wait reduz flakiness, suporte nativo a client-cert. contras: anel **assess** (ainda em teste na casa).
2. **Selenium** — prós: veterano, muita documentação. contras: mais frágil, sem auto-wait nativo, gestão de certificado mais trabalhosa. anel: fora do radar.
3. **Requisições HTTP diretas** simulando o PJe — prós: rápido. contras: **burla o fluxo/proteções** do sistema (vetado pelo RNF de automação responsável) e quebra a cada mudança de CSRF/token.

## Decisão
**Escolhemos Playwright-Python.** O certificado **A1 (.pfx)** é apresentado ao PJe como client certificate do contexto do browser; a **assinatura ocorre no próprio fluxo do PJe**. **A3 fica fora** (token físico não é acessível por servidor headless — Fase 2, exigiria rodar o navegador na máquina com o token). Descartado HTTP direto por violar o RNF de automação responsável; Selenium por fragilidade.

## Consequências
- **Ganhamos:** robustez, sessão persistente (checkpoint e reautenticação viáveis), automação dentro do uso legítimo.
- **Abrimos mão de:** velocidade de HTTP puro (aceitável no volume).
- **Passa a exigir:** browsers do Playwright no container; conversão/guarda segura do A1.
- **Reversibilidade:** média.

## Impacto no Banco de Stack
Playwright promovido **assess → trial** (primeiro projeto real). Atualizar `stack.json` (campo `adr` → ADR-0002@rian-pje-trf1).
