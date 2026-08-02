import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive, ChevronDown, ChevronRight, Clock, ExternalLink, Loader2,
  MessageSquarePlus, PanelRightClose, Send, Sparkles, X,
} from "lucide-react";

import { api, type CopilotRunTrace, type CopilotSurface } from "../lib/api";
import { useUiStore } from "../store/uiStore";

/**
 * Painel fixo do copiloto — a "sala" da conversa.
 *
 * Decisão do Eduardo (DECISOES-ABERTAS #3): painel lateral colapsável + `Cmd+K`
 * como porta de entrada. Não são alternativas — o atalho abre o painel com o
 * foco no campo, como Gemini/Docs e Cursor fazem.
 *
 * A conversa acompanha você ao trocar de tela: o fio do assunto continua e o
 * escopo (workspace/tarefa) passa a ser o da tela nova. A alternativa —
 * conversa por tela — faz perder o assunto a cada navegação, que é o problema
 * que este painel existe para resolver.
 */

const STORAGE_KEY = "bioma_copilot_panel_open";

function formatDuration(ms: number | null) {
  if (ms === null) return "—";
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function formatCost(cents: number | null) {
  // Nulo é "modelo sem preço na tabela", não "de graça". Dizer isso importa.
  if (cents === null) return "sem preço na tabela";
  return `US$ ${(cents / 100).toFixed(4)}`;
}

/** Escopo derivado da rota: o copiloto enxerga a tela em que você está. */
function useScopeFromRoute(): { surface: CopilotSurface; workspaceId?: string; label: string } {
  const location = useLocation();
  const params = useParams();
  const selectedClientId = useUiStore((state) => state.selectedClientId);
  const { data: workspaces } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => api.workspaces(),
    staleTime: 5 * 60 * 1000,
  });

  return useMemo(() => {
    const clientId = params.clientId ?? selectedClientId;
    const workspace = workspaces?.find((item) => item.kind === "client" && item.client_id === clientId);
    if (location.pathname.startsWith("/clientes") && workspace) {
      return { surface: "workspace" as const, workspaceId: workspace.id, label: workspace.name };
    }
    return { surface: "workspace" as const, label: "Operação EG" };
  }, [location.pathname, params.clientId, selectedClientId, workspaces]);
}

function StepList({ trace }: { trace: CopilotRunTrace }) {
  const statusColor: Record<string, string> = {
    ok: "#2e9e5b", skipped: "var(--text-dim)", blocked: "#ffab00", failed: "#ff5252",
  };
  return (
    <div className="copilot-trace">
      <div className="copilot-trace-meta">
        <span><Clock size={12} /> {formatDuration(trace.duration_ms)}</span>
        {trace.generation_mode === "preview" ? (
          <span title="Sem OPENAI_API_KEY: resposta gerada localmente, nenhum token gasto.">
            prévia local
          </span>
        ) : (
          <>
            <span>{trace.model ?? "modelo não informado"}</span>
            <span>
              {trace.input_tokens ?? 0}+{trace.output_tokens ?? 0} tokens · {formatCost(trace.cost_cents)}
            </span>
          </>
        )}
      </div>

      <ol className="copilot-trace-steps">
        {trace.steps.map((step) => (
          <li key={step.position}>
            <span className="copilot-trace-dot" style={{ background: statusColor[step.status] }} />
            <span className="copilot-trace-label">{step.label}</span>
            <span className="copilot-trace-time">{formatDuration(step.duration_ms)}</span>
            {step.detail && <span className="copilot-trace-detail">{step.detail}</span>}
          </li>
        ))}
      </ol>

      <div className="copilot-trace-context">
        <strong>Leu:</strong>{" "}
        {Object.entries(trace.dossier_summary)
          .filter(([, value]) => typeof value === "number" && value > 0)
          .map(([key, value]) => `${key.replace(/_/g, " ")}: ${value}`)
          .join(" · ") || "nada além do escopo da tela"}
      </div>
      {trace.memories_used.length > 0 && (
        <div className="copilot-trace-context">
          <strong>Memórias:</strong> {trace.memories_used.map((row) => row.title).join(" · ")}
        </div>
      )}
      {trace.skills_used.length > 0 && (
        <div className="copilot-trace-context">
          <strong>Habilidades:</strong> {trace.skills_used.join(" · ")}
        </div>
      )}
    </div>
  );
}

