/**
 * Inventário do `dashboard/` Vite legado (spec mod-cockpit-interno, RF8 +
 * CA5/CA6): cada área do cockpit antigo classificada com decisão final e,
 * quando já portada, a URL equivalente no Bioma.
 *
 * Levantado olhando `dashboard/src/` real em 2026-07-07:
 *   App.tsx (tabs: escritorio | banco | stack | arquitetura | clientes),
 *   idea-bank/, tech-radar/, architecture/, clients/, office/ (Phaser),
 *   components/ (SquadCard, SquadSelector, StatusBar), hooks/useSquadSocket,
 *   plugin/squadWatcher (REST /api/* + WebSocket /__squads_ws), store/ (zustand).
 *
 * `area`/`note` são CONTEÚDO (como os bancos internos): ficam em PT, igual a
 * ideas.json. Rótulos de UI (colunas, decisões) vêm do i18n (cockpit.json).
 */
import "server-only";

export type LegacyDecision =
  | "portar"
  | "descartar"
  | "manter_temporario"
  | "substituido";

export type LegacyInventoryItem = {
  id: string;
  /** Nome da área/funcionalidade no dashboard antigo (conteúdo, PT). */
  area: string;
  /** Onde vive no legado (arquivos/endpoints). */
  legacyPath: string;
  decision: LegacyDecision;
  /** URL equivalente no Bioma quando já existir (CA6). */
  biomaUrl: string | null;
  /** Justificativa/destino (conteúdo, PT). */
  note: string;
};

export const LEGACY_INVENTORY: LegacyInventoryItem[] = [
  {
    id: "idea-bank-read",
    area: "Banco de Ideias — visualização e filtros",
    legacyPath: "src/idea-bank/IdeaBank.tsx · store/useIdeaStore.ts · GET /api/ideas",
    decision: "substituido",
    biomaUrl: "/viveiro/ideias",
    note: "Leitura/filtros portados. O Bioma lê ideas.json direto via adapter server-only (sem watcher).",
  },
  {
    id: "idea-bank-write",
    area: "Banco de Ideias — edição (escrita no JSON)",
    legacyPath: "plugin/squadWatcher.ts · POST /api/ideas",
    decision: "manter_temporario",
    biomaUrl: null,
    note: "TODO: edição no Bioma exige schema validation + diff resumido + auditoria (CA2 da spec). Até lá, escrita segue no fluxo atual (Curador/git ou dashboard antigo).",
  },
  {
    id: "tech-radar-read",
    area: "Tech Radar / Banco de Stack — visualização",
    legacyPath: "src/tech-radar/TechRadar.tsx · GET /api/stack",
    decision: "substituido",
    biomaUrl: "/viveiro/radar",
    note: "Tabela por quadrante com anel e referência de ADR portada para o Bioma.",
  },
  {
    id: "tech-radar-write",
    area: "Tech Radar — edição (escrita no JSON)",
    legacyPath: "plugin/squadWatcher.ts · POST /api/stack",
    decision: "manter_temporario",
    biomaUrl: null,
    note: "Mesma pendência da edição de ideias: escrita com diff/auditoria fica para o próximo corte.",
  },
  {
    id: "architecture-view",
    area: "Arquitetura — decisões D1–D7 + ferramentas externas",
    legacyPath: "src/architecture/ArchitectureView.tsx · GET /api/architecture",
    decision: "substituido",
    biomaUrl: "/viveiro/arquitetura",
    note: "Decisões e ferramentas externas portadas. O mapa de squads ao vivo (parte da mesma tela no legado) NÃO foi portado — ver item 'squads-live-state'.",
  },
  {
    id: "clients-portfolio",
    area: "Carteira de clientes",
    legacyPath: "src/clients/ClientPortfolio.tsx · GET /api/clients (lê clients/)",
    decision: "portar",
    biomaUrl: null,
    note: "Destino: client-hub / mod-comercial (a carteira real passa a viver nas organizations do multitenant; /admin já lista orgs, mas onboarding/serviços do clients/ ainda não têm casa).",
  },
  {
    id: "squads-live-state",
    area: "Squads — estado/execuções ao vivo",
    legacyPath: "components/SquadCard·SquadSelector·StatusBar · hooks/useSquadSocket · GET /api/snapshot · WS /__squads_ws",
    decision: "portar",
    biomaUrl: null,
    note: "RF7 da spec: visão de execuções/runs no cockpit. Depende de mod-observabilidade (sinais de saúde) — o push em tempo real vem de lá, não de um watcher Vite.",
  },
  {
    id: "office-phaser",
    area: "Escritório virtual (pixel art Phaser)",
    legacyPath: "src/office/* (PhaserGame, OfficeScene, AgentSprite, RoomBuilder)",
    decision: "descartar",
    biomaUrl: null,
    note: "Fora de escopo do MVP por decisão da spec (§4: não é prioridade; visual lúdico sem função de decisão). Revisitar apenas se a metáfora voltar como prioridade explícita.",
  },
  {
    id: "squad-watcher-plugin",
    area: "squadWatcher — plugin Vite (watch + REST + WebSocket)",
    legacyPath: "src/plugin/squadWatcher.ts",
    decision: "descartar",
    biomaUrl: null,
    note: "Mecanismo substituído: o Bioma lê o filesystem em Server Components (adapters em src/server/viveiro/). Tempo real/observabilidade é papel do mod-observabilidade.",
  },
  {
    id: "ui-foundation",
    area: "Fundação de UI do legado (stores zustand, estilos, helpers)",
    legacyPath: "src/store/* · src/styles/* · src/lib/{formatTime,normalizeState}.ts",
    decision: "descartar",
    biomaUrl: null,
    note: "O Bioma usa Server Components + tokens semânticos (ADR-0010) + next-intl (ADR-0009); estado global client-side e CSS custom do legado não se aplicam.",
  },
];
