import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  Clock3,
  LayoutDashboard,
  Search,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import type { ClientSummary, CurrentUser } from "../lib/api";
import { statusLabel } from "../lib/app-config";
import { externalClients } from "../lib/client-scope";
import { resolveAgencyWorkspace } from "../lib/workspace-context";

type RecentWorkspace =
  | { kind: "agency" }
  | { kind: "client"; clientId: string };

type RecentWorkspaceEntry =
  | { key: "agency"; kind: "agency" }
  | { key: string; kind: "client"; client: ClientSummary };

function loadRecentWorkspaces(storageKey: string): RecentWorkspace[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is RecentWorkspace => Boolean(
      item
      && typeof item === "object"
      && (
        ("kind" in item && item.kind === "agency")
        || ("kind" in item && item.kind === "client" && "clientId" in item && typeof item.clientId === "string")
      )
    ));
  } catch {
    return [];
  }
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function clientIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/clientes\/([^/]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function clientSuffixFromPath(pathname: string): string {
  const match = pathname.match(/^\/clientes\/[^/]+\/(crm|financeiro|analytics|documentos|integracoes)/);
  if (match?.[1]) return match[1];
  if (pathname.startsWith("/operacao/crm")) return "crm";
  if (pathname.startsWith("/operacao/financeiro")) return "financeiro";
  if (pathname.startsWith("/operacao/metricas")) return "analytics";
  return "";
}

function clientDestination(clientId: string, pathname: string): string {
  const suffix = clientSuffixFromPath(pathname);
  return suffix ? `/clientes/${clientId}/${suffix}` : `/clientes/${clientId}`;
}

function agencyDestination(pathname: string): string {
  const suffix = clientSuffixFromPath(pathname);
  if (suffix === "crm") return "/operacao/crm";
  if (suffix === "financeiro") return "/operacao/financeiro";
  if (suffix === "analytics") return "/operacao/metricas";
  return "/operacao";
}

export function WorkspaceNavigator({
  user,
  clients,
  isLoading,
}: {
  user: CurrentUser;
  clients: ClientSummary[];
  isLoading: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const storageKey = `bioma_recent_workspaces_${user.id}`;
  const [recent, setRecent] = useState<RecentWorkspace[]>(() => loadRecentWorkspaces(storageKey));

  useEffect(() => {
    setRecent(loadRecentWorkspaces(storageKey));
  }, [storageKey]);

  const accessibleClients = useMemo(() => externalClients(clients), [clients]);
  const agencyResolution = useMemo(() => resolveAgencyWorkspace(clients, user), [clients, user]);
  const isEgAdmin = user.organizations.some(
    (organization) => organization.slug === "eg" && organization.role === "eg_admin",
  );
  const currentClientId = clientIdFromPath(location.pathname);
  const currentClient = accessibleClients.find((client) => client.id === currentClientId) ?? null;
  const inAgencyWorkspace = location.pathname.startsWith("/operacao");

  const currentContext = currentClient
    ? { eyebrow: "Hub do cliente", label: currentClient.name, icon: Building2 }
    : inAgencyWorkspace
      ? { eyebrow: "Workspace da agência", label: "Operação EG", icon: BriefcaseBusiness }
      : location.pathname.startsWith("/clientes")
        ? { eyebrow: "Central da agência", label: "Carteira de clientes", icon: Building2 }
        : { eyebrow: "Control plane", label: "Bioma Cockpit", icon: LayoutDashboard };
  const CurrentIcon = currentContext.icon;

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((value) => !value);
      }
      if (event.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  function rememberWorkspace(workspace: RecentWorkspace) {
    const next = [
      workspace,
      ...recent.filter((item) => item.kind !== workspace.kind || (
        item.kind === "client" && workspace.kind === "client" && item.clientId !== workspace.clientId
      )),
    ].slice(0, 5);
    setRecent(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Navegação continua funcional quando storage está indisponível.
    }
  }

  function openAgencyWorkspace() {
    rememberWorkspace({ kind: "agency" });
    navigate(agencyDestination(location.pathname));
  }

  function openClientWorkspace(client: ClientSummary) {
    rememberWorkspace({ kind: "client", clientId: client.id });
    navigate(clientDestination(client.id, location.pathname));
  }

  const normalizedQuery = normalizeSearch(query);
  const matchingClients = accessibleClients.filter((client) => normalizeSearch([
    client.name,
    client.organization_name,
    client.responsible_name ?? "",
  ].join(" ")).includes(normalizedQuery));
  const agencyMatches = isEgAdmin && normalizeSearch("Operação EG EverGreen agência interno").includes(normalizedQuery);

  const recentEntries = recent.reduce<RecentWorkspaceEntry[]>((entries, item) => {
    if (item.kind === "agency") {
      if (isEgAdmin && agencyResolution.status === "ready") {
        entries.push({ key: "agency", kind: "agency" });
      }
      return entries;
    }
    const client = accessibleClients.find((candidate) => candidate.id === item.clientId);
    if (client) entries.push({ key: client.id, kind: "client", client });
    return entries;
  }, []);
  const recentKeys = new Set(recentEntries.map((entry) => entry.key));

  const dialog = isOpen ? createPortal(
    <div
      className="workspace-navigator-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setIsOpen(false);
      }}
    >
      <section className="workspace-navigator" role="dialog" aria-modal="true" aria-labelledby="workspace-navigator-title">
        <header className="workspace-navigator-header">
          <div>
            <span>Contexto operacional</span>
            <h2 id="workspace-navigator-title">Navegar entre workspaces</h2>
          </div>
          <button className="icon-button" type="button" onClick={() => setIsOpen(false)} aria-label="Fechar navegador">
            <X size={18} />
          </button>
        </header>

        <label className="workspace-search">
          <Search size={18} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar cliente, organização ou responsável..."
          />
          <kbd>Esc</kbd>
        </label>

        <div className="workspace-navigator-results">
          {!normalizedQuery && recentEntries.length > 0 && (
            <div className="workspace-result-section">
              <div className="workspace-result-label"><Clock3 size={13} /> Recentes</div>
              {recentEntries.map((entry) => entry.kind === "agency" ? (
                <button className="workspace-result" type="button" key={entry.key} onClick={openAgencyWorkspace}>
                  <span className="workspace-result-icon agency"><BriefcaseBusiness size={17} /></span>
                  <span><strong>Operação EG</strong><small>Workspace interno · EverGreen</small></span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <WorkspaceClientResult client={entry.client} onSelect={() => openClientWorkspace(entry.client)} />
              ))}
            </div>
          )}

          {isEgAdmin && agencyMatches && (normalizedQuery || !recentKeys.has("agency")) && (
            <div className="workspace-result-section">
              <div className="workspace-result-label">Agência</div>
              {agencyResolution.status === "ready" ? (
                <button className={`workspace-result ${inAgencyWorkspace ? "active" : ""}`} type="button" onClick={openAgencyWorkspace}>
                  <span className="workspace-result-icon agency"><BriefcaseBusiness size={17} /></span>
                  <span><strong>Operação EG</strong><small>CRM, financeiro e métricas da própria agência</small></span>
                  <span className="workspace-kind-pill">Interno</span>
                </button>
              ) : (
                <div className="workspace-result disabled">
                  <span className="workspace-result-icon agency"><BriefcaseBusiness size={17} /></span>
                  <span><strong>Operação EG</strong><small>Workspace ainda não provisionado</small></span>
                  <span className="workspace-kind-pill warning">Pendente</span>
                </div>
              )}
            </div>
          )}

          {matchingClients.some((client) => normalizedQuery || !recentKeys.has(client.id)) && (
            <div className="workspace-result-section">
              <div className="workspace-result-label">Clientes disponíveis · {matchingClients.length}</div>
              {matchingClients
                .filter((client) => normalizedQuery || !recentKeys.has(client.id))
                .map((client) => (
                  <WorkspaceClientResult
                    client={client}
                    active={currentClient?.id === client.id}
                    onSelect={() => openClientWorkspace(client)}
                    key={client.id}
                  />
                ))}
            </div>
          )}

          {!isLoading && !agencyMatches && matchingClients.length === 0 && (
            <div className="workspace-navigator-empty">Nenhum workspace corresponde à busca.</div>
          )}
          {isLoading && <div className="workspace-navigator-empty">Carregando workspaces...</div>}
        </div>

        <footer className="workspace-navigator-footer">
          {isEgAdmin && (
            <button type="button" onClick={() => navigate("/clientes")}>
              Abrir carteira completa <ArrowRight size={14} />
            </button>
          )}
          <span>Ctrl/⌘ K para abrir de qualquer tela</span>
        </footer>
      </section>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        className="workspace-navigator-trigger"
        type="button"
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span className="workspace-trigger-icon"><CurrentIcon size={17} /></span>
        <span className="workspace-trigger-copy">
          <small>{currentContext.eyebrow}</small>
          <strong>{currentContext.label}</strong>
        </span>
        <ChevronDown size={16} />
      </button>
      {dialog}
    </>
  );
}

function WorkspaceClientResult({
  client,
  active = false,
  onSelect,
}: {
  client: ClientSummary;
  active?: boolean;
  onSelect: () => void;
}) {
  return (
    <button className={`workspace-result ${active ? "active" : ""}`} type="button" onClick={onSelect}>
      <span className="workspace-result-icon"><Building2 size={17} /></span>
      <span>
        <strong>{client.name}</strong>
        <small>{client.responsible_name ? `Responsável: ${client.responsible_name}` : client.organization_name}</small>
      </span>
      <span className="workspace-kind-pill">{statusLabel[client.status]}</span>
    </button>
  );
}
