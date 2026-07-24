import { useState, useEffect } from "react";
import { Package, Truck, Layers, Plus } from "lucide-react";
import {
  api,
  type KitDefinitionSummary,
  type KitPieceSummary,
  type KitShipmentSummary,
} from "../../../lib/api";

export function KitsManager() {
  const [activeTab, setActiveTab] = useState<"shipments" | "definitions" | "pieces">("shipments");
  const [shipments, setShipments] = useState<KitShipmentSummary[]>([]);
  const [definitions, setDefinitions] = useState<KitDefinitionSummary[]>([]);
  const [pieces, setPieces] = useState<KitPieceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Formulário nova peça
  const [pieceName, setPieceName] = useState("");
  const [pieceCost, setPieceCost] = useState(0);
  const [pieceStock, setPieceStock] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [s, d, p] = await Promise.all([
        api.listKitShipments(),
        api.listKitDefinitions(),
        api.listKitPieces(),
      ]);
      setShipments(s);
      setDefinitions(d);
      setPieces(p);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados de logística de kits.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePiece(e: React.FormEvent) {
    e.preventDefault();
    if (!pieceName.trim()) return;
    try {
      await api.createKitPiece({
        name: pieceName,
        unit_cost_cents: Math.round(pieceCost * 100),
        stock_qty: Number(pieceStock),
      });
      setPieceName("");
      setPieceCost(0);
      setPieceStock(0);
      loadData();
    } catch (err: any) {
      alert("Erro ao criar peça de kit: " + err.message);
    }
  }

  async function handleUpdateShipmentStatus(shipmentId: string, newStatus: string) {
    try {
      await api.updateKitShipmentStatus(shipmentId, newStatus);
      loadData();
    } catch (err: any) {
      alert("Erro ao atualizar status do envio: " + err.message);
    }
  }

  return (
    <div className="kits-manager-container p-6 space-y-6">
      <header className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-7 h-7 text-amber-500" /> Logística & Envio de Kits (MOD-LOGISTICA-KITS-001)
          </h1>
          <p className="text-sm text-gray-500">
            Catálogo de peças, definição de kits corporativos e controle de envios para clientes/colaboradores.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("shipments")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "shipments" ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Envios ({shipments.length})
          </button>
          <button
            onClick={() => setActiveTab("definitions")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "definitions" ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Kits Cadastrados ({definitions.length})
          </button>
          <button
            onClick={() => setActiveTab("pieces")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "pieces" ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Estoque de Peças ({pieces.length})
          </button>
        </div>
      </header>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando dados de Kits...</div>
      ) : activeTab === "shipments" ? (
        <div className="space-y-4">
          {shipments.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed text-gray-500">
              Nenhum envio registrado no momento.
            </div>
          ) : (
            <div className="divide-y border rounded-xl bg-white">
              {shipments.map((s) => (
                <div key={s.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-amber-600" /> {s.kit_name}
                    </div>
                    <div className="text-xs text-gray-500">Cliente / Destinatário: {s.client_name}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={s.status}
                      onChange={(e) => handleUpdateShipmentStatus(s.id, e.target.value)}
                      className="px-3 py-1 border rounded-lg text-sm bg-gray-50 font-medium"
                    >
                      <option value="em_producao">Em Produção</option>
                      <option value="enviado">Enviado</option>
                      <option value="entregue">Entregue</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "definitions" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {definitions.map((def) => (
            <div key={def.id} className="p-5 border rounded-xl bg-white shadow-sm space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-600" /> {def.name}
                </h3>
                <span className="text-xs px-2 py-1 bg-amber-50 text-amber-800 rounded font-medium">Nível: {def.level}</span>
              </div>
              <p className="text-sm text-gray-600">{def.description || "Sem descrição."}</p>
              <div className="text-xs text-gray-500 pt-2 border-t">
                Custo estimado: <strong>R$ {(def.total_cost_cents / 100).toFixed(2)}</strong> • Peças inclusas: {def.pieces.length}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <form onSubmit={handleCreatePiece} className="p-4 border rounded-xl bg-white space-y-3">
            <h3 className="font-semibold text-md flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-600" /> Cadastrar Nova Peça no Estoque
            </h3>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Nome da peça (ex: Caderno Moleskine EG)"
                value={pieceName}
                onChange={(e) => setPieceName(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Custo Un (R$)"
                step="0.01"
                value={pieceCost}
                onChange={(e) => setPieceCost(Number(e.target.value))}
                className="w-32 px-3 py-2 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Estoque"
                value={pieceStock}
                onChange={(e) => setPieceStock(Number(e.target.value))}
                className="w-28 px-3 py-2 border rounded-lg"
              />
              <button type="submit" className="px-5 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700">
                Salvar Peça
              </button>
            </div>
          </form>

          <div className="divide-y border rounded-xl bg-white">
            {pieces.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{p.name}</div>
                  <div className="text-xs text-gray-500">Fornecedor: {p.supplier || "N/A"}</div>
                </div>
                <div className="text-sm space-x-4">
                  <span>Custo: <strong>R$ {(p.unit_cost_cents / 100).toFixed(2)}</strong></span>
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded font-medium">Estoque: {p.stock_qty} un</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
