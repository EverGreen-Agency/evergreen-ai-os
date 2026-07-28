import { useEffect, useState } from "react";
import { Bot, FileAudio, Play, Sparkles, Square } from "lucide-react";

import {
  api,
  type ClientSummary,
  type ProposalSummary,
  type SalesCopilotMetrics,
  type SalesCopilotRealtimeStatus,
  type SalesCopilotSession,
} from "../../../lib/api";


export function SalesCopilotPanel({ proposals }: { proposals: ProposalSummary[] }) {
  const [sessions, setSessions] = useState<SalesCopilotSession[]>([]);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [metrics, setMetrics] = useState<SalesCopilotMetrics | null>(null);
  const [adapter, setAdapter] = useState<SalesCopilotRealtimeStatus | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [title, setTitle] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [proposalId, setProposalId] = useState("");
  const [objective, setObjective] = useState("");
  const [transcriptChunk, setTranscriptChunk] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const [sessionRows, clientRows, metricData, adapterData] = await Promise.all([
      api.salesCopilotSessions(),
      api.clients(),
      api.salesCopilotMetrics(),
      api.salesCopilotRealtimeStatus(),
    ]);
    setSessions(sessionRows);
    setClients(clientRows.filter((client) => client.status !== "archived"));
    setMetrics(metricData);
    setAdapter(adapterData);
    setSelectedId((current) => current || sessionRows[0]?.id || "");
  };

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar o Copiloto."));
  }, []);

  const selected = sessions.find((session) => session.id === selectedId);
  const run = async (label: string, action: () => Promise<SalesCopilotSession>) => {
    setBusy(label);
    setError("");
    try {
      const session = await action();
      setSessions((current) => [session, ...current.filter((item) => item.id !== session.id)]);
      setSelectedId(session.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir a ação.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="notice">
        <strong>Copiloto comercial com limites explícitos</strong>
        <span style={{ display: "block", marginTop: 4 }}>{adapter?.message ?? "Verificando adaptador…"}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          ["Sessões", metrics?.total_sessions ?? 0],
          ["Tempo analisado", `${Math.round((metrics?.total_duration_seconds ?? 0) / 60)} min`],
          ["Análises concluídas", metrics?.analyses_completed ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="surface" style={{ padding: 16 }}>
            <span style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>{label}</span>
            <strong style={{ display: "block", fontSize: "1.6rem", marginTop: 6 }}>{value}</strong>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, .85fr) 1.3fr", gap: 16 }}>
        <section className="surface" style={{ padding: 18, display: "grid", gap: 10, alignContent: "start" }}>
          <h3 style={{ margin: 0 }}><Play size={17} /> Nova sessão</h3>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Discovery com cliente" />
          <select value={workspaceId} onChange={(event) => {
            setWorkspaceId(event.target.value);
            setProposalId("");
          }}>
            <option value="">Sem cliente vinculado</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.organization_name}</option>)}
          </select>
          <select value={proposalId} onChange={(event) => setProposalId(event.target.value)}>
            <option value="">Sem proposta vinculada</option>
            {proposals.filter((proposal) => !workspaceId || proposal.workspace_id === workspaceId).map((proposal) => (
              <option key={proposal.id} value={proposal.id}>{proposal.title || proposal.client_name} · v{proposal.version}</option>
            ))}
          </select>
          <textarea rows={3} value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Objetivo e contexto dos participantes" />
          <button className="primary-button" disabled={!title.trim() || Boolean(busy)} onClick={() => void run("create", () => api.createSalesCopilotSession({
            title: title.trim(),
            workspace_id: workspaceId || null,
            proposal_id: proposalId || null,
            session_type: proposalId ? "proposal_review" : "discovery",
            objective: objective.trim() || null,
          }))}><Bot size={16} /> Criar sessão</button>

          <h4 style={{ marginBottom: 0 }}>Sessões recentes</h4>
          {sessions.map((session) => (
            <button key={session.id} className="secondary-button" style={{ justifyContent: "space-between" }} onClick={() => setSelectedId(session.id)}>
              <span>{session.title}</span><span>{session.status}</span>
            </button>
          ))}
        </section>

        <section className="surface" style={{ padding: 18 }}>
          {!selected ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-dim)" }}><FileAudio size={30} /> Selecione ou crie uma sessão.</div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div><h3 style={{ margin: 0 }}>{selected.title}</h3><span style={{ color: "var(--text-dim)" }}>{selected.status} · {selected.language}</span></div>
                {selected.status === "draft" && <button className="primary-button" disabled={Boolean(busy)} onClick={() => void run("prepare", () => api.prepareSalesCopilotSession(selected.id))}><Sparkles size={16} /> Preparar com contexto</button>}
              </div>

              {Object.keys(selected.preparation_brief).length > 0 && (
                <div className="notice">
                  <strong>Briefing de preparação</strong>
                  <pre style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{JSON.stringify(selected.preparation_brief, null, 2)}</pre>
                </div>
              )}

              {selected.status !== "completed" && (
                <>
                  <textarea rows={8} value={transcriptChunk} onChange={(event) => setTranscriptChunk(event.target.value)} placeholder="Cole um trecho da transcrição ou notas da reunião. Nada é gravado pelo navegador." />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="secondary-button" disabled={!transcriptChunk.trim() || Boolean(busy)} onClick={() => void run("chunk", async () => {
                      const result = await api.addSalesCopilotEvent(selected.id, { event_type: "transcript_chunk", content: transcriptChunk.trim() });
                      setTranscriptChunk("");
                      return result;
                    })}><FileAudio size={16} /> Adicionar transcrição</button>
                    <button className="primary-button" disabled={!selected.transcript.trim() || Boolean(busy)} onClick={() => void run("complete", () => api.completeSalesCopilotSession(selected.id, 0))}><Square size={14} /> Concluir e analisar</button>
                  </div>
                </>
              )}

              {selected.summary && <div className="notice"><strong>Resumo</strong><p>{selected.summary}</p></div>}
              <div>
                <strong>Registro da sessão</strong>
                {selected.events.map((event) => (
                  <div key={event.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <span className="status-badge">{event.event_type}</span>
                    <p style={{ whiteSpace: "pre-wrap", margin: "6px 0" }}>{event.content}</p>
                    {event.recommendation && <small style={{ color: "var(--brand-accent)" }}>{event.recommendation}</small>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
      {error && <p style={{ color: "#ef4444" }}>{error}</p>}
    </div>
  );
}
