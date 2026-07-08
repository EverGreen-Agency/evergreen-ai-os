/** Skeleton do Viveiro: toolbar + colunas de kanban fantasma. */
export default function ViveiroLoading() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <div className="h-9 animate-pulse rounded-md bg-muted/60" />
      <div className="flex gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-64 min-w-[260px] flex-1 animate-pulse rounded-md bg-muted/40"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
