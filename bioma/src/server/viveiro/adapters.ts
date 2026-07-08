/**
 * Adapters do cockpit interno (mod-cockpit-interno).
 *
 * Leem os BANCOS INTERNOS em arquivo (ADR-0006/D2: eles NÃO migram para o DB)
 * direto do repo `evergreen-ai-os` via fs — server-only, nunca no client.
 *
 * Feature-detection (CA7): se o diretório de memória não existir (deploy cloud
 * sem o repo interno), todo adapter retorna `null` e a UI mostra o estado
 * "memória interna indisponível" — o cockpit NUNCA derruba o app.
 *
 * Parse defensivo: zod com `.catch()` campo a campo — um registro novo com
 * enum desconhecido não pode quebrar a tela (os bancos evoluem toda semana).
 */
import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { cache } from "react";
import { z } from "zod";

// ── Caminho base ──────────────────────────────────────────────────────────────

/** Raiz da memória interna. Override via env INTERNAL_MEMORY_PATH. */
function memoryBasePath(): string {
  const fromEnv = process.env.INTERNAL_MEMORY_PATH;
  if (fromEnv && fromEnv.length > 0) return path.resolve(fromEnv);
  // bioma/ vive dentro do monorepo evergreen-ai-os — sobe um nível.
  return path.resolve(process.cwd(), "..", "_opensquad", "_memory");
}

/** O repo interno está presente neste ambiente? */
export const isMemoryAvailable = cache(async (): Promise<boolean> => {
  try {
    const stat = await fs.stat(memoryBasePath());
    return stat.isDirectory();
  } catch {
    return false;
  }
});

async function readTextFile(...segments: string[]): Promise<string | null> {
  try {
    return await fs.readFile(path.join(memoryBasePath(), ...segments), "utf8");
  } catch {
    return null;
  }
}

