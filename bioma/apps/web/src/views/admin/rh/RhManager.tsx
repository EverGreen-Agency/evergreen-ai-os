import { useState, useEffect } from "react";
import { Users, UserCheck, CheckCircle2, Plus } from "lucide-react";
import {
  api,
  type MilestoneTemplateSummary,
  type OnboardingPlanSummary,
} from "../../../lib/api";

export function RhManager() {
  const [activeTab, setActiveTab] = useState<"onboarding" | "templates">("onboarding");
  const [plans, setPlans] = useState<OnboardingPlanSummary[]>([]);
  const [templates, setTemplates] = useState<MilestoneTemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newDayOffset, setNewDayOffset] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [p, t] = await Promise.all([
        api.listRhOnboardingPlans(),
        api.listRhOnboardingTemplates(),
      ]);
      setPlans(p);
      setTemplates(t);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados de RH.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await api.createRhOnboardingTemplate({
        title: newTitle,
        day_offset: Number(newDayOffset),
      });
      setNewTitle("");
      setNewDayOffset(0);
      loadData();
    } catch (err: any) {
      alert("Erro ao criar marco: " + err.message);
    }
  }

  async function handleToggleMilestone(planId: string, dayOffset: number, currentStatus: "pending" | "done") {
    const nextStatus = currentStatus === "done" ? "pending" : "done";
    try {
      await api.toggleRhMilestone(planId, dayOffset, nextStatus);
      loadData();
    } catch (err: any) {
      alert("Erro ao atualizar marco: " + err.message);
    }
  }

  return (
    <div className="rh-manager-container p-6 space-y-6">
      <header className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-500" /> Gestão de RH & Rampagem (MOD-RH-001)
          </h1>
          <p className="text-sm text-gray-500">
            Acompanhamento de onboarding, rampagem de colaboradores e métricas de satisfação.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("onboarding")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "onboarding" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Planos de Onboarding ({plans.length})
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "templates" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Marcos Padrão ({templates.length})
          </button>
        </div>
      </header>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando dados de RH...</div>
      ) : activeTab === "onboarding" ? (
        <div className="grid gap-6">
          {plans.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed text-gray-500">
              Nenhum plano de onboarding cadastrado no momento.
            </div>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} className="p-5 border rounded-xl bg-white shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-emerald-600" /> {plan.user_name}
                    </h3>
                    <span className="text-xs text-gray-500">{plan.user_email} • Admissão: {plan.hire_date}</span>
                  </div>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
                    {plan.milestones.filter((m) => m.status === "done").length} / {plan.milestones.length} concluídos
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {plan.milestones.map((m) => (
                    <div
                      key={m.day_offset + m.title}
                      onClick={() => handleToggleMilestone(plan.id, m.day_offset, m.status)}
                      className={`p-3 rounded-lg border cursor-pointer flex items-start gap-3 transition ${
                        m.status === "done"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-800"
                      }`}
                    >
                      <CheckCircle2
                        className={`w-5 h-5 mt-0.5 ${m.status === "done" ? "text-emerald-600" : "text-gray-400"}`}
                      />
                      <div>
                        <div className="font-medium text-sm">D+{m.day_offset}: {m.title}</div>
                        {m.completed_at && (
                          <div className="text-xs text-emerald-700 mt-1">Concluído em: {new Date(m.completed_at).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <form onSubmit={handleCreateTemplate} className="p-4 border rounded-xl bg-white space-y-3">
            <h3 className="font-semibold text-md flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" /> Criar Novo Marco Padrão (Template)
            </h3>
            <div className="flex gap-4">
              <input
                type="number"
                placeholder="Offset Dias (ex: 30)"
                value={newDayOffset}
                onChange={(e) => setNewDayOffset(Number(e.target.value))}
                className="w-32 px-3 py-2 border rounded-lg"
                min={0}
              />
              <input
                type="text"
                placeholder="Título do Marco (ex: Alinhamento de Expectativas D+30)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">
                Adicionar
              </button>
            </div>
          </form>

          <div className="divide-y border rounded-xl bg-white">
            {templates.map((tpl) => (
              <div key={tpl.id} className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-indigo-600">D+{tpl.day_offset}:</span>{" "}
                  <span className="font-medium text-gray-900">{tpl.title}</span>
                </div>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  {tpl.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
