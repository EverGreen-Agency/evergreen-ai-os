import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Estado real do build, injetado em tempo de compilação.
 *
 * O número em APP_VERSION só muda quando o release-please corta um release em
 * `main`. Enquanto o trabalho vive em `develop`, exibir apenas "v0.1.0" faz a
 * interface mentir sobre o que está no ar — por isso o rodapé passa a mostrar
 * também branch e commit, que são verdade em qualquer branch.
 *
 * Sem git disponível (container de build sem .git), os campos vêm vazios e a
 * interface mostra só a versão, em vez de inventar um hash.
 */
function git(command) {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_COMMIT__: JSON.stringify(git("git rev-parse --short HEAD")),
    __BUILD_BRANCH__: JSON.stringify(git("git rev-parse --abbrev-ref HEAD")),
    __BUILD_AT__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    port: 5173,
    proxy: {
      "/auth": "http://127.0.0.1:8000",
      "/clients": "http://127.0.0.1:8000",
      "/workspaces": "http://127.0.0.1:8000",
      "/health": "http://127.0.0.1:8000",
      "/backoffice": "http://127.0.0.1:8000"
    }
  },
});
