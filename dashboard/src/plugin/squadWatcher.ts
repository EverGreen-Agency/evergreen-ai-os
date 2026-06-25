import type { Plugin, ViteDevServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import type { Server, IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { watch as chokidarWatch } from "chokidar";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import type { SquadInfo, SquadState, WsMessage } from "../types/state";

function resolveSquadsDir(): string {
  const candidates = [
    path.resolve(process.cwd(), "../squads"),
    path.resolve(process.cwd(), "squads"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.resolve(process.cwd(), "../squads");
}

function resolveMemoryPath(relative: string): string {
  const candidates = [
    path.resolve(process.cwd(), "../_opensquad/_memory", relative),
    path.resolve(process.cwd(), "_opensquad/_memory", relative),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

function resolveIdeasPath(): string {
  return resolveMemoryPath("banco_ideias/ideas.json");
}

function resolveArchPath(): string {
  return resolveMemoryPath("banco_arquitetura/arquitetura.md");
}

function resolveStackPath(): string {
  return resolveMemoryPath("banco_stack/stack.json");
}

function resolveClientsDir(): string {
  return resolveMemoryPath("clients");
}

// Reads every clients/<id>/config.json into an array for /api/clients.
async function readClients(clientsDir: string): Promise<unknown[]> {
  let entries;
  try {
    entries = await fsp.readdir(clientsDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const clients: unknown[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const cfgPath = path.join(clientsDir, entry.name, "config.json");
    try {
      const raw = await fsp.readFile(cfgPath, "utf-8");
      const cfg = JSON.parse(raw);
      clients.push({ ...cfg, _dir: entry.name, _is_template: entry.name === "_template" });
    } catch {
      // No config.json or invalid — skip
    }
  }
  return clients;
}

async function discoverSquads(squadsDir: string): Promise<SquadInfo[]> {
  let entries;
  try {
    entries = await fsp.readdir(squadsDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const squads: SquadInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;

    const yamlPath = path.join(squadsDir, entry.name, "squad.yaml");
    try {
      const raw = await fsp.readFile(yamlPath, "utf-8");
      const parsed = parseYaml(raw) as Record<string, unknown>;
      // Support both canonical `squad:` wrapper and flat root-level format
      const s = (parsed?.squad ?? parsed) as Record<string, unknown>;
      if (s && typeof s === "object") {
        // Derive agent list: explicit agents field OR infer from pipeline steps
        let agents: string[] = [];
        if (Array.isArray(s.agents)) {
          agents = (s.agents as unknown[]).filter((a): a is string => typeof a === "string");
        } else if (Array.isArray(s.pipeline)) {
          const seen = new Set<string>();
          for (const step of s.pipeline as Record<string, unknown>[]) {
            if (typeof step?.agent === "string" && !seen.has(step.agent)) {
              seen.add(step.agent);
              agents.push(step.agent);
            }
          }
        }
        squads.push({
          code: typeof s.code === "string" ? s.code : entry.name,
          name: typeof s.name === "string" ? s.name : entry.name,
          description: typeof s.description === "string" ? s.description : "",
          icon: typeof s.icon === "string" ? s.icon : "\u{1F4CB}",
          agents,
        });
        continue;
      }
    } catch {
      // No squad.yaml or invalid YAML — fall through to default
    }

    squads.push({
      code: entry.name,
      name: entry.name,
      description: "",
      icon: "\u{1F4CB}",
      agents: [],
    });
  }

  return squads;
}

function isValidState(data: unknown): data is SquadState {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.status === "string" &&
    d.step != null && typeof d.step === "object" &&
    Array.isArray(d.agents)
  );
}

async function readActiveStates(squadsDir: string): Promise<Record<string, SquadState>> {
  const states: Record<string, SquadState> = {};

  let entries;
  try {
    entries = await fsp.readdir(squadsDir, { withFileTypes: true });
  } catch {
    return states;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const statePath = path.join(squadsDir, entry.name, "state.json");

    try {
      const raw = await fsp.readFile(statePath, "utf-8");
      const parsed = JSON.parse(raw);
      if (isValidState(parsed)) {
        states[entry.name] = parsed;
      }
    } catch {
      // Skip missing or invalid JSON
    }
  }

  return states;
}

async function buildSnapshot(squadsDir: string): Promise<WsMessage> {
  return {
    type: "SNAPSHOT",
    squads: await discoverSquads(squadsDir),
    activeStates: await readActiveStates(squadsDir),
  };
}

function broadcast(wss: WebSocketServer, msg: WsMessage) {
  const data = JSON.stringify(msg);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(data);
      } catch {
        // Client connection dying — ws library will clean it up
      }
    }
  }
}

export function squadWatcherPlugin(): Plugin {
  return {
    name: "squad-watcher",
    configureServer(server: ViteDevServer) {
      if (!server.httpServer) {
        server.config.logger.warn("[squad-watcher] no httpServer — skipping");
        return;
      }

      const squadsDir = resolveSquadsDir();
      const ideasPath = resolveIdeasPath();
      const stackPath = resolveStackPath();
      const clientsDir = resolveClientsDir();
      const archPath = resolveArchPath();
      server.config.logger.info(`[squad-watcher] squads dir: ${squadsDir}`);
      server.config.logger.info(`[squad-watcher] ideas path: ${ideasPath}`);

      // Create WebSocket server with noServer to avoid intercepting Vite's HMR
      const wss = new WebSocketServer({ noServer: true });
      (server.httpServer as Server).on("upgrade", (req: IncomingMessage, socket: Duplex, head: Buffer) => {
        if (req.url === "/__squads_ws") {
          wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit("connection", ws, req);
          });
        }
        // Let Vite handle all other upgrade requests (HMR)
      });

      // Send snapshot on new connection
      wss.on("connection", async (ws) => {
        try {
          const snap = await buildSnapshot(squadsDir);
          ws.send(JSON.stringify(snap));
        } catch {
          // Connection may have closed before snapshot was ready
        }
      });

      // Ensure squads directory exists
      fsp.mkdir(squadsDir, { recursive: true }).catch((err) => {
        server.config.logger.error(`[squad-watcher] failed to create squads dir: ${err.message}`);
      });

      // REST API — snapshot + ideas endpoints
      server.middlewares.use(async (req, res, next) => {
        // GET /api/snapshot
        if (req.url === "/api/snapshot" && req.method === "GET") {
          try {
            const snapshot = await buildSnapshot(squadsDir);
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Cache-Control", "no-cache");
            res.end(JSON.stringify(snapshot));
          } catch {
            res.writeHead(500);
            res.end("Internal Server Error");
          }
          return;
        }

        // GET /api/ideas
        if (req.url === "/api/ideas" && req.method === "GET") {
          try {
            const raw = await fsp.readFile(ideasPath, "utf-8");
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Cache-Control", "no-cache");
            res.end(raw);
          } catch {
            res.writeHead(404);
            res.end(JSON.stringify({ error: "ideas.json not found" }));
          }
          return;
        }

        // GET /api/stack
        if (req.url === "/api/stack" && req.method === "GET") {
          try {
            const raw = await fsp.readFile(stackPath, "utf-8");
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Cache-Control", "no-cache");
            res.end(raw);
          } catch {
            res.writeHead(404);
            res.end(JSON.stringify({ error: "stack.json not found" }));
          }
          return;
        }

        // GET /api/clients
        if (req.url === "/api/clients" && req.method === "GET") {
          try {
            const clients = await readClients(clientsDir);
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Cache-Control", "no-cache");
            res.end(JSON.stringify({ clients }));
          } catch {
            res.writeHead(500);
            res.end(JSON.stringify({ error: "failed to read clients" }));
          }
          return;
        }

        // POST /api/stack — write updated stack back to stack.json
        if (req.url === "/api/stack" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
          req.on("end", async () => {
            try {
              const payload = JSON.parse(body) as { techs: unknown[] };
              const existing = JSON.parse(await fsp.readFile(stackPath, "utf-8"));
              const updated = {
                ...existing,
                updated_at: new Date().toISOString().split("T")[0],
                techs: payload.techs,
              };
              await fsp.writeFile(stackPath, JSON.stringify(updated, null, 2), "utf-8");
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true }));
            } catch (err) {
              res.writeHead(500);
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
          return;
        }

        // GET /api/architecture — returns arquitetura.md + live squad scan
        if (req.url === "/api/architecture" && req.method === "GET") {
          try {
            const md = await fsp.readFile(archPath, "utf-8").catch(() => "");
            const squads = await discoverSquads(squadsDir);
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Cache-Control", "no-cache");
            res.end(JSON.stringify({ md, squads }));
          } catch {
            res.writeHead(500);
            res.end(JSON.stringify({ error: "failed to read architecture" }));
          }
          return;
        }

        // POST /api/ideas — write updated ideas array back to ideas.json
        if (req.url === "/api/ideas" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
          req.on("end", async () => {
            try {
              const payload = JSON.parse(body) as { ideas: unknown[] };
              const existing = JSON.parse(await fsp.readFile(ideasPath, "utf-8"));
              const updated = {
                ...existing,
                updated_at: new Date().toISOString().split("T")[0],
                ideas: payload.ideas,
              };
              await fsp.writeFile(ideasPath, JSON.stringify(updated, null, 2), "utf-8");
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true }));
            } catch (err) {
              res.writeHead(500);
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
          return;
        }

        next();
      });

      // Watch ideas.json for changes from the Curador
      const ideasWatcher = chokidarWatch(ideasPath, {
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 400, pollInterval: 50 },
      });
      ideasWatcher.on("change", async () => {
        try {
          const raw = await fsp.readFile(ideasPath, "utf-8");
          const bank = JSON.parse(raw);
          if (Array.isArray(bank?.ideas)) {
            broadcast(wss, { type: "IDEAS_UPDATE", ideas: bank.ideas });
          }
        } catch {
          // Partial write — next event will have the complete file
        }
      });

      // File watcher using chokidar — reliable cross-platform, handles partial writes
      const watcher = chokidarWatch(squadsDir, {
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 50 },
        ignored: [/(^|[/\\])\./, /node_modules/, /output[/\\]/],
        depth: 2,
      });

      function handleFileChange(filePath: string) {
        const relative = path.relative(squadsDir, filePath).replace(/\\/g, "/");
        const parts = relative.split("/");
        if (parts.length < 2) return;

        const squadName = parts[0];
        const fileName = parts[1];

        if (fileName === "state.json") {
          fsp.readFile(filePath, "utf-8").then((raw) => {
            const parsed = JSON.parse(raw);
            if (!isValidState(parsed)) return;
            broadcast(wss, { type: "SQUAD_UPDATE", squad: squadName, state: parsed });
          }).catch(() => {
            // Invalid JSON — next change event will retry
          });
        } else if (fileName === "squad.yaml") {
          buildSnapshot(squadsDir).then((snap) => broadcast(wss, snap));
        }
      }

      function handleFileRemoval(filePath: string) {
        const relative = path.relative(squadsDir, filePath).replace(/\\/g, "/");
        const parts = relative.split("/");
        if (parts.length < 2) return;

        const squadName = parts[0];
        const fileName = parts[1];

        if (fileName === "state.json") {
          broadcast(wss, { type: "SQUAD_INACTIVE", squad: squadName });
        } else if (fileName === "squad.yaml") {
          buildSnapshot(squadsDir).then((snap) => broadcast(wss, snap));
        }
      }

      watcher.on("add", handleFileChange);
      watcher.on("change", handleFileChange);
      watcher.on("unlink", handleFileRemoval);

      server.httpServer.on("close", () => {
        watcher.close();
        ideasWatcher.close();
      });
    },
  };
}

