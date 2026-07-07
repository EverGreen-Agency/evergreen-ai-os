# Diagnostico - eg_meta sobre eg_proposals

## Squad-alvo
`eg_proposals`

## Evidencias
- Feedback explicito do usuario nesta run: "usamos (enquanto a plataforma interna nao foi finalizada) o ClickUp" e "comentar notion nao faz sentido".
- Erro observado na proposta de `eg_proposals`: `squads/eg_proposals/output/2026-07-07-175042/proposta.md` citou "apoio de Notion/Sheets para calendario".
- Fonte operacional: `_opensquad/_memory/banco_arquitetura/ferramentas-externas.md` registra ClickUp como gestao de tarefas/projetos, decisao MANTER/integrar.
- Fonte de stack: `_opensquad/_memory/banco_stack/stack.md` lista ClickUp em Adopt / Plataformas-Infra, "Gestao centralizada; skill propria".
- Fonte de operacao Social/Growth: manuais operacionais descrevem listas, tarefas, status, calendario editorial, aprovacao e dashboard do cliente no ClickUp.

## Diagnostico
O agente `Closer` tem regra para tecnologia, CRM e Growth, mas nao tem regra explicita para ferramentas operacionais da EG em propostas de marketing/social. Isso abriu espaco para sugerir Notion como apoio generico, apesar de a arquitetura atual da EG apontar ClickUp como ferramenta operacional provisoria enquanto a plataforma interna/Bioma nao finaliza.

## Diff proposto

Agente: `squads/eg_proposals/agents/closer.agent.md`

Evidencia: a proposta recente citou Notion; a memoria operacional da EG registra ClickUp como ferramenta de gestao centralizada e a correcao do usuario reforcou que Notion nao faz sentido como default.

Mudanca 1:

Trecho atual:

```md
- *Se for Growth/Vendas:* Pense no Sistema Raiz EG, estruturação comercial, Funil, CRM (Kommo) e tráfego como meio, não fim.
```

Trecho proposto:

```md
- *Se for Growth/Vendas:* Pense no Sistema Raiz EG, estruturação comercial, Funil, CRM (Kommo), ClickUp como camada operacional provisória da EG enquanto a plataforma interna/Bioma não estiver finalizada, e tráfego como meio, não fim. Não sugira Notion como ferramenta padrão da EG; só mencione Notion quando o cliente já usa/solicita explicitamente.
```

Risco: baixo. A regra e pequena, reduz desalinhamento comercial e preserva flexibilidade quando o cliente ja usa Notion.

Mudanca 2:

Trecho atual:

```md
- Não invente fatos sobre o cliente.
- Priorize ferramentas gratuitas/freemium no MVP tecnológico.
- A proposta final deve ter no máximo 3.000 caracteres.
- Mantenha a resposta em plain text limpo, sem o caractere "â€”" no início.
```

Trecho proposto:

```md
- Não invente fatos sobre o cliente.
- Priorize ferramentas gratuitas/freemium no MVP tecnológico.
- Em propostas de Growth/Social/operacao, quando precisar citar ferramenta de gestao, use ClickUp como padrao operacional da EG e Meta Business Suite/Metricool para agendamento/metricas quando fizer sentido. Evite Notion/Sheets como fallback generico; Sheets pode aparecer apenas para relatorio simples/exportacao, nao como calendario operacional principal.
- A proposta final deve ter no máximo 3.000 caracteres.
- Mantenha a resposta em plain text limpo, sem o caractere "â€”" no início.
```

Risco: baixo/medio. Pode deixar a proposta um pouco mais prescritiva sobre ferramenta, mas alinha com o que a EG realmente opera.

## Correcao recomendada para a proposta atual

Substituir:

```text
A operação pode rodar com Meta Business Suite ou Metricool para agendamento e métricas, apoio de Notion/Sheets para calendário e um relatório enxuto para decisão.
```

Por:

```text
A operação pode rodar com Meta Business Suite ou Metricool para agendamento e métricas, ClickUp para calendário operacional/aprovação e um relatório enxuto para decisão.
```

## Pergunta de aprovacao
Aplicar as duas mudancas no `closer.agent.md` e depois ajustar a proposta atual removendo Notion?
