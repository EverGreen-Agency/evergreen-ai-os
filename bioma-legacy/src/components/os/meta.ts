/**
 * Metadados visuais dos bancos internos — portados do dashboard legado
 * (dashboard/src/idea-bank/IdeaBank.tsx e tech-radar/TechRadar.tsx), que é a
 * referência de branding aprovada (2026-07-08).
 *
 * São VOCABULÁRIO DE DOMÍNIO dos bancos (conteúdo, como o ideas.json em PT),
 * não chrome de UI — por isso vivem aqui e não no i18n.
 */

export const STAGE_META: Record<string, { label: string; color: string; hint: string }> = {
  capture:    { label: "Captura",      color: "#8888a0", hint: "Ideia bruta — acabou de surgir. Falta avaliar se vale o esforço." },
  evaluation: { label: "Avaliação",    color: "#ffab00", hint: "Em análise — decidindo se vira projeto ou fica no horizonte futuro." },
  processing: { label: "Em Progresso", color: "#00d4ff", hint: "Em construção — squad ativo ou artefato sendo criado agora." },
  project:    { label: "Projeto",      color: "#00e676", hint: "Entregue e em uso — funciona em produção ou uso real." },
  company:    { label: "Empresa Nova", color: "#a855f7", hint: "Virou produto ou spin-off — transformação de negócio." },
};

export const STAGE_ORDER = ["capture", "evaluation", "processing", "project", "company"];

export const CAT_COLOR: Record<string, string> = {
  Squad:      "#00d4ff",
  Cockpit:    "#00e676",
  Feature:    "#ffab00",
  Service:    "#a855f7",
  Infra:      "#8888a0",
  Commercial: "#ff5252",
  Platform:   "#3ac97b",
};

export const HORIZON_META: Record<string, { label: string; color: string }> = {
  NOW:         { label: "AGORA",        color: "#ff5252" },
  MEDIUM:      { label: "MÉDIO",        color: "#ffab00" },
  LONG:        { label: "LONGO",        color: "#8fb4a3" },
  NEW_COMPANY: { label: "NOVA EMPRESA", color: "#a855f7" },
};

export const HORIZON_ORDER: Record<string, number> = {
  NOW: 0,
  MEDIUM: 1,
  LONG: 2,
  NEW_COMPANY: 3,
  "": 4,
};

export const RING_META: Record<string, { label: string; color: string; hint: string }> = {
  adopt:  { label: "Adotar",   color: "#3ac97b", hint: "Padrão da casa — usar sem pensar duas vezes." },
  trial:  { label: "Em Teste", color: "#ffab00", hint: "Testando em projeto real agora; vale apostar." },
  assess: { label: "Avaliar",  color: "#8fb4a3", hint: "Vale investigar, sem compromisso. Ainda é experimento." },
  hold:   { label: "Evitar",   color: "#ff6b5c", hint: "Não começar nada novo com isso. Substituir quando der." },
};

export const RING_ORDER = ["adopt", "trial", "assess", "hold"];

export const QUADRANT_LABEL: Record<string, string> = {
  languages: "Linguagens",
  frameworks: "Frameworks",
  tools: "Ferramentas",
  "platforms-infra": "Plataformas & Infra",
};

/** Fases do roadmap da plataforma (matriz-maturidade). */
export const PHASE_COLOR: Record<string, string> = {
  P0: "#00e676",
  "P0.5": "#3ac97b",
  P1: "#00d4ff",
  P2: "#ffab00",
  P3: "#a855f7",
  P4: "#8fb4a3",
};

/** Cor de fallback para valores desconhecidos (bancos evoluem toda semana). */
export const FALLBACK_COLOR = "#8fb4a3";
