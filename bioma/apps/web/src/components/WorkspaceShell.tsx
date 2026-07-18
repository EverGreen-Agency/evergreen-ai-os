import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

export type WorkspaceShellItem = {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
};

export function WorkspaceShell({
  eyebrow,
  title,
  icon: Icon,
  backTo,
  backLabel,
  items,
  children,
}: {
  eyebrow: string;
  title: string;
  icon: LucideIcon;
  backTo: string;
  backLabel: string;
  items: WorkspaceShellItem[];
  children: ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <section className="workspace-shell">
      <header className="workspace-context-bar">
        <button className="icon-button" type="button" onClick={() => navigate(backTo)} aria-label={backLabel}>
          <ArrowLeft size={18} />
        </button>
        <div className="workspace-context-title">
          <span><Icon size={14} /> {eyebrow}</span>
          <strong>{title}</strong>
        </div>
        <nav className="workspace-context-nav" aria-label={`Módulos de ${title}`}>
          {items.map((item) => {
            const ItemIcon = item.icon;
            return (
              <NavLink key={item.id} to={item.to} end={item.end}>
                <ItemIcon size={15} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </header>

      <div className="workspace-shell-content">{children}</div>
    </section>
  );
}
