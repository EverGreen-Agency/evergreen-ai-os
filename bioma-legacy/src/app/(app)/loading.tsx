/** Feedback imediato ao clique (perf 2026-07-08): skeleton denso do shell. */
export default function AppLoading() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <div className="h-9 animate-pulse rounded-md bg-muted/60" />
      <div className="h-40 animate-pulse rounded-md bg-muted/40" />
      <div className="h-40 animate-pulse rounded-md bg-muted/25" />
    </div>
  );
}
