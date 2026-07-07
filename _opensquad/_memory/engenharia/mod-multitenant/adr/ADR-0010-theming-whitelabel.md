# ADR-0010: Temas (Light/Dark) e Branding White-label

**Módulo:** `mod-multitenant` (Decisão Transversal P10)
**Data:** 2026-07-07
**Status:** Proposto

## 1. Contexto
A plataforma exige um design espetacular e a capacidade de alternar entre Tema Claro e Tema Escuro. Além disso, pelo requisito de "Agência Parceira" (White-label mapeado no ADR-0005), precisaremos que o sistema adapte suas cores e logo de acordo com o Tenant que está logado (sem perdermos o branding de altíssima qualidade da EG).

## 2. Decisão Proposta
Utilizar a tríade **Tailwind CSS + Variáveis CSS Nativas + Shadcn/UI**:

1. **Arquitetura de Variáveis CSS (Custom Properties):**
   *   Nunca usar cores fixas da paleta do Tailwind (ex: `bg-blue-500`).
   *   Usar sempre variáveis semânticas: `bg-primary`, `text-muted-foreground`, `bg-background`.
2. **Troca de Tema (Light/Dark):**
   *   A simples adição de uma classe `class="dark"` na tag `<html>` pelo React mudará os valores RGB dessas variáveis globais instantaneamente. Não requer reload e funciona offline.
3. **White-label (Branding da Agência Parceira):**
   *   Quando uma Agência Parceira se cadastrar, ela vai definir a cor primária dela no painel e fazer upload do logo.
   *   O Next.js (no Server Component) injetará um bloco de `<style>` inline substituindo as variáveis CSS globais baseadas no `tenant_id` atual (ex: `--primary: 210 100% 50%;`).
   *   O resto do design (sombras, bordas com glassmorphism, raio das bordas) continuará seguindo o padrão Premium da EG, mas com a cor e logo do cliente.

## 3. Consequências e Trade-offs
*   Exige disciplina férrea na hora de programar os componentes React (sempre usar as variáveis CSS, nunca chumbado).
*   Garante que o White-label não parece uma "gambiarra", e sim um sistema nativo. Uma única base de código renderizará a versão da EverGreen (com as cores da EG) e a versão da agência parceira de forma idêntica e perfomática.
