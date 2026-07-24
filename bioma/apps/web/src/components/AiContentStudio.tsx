import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Film,
  Image as ImageIcon,
  LoaderCircle,
  MessageSquareText,
  Plus,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import {
  api,
  type AiContentPost,
  type AiContentImage,
  type AiContentVideoScript,
} from "../lib/api";
import {
  useBrandBook,
  useSaveBrandBook,
  useCalendarItems,
  useCreateCalendarItem,
  useUpdateCalendarStage,
} from "../hooks/useBiomaApi";
import { EmptyState, SectionHeader } from "./shared";

type MainTab = "studio" | "brand_book" | "calendar";
type ContentType = "social_posts" | "image_generation" | "video_scripts";
type ImageProvider = "dalle_3" | "flux" | "higgsfield" | "custom";

const channelOptions: Array<{ value: AiContentPost["channel"]; label: string }> = [
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
];

function BrandBookSection({ workspaceId }: { workspaceId: string }) {
  const { data: book, isLoading } = useBrandBook(workspaceId);
  const saveMutation = useSaveBrandBook();

  const [tom, setTom] = useState("");
  const [arquetipo, setArquetipo] = useState("");
  const [posicionamento, setPosicionamento] = useState("");
  const [proposta, setProposta] = useState("");
  const [regras, setRegras] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleSave(e: FormEvent) {
    e.preventDefault();
    saveMutation.mutate(
      {
        workspaceId,
        payload: {
          tom_de_voz: tom || book?.tom_de_voz || "Profissional",
          arquetipo: arquetipo || book?.arquetipo || "O Governante",
          posicionamento: posicionamento || undefined,
          proposta_valor: proposta || undefined,
          regras_copy: regras.split("\n").map((r) => r.trim()).filter(Boolean),
        },
      },
      {
        onSuccess: (res) => setFeedback(`Brand Book v${res.version} salvo com sucesso!`),
      }
    );
  }

  if (isLoading) return <EmptyState compact text="Carregando Brand Book do workspace..." />;

  return (
    <article className="surface" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <SectionHeader
        eyebrow="Manual de Marca EG"
        title={`Brand Book Versionado (Versão Atual: v${book?.version ?? 1})`}
        icon={BookOpen}
      />

      {feedback && <div className="notice success">{feedback}</div>}

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", marginBottom: "4px" }}>Tom de Voz da Marca</label>
            <input
              type="text"
              defaultValue={book?.tom_de_voz ?? ""}
              onChange={(e) => setTom(e.target.value)}
              placeholder="Ex: Autoridade, Direto e Humano"
              style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border-light)" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", marginBottom: "4px" }}>Arquétipo de Marca</label>
            <input
              type="text"
              defaultValue={book?.arquetipo ?? ""}
              onChange={(e) => setArquetipo(e.target.value)}
              placeholder="Ex: O Governante / O Especialista"
              style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border-light)" }}
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: "12px", marginBottom: "4px" }}>Posicionamento Estratégico</label>
            <textarea
              defaultValue={book?.posicionamento ?? ""}
              onChange={(e) => setPosicionamento(e.target.value)}
              rows={2}
              placeholder="Definição do posicionamento único da marca no mercado"
              style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border-light)" }}
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: "12px", marginBottom: "4px" }}>Proposta Única de Valor</label>
            <textarea
              defaultValue={book?.proposta_valor ?? ""}
              onChange={(e) => setProposta(e.target.value)}
              rows={2}
              placeholder="O que a marca promete entregar que ninguém mais entrega?"
              style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border-light)" }}
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: "12px", marginBottom: "4px" }}>Regras de Copywriting (1 por linha)</label>
            <textarea
              defaultValue={book?.regras_copy.join("\n") ?? ""}
              onChange={(e) => setRegras(e.target.value)}
              rows={3}
              placeholder="Sempre citar dados concretos&#10;Nunca usar jargões corporativos vazios"
              style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border-light)" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="primary-button" type="submit" disabled={saveMutation.isPending}>
            <Sparkles size={15} />
            {saveMutation.isPending ? "Salvando..." : "Salvar Nova Versão do Brand Book"}
          </button>
        </div>
      </form>
    </article>
  );
}

