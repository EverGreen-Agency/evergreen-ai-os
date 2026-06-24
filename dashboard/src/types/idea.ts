export type Stage = "capture" | "evaluation" | "processing" | "project" | "company";
export type Horizon = "NOW" | "MEDIUM" | "LONG" | "NEW_COMPANY" | "";
export type Category = "Squad" | "Cockpit" | "Feature" | "Service" | "Infra" | "Commercial";
export type Origin = "internal" | "external";

export interface Idea {
  id: string;
  title: string;
  desc: string;
  stage: Stage;
  horizon: Horizon;
  category: Category;
  origin: Origin;
  archived: boolean;
  depends_on: string[];
  enables: string[];
  source: string;
}

export interface IdeasBank {
  schema_version: string;
  updated_at: string;
  note: string;
  stages: Stage[];
  ideas: Idea[];
}
