import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function ProofItem({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
  return (
    <div>
      <Icon size={20} />
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}

export function SectionHeader({ eyebrow, title, icon: Icon }: { eyebrow: string; title: string; icon: LucideIcon }) {
  return (
    <div className="panel-heading compact">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <Icon size={22} />
    </div>
  );
}

export function DockTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="dock-title">
      <Icon size={16} />
      <strong>{title}</strong>
    </div>
  );
}

export function HubBlock({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <section className="hub-block">
      <div className="hub-block-title">
        <Icon size={18} />
        <h3>{title}</h3>
      </div>
      <div className="hub-block-list">{children}</div>
    </section>
  );
}

export function HealthRow({ icon: Icon, label, ok, value }: { icon: LucideIcon; label: string; ok: boolean; value: string }) {
  return (
    <div className="health-row">
      <Icon size={18} />
      <span>{label}</span>
      <strong className={ok ? "ok" : "bad"}>{value}</strong>
    </div>
  );
}

export function EmptyState({ text, compact = false }: { text: string; compact?: boolean }) {
  return <div className={compact ? "empty-state compact" : "empty-state"}>{text}</div>;
}