function CalendarSection({ workspaceId }: { workspaceId: string }) {
  const { data: items, isLoading } = useCalendarItems(workspaceId);
  const createItem = useCreateCalendarItem();
  const updateStage = useUpdateCalendarStage();

  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState<"instagram" | "linkedin" | "facebook" | "tiktok">("instagram");
  const [postText, setPostText] = useState("");

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!title) return;
    createItem.mutate(
      {
        workspaceId,
        payload: {
          title,
          channel,
          post_text: postText || undefined,
          stage: "ideation",
        },
      },
      {
        onSuccess: () => {
          setTitle("");
          setPostText("");
        },
      }
    );
  }

  const stages = [
    { id: "ideation", label: "Ideação" },
    { id: "production", label: "Em Produção" },
    { id: "review", label: "Revisão" },
    { id: "approved", label: "Aprovado" },
    { id: "scheduled", label: "Agendado" },
    { id: "published", label: "Publicado" },
  ];

  if (isLoading) return <EmptyState compact text="Carregando Calendário Editorial..." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <article className="surface">
        <SectionHeader eyebrow="Planejamento Editorial" title="Adicionar Novo Conteúdo" icon={Calendar} />
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
            <input
              type="text"
              placeholder="Título da peça ou ideia de anúncio..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border-light)" }}
              required
            />
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as any)}
              style={{ padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border-light)" }}
            >
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="facebook">Facebook</option>
              <option value="tiktok">TikTok</option>
            </select>
          </div>
          <textarea
            placeholder="Legenda, roteiro ou rascunho de texto (opcional)..."
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            rows={2}
            style={{ padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border-light)" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="secondary-button" type="submit" disabled={createItem.isPending}>
              <Plus size={15} /> Adicionar à Esteira
            </button>
          </div>
        </form>
      </article>

      <article className="surface">
        <SectionHeader eyebrow="Esteira Social Media" title="Kanban do Calendário Editorial" icon={Calendar} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginTop: "16px" }}>
          {stages.map((stg) => {
            const stageItems = items?.filter((i) => i.stage === stg.id) ?? [];
            return (
              <div
                key={stg.id}
                style={{
                  background: "var(--bg-panel)",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-light)",
                  minHeight: "200px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <strong style={{ fontSize: "13px" }}>{stg.label}</strong>
                  <span className="demo-badge">{stageItems.length}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {stageItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: "var(--bg-card)",
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid var(--border-light)",
                        fontSize: "12px",
                      }}
                    >
                      <strong style={{ display: "block", marginBottom: "4px" }}>{item.title}</strong>
                      <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{item.channel.toUpperCase()}</span>
                      
                      <div style={{ marginTop: "8px", display: "flex", gap: "4px" }}>
                        {stg.id !== "published" && (
                          <button
                            className="mini-button"
                            type="button"
                            style={{ fontSize: "10px", padding: "2px 6px" }}
                            onClick={() => {
                              const nextStage = stages[stages.findIndex((s) => s.id === stg.id) + 1]?.id;
                              if (nextStage) updateStage.mutate({ workspaceId, itemId: item.id, stage: nextStage });
                            }}
                          >
                            Avançar ➔
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </article>
    </div>
  );
}

export function AiContentStudio({ workspaceId }: { workspaceId: string }) {
  const queryClient = useQueryClient();
  const [mainTab, setMainTab] = useState<MainTab>("studio");
  const [contentType, setContentType] = useState<ContentType>("social_posts");
  const [imageProvider, setImageProvider] = useState<ImageProvider>("dalle_3");
  const [brief, setBrief] = useState("");
  const [channels, setChannels] = useState<AiContentPost["channel"][]>(["instagram", "linkedin"]);
  const [quantity, setQuantity] = useState(3);
  const [tone, setTone] = useState("consultivo, humano e direto");
  const [objective, setObjective] = useState("");
  const [methodology, setMethodology] = useState("Social Media Engine");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const requests = useQuery({
    queryKey: ["ai-content", workspaceId],
    queryFn: () => api.aiContentRequests(workspaceId),
    refetchInterval: (query) => query.state.data?.some((request) => ["queued", "running"].includes(request.status)) ? 3000 : false,
  });

  const createRequest = useMutation({
    mutationFn: () => api.createAiContentRequest(workspaceId, {
      content_type: contentType,
      brief: brief.trim(),
      channels,
      quantity,
      tone: tone.trim() || null,
      objective: objective.trim() || null,
      methodology_refs: methodology.split(",").map((item) => item.trim()).filter(Boolean),
      image_provider: contentType === "image_generation" ? imageProvider : undefined,
    }),
    onSuccess: async () => {
      setBrief("");
      await queryClient.invalidateQueries({ queryKey: ["ai-content", workspaceId] });
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!brief.trim()) return;
    createRequest.mutate();
  }

  function toggleChannel(channel: AiContentPost["channel"]) {
    setChannels((prev) => prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]);
  }

  function handleCopy(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, gridColumn: "1 / -1" }}>
      {/* Abas Principais: Estúdio, Brand Book, Calendário */}
      <div className="performance-tabs" role="tablist">
        <button
          className={mainTab === "studio" ? "performance-tab active" : "performance-tab"}
          type="button"
          onClick={() => setMainTab("studio")}
        >
          <Sparkles size={15} /> Estúdio IA Multi-modal
        </button>
        <button
          className={mainTab === "brand_book" ? "performance-tab active" : "performance-tab"}
          type="button"
          onClick={() => setMainTab("brand_book")}
        >
          <BookOpen size={15} /> Brand Book da Marca
        </button>
        <button
          className={mainTab === "calendar" ? "performance-tab active" : "performance-tab"}
          type="button"
          onClick={() => setMainTab("calendar")}
        >
          <Calendar size={15} /> Esteira do Calendário Editorial
        </button>
      </div>

      {mainTab === "brand_book" && <BrandBookSection workspaceId={workspaceId} />}
      {mainTab === "calendar" && <CalendarSection workspaceId={workspaceId} />}

      {mainTab === "studio" && (
        <>
          <article className="surface">
            <SectionHeader
              eyebrow="Estúdio IA Multi-modal"
              title="Geração Inteligente de Conteúdo (Posts, Artes e Roteiros de Vídeo)"
              icon={WandSparkles}
            />

            <form className="form-grid" onSubmit={handleSubmit} style={{ marginTop: 16 }}>
              <div style={{ display: "flex", gap: 12, gridColumn: "1 / -1", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className={contentType === "social_posts" ? "primary-button" : "ghost-button"}
                  onClick={() => setContentType("social_posts")}
                >
                  <MessageSquareText size={15} /> Copywriting & Posts
                </button>
                <button
                  type="button"
                  className={contentType === "image_generation" ? "primary-button" : "ghost-button"}
                  onClick={() => setContentType("image_generation")}
                >
                  <ImageIcon size={15} /> Artes Visuais (Imagens)
                </button>
                <button
                  type="button"
                  className={contentType === "video_scripts" ? "primary-button" : "ghost-button"}
                  onClick={() => setContentType("video_scripts")}
                >
                  <Film size={15} /> Roteiros de Vídeo & Ads
                </button>
              </div>

              {contentType === "image_generation" && (
                <label style={{ gridColumn: "1 / -1" }}>
                  Provedor de Imagem
                  <select value={imageProvider} onChange={(e) => setImageProvider(e.target.value as ImageProvider)}>
                    <option value="dalle_3">OpenAI DALL-E 3 (Alta precisão)</option>
                    <option value="flux">Flux.1 Schnell (Estética fotorrealista)</option>
                    <option value="higgsfield">Higgsfield AI (Artes publicitárias)</option>
                  </select>
                </label>
              )}

              <label style={{ gridColumn: "1 / -1" }}>
                Briefing / Tópico Principal
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Ex: Estratégias para escalar receita recorrente em B2B..."
                  rows={3}
                  required
                />
              </label>

              {contentType === "social_posts" && (
                <div>
                  <label style={{ marginBottom: 6, display: "block" }}>Canais Destino</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {channelOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={channels.includes(opt.value) ? "mini-button approve" : "mini-button"}
                        onClick={() => toggleChannel(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
                <button className="primary-button" type="submit" disabled={createRequest.isPending || !brief.trim()}>
                  {createRequest.isPending ? <LoaderCircle size={16} className="spin" /> : <Sparkles size={16} />}
                  {createRequest.isPending ? "Gerando..." : "Gerar Conteúdo"}
                </button>
              </div>
            </form>
          </article>

          {/* Resultados das Requisições */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {requests.data?.map((req) => (
              <article key={req.id} className="surface" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15 }}>{req.brief}</h4>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {new Date(req.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <span className={`status-badge status-${req.status}`}>{req.status}</span>
                </div>

                {req.status === "ready" && req.output && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                    {req.output.posts?.map((post, idx) => (
                      <div key={idx} style={{ background: "var(--bg-panel)", padding: 12, borderRadius: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <strong>{post.channel.toUpperCase()} — {post.title} ({post.format})</strong>
                          <button className="ghost-button" type="button" onClick={() => handleCopy(`post-${idx}`, `${post.hook}\n\n${post.caption}\n\n${post.cta}`)}>
                            {copiedKey === `post-${idx}` ? <Check size={14} /> : <Copy size={14} />} Copiar
                          </button>
                        </div>
                        <p style={{ whiteSpace: "pre-wrap", fontSize: 13, color: "var(--text-muted)" }}>{post.hook}</p>
                        <p style={{ whiteSpace: "pre-wrap", fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>{post.caption}</p>
                      </div>
                    ))}

                    {req.output.images?.map((img, idx) => (
                      <div key={idx} style={{ background: "var(--bg-panel)", padding: 12, borderRadius: 6 }}>
                        <strong>{img.title} ({img.provider.toUpperCase()})</strong>
                        <p style={{ fontSize: 12, color: "var(--text-muted)" }}><strong>Prompt Visual:</strong> {img.prompt_en}</p>
                      </div>
                    ))}

                    {req.output.video_scripts?.map((script, idx) => (
                      <div key={idx} style={{ background: "var(--bg-panel)", padding: 12, borderRadius: 6 }}>
                        <strong>🎥 {script.title} (Hook: {script.hook_0_3s})</strong>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}><strong>Locução:</strong> {script.script_body}</p>
                        <p style={{ fontSize: 12, color: "var(--brand-accent)" }}><strong>Visual/B-Roll:</strong> {script.broll_notes}</p>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
