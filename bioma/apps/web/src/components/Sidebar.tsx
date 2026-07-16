import { useLocation, useNavigate } from "react-router-dom";
import { APP_VERSION } from "../lib/version";
import type { navItems } from "../lib/app-config";
import type { CurrentUser } from "../lib/api";
import { Menu, X, ChevronLeft, ChevronRight, LogOut, Settings } from "lucide-react";
import { useState, useEffect } from "react";

interface SidebarProps {
  visibleNavItems: typeof navItems;
  user: CurrentUser;
  onLogout: () => void;
  isLoggingOut: boolean;
}

export function Sidebar({
  visibleNavItems,
  user,
  onLogout,
  isLoggingOut,
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); // Mobile menu
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop toggle
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Fecha a sidebar ao navegar no mobile
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const groupPrincipal = ["cockpit", "clientes", "comercial", "conteudo"];
  const groupDados = ["analytics"];
  const groupConfig = ["integracoes", "engenharia"];
  const groupAdmin = ["eg-office", "eg-ideas", "eg-tech", "eg-architecture", "eg-clients"];

  function renderGroup(groupItems: string[], label: string) {
    const items = visibleNavItems.filter((item) => groupItems.includes(item.id));
    if (items.length === 0) return null;

    return (
      <div className="nav-group">
        {!isCollapsed && <div className="nav-group-label">{label}</div>}
        {items.map((item) => {
          const Icon = item.icon;
          const path = item.id === "cockpit" ? "/" : `/${item.id}`;
          const isActive =
            location.pathname === path || (item.id !== "cockpit" && location.pathname.startsWith(path));
          return (
            <button
              className={isActive ? "active" : ""}
              key={item.id}
              type="button"
              onClick={() => navigate(path)}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={18} />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  // Obter as iniciais para o avatar
  const initials = user.display_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  return (
    <>
      <button
        className="mobile-menu-toggle"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Alternar menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`sidebar ${isOpen ? "open" : ""} ${isCollapsed ? "collapsed" : ""}`}
        aria-label="Navegação principal"
      >
        <div className="brand">
          <div className="brand-mark">
            <img src="/assets/brand/eg-symbol.png" alt="Símbolo EverGreen" width={isCollapsed ? 32 : 40} height={isCollapsed ? 32 : 40} />
          </div>
          {!isCollapsed && (
            <div>
              <strong>Bioma</strong>
              <span>v{APP_VERSION}</span>
            </div>
          )}
        </div>

        <nav className="nav-list">
          {renderGroup(groupPrincipal, "Principal")}
          {renderGroup(groupDados, "Dados")}
          {renderGroup(groupConfig, "Configurações")}
          {user?.organizations?.some(org => org.role === "eg_admin") && renderGroup(groupAdmin, "Administração EG")}
        </nav>

        {/* Rodapé da Sidebar: Perfil do usuário */}
        <div className="sidebar-footer">
          <button
            className={`sidebar-user-toggle ${isUserMenuOpen ? "active" : ""}`}
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            title={isCollapsed ? user.display_name : undefined}
          >
            <div className="avatar">{initials}</div>
            {!isCollapsed && (
              <div className="user-info">
                <strong>{user.display_name}</strong>
                <span>{user.email}</span>
              </div>
            )}
          </button>

          {isUserMenuOpen && (
            <div className="sidebar-user-menu">
              <div className="sidebar-user-menu-header">
                <strong>{user.display_name}</strong>
                <span>{user.email}</span>
              </div>
              <button type="button" onClick={() => { setIsUserMenuOpen(false); navigate("/configuracoes"); }}>
                <Settings size={16} />
                Configurações
              </button>
              <button type="button" className="danger" onClick={onLogout} disabled={isLoggingOut}>
                <LogOut size={16} />
                {isLoggingOut ? "Saindo..." : "Sair da conta"}
              </button>
            </div>
          )}
        </div>

        {/* Botão de colapsar (apenas desktop) */}
        <button
          className="sidebar-collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
}
