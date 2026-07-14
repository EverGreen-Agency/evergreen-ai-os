#!/usr/bin/env node
// eg-scan — roda uma pergunta do CodeGraph em TODOS os repos da EG sob uma raiz.
// Uso: node eg-scan.mjs "sua pergunta"
// Raiz: env EG_PROJECTS_ROOT, senão a pasta-mãe deste repo (ex.: Desktop/EG).
import { execSync } from "node:child_process";
import { readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const query = process.argv.slice(2).join(" ").trim();
if (!query) {
  console.error('Uso: node eg-scan.mjs "sua pergunta"');
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url)); // skills/eg-scan/scripts
const repoRoot = join(here, "..", "..", "..");        // raiz deste repo
const root = process.env.EG_PROJECTS_ROOT || join(repoRoot, ".."); // pasta-mãe (Desktop/EG)

const isRepo = (p) => existsSync(join(p, ".git"));
const isIndexed = (p) => existsSync(join(p, ".codegraph"));

let entries;
try {
  entries = readdirSync(root, { withFileTypes: true });
} catch (e) {
  console.error(`Não consegui ler a raiz: ${root}\n${e.message}`);
  process.exit(1);
}

const repos = entries
  .filter((d) => d.isDirectory())
  .map((d) => join(root, d.name))
  .filter(isRepo);

console.log(`# eg-scan — "${query}"`);
console.log(`Raiz: ${root} · ${repos.length} repo(s) git\n`);

if (!repos.length) {
  console.log("Nenhum repo git na raiz. Defina EG_PROJECTS_ROOT ou clone os projetos sob essa pasta.");
  process.exit(0);
}

for (const repo of repos) {
  const name = repo.split(/[\\/]/).pop();
  if (!isIndexed(repo)) {
    console.log(`## ${name}\n  ⚠️  não indexado — rode:  cd "${repo}" && codegraph init\n`);
    continue;
  }
  console.log(`## ${name}`);
  try {
    const out = execSync(
      `codegraph explore ${JSON.stringify(query)} -p ${JSON.stringify(repo)} --max-files 1`,
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 90000 }
    );
    // Resumo: cabeçalho + blast radius (primeiras ~14 linhas), sem despejar o código todo.
    const summary = out.split("\n").slice(0, 14).join("\n").trim();
    console.log((summary || "(sem símbolos relevantes)") + "\n");
  } catch (e) {
    console.log(`  (erro/sem resultado: ${String(e.message).split("\n")[0]})\n`);
  }
}
