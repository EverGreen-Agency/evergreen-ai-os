import { useState, useEffect } from "react";
import { Package, Truck, Layers, Plus } from "lucide-react";
import {
  api,
  type KitDefinitionSummary,
  type KitPieceSummary,
  type KitShipmentSummary,
} from "../../../lib/api";

export function KitsManager() {
  const [activeTab, setActiveTab] = useState<"shipments" | "kits" | "pieces">("shipments");
  const [shipments, setShipments] = useState<KitShipmentSummary[]>([]);
  const [kits, setKits] = useState<KitDefinitionSummary[]>([]);
  const [pieces, setPieces] = useState<KitPieceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pieceName, setPieceName] = useState("");
  const [pieceSupplier, setPieceSupplier] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [s, k, p] = await Promise.all([
        api.listKitShipments(),
        api.listKitDefinitions(),
        api.listKitPieces(),
      ]);
      setShipments(s);
      setKits(k);
      setPieces(p);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar logística de kits.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePiece(e: React.FormEvent) {
    e.preventDefault();
    if (!pieceName.trim()) return;
    try {
      await api.createKitPiece({ name: pieceName, supplier: pieceSupplier || undefined });
      setPieceName("");
      setPieceSupplier("");
      loadData();
    } catch (err: any) {
      alert("Erro ao criar peça: " + err.message);
    }
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto", color: "var(--text)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            <Package color="var(--brand-accent)" size={28} /> Logística & Envio de Kits (MOD-LOGISTICA-KITS-001)
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--text-dim)", fontSize: "0.9rem" }}>
            Catálogo de peças, definição de kits corporativos e controle de envios para clientes/colaboradores.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border)", marginBottom: "24px" }}>
        <button
          onClick={() => setActiveTab("shipments")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "shipments" ? "2px solid var(--brand-accent)" : "2px solid transparent",
            color: activeTab === "shipments" ? "var(--brand-accent)" : "var(--text-dim)",
            padding: "10px 16px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Truck size={18} /> Envios ({shipments.length})
        </button>
        <button
          onClick={() => setActiveTab("kits")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "kits" ? "2px solid var(--brand-accent)" : "2px solid transparent",
            color: activeTab === "kits" ? "var(--brand-accent)" : "var(--text-dim)",
            padding: "10px 16px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Package size={18} /> Kits Cadastrados ({kits.length})
        </button>
        <button
          onClick={() => setActiveTab("pieces")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "pieces" ? "2px solid var(--brand-accent)" : "2px solid transparent",
            color: activeTab === "pieces" ? "var(--brand-accent)" : "var(--text-dim)",
            padding: "10px 16px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Layers size={18} /> Estoque de Peças ({pieces.length})
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "#ef4444", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-dim)" }}>Carregando dados de logística...</div>
      ) : activeTab === "shipments" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {shipments.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--text-dim)" }}>
              Nenhum envio registrado no momento.
            </div>
          ) : (
            shipments.map((s) => (
              <div
                key={s.id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600 }}>{s.kit_name}</h3>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>Cliente: {s.client_name}</span>
                </div>
                <span style={{ fontSize: "0.8rem", background: "var(--bg-inset)", color: "var(--brand-accent)", padding: "4px 12px", borderRadius: "16px", fontWeight: 600 }}>
                  Status: {s.status}
                </span>
              </div>
            ))
          )}
        </div>
      ) : activeTab === "kits" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {kits.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", padding: "40px", textAlign: "center", background: "var(--surface)", borderRadius: "12px", color: "var(--text-dim)" }}>
              Nenhum kit cadastrado.
            </div>
          ) : (
            kits.map((k) => (
              <div key={k.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "1.1rem", fontWeight: 600 }}>{k.name}</h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-dim)" }}>{k.description || "Sem descrição."}</p>
                <span style={{ fontSize: "0.75rem", color: "var(--brand-accent)", display: "block", marginTop: "8px" }}>Nível: {k.level}</span>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Formulário Nova Peça */}
          <form
            onSubmit={handleCreatePiece}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              gap: "16px",
              alignItems: "flex-end",
            }}
          >
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>Nome do Item / Brinde</label>
              <input
                type="text"
                value={pieceName}
                onChange={(e) => setPieceName(e.target.value)}
                placeholder="Ex: Caneca Térmica EG 500ml"
                style={{ padding: "10px", borderRadius: "8px", background: "var(--surface-sunken)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
            </div>
            <div style={{ width: "200px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>Fornecedor</label>
              <input
                type="text"
                value={pieceSupplier}
                onChange={(e) => setPieceSupplier(e.target.value)}
                placeholder="Ex: Gráfica Express"
                style={{ padding: "10px", borderRadius: "8px", background: "var(--surface-sunken)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
            </div>
            <button className="primary-button" type="submit" style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Plus size={18} /> Adicionar Peça
            </button>
          </form>

          {/* Lista de Peças */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {pieces.map((p) => (
              <div key={p.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                <Layers size={20} color="var(--brand-accent)" />
                <div>
                  <strong style={{ fontSize: "0.9rem", display: "block" }}>{p.name}</strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                    Estoque: {p.stock_qty} • Fornecedor: {p.supplier || "N/I"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
