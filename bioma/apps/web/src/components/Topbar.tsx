import { Search } from "lucide-react";

export function Topbar() {
  return (
    <header className="topbar">
      <div className="search-shell">
        <Search size={18} />
        <input type="text" placeholder="Buscar clientes, entregas ou arquivos..." className="topbar-search-input" />
      </div>
    </header>
  );
}
