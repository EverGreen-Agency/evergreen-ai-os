from uuid import UUID

from fastapi import HTTPException, status

from bioma_api.access import is_platform_admin, require_workspace_capability
from bioma_api.config import get_settings
from bioma_api.db import connect
from bioma_api.integrations.github import GitHubClient, GitHubReadError, GitHubWriteError
from bioma_api.repositories import github as github_repo
from bioma_api.repositories import projects as project_repo
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.github import (
    GitHubConnectionInput,
    GitHubConnectionSummary,
    GitHubIssueCreateRequest,
    GitHubIssueLinkSummary,
    GitHubProjectActivity,
)


def get_connection(project_id: UUID, user: CurrentUserResponse) -> GitHubConnectionSummary:
    with connect() as conn:
        _project(conn, project_id, user, "view")
        row = github_repo.find_connection(conn, project_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repositório GitHub não configurado.")
    return _summary(row)


def upsert_connection(project_id: UUID, payload: GitHubConnectionInput, user: CurrentUserResponse) -> GitHubConnectionSummary:
    owner, repository = payload.repository.split("/", 1)
    with connect() as conn:
        project = _project(conn, project_id, user, "manage_work")
        if project["project_type"] != "tech":
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="GitHub só pode ser ligado a projetos Tech.")
        row = github_repo.upsert_connection(conn, project_id, user.id, {
            "repository_owner": owner,
            "repository_name": repository,
            "default_branch": payload.default_branch,
            "status": payload.status,
        })
        github_repo.write_audit(conn, user.id, project["subject_organization_id"], "github.connection_upserted", {
            "project_id": str(project_id), "repository": payload.repository, "status": payload.status,
        })
    return _summary(row)


def get_activity(project_id: UUID, user: CurrentUserResponse, limit: int) -> GitHubProjectActivity:
    settings = get_settings()
    if not settings.github_api_token:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="GITHUB_API_TOKEN não configurado.")
    with connect() as conn:
        _project(conn, project_id, user, "view")
        connection = github_repo.find_connection(conn, project_id)
    if not connection or connection["status"] != "active":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repositório GitHub ativo não configurado.")
    client = GitHubClient(settings.github_api_token, settings.github_api_base_url)
    try:
        activity = client.project_activity(
            connection["repository_owner"], connection["repository_name"], connection["default_branch"], limit,
        )
    except GitHubReadError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    finally:
        client.close()
    return GitHubProjectActivity(
        project_id=project_id,
        repository=f"{connection['repository_owner']}/{connection['repository_name']}",
        default_branch=connection["default_branch"],
        **activity,
    )


def create_issue_from_deliverable(
    deliverable_id: UUID, payload: GitHubIssueCreateRequest, user: CurrentUserResponse
) -> GitHubIssueLinkSummary:
    settings = get_settings()
    with connect() as conn:
        deliverable = github_repo.find_deliverable_for_issue(conn, deliverable_id)
        if not deliverable:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrega não encontrada.")
        if not deliverable["project_id"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Entrega não está ligada a um projeto Tech.",
            )
        project = _project(conn, deliverable["project_id"], user, "manage_work")
        if project["project_type"] != "tech":
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="GitHub só pode ser ligado a projetos Tech.")
        connection = github_repo.find_connection(conn, deliverable["project_id"])
        if not connection or connection["status"] != "active":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repositório GitHub ativo não configurado.")
        repository = f"{connection['repository_owner']}/{connection['repository_name']}"

        if deliverable["github_issue_number"] is not None:
            # Idempotente: uma entrega já ligada a uma issue nunca cria uma segunda ao reprocessar.
            return GitHubIssueLinkSummary(
                deliverable_id=deliverable_id,
                repository=repository,
                issue_number=deliverable["github_issue_number"],
                issue_url=deliverable["github_issue_url"],
            )

        if not settings.github_api_token:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="GITHUB_API_TOKEN não configurado.")
        if not github_repo.reserve_deliverable_issue(conn, deliverable_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A criação desta issue já está em andamento. Tente novamente em alguns minutos.",
            )
        owner = connection["repository_owner"]
        repository_name = connection["repository_name"]
        project_id = deliverable["project_id"]
        organization_id = project["subject_organization_id"]
        deliverable_title = deliverable["title"]

    marker = f"[Bioma:{deliverable_id}]"
    issue_title = f"{marker} {deliverable_title}"
    issue_body = "\n".join(part for part in (payload.body, "", f"Rastreio: {marker}") if part is not None)
    client = GitHubClient(settings.github_api_token, settings.github_api_base_url)
    try:
        issue = client.find_issue_by_title_prefix(owner, repository_name, marker)
        if issue is None:
            issue = client.create_issue(owner, repository_name, issue_title, issue_body)
    except (GitHubReadError, GitHubWriteError) as exc:
        with connect() as conn:
            github_repo.fail_deliverable_issue(conn, deliverable_id, str(exc))
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    finally:
        client.close()

    with connect() as conn:
        github_repo.record_deliverable_issue(conn, deliverable_id, issue["number"], issue["url"])
        github_repo.write_audit(conn, user.id, organization_id, "github.issue_created", {
            "deliverable_id": str(deliverable_id), "project_id": str(project_id),
            "repository": repository, "issue_number": issue["number"],
        })

    return GitHubIssueLinkSummary(
        deliverable_id=deliverable_id, repository=repository, issue_number=issue["number"], issue_url=issue["url"],
    )


def _project(conn, project_id: UUID, user: CurrentUserResponse, capability: str):
    project = project_repo.find_project_context(conn, project_id, is_platform_admin(user), user.id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado.")
    require_workspace_capability(project, user, capability)
    if project["access_role"] == "client_user" and not project["client_visible"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado.")
    return project


def _summary(row) -> GitHubConnectionSummary:
    return GitHubConnectionSummary(
        id=row["id"], project_id=row["project_id"],
        repository=f"{row['repository_owner']}/{row['repository_name']}",
        default_branch=row["default_branch"], status=row["status"], updated_at=row["updated_at"],
    )
