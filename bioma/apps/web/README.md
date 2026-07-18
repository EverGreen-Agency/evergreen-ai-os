# Bioma Web

Frontend do Bioma MVP v0.

## Rodar local

```bash
npm install
npm run dev
```

## Validar

```bash
npm run build
```

O build executa `tsc -b` e `vite build`. Por enquanto ele é o smoke mínimo do frontend.

O QA visual manual (desktop, notebook com DevTools aberto e mobile) está documentado na seção "Checklist de QA visual" do `bioma/ROADMAP-MVP.md` e precisa ser assinado antes de considerar a UI pronta para cliente real.

## Fronteira operacional

O frontend separa dois contextos de navegação:

- **Operação EG:** cockpit e backoffice internos da EverGreen.
- **Carteira de Clientes:** lista apenas clientes externos e funciona como porta de entrada dos respectivos hubs.

CRM, financeiro do contrato, métricas, documentos, integrações, entregáveis, aprovações, artefatos e score de um cliente ficam sob `/clientes/:clientId/...`. As rotas globais antigas de CRM, financeiro e Analytics apenas redirecionam para a Carteira. Essa regra deve ser mantida na URL, nos feature gates e na autorização da API; não deve ser recriado um seletor global que permita operar vários clientes fora dos hubs.

O registro técnico `EverGreen Internal` ainda pode existir no banco de desenvolvimento por compatibilidade com seeds anteriores, mas não pertence à Carteira e não deve ser usado como fallback de módulos de cliente.

## Tema e branding

O app usa tema escuro Verde Musgo com tokens CSS definidos no topo de `src/styles.css` (`--bg`, `--surface`, `--text`, `--accent` etc.). Novos componentes devem consumir os tokens em vez de cores hardcoded. Assets de marca ficam em `public/assets/brand/` (EG) e `public/assets/clients/<cliente>/` (clientes); os SVGs atuais são placeholders até chegarem os vetores finais.
