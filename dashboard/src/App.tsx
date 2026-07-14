import { useState } from "react";
import { useSquadSocket } from "@/hooks/useSquadSocket";
import { SquadSelector } from "@/components/SquadSelector";
import { PhaserGame } from "@/office/PhaserGame";
import { StatusBar } from "@/components/StatusBar";
import { IdeaBank } from "@/idea-bank/IdeaBank";
import { TechRadar } from "@/tech-radar/TechRadar";
import { ClientPortfolio } from "@/clients/ClientPortfolio";
import { ArchitectureView } from "@/architecture/ArchitectureView";

type Tab = "escritorio" | "banco" | "stack" | "arquitetura" | "clientes";

const TAB_LABELS: Record<Tab, string> = {
  escritorio:  "Escritório",
  banco:       "Banco de Ideias",
  stack:       "Banco de Stack",
  arquitetura: "Arquitetura",
  clientes:    "Clientes",
};

const TABS: Tab[] = ["escritorio", "banco", "stack", "arquitetura", "clientes"];

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
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5, color: "var(--text-primary)" }}>
          EverGreen <span style={{ color: "var(--accent-green)" }}>AI OS</span>
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
        {activeTab === "stack" && <TechRadar />}
        {activeTab === "arquitetura" && <ArchitectureView />}
        {activeTab === "clientes" && <ClientPortfolio />}
      </div>

      {/* Footer */}
      <StatusBar />
    </div>
  );
}
