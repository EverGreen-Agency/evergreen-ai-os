import { useEffect, useState } from "react";
import { Bot, Brain, CheckCircle2, FileAudio, Play, Sparkles, Square, Users, Video } from "lucide-react";

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
  const [speakerId, setSpeakerId] = useState("");
  const [meetingProvider, setMeetingProvider] = useState<"manual" | "google_meet" | "microsoft_teams">("manual");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [consentGranted, setConsentGranted] = useState(false);
  const [participantName, setParticipantName] = useState("");
  const [participantTitle, setParticipantTitle] = useState("");
  const [participantGroup, setParticipantGroup] = useState<"eg_team" | "client" | "partner" | "unknown">("client");
  const [actionTitle, setActionTitle] = useState("");
  const [adapterCredential, setAdapterCredential] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const replaceSession = (session: SalesCopilotSession) => {
    setSessions((current) => [session, ...current.filter((item) => item.id !== session.id)]);
    setSelectedId(session.id);
  };

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

  useEffect(() => {
    const selected = sessions.find((session) => session.id === selectedId);
    if (!selected || selected.status !== "active") return;
    const timer = window.setInterval(() => {
      void api.salesCopilotSession(selected.id).then(replaceSession).catch(() => undefined);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [selectedId, sessions]);

  const selected = sessions.find((session) => session.id === selectedId);
  const run = async (label: string, action: () => Promise<SalesCopilotSession>) => {
    setBusy(label);
    setError("");
    try {
      replaceSession(await action());
      const metricData = await api.salesCopilotMetrics();
      setMetrics(metricData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir a ação.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="notice">
        <strong>Copiloto de reuniões com contexto e HITL</strong>
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

      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, .75fr) 1.5fr", gap: 16 }}>
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
          <textarea rows={3} value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Objetivo da reunião e contexto prévio" />
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
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <h3 style={{ margin: 0 }}>{selected.title}</h3>
                  <span style={{ color: "var(--text-dim)" }}>
                    {selected.status} · {selected.language} · {selected.meeting_provider} · consentimento {selected.consent_status}
                  </span>
                </div>
                {selected.status === "draft" && (
                  <button className="primary-button" disabled={Boolean(busy)} onClick={() => void run("prepare", () => api.prepareSalesCopilotSession(selected.id))}>
                    <Sparkles size={16} /> Preparar com contexto
                  </button>
                )}
              </div>

              {selected.status !== "completed" && (
                <div className="surface" style={{ padding: 14, display: "grid", gap: 9 }}>
                  <strong><Video size={16} /> Reunião e consentimento</strong>
                  <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 8 }}>
                    <select value={meetingProvider} onChange={(event) => setMeetingProvider(event.target.value as typeof meetingProvider)}>
                      <option value="manual">Manual/upload</option>
                      <option value="google_meet">Google Meet</option>
                      <option value="microsoft_teams">Microsoft Teams</option>
                    </select>
                    <input value={meetingUrl} onChange={(event) => setMeetingUrl(event.target.value)} placeholder="Link da reunião (para Meet/Teams)" />
                  </div>
                  <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="checkbox" checked={consentGranted} onChange={(event) => setConsentGranted(event.target.checked)} />
                    Participantes informados e consentimento de transcrição registrado
                  </label>
                  <button className="secondary-button" disabled={Boolean(busy) || (meetingProvider !== "manual" && !meetingUrl.trim())} onClick={() => void run("meeting", () => api.configureSalesCopilotMeeting(selected.id, {
                    meeting_provider: meetingProvider,
                    meeting_url: meetingUrl.trim() || null,
                    consent_granted: consentGranted,
                    retention_days: 90,
                  }))}>Salvar configuração</button>
                  {selected.meeting_provider !== "manual" && selected.consent_status === "granted" && (
                    <button className="secondary-button" disabled={Boolean(busy)} onClick={() => {
                      setBusy("credential");
                      setError("");
                      void api.issueSalesCopilotIngestionCredential(selected.id)
                        .then((credential) => {
                          setAdapterCredential(`${credential.endpoint_path}\n${credential.ingest_token}`);
                          window.setTimeout(() => setAdapterCredential(""), 60_000);
                        })
                        .catch((err) => setError(err instanceof Error ? err.message : "Falha ao emitir credencial."))
                        .finally(() => setBusy(""));
                    }}>Gerar credencial do adaptador</button>
                  )}
                  {adapterCredential && (
                    <div className="notice">
                      <strong>Credencial exibida uma única vez</strong>
                      <pre style={{ whiteSpace: "pre-wrap" }}>{adapterCredential}</pre>
                      <small>Guarde no secret store do provedor. Este valor desaparece da tela em 60 segundos.</small>
                    </div>
                  )}
                </div>
              )}

              <div className="surface" style={{ padding: 14, display: "grid", gap: 9 }}>
                <strong><Users size={16} /> Participantes e papéis</strong>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {selected.participants.map((participant) => (
                    <span key={participant.id} className="status-badge">
                      {participant.display_name} · {participant.job_title || participant.decision_role} · {participant.participant_group}
                    </span>
                  ))}
                </div>
                {selected.status !== "completed" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 150px", gap: 8 }}>
                      <input value={participantName} onChange={(event) => setParticipantName(event.target.value)} placeholder="Nome do participante" />
                      <input value={participantTitle} onChange={(event) => setParticipantTitle(event.target.value)} placeholder="Cargo: CEO, CFO, Diretora…" />
                      <select value={participantGroup} onChange={(event) => setParticipantGroup(event.target.value as typeof participantGroup)}>
                        <option value="client">Cliente</option>
                        <option value="eg_team">Equipe EG</option>
                        <option value="partner">Parceiro</option>
                        <option value="unknown">A identificar</option>
                      </select>
                    </div>
                    <button className="secondary-button" disabled={!participantName.trim() || Boolean(busy)} onClick={() => void run("participant", async () => {
                      const session = await api.addSalesCopilotParticipant(selected.id, {
                        display_name: participantName.trim(),
                        participant_group: participantGroup,
                        job_title: participantTitle.trim() || null,
                        seniority: /ceo|cfo|cto|chief|sóci|propriet/i.test(participantTitle) ? "c_level" : /diretor/i.test(participantTitle) ? "director" : "unknown",
                        decision_role: /ceo|cfo|diretor|sóci|propriet/i.test(participantTitle) ? "decision_maker" : "unknown",
                      });
                      setParticipantName("");
                      setParticipantTitle("");
                      return session;
                    })}>Adicionar participante</button>
                  </>
                )}
              </div>

              {Object.keys(selected.preparation_brief).length > 0 && (
                <div className="notice">
                  <strong>Briefing de preparação</strong>
                  <pre style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{JSON.stringify(selected.preparation_brief, null, 2)}</pre>
                </div>
              )}

              {selected.status !== "completed" && (
                <div className="surface" style={{ padding: 14, display: "grid", gap: 9 }}>
                  <strong><FileAudio size={16} /> Transcrição diarizada</strong>
                  <select value={speakerId} onChange={(event) => setSpeakerId(event.target.value)}>
                    <option value="">Falante ainda não identificado</option>
                    {selected.participants.map((participant) => (
                      <option key={participant.id} value={participant.id}>{participant.display_name}</option>
                    ))}
                  </select>
                  <textarea rows={6} value={transcriptChunk} onChange={(event) => setTranscriptChunk(event.target.value)} placeholder="Trecho falado. Adaptadores Meet/Teams usarão este mesmo contrato de ingestão." />
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="secondary-button" disabled={!transcriptChunk.trim() || Boolean(busy)} onClick={() => void run("chunk", async () => {
                      const participant = selected.participants.find((item) => item.id === speakerId);
                      const session = await api.ingestSalesCopilotSegments(selected.id, {
                        segments: [{
                          idempotency_key: crypto.randomUUID(),
                          participant_id: speakerId || null,
                          speaker_label: participant?.display_name || null,
                          source: "manual",
                          content: transcriptChunk.trim(),
                          is_final: true,
                        }],
                      });
                      setTranscriptChunk("");
                      return session;
                    })}><FileAudio size={16} /> Adicionar trecho</button>
                    <button className="secondary-button" disabled={selected.segments.length === 0 || Boolean(busy)} onClick={() => void run("analyze", () => api.analyzeSalesCopilotLive(selected.id))}>
                      <Brain size={16} /> Sugerir intervenção
                    </button>
                    <button className="primary-button" disabled={!selected.transcript.trim() || Boolean(busy)} onClick={() => void run("complete", () => api.completeSalesCopilotSession(selected.id, 0))}>
                      <Square size={14} /> Concluir e analisar
                    </button>
                  </div>
                </div>
              )}

              {selected.suggestions.length > 0 && (
                <div className="notice">
                  <strong><Brain size={16} /> Assistência ao vivo</strong>
                  {selected.suggestions.slice(0, 5).map((suggestion) => (
                    <div key={suggestion.id} style={{ marginTop: 10 }}>
                      <span className="status-badge">{suggestion.suggestion_type} · {suggestion.generation_mode}</span>
                      <p style={{ margin: "6px 0" }}>{suggestion.content}</p>
                      {suggestion.rationale && <small>{suggestion.rationale}</small>}
                    </div>
                  ))}
                </div>
              )}

              {selected.segments.length > 0 && (
                <div>
                  <strong>Conversa</strong>
                  {selected.segments.slice(-20).map((segment) => (
                    <p key={segment.id} style={{ margin: "8px 0", whiteSpace: "pre-wrap" }}>
                      <strong>{segment.speaker_label || "Falante"}:</strong> {segment.content}
                    </p>
                  ))}
                </div>
              )}

              {selected.summary && <div className="notice"><strong>Resumo</strong><p>{selected.summary}</p></div>}

              <div className="surface" style={{ padding: 14, display: "grid", gap: 9 }}>
                <strong><CheckCircle2 size={16} /> Compromissos pós-reunião</strong>
                {selected.actions.map((action) => (
                  <div key={action.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <span>{action.title} · {action.action_type} · {action.status}</span>
                    {action.status === "proposed" && (
                      <button className="secondary-button" disabled={Boolean(busy)} onClick={() => void run("materialize", () => api.materializeSalesCopilotAction(action.id, `copilot-${action.id}`))}>
                        Confirmar e criar
                      </button>
                    )}
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={actionTitle} onChange={(event) => setActionTitle(event.target.value)} placeholder="Novo follow-up acordado" />
                  <button className="secondary-button" disabled={!actionTitle.trim() || Boolean(busy)} onClick={() => void run("action", async () => {
                    const session = await api.addSalesCopilotAction(selected.id, {
                      action_type: "follow_up_task",
                      title: actionTitle.trim(),
                      idempotency_key: crypto.randomUUID(),
                    });
                    setActionTitle("");
                    return session;
                  })}>Adicionar</button>
                </div>
              </div>

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
