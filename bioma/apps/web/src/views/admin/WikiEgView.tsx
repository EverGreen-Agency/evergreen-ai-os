import { BookOpen, FolderTree, Users, Briefcase } from "lucide-react";
import { SectionHeader, EmptyState } from "../../components/shared";

export function WikiEgView() {
  return (
    <section className="content-layout">
      <div className="content-main">
        <article className="surface">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ background: "var(--brand-accent)", color: "#111", padding: "12px", borderRadius: "12px" }}>
              <BookOpen size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Wiki EG</h1>
              <p style={{ margin: 0, color: "var(--text-muted)" }}>
                Base de conhecimento interna, manuais e playbooks da EverGreen.
              </p>
            </div>
          </div>
        </article>

        <article className="surface">
          <SectionHeader eyebrow="Comercial & Vendas" title="Playbooks Comerciais" icon={Briefcase} />
          <EmptyState 
            text="Nenhum playbook cadastrado ainda." 
            compact 
          />
          {/* Aqui entrarão os cards ou listas de playbooks */}
        </article>

        <article className="surface">
          <SectionHeader eyebrow="Recursos Humanos" title="Políticas & Onboarding" icon={Users} />
          <EmptyState 
            text="Nenhum manual de RH cadastrado ainda." 
            compact 
          />
          {/* Aqui entrarão os documentos do RH */}
        </article>

        <article className="surface">
          <SectionHeader eyebrow="Operação" title="Metodologia Base" icon={FolderTree} />
          <EmptyState 
            text="Nenhum documento operacional cadastrado ainda." 
            compact 
          />
          {/* Aqui entrarão os guias de metodologia (ex: Raio-X) */}
        </article>
      </div>

      <div className="content-sidebar">
        <article className="surface">
          <SectionHeader eyebrow="Últimas Atualizações" title="Atividade Recente" icon={BookOpen} />
          <div className="timeline-list">
            <EmptyState compact text="Nenhuma atualização recente" />
          </div>
        </article>
      </div>
    </section>
  );
}
