import { create } from "zustand";
import type { Idea } from "@/types/idea";

interface IdeaStore {
  ideas: Idea[];
  setIdeas: (ideas: Idea[]) => void;
}

export const useIdeaStore = create<IdeaStore>((set) => ({
  ideas: [],
  setIdeas: (ideas) => set({ ideas }),
}));
