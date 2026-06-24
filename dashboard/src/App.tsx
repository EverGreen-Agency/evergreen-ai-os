import { useState } from "react";
import { useSquadSocket } from "@/hooks/useSquadSocket";
import { SquadSelector } from "@/components/SquadSelector";
import { PhaserGame } from "@/office/PhaserGame";
import { StatusBar } from "@/components/StatusBar";
import { IdeaBank } from "@/idea-bank/IdeaBank";

type Tab = "escritorio" | "banco";

const TAB_LABELS: Record<Tab, string> = {
  escritorio: "Escritório",
  banco: "Banco de Ideias",
};

const TABS: Tab[] = ["escritorio", "banco"];

export function App() {
  useSquadSocket();
  const [activeTab, setActiveTab] = useState<Tab>("escritorio");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          height: 40,
          minHeight: 40,
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-sidebar)",
          gap: 24,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.5, color: "var(--text-primary)" }}>
          opensquad
        </span>

        {/* Tabs */}
        <nav style={{ display: "flex", gap: 2, height: "100%", alignItems: "stretch" }}>
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: "transparent",
                  border: "none",
                  borderBottom: active ? "2px solid var(--accent-cyan)" : "2px solid transparent",
                  padding: "0 12px",
                  fontSize: 12,
                  fontFamily: "inherit",
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "color 0.12s",
                  letterSpacing: 0.3,
                }}
              >
                {TAB_LABELS[tab]}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main content */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {activeTab === "escritorio" && (
          <>
            <SquadSelector />
            <PhaserGame />
          </>
        )}
        {activeTab === "banco" && <IdeaBank />}
      </div>

      {/* Footer */}
      <StatusBar />
    </div>
  );
}
