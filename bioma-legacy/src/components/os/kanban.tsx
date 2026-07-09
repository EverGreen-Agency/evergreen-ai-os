import { cn } from "@/lib/utils";

/** Board horizontal denso (colunas min 260px, scroll-x) — padrão do legado. */
export function KanbanBoard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3 overflow-x-auto pb-2", className)}>
      {children}
    </div>
  );
}

/** Coluna com borda superior 2px na cor + label uppercase + contador + hint. */
export function KanbanColumn({
  label,
  color,
  count,
  hint,
  children,
}: {
  label: string;
  color: string;
  count: number;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="min-w-[260px] flex-1 rounded-md border border-border bg-card"
      style={{ borderTopWidth: 2, borderTopColor: color }}
    >
      <header className="px-3 pb-1 pt-2">
        <div className="flex items-baseline gap-2">
          <span
            className="text-[11px] font-bold uppercase tracking-[0.7px]"
            style={{ color }}
          >
            {label}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">{count}</span>
        </div>
        {hint ? (
          <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{hint}</p>
        ) : null}
      </header>
      <div className="flex flex-col gap-1.5 p-2">{children}</div>
    </section>
  );
}

/** Card denso de kanban (13px, paddings mínimos, hover sutil). */
export function KanbanCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "rounded-[5px] border border-border bg-background/60 px-2.5 py-2 text-[13px] leading-snug transition-colors hover:border-primary/50",
        className,
      )}
    >
      {children}
    </article>
  );
}