async function readJsonFile(...segments: string[]): Promise<unknown | null> {
  const raw = await readTextFile(...segments);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

// ── Banco de Ideias (banco_ideias/ideas.json, schema v1.1) ───────────────────

const ideaSchema = z.object({
  id: z.string(),
  title: z.string(),
  desc: z.string().catch(""),
  stage: z.string().catch(""),
  horizon: z.string().catch(""),
  category: z.string().catch(""),
  origin: z.string().catch(""),
  archived: z.boolean().catch(false),
  depends_on: z.array(z.string()).catch([]),
  enables: z.array(z.string()).catch([]),
  source: z.string().catch(""),
  part_of: z.string().nullable().catch(null),
  readiness: z.string().nullable().catch(null),
  clickup: z.boolean().catch(false),
});

const ideaBankSchema = z.object({
  schema_version: z.string().catch(""),
  updated_at: z.string().catch(""),
  stages: z.array(z.string()).catch([]),
  ideas: z.array(ideaSchema).catch([]),
});

export type Idea = z.infer<typeof ideaSchema>;
export type IdeaBank = z.infer<typeof ideaBankSchema>;

export const getIdeaBank = cache(async (): Promise<IdeaBank | null> => {
  const json = await readJsonFile("banco_ideias", "ideas.json");
  if (json === null) return null;
  const parsed = ideaBankSchema.safeParse(json);
  return parsed.success ? parsed.data : null;
});

// ── Banco de Stack / Tech Radar (banco_stack/stack.json) ─────────────────────

/** Anéis conhecidos do radar (modelo ThoughtWorks). Valores novos não quebram. */
export const KNOWN_RINGS = ["adopt", "trial", "assess", "hold"] as const;
export const KNOWN_QUADRANTS = [
  "languages",
  "frameworks",
  "tools",
  "platforms-infra",
] as const;

const techSchema = z.object({
  id: z.string(),
  name: z.string(),
  quadrant: z.string().catch(""),
  ring: z.string().catch(""),
  note: z.string().catch(""),
  adr: z.string().catch(""),
  source: z.string().catch(""),
});

const stackRadarSchema = z.object({
  schema_version: z.string().catch(""),
  updated_at: z.string().catch(""),
  rings: z.array(z.string()).catch([...KNOWN_RINGS]),
  quadrants: z.array(z.string()).catch([...KNOWN_QUADRANTS]),
  techs: z.array(techSchema).catch([]),
});

export type Tech = z.infer<typeof techSchema>;
export type StackRadar = z.infer<typeof stackRadarSchema>;

export const getStackRadar = cache(async (): Promise<StackRadar | null> => {
  const json = await readJsonFile("banco_stack", "stack.json");
  if (json === null) return null;
  const parsed = stackRadarSchema.safeParse(json);
  return parsed.success ? parsed.data : null;
});

// ── Engenharia (engenharia/<id>/{spec.md, adr/*.md, tasks.md}) ───────────────

export type EngineeringModule = {
  id: string;
  hasSpec: boolean;
  /** Título da spec (1ª linha `# …`, sem o prefixo "Spec:"). */
  specTitle: string | null;
  /** Metadados do cabeçalho da spec (`- **Status:** …` / `- **Data:** …`). */
  specStatus: string | null;
  specDate: string | null;
  adrCount: number;
  hasTasks: boolean;
};

function parseSpecMetadata(raw: string): {
  title: string | null;
  status: string | null;
  date: string | null;
} {
  // Só o cabeçalho interessa — evita varrer specs longas inteiras.
  const head = raw.slice(0, 2000);
  const titleMatch = head.match(/^#\s+(.+)$/m);
  const title = titleMatch
    ? titleMatch[1].replace(/^Spec:\s*/i, "").trim()
    : null;
  const statusMatch = head.match(/\*\*Status:\*\*\s*(.+)$/m);
  const dateMatch = head.match(/\*\*Data:\*\*\s*(.+)$/m);
  return {
    title,
    status: statusMatch ? statusMatch[1].trim() : null,
    date: dateMatch ? dateMatch[1].trim() : null,
  };
}

export const getEngineeringModules = cache(
  async (): Promise<EngineeringModule[] | null> => {
    if (!(await isMemoryAvailable())) return null;
    const engDir = path.join(memoryBasePath(), "engenharia");

    let entries;
    try {
      entries = await fs.readdir(engDir, { withFileTypes: true });
    } catch {
      return null;
    }

    const modules: EngineeringModule[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const id = entry.name;

      const spec = await readTextFile("engenharia", id, "spec.md");
      const meta = spec !== null ? parseSpecMetadata(spec) : null;

      let adrCount = 0;
      try {
        const adrFiles = await fs.readdir(path.join(engDir, id, "adr"));
        adrCount = adrFiles.filter((f) => f.toLowerCase().endsWith(".md")).length;
      } catch {
        adrCount = 0;
      }

      let hasTasks = false;
      try {
        await fs.access(path.join(engDir, id, "tasks.md"));
        hasTasks = true;
      } catch {
        hasTasks = false;
      }

      modules.push({
        id,
        hasSpec: spec !== null,
        specTitle: meta?.title ?? null,
        specStatus: meta?.status ?? null,
        specDate: meta?.date ?? null,
        adrCount,
        hasTasks,
      });
    }

    return modules.sort((a, b) => a.id.localeCompare(b.id));
  },
);

// ── Banco de Arquitetura (banco_arquitetura/*.md) ────────────────────────────

export type ArchitectureDecision = {
  /** ex.: "D1" */
  id: string;
  title: string;
  /** Corpo em texto simples (markdown inline removido). */
  body: string;
};

export type MarkdownSection = {
  title: string;
  body: string;
};

/** Remove ênfase inline de markdown para exibição como texto simples. */
function stripInlineMarkdown(text: string): string {
  return text.replace(/\*\*/g, "").replace(/`/g, "");
}

/** Decisões D1..Dn de `arquitetura.md` (seções `### Dx — título`). */
export const getArchitectureDecisions = cache(
  async (): Promise<ArchitectureDecision[] | null> => {
    const raw = await readTextFile("banco_arquitetura", "arquitetura.md");
    if (raw === null) return null;

    const decisions: ArchitectureDecision[] = [];
    const regex = /^###\s+(D\d+)\s+[—-]\s+(.+)$/gm;
    let match: RegExpExecArray | null;
    const marks: Array<{ id: string; title: string; start: number }> = [];
    while ((match = regex.exec(raw)) !== null) {
      marks.push({
        id: match[1],
        title: stripInlineMarkdown(match[2].trim()),
        start: match.index + match[0].length,
      });
    }
    for (let i = 0; i < marks.length; i++) {
      const end =
        i + 1 < marks.length
          ? raw.lastIndexOf("###", marks[i + 1].start)
          : raw.indexOf("\n---", marks[i].start) === -1
            ? raw.length
            : raw.indexOf("\n---", marks[i].start);
      decisions.push({
        id: marks[i].id,
        title: marks[i].title,
        body: stripInlineMarkdown(raw.slice(marks[i].start, end).trim()),
      });
    }
    return decisions;
  },
);

/** Princípios de engenharia (seção `## 1. Princípios…` de arquitetura.md). */
export const getArchitecturePrinciples = cache(
  async (): Promise<string[] | null> => {
    const raw = await readTextFile("banco_arquitetura", "arquitetura.md");
    if (raw === null) return null;
    const section = raw
      .split(/^##\s+/m)
      .find((part) => part.startsWith("1."));
    if (!section) return [];
    return section
      .split("\n")
      .filter((line) => line.trimStart().startsWith("- "))
      .map((line) => stripInlineMarkdown(line.trim().replace(/^- /, "")));
  },
);

/**
 * Ferramentas externas (`ferramentas-externas.md`) em seções por `## título`.
 * Corpo fica como texto simples pré-formatado (tabelas MD legíveis o bastante
 * para uso interno — render rico fica para um corte futuro).
 */
export const getExternalToolsSections = cache(
  async (): Promise<MarkdownSection[] | null> => {
    const raw = await readTextFile("banco_arquitetura", "ferramentas-externas.md");
    if (raw === null) return null;

    const sections: MarkdownSection[] = [];
    const parts = raw.split(/^##\s+/m);
    // parts[0] é o preâmbulo (comentários + h1) — pulamos.
    for (const part of parts.slice(1)) {
      const newline = part.indexOf("\n");
      if (newline === -1) continue;
      sections.push({
        title: stripInlineMarkdown(part.slice(0, newline).trim()),
        body: stripInlineMarkdown(part.slice(newline + 1).trim()),
      });
    }
    return sections;
  },
);
