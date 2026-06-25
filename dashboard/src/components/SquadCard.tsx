import type { SquadInfo, SquadState } from "@/types/state";
import { StatusBadge } from "./StatusBadge";

interface SquadCardProps {
  squad: SquadInfo;
  state: SquadState | undefined;
  isSelected: boolean;
  onSelect: () => void;
}

export function SquadCard({ squad, state, isSelected, onSelect }: SquadCardProps) {
  const isActive = !!state;
  const status = state?.status ?? "inactive";

  return (
    <button
      type="button"
      onClick={onSelect}
      title={squad.description || squad.name}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        width: "100%",
        padding: "9px 12px",
        border: "none",
        borderLeft: isSelected ? "3px solid var(--accent-cyan)" : "3px solid transparent",
        background: isSelected ? "var(--bg-secondary)" : "transparent",
        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
        cursor: "pointer",
        textAlign: "left",
        fontSize: 13,
        fontFamily: "inherit",
        transition: "all 0.15s ease",
      }}
    >
      <StatusBadge status={status} />
      <span style={{ marginTop: 1 }}>{squad.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontSize: 12, fontWeight: isSelected ? 600 : 400,
        }}>
          {squad.name}
        </div>
        {squad.description && (
          <div style={{
            fontSize: 10,
            color: "var(--text-secondary)",
            lineHeight: 1.35,
            marginTop: 2,
            maxHeight: "2.7em",
            overflow: "hidden",
          }}>
            {squad.description}
          </div>
        )}
      </div>
      {state?.step && (
        <span style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 2, flexShrink: 0 }}>
          {state.step.current}/{state.step.total}
        </span>
      )}
    </button>
  );
}
