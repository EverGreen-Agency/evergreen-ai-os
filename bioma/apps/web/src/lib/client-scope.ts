import type { ClientSummary } from "./api";

export function isExternalClient(client: ClientSummary): boolean {
  return client.organization_slug !== "eg";
}

export function externalClients(clients: ClientSummary[]): ClientSummary[] {
  return clients.filter(isExternalClient);
}

/** O registro da própria EG ("EverGreen Internal", criado por
 * `scripts/create_eg_client.py`).
 *
 * Existe porque `performance_connections` e o resto do pipeline de métricas são
 * chaveados por `clients.id` — então, para a EG medir o próprio tráfego, ela
 * precisa de uma linha em `clients`. Isso **não** cria um workspace novo: o
 * workspace continua sendo o `agency_internal` ("Operação EG"), e é ele que a
 * tela usa. São dois registros com papéis diferentes: o workspace é onde o
 * trabalho acontece, o cliente é o sujeito a que a métrica se prende.
 *
 * Fica escondido da carteira de propósito (`externalClients`) — a EG não é
 * cliente dela mesma na visão comercial. É por isso que a tela de integrações
 * dela precisa morar em `/operacao`, e não em `/clientes/:id`. */
export function internalEgClient(clients: ClientSummary[]): ClientSummary | null {
  return clients.find((client) => !isExternalClient(client)) ?? null;
}
