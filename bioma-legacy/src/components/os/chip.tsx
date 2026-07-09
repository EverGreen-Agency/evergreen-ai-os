import Link from "next/link";
import type { Route } from "next";

import { cn } from "@/lib/utils";

/**
 * Chip — assinatura visual do legado: fundo `{cor}22`, texto na cor, 10px.
 * Server-compatible (sem handlers); para filtro interativo use FilterChipLink.
 */
export function Chip({
  color,
  children,
  title,
  className,
}: {
  color: string;
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 text-[10px] font-semibold leading-none",
        className,
      )}
      style={{ backgroundColor: `${color}22`, color }}
    >
      {children}
    </span>
  );
}

/** Chip de filtro como link GET (RSC-friendly): ativo = pintado, inativo = borda. */
export function FilterChipLink({
  color,
  href,
  active,
  children,
}: {
  color: string;
  href: Route;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-[3px] border px-1.5 py-0.5 text-[10px] font-semibold leading-none transition-colors"
      style={
        active
          ? { backgroundColor: `${color}22`, color, borderColor: `${color}66` }
          : { color: "var(--muted-foreground)", borderColor: "var(--border)" }
      }
    >
      {children}
    </Link>
  );
}
