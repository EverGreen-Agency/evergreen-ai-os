import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import { BrowserRouter } from "react-router-dom";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isSessionError } from "./lib/format";
import { useUiStore } from "./store/uiStore";

// Sessão expirada precisa derrubar o usuário para o login mesmo com dados em
// cache; sem isso a UI congela com dados velhos e as ações falham em silêncio.
function handleSessionError(client: QueryClient, error: unknown): boolean {
  if (error instanceof Error && isSessionError(error)) {
    client.setQueryData(["user"], null);
    client.removeQueries({ predicate: (query) => query.queryKey[0] !== "user" });
    return true;
  }
  return false;
}

const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      handleSessionError(queryClient, error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (handleSessionError(queryClient, error)) return;
      useUiStore.getState().setDataError(error instanceof Error ? error.message : "Não foi possível concluir a ação.");
    },
    onSuccess: () => {
      useUiStore.getState().setDataError("");
    },
  }),
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
