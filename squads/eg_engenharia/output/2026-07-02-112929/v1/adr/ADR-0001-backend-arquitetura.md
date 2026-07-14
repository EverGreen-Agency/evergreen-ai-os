# ADR-0001: Backend em Python/FastAPI, monólito modular por tribunal

- **Status:** aceita
- **Data:** 2026-07-02
- **Projeto / Cliente:** rian-pje-trf1
- **Decisores:** Eduardo (EG) + Arquiteto de Decisões EG

## Contexto
A spec (§3, §5, RF13) pede uma aplicação web que automatiza browser, roda um motor de modelos e mantém checkpoint, self-hosted em Docker (§6), com baixa escala (60/mês, 1 escritório) e **modular por tribunal** (TRF1 primeiro). Precisa definir linguagem/runtime e estilo de arquitetura. O stack do post original (Python/TUI/Ollama/PyInstaller) foi descartado na reunião; a EG redefine.

## Opções Consideradas
1. **Python + FastAPI (monólito modular)** — prós: radar posiciona Python como backend de projetos de cliente e FastAPI como padrão a validar; ecossistema maduro de automação/PDF/certificado; async + OpenAPI grátis. contras: 2 linguagens no projeto (frontend TS). anel: **adopt / adopt**.
2. **Node/TypeScript full-stack** (Nest/Express + Playwright-node) — prós: linguagem única com o frontend. contras: contraria a aposta do radar p/ backend de cliente; ecossistema de PDF/certificado menos maduro que o Python. anel: TS adopt (mas p/ frontend).
3. **Django** — prós: baterias inclusas. contras: mais pesado/opinativo que o necessário; ORM/admin não agregam num app de automação enxuto. anel: fora do radar.

## Decisão
**Escolhemos Python + FastAPI, monólito modular por tribunal.** Descartado Node/TS full-stack: unificar linguagem não compensa perder o ecossistema Python de automação/PDF/certificado, e o radar aponta Python/FastAPI como a direção da casa para projetos de cliente — este é o "1º projeto real que valida via ADR" previsto no radar. Monólito (não microserviço) pela escala baixa; modularidade via um **connector por tribunal** (TRF1 é o primeiro módulo).

## Consequências
- **Ganhamos:** maturidade de automação/PDF, alinhamento com o radar, primeira validação real de Python+FastAPI.
- **Abrimos mão de:** linguagem única (frontend fica em TS).
- **Passa a exigir:** Python 3.12 no runtime; disciplina de fronteira entre núcleo e connector de tribunal.
- **Reversibilidade:** cara (reescrever backend).

## Impacto no Banco de Stack
Python e FastAPI seguem **adopt**; registro este ADR como a primeira validação real (campo `adr` de ambos → ADR-0001@rian-pje-trf1).
