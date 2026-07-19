import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, LoaderCircle, Sparkles, WandSparkles } from "lucide-react";

import { api, type AiContentPost } from "../lib/api";
import { EmptyState } from "./shared";


const channelOptions: Array<{ value: AiContentPost["channel"]; label: string }> = [
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
];


export function AiContentStudio({ workspaceId }: { workspaceId: string }) {
  const queryClient = useQueryClient();
  const [brief, setBrief] = useState("");
  const [channels, setChannels] = useState<AiContentPost["channel"][]>(["instagram", "linkedin"]);
  const [quantity, setQuantity] = useState(3);
  const [tone, setTone] = useState("consultivo, humano e direto");
  const [objective, setObjective] = useState("");
  const [methodology, setMethodology] = useState("Social Media Engine");
  const [copiedPost, setCopiedPost] = useState<string | null>(null);

  const requests = useQuery({
    queryKey: ["ai-content", workspaceId],
    queryFn: () => api.aiContentRequests(workspaceId),
    refetchInterval: (query) => query.state.data?.some((request) => ["queued", "running"].includes(request.status)) ? 3000 : false,
  });
  const createRequest = useMutation({
    mutationFn: () => api.createAiContentRequest(workspaceId, {
      brief: brief.trim(),
      channels,
      quantity,
      tone: tone.trim() || null,
      objective: objective.trim() || null,
      methodology_refs: methodology.split(",").map((item) => item.trim()).filter(Boolean),
    }),
    onSuccess: async () => {
      setBrief("");
      await queryClient.invalidateQueries({ queryKey: ["ai-content", workspaceId] });
    },
  });

  function toggleChannel(channel: AiContentPost["channel"]) {
    setChannels((current) => current.includes(channel)
      ? current.filter((item) => item !== channel)
      : [...current, channel]);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (brief.trim().length < 10 || channels.length === 0) return;
    createRequest.mutate();
  }

  async function copyPost(requestId: string, post: AiContentPost) {
    await navigator.clipboard.writeText(`${post.hook}\n\n${post.caption}\n\n${post.cta}`);
    setCopiedPost(`${requestId}:${post.title}`);
    window.setTimeout(() => setCopiedPost(null), 1800);
  }

  return (
    <section className="ai-studio-layout">
      <article className="surface ai-studio-brief">
        <div className="surface-header">
          <WandSparkles size={19} />
          <div>
            <span>Ativação de metodologia</span>
            <h3>Gerar plano de posts</h3>
          </div>
        </div>
        <p className="panel-footnote">
          Transforme um briefing em rascunhos estruturados. Toda saída permanece revisável; nada é publicado automaticamente.
        </p>

        <form className="ai-studio-form" onSubmit={handleSubmit}>
          <label>
            Briefing
            <textarea
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              placeholder="Ex.: campanha para posicionar a consultoria X, público Y, oferta Z, diferenciais e restrições..."
              rows={7}
              minLength={10}
              required
            />
          </label>

          <fieldset>
            <legend>Canais</legend>
            <div className="ai-channel-grid">
              {channelOptions.map((channel) => (
                <button
                  className={channels.includes(channel.value) ? "active" : ""}
                  type="button"
                  onClick={() => toggleChannel(channel.value)}
                  key={channel.value}
                >
                  {channels.includes(channel.value) && <Check size={13} />}
                  {channel.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="form-grid ai-studio-fields">
            <label>
              Quantidade
              <input type="number" min={1} max={12} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
            </label>
            <label>
              Tom
              <input value={tone} onChange={(event) => setTone(event.target.value)} />
            </label>
            <label>
              Objetivo
              <input value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Ex.: gerar reuniões" />
            </label>
            <label>
              Metodologias EG
              <input value={methodology} onChange={(event) => setMethodology(event.target.value)} placeholder="Separadas por vírgula" />
            </label>
          </div>

          {createRequest.error && <span className="form-error">{createRequest.error.message}</span>}
          <button className="primary-button" type="submit" disabled={createRequest.isPending || brief.trim().length < 10 || channels.length === 0}>
            {createRequest.isPending ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}
            {createRequest.isPending ? "Enfileirando..." : "Gerar rascunhos"}
          </button>
        </form>
      </article>

      <div className="ai-studio-results">
        <header>
          <div>
            <span>Histórico do workspace</span>
            <h3>Rascunhos gerados</h3>
          </div>
          {requests.isFetching && <LoaderCircle className="spin" size={17} />}
        </header>

        {requests.isLoading && <EmptyState text="Carregando ativações de IA..." />}
        {requests.error && <div className="notice error">{requests.error.message}</div>}
        {!requests.isLoading && !requests.error && requests.data?.length === 0 && (
          <EmptyState text="Nenhuma ativação ainda. Use o briefing para criar o primeiro lote." />
        )}

        {requests.data?.map((request) => (
          <article className="surface ai-generation" key={request.id}>
            <div className="ai-generation-head">
              <div>
                <span>{new Date(request.created_at).toLocaleString("pt-BR")}</span>
                <strong>{request.objective || request.brief}</strong>
              </div>
              <span className={`ai-status ${request.status}`}>
                {["queued", "running"].includes(request.status) && <LoaderCircle className="spin" size={12} />}
                {{ queued: "Na fila", running: "Gerando", ready: "Pronto", error: "Erro", cancelled: "Cancelado" }[request.status]}
              </span>
            </div>

            {request.status === "error" && <div className="notice error">{request.error_message}</div>}
            {["queued", "running"].includes(request.status) && (
              <p className="panel-footnote">O worker está processando esta ativação. A tela atualiza automaticamente.</p>
            )}
            {request.output && (
              <>
                <div className="ai-generation-meta">
                  <span>{request.generation_mode === "live" ? "OpenAI · geração real" : "Prévia metodológica local"}</span>
                  <small>{request.model}</small>
                </div>
                <p className="ai-strategy-note">{request.output.strategy_note}</p>
                <div className="ai-post-grid">
                  {request.output.posts.map((post, index) => {
                    const copyKey = `${request.id}:${post.title}`;
                    return (
                      <article className="ai-post-card" key={`${post.title}-${index}`}>
                        <div><span>{post.channel}</span><small>{post.format}</small></div>
                        <h4>{post.title}</h4>
                        <strong>{post.hook}</strong>
                        <p>{post.caption}</p>
                        <em>{post.cta}</em>
                        <button type="button" onClick={() => void copyPost(request.id, post)}>
                          {copiedPost === copyKey ? <Check size={14} /> : <Copy size={14} />}
                          {copiedPost === copyKey ? "Copiado" : "Copiar texto"}
                        </button>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
