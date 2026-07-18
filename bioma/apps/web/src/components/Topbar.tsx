import type { ClientSummary, CurrentUser } from "../lib/api";
import { WorkspaceNavigator } from "./WorkspaceNavigator";

export function Topbar({
  user,
  clients,
  isLoadingClients,
}: {
  user: CurrentUser;
  clients: ClientSummary[];
  isLoadingClients: boolean;
}) {
  return (
    <header className="topbar">
      <WorkspaceNavigator user={user} clients={clients} isLoading={isLoadingClients} />
    </header>
  );
}
