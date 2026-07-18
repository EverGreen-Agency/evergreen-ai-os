from bioma_api.access import is_platform_admin
from bioma_api.db import connect
from bioma_api.repositories import workspaces as workspaces_repo
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.workspaces import WorkspaceSummary


def list_workspaces(user: CurrentUserResponse) -> list[WorkspaceSummary]:
    with connect() as conn:
        rows = workspaces_repo.list_accessible_workspaces(
            conn,
            is_platform_admin(user),
            user.id,
        )
    return [WorkspaceSummary(**row) for row in rows]
