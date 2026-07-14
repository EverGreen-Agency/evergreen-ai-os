import { FormEvent, useEffect, useState } from "react";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { EmptyState, SectionHeader } from "./shared";
import { api, type ClientFileSummary, type ClientFileVisibility } from "../lib/api";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

export function FilesPanel({
  clientId,
  isEgAdmin,
}: {
  clientId: string | null;
  isEgAdmin: boolean;
}) {
  const [files, setFiles] = useState<ClientFileSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [visibility, setVisibility] = useState<ClientFileVisibility>("client");

  useEffect(() => {
    if (!clientId) {
      setFiles([]);
      return;
    }
    setLoading(true);
    setError("");
    api
      .listFiles(clientId)
      .then(setFiles)
      .catch((err: Error) => setError(err.message || "Não foi possível carregar os arquivos."))
      .finally(() => setLoading(false));
  }, [clientId]);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clientId) return;
    const form = event.currentTarget;
    const input = form.elements.namedItem("file") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    setBusy("upload");
    setError("");
    try {
      setFiles(await api.uploadFile(clientId, file, visibility));
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o arquivo.");
    } finally {
      setBusy("");
    }
  }

  async function handleDownload(file: ClientFileSummary) {
    if (!clientId) return;
    setBusy(`download:${file.id}`);
    setError("");
    try {
      const { url } = await api.fileDownloadUrl(clientId, file.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível gerar o link de download.");
    } finally {
      setBusy("");
    }
  }

  async function handleDelete(file: ClientFileSummary) {
    if (!clientId) return;
    setBusy(`delete:${file.id}`);
    setError("");
    try {
      setFiles(await api.deleteFile(clientId, file.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir o arquivo.");
    } finally {
      setBusy("");
    }
  }

  if (!clientId) return null;

  return (
    <article className="surface">
      <SectionHeader eyebrow="Documentos" title="Arquivos do cliente" icon={FileText} />
      {error && <div className="notice error">{error}</div>}

      {loading ? (
        <EmptyState compact text="Carregando arquivos..." />
      ) : files.length === 0 ? (
        <EmptyState compact text="Nenhum arquivo enviado para este cliente." />
      ) : (
        <div className="hub-block-list">
          {files.map((file) => (
            <div className="work-row" key={file.id}>
              <FileText size={16} />
              <div>
                <strong>{file.file_name}</strong>
                <small>
                  {formatBytes(file.size_bytes)} · {new Date(file.created_at).toLocaleDateString("pt-BR")}
                </small>
              </div>
              <div className="row-tail">
                <span className={file.visibility === "client" ? "status-pill" : "status-pill onboarding"}>
                  {file.visibility === "client" ? "Cliente" : "Interno"}
                </span>
                <div className="row-actions">
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => handleDownload(file)}
                    disabled={busy === `download:${file.id}`}
                    title="Baixar arquivo"
                  >
                    <Download size={15} />
                  </button>
                  {isEgAdmin && (
                    <button
                      className="icon-button danger"
                      type="button"
                      onClick={() => handleDelete(file)}
                      disabled={busy === `delete:${file.id}`}
                      title="Excluir arquivo"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isEgAdmin && (
        <form className="files-upload-form mt-3" onSubmit={handleUpload}>
          <label>
            Arquivo
            <input type="file" name="file" required />
          </label>
          <label>
            Visibilidade
            <select value={visibility} onChange={(event) => setVisibility(event.target.value as ClientFileVisibility)}>
              <option value="client">Visível ao cliente</option>
              <option value="internal">Somente EG</option>
            </select>
          </label>
          <button className="primary-button" type="submit" disabled={busy === "upload"}>
            <Upload size={16} />
            Enviar arquivo
          </button>
        </form>
      )}
    </article>
  );
}
