/** Versão do Bioma — fonte única de verdade.
 *  SemVer: MAJOR.MINOR.PATCH
 *  - MAJOR: breaking change de produto / lançamento público
 *  - MINOR: feature nova visível ao usuário
 *  - PATCH: bugfix, ajuste visual, melhoria interna
 *  Atualizada automaticamente pelo release-please a cada release em main
 *  (a anotação x-release-please-version na linha abaixo é o marcador).
 */
export const APP_VERSION = "0.1.0"; // x-release-please-version

/** Estado real do build, injetado pelo Vite (ver vite.config.mjs).
 *
 *  Por que existe: o release-please só sobe APP_VERSION quando corta release em
 *  `main`. Todo o desenvolvimento vive em `develop`, então a versão fica parada
 *  e o rodapé passaria a impressão de que nada mudou. Commit e branch dizem a
 *  verdade sobre o que está rodando em qualquer branch.
 */
declare const __BUILD_COMMIT__: string;
declare const __BUILD_BRANCH__: string;
declare const __BUILD_AT__: string;

export const BUILD_COMMIT = typeof __BUILD_COMMIT__ === "string" ? __BUILD_COMMIT__ : "";
export const BUILD_BRANCH = typeof __BUILD_BRANCH__ === "string" ? __BUILD_BRANCH__ : "";
export const BUILD_AT = typeof __BUILD_AT__ === "string" ? __BUILD_AT__ : "";

/** É um build de release (cortado em main) ou de desenvolvimento? */
export const IS_RELEASE_BUILD = BUILD_BRANCH === "main" || BUILD_BRANCH === "";

/** Rótulo curto para o rodapé: "v0.1.0" em release, "v0.1.0 · develop 95f5f0c" fora. */
export const VERSION_LABEL = IS_RELEASE_BUILD
  ? `v${APP_VERSION}`
  : `v${APP_VERSION} · ${BUILD_BRANCH}${BUILD_COMMIT ? ` ${BUILD_COMMIT}` : ""}`;
