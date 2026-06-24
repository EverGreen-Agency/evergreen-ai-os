<!-- VIEW GERADA a partir de stack.json — não editar à mão. -->
# Banco de Stack EG — Tech Radar

> Tecnologias para os projetos que desenvolvemos, em 4 anéis. **Adopt** = padrão, usar sem pensar · **Trial** = testando agora, vale apostar · **Assess** = vale investigar, sem compromisso · **Hold** = não começar novo com isso. Promoção Trial→Adopt num projeto vira um **ADR** (squad `eg_engenharia`). Atualizado: 2026-06-24.

## ✅ Adopt — padrão da casa
| Tech | Quadrante | Por quê |
|---|---|---|
| **TypeScript** | Linguagens | Tipagem pega erro em edição; padrão de frontend/tooling. |
| **JavaScript** | Linguagens | Base do runtime; preferir TS no novo. |
| **Markdown + YAML** | Linguagens | A "linguagem" do framework Opensquad. |
| **React 19** | Frameworks | UI declarativa do cockpit. |
| **Vite** | Frameworks | Dev server rápido; sem overhead de full-stack. |
| **Zustand** | Frameworks | Store global sem boilerplate. |
| **Phaser 3** | Frameworks | Sprites 2D do escritório (game loop). |
| **Playwright** | Ferramentas | Browser automation com sessão persistente. |
| **ws + chokidar** | Ferramentas | Tempo real sobre arquivos. |
| **Claude Code** | Ferramentas | Runtime do Opensquad. |
| **Anthropic Claude** | Plataformas-Infra | Cérebro principal. |
| **ClickUp** | Plataformas-Infra | Gestão centralizada; skill própria. |
| **Kommo** | Plataformas-Infra | CRM por cliente; skill própria. |
| **Meta + Google Ads** | Plataformas-Infra | Mídia que operamos (sem skill nativa ainda). |

## 🔬 Trial — testando agora
| Tech | Quadrante | Por quê |
|---|---|---|
| **Python** | Linguagens | Aposta para backend de projetos de cliente; 1º projeto valida. |
| **OpenAI** | Plataformas-Infra | Segundo cérebro / fallback. |

## 👁 Assess — vale investigar
| Tech | Quadrante | Por quê |
|---|---|---|
| **FastAPI** | Frameworks | Candidato a padrão de API Python; decidir via ADR. |
| **Next.js** | Frameworks | Só se o cockpit virar produto SaaS público. |
| **CodeGraph** | Ferramentas | Indexação automática do repo p/ o Guardião. |
| **n8n** | Ferramentas | Orquestração externa; onde compensa vs. squad nativo. |
| **Google Gemini** | Plataformas-Infra | Multimodal / contexto longo. |
| **pgvector** | Plataformas-Infra | Vector store com isolamento por client_id (RAG). |
| **Evolution API** | Plataformas-Infra | WhatsApp não-oficial; avaliar risco de bloqueio. |
| **Zep** | Plataformas-Infra | Memória de longo prazo p/ agentes. |

## ⛔ Hold — evitar começar novo
_(nenhuma no momento)_
