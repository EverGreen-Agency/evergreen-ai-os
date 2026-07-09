import { Chip } from "./chip";

/**
 * Badges de grafo do Banco de Ideias (legado): `← N` depende de,
 * `→ N` habilita, `⊂ pai` pertence a, `⊃ N` contém módulos.
 */
export function GraphBadges({
  dependsOn,
  enables,
  partOf,
  containsCount,
}: {
  dependsOn: number;
  enables: number;
  partOf: string | null;
  containsCount: number;
}) {
  if (!dependsOn && !enables && !partOf && !containsCount) return null;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {dependsOn > 0 ? (
        <Chip color="#ffab00" title={`depende de ${dependsOn} ideia(s)`}>
          ← {dependsOn}
        </Chip>
      ) : null}
      {enables > 0 ? (
        <Chip color="#00d4ff" title={`habilita ${enables} ideia(s)`}>
          → {enables}
        </Chip>
      ) : null}
      {partOf ? (
        <Chip color="#a855f7" title={`parte de ${partOf}`}>
          ⊂ {partOf}
        </Chip>
      ) : null}
      {containsCount > 0 ? (
        <Chip color="#3ac97b" title={`contém ${containsCount} módulo(s)`}>
          ⊃ {containsCount}
        </Chip>
      ) : null}
    </span>
  );
}
