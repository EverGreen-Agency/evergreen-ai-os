import { cn } from "@/lib/utils";

/** Toolbar densa do legado: superfície funda, borda inferior, conteúdo inline. */
export function Toolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface-deep px-3 py-2 text-xs",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Contador da toolbar ("146 ativas"). */
export function ToolbarCount({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-auto font-mono text-[11px] text-muted-foreground">
      {children}
    </span>
  );
}