export function CopilotPanel() {
  const queryClient = useQueryClient();
  const scope = useScopeFromRoute();
  const [isOpen, setIsOpen] = useState(() => {
    // Fechado no primeiro acesso; depois lembra o último estado.
    try { return localStorage.getItem(STORAGE_KEY) === "true"; } catch { return false; }
  });
  const [threadId, setThreadId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [openTrace, setOpenTrace] = useState<string | null>(null);
  const [showThreads, setShowThreads] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(isOpen)); } catch { /* modo privado */ }
  }, [isOpen]);

  // `Cmd+K` (ou `Ctrl+K`) abre o painel já com o foco no campo — é a porta.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen(true);
        window.setTimeout(() => inputRef.current?.focus(), 60);
      }
      if (event.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const threads = useQuery({
    queryKey: ["copilot-threads"],
    queryFn: () => api.copilotThreads("active"),
    enabled: isOpen,
  });

  const runs = useQuery({
    queryKey: ["copilot-thread", threadId],
    queryFn: () => api.copilotThreadRuns(threadId!),
    enabled: isOpen && Boolean(threadId),
  });

  const send = useMutation({
    mutationFn: (text: string) =>
      api.runCopilot({
        message: text,
        surface: scope.surface,
        workspace_id: scope.workspaceId,
        thread_id: threadId ?? undefined,
      }),
    onSuccess: async (response) => {
      setThreadId(response.thread_id);
      setMessage("");
      await queryClient.invalidateQueries({ queryKey: ["copilot-thread", response.thread_id] });
      await queryClient.invalidateQueries({ queryKey: ["copilot-threads"] });
      if (response.actions.some((action) => action.status === "executed")) {
        // Algo mudou de verdade no Bioma: a tela por trás precisa refletir.
        await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      }
    },
  });

  const archive = useMutation({
    mutationFn: (id: string) => api.archiveCopilotThread(id),
    onSuccess: async (_data, id) => {
      if (threadId === id) setThreadId(null);
      await queryClient.invalidateQueries({ queryKey: ["copilot-threads"] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [runs.data?.length, send.isPending]);

  if (!isOpen) {
    return (
      <button
        className="copilot-launcher"
        type="button"
        onClick={() => { setIsOpen(true); window.setTimeout(() => inputRef.current?.focus(), 60); }}
        title="Abrir copiloto (Ctrl+K)"
      >
        <Sparkles size={18} />
      </button>
    );
  }

  return (
    <aside className="copilot-panel">
      <header className="copilot-panel-header">
        <div>
          <strong><Sparkles size={15} /> Copiloto</strong>
          <span title="Escopo que o copiloto enxerga nesta tela">{scope.label}</span>
        </div>
        <div className="copilot-panel-header-actions">
          <button type="button" onClick={() => setShowThreads((value) => !value)} title="Conversas">
            <MessageSquarePlus size={15} />
          </button>
          <button type="button" onClick={() => setIsOpen(false)} title="Fechar (Ctrl+K reabre)">
            <PanelRightClose size={15} />
          </button>
        </div>
      </header>

      {showThreads && (
        <div className="copilot-threads">
          <button
            className="copilot-thread-new"
            type="button"
            onClick={() => { setThreadId(null); setShowThreads(false); inputRef.current?.focus(); }}
          >
            + Nova conversa
          </button>
          {threads.isLoading && <p className="copilot-empty">Carregando…</p>}
          {threads.data?.length === 0 && <p className="copilot-empty">Nenhuma conversa ainda.</p>}
          {threads.data?.map((thread) => (
            <div className={`copilot-thread-row ${thread.id === threadId ? "selected" : ""}`} key={thread.id}>
              <button type="button" onClick={() => { setThreadId(thread.id); setShowThreads(false); }}>
                <span>{thread.title ?? "Sem título"}</span>
                <small>{thread.run_count} turno(s)</small>
              </button>
              <button
                className="copilot-thread-archive"
                type="button"
                title="Arquivar"
                onClick={() => archive.mutate(thread.id)}
              >
                <Archive size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="copilot-panel-body">
        {!threadId && !send.isPending && (
          <div className="copilot-intro">
            <p>Pergunte sobre a operação. Ele lê o escopo desta tela e cita a fonte de tudo.</p>
            <ul>
              <li>“o que priorizar hoje?”</li>
              <li>“quais entregas deste cliente estão atrasadas?”</li>
              <li>“resume o que aconteceu nesta tarefa”</li>
            </ul>
          </div>
        )}

        {runs.data?.map((trace) => (
          <div className="copilot-turn" key={trace.id}>
            <div className="copilot-message user">{trace.message}</div>

            {trace.status === "failed" ? (
              <div className="copilot-message error">
                Falhou: {trace.error_message ?? "motivo não registrado"}
              </div>
            ) : (
              <div className="copilot-message agent">
                <p>{trace.answer}</p>

                {trace.actions.length > 0 && (
                  <ul className="copilot-actions">
                    {trace.actions.map((action, index) => (
                      <li key={index} className={action.status}>
                        <strong>{action.label}</strong>
                        <span>{action.detail}</span>
                        {action.undo_hint && <em>Desfazer: {action.undo_hint}</em>}
                      </li>
                    ))}
                  </ul>
                )}

                {trace.sources.length > 0 && (
                  <div className="copilot-sources">
                    {trace.sources.map((source, index) =>
                      source.kind === "web" ? (
                        <a key={index} href={source.reference} target="_blank" rel="noreferrer">
                          <ExternalLink size={11} /> {new URL(source.reference).hostname}
                        </a>
                      ) : (
                        <span key={index}>{source.reference}</span>
                      ),
                    )}
                  </div>
                )}

                <button
                  className="copilot-trace-toggle"
                  type="button"
                  onClick={() => setOpenTrace(openTrace === trace.id ? null : trace.id)}
                >
                  {openTrace === trace.id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  Como ele chegou nisso
                </button>
                {openTrace === trace.id && <StepList trace={trace} />}
              </div>
            )}
          </div>
        ))}

        {send.isPending && (
          <div className="copilot-message agent pending">
            <Loader2 size={14} className="spin" /> Lendo o escopo e pensando…
          </div>
        )}
        {send.error && (
          <div className="copilot-message error">
            {send.error.message}
            <button type="button" onClick={() => send.reset()}><X size={12} /></button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="copilot-composer"
        onSubmit={(event) => {
          event.preventDefault();
          const text = message.trim();
          if (text) send.mutate(text);
        }}
      >
        <textarea
          ref={inputRef}
          rows={2}
          value={message}
          placeholder="Pergunte ou peça algo…  (Ctrl+K)"
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            // Enter envia, Shift+Enter quebra linha — o padrão que a mão espera.
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              const text = message.trim();
              if (text && !send.isPending) send.mutate(text);
            }
          }}
        />
        <button type="submit" disabled={send.isPending || !message.trim()} title="Enviar">
          <Send size={15} />
        </button>
      </form>
    </aside>
  );
}
