import { PlanningPortfolioPanel } from "./PlanningPortfolioPanel";

export function PlanningPortfolioView() {
  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto", color: "var(--text)" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
          Portfólio de Planejamentos
        </h1>
        <p style={{ margin: "4px 0 0", color: "var(--text-dim)", fontSize: "0.9rem" }}>
          Intakes operacionais, diagnósticos técnicos e estimativas de alocação dos projetos.
        </p>
      </div>

      <PlanningPortfolioPanel />
    </div>
  );
}

export default PlanningPortfolioView;
