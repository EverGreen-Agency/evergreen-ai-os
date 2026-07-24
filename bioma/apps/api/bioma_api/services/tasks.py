from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status

from bioma_api.access import is_platform_admin, require_workspace_capability
from bioma_api.db import connect
from bioma_api.repositories import tasks as tasks_repo
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.tasks import Task, TaskCreate, TaskList, TaskListCreate, TaskUpdate


def _not_found(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def _authorize(context, user: CurrentUserResponse, capability: str, detail: str) -> dict:
    if not context:
        raise _not_found(detail)
    resolved = dict(context)
    require_workspace_capability(resolved, user, capability)
    return resolved


def _require_local_task(context: dict) -> None:
    if context.get("external_source") == "clickup":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tarefas importadas do ClickUp são projeções somente leitura; altere a fonte de verdade no ClickUp.",
        )


def _validate_people(conn, workspace_id: UUID, values: dict) -> None:
    for field in ("assignee_id", "owner_id"):
        user_id = values.get(field)
        if user_id is not None and not tasks_repo.user_can_belong_to_workspace(conn, workspace_id, user_id):
            label = "Responsável" if field == "assignee_id" else "Owner"
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{label} precisa pertencer ao mesmo tenant/workspace da tarefa.",
            )


def _validate_dependencies(
    conn,
    workspace_id: UUID,
    dependencies: list[dict],
    task_id: UUID | None = None,
) -> None:
    dependency_ids = [dependency["depends_on_task_id"] for dependency in dependencies]
    if len(dependency_ids) != len(set(dependency_ids)):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Dependência duplicada.")
    if task_id is not None and task_id in dependency_ids:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Uma tarefa não pode depender de si mesma.")
    if tasks_repo.task_ids_in_workspace(conn, workspace_id, dependency_ids) != set(dependency_ids):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Todas as dependências precisam pertencer ao mesmo workspace.",
        )
    if task_id is not None:
        for dependency_id in dependency_ids:
            if tasks_repo.dependency_would_cycle(conn, task_id, dependency_id):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A dependência criaria um ciclo entre tarefas.",
                )


def list_task_lists(workspace_id: UUID, user: CurrentUserResponse) -> list[TaskList]:
    with connect() as conn:
        context = tasks_repo.find_workspace_context(conn, workspace_id, is_platform_admin(user), user.id)
        _authorize(context, user, "view", "Workspace não encontrado.")
        return [TaskList(**row) for row in tasks_repo.list_task_lists(conn, workspace_id)]


def create_task_list(workspace_id: UUID, data: TaskListCreate, user: CurrentUserResponse) -> TaskList:
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Nome da lista é obrigatório.")
    with connect() as conn:
        context = tasks_repo.find_workspace_context(conn, workspace_id, is_platform_admin(user), user.id)
        _authorize(context, user, "manage_work", "Workspace não encontrado.")
        return TaskList(**tasks_repo.create_task_list(conn, workspace_id, name, data.type))


def get_tasks_in_list(list_id: UUID, user: CurrentUserResponse) -> list[Task]:
    with connect() as conn:
        context = tasks_repo.find_list_context(conn, list_id, is_platform_admin(user), user.id)
        _authorize(context, user, "view", "Lista de tarefas não encontrada.")
        return [Task(**row) for row in tasks_repo.list_tasks(conn, list_id)]


def create_task(list_id: UUID, data: TaskCreate, user: CurrentUserResponse) -> Task:
    values = data.model_dump()
    values["title"] = values["title"].strip()
    if not values["title"]:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Título da tarefa é obrigatório.")
    custom_fields = [field.model_dump() for field in data.custom_fields]
    dependencies = [dependency.model_dump() for dependency in data.dependencies]
    subtasks = [subtask.model_dump() for subtask in data.subtasks]
    with connect() as conn:
        context = _authorize(
            tasks_repo.find_list_context(conn, list_id, is_platform_admin(user), user.id),
            user,
            "manage_work",
            "Lista de tarefas não encontrada.",
        )
        _validate_people(conn, context["workspace_id"], values)
        _validate_dependencies(conn, context["workspace_id"], dependencies)
        row = tasks_repo.create_task(conn, list_id, values)
        task_id = row["id"]
        tasks_repo.replace_custom_fields(conn, task_id, custom_fields)
        tasks_repo.replace_dependencies(conn, task_id, dependencies)
        tasks_repo.replace_subtasks(conn, task_id, subtasks)
        return Task(**tasks_repo.get_task(conn, task_id))


def update_task(task_id: UUID, data: TaskUpdate, user: CurrentUserResponse) -> Task:
    updates = data.model_dump(exclude_unset=True)
    custom_fields = updates.pop("custom_fields", None)
    dependencies = updates.pop("dependencies", None)
    subtasks = updates.pop("subtasks", None)
    if "title" in updates:
        updates["title"] = updates["title"].strip()
        if not updates["title"]:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Título da tarefa é obrigatório.")
    with connect() as conn:
        context = _authorize(
            tasks_repo.find_task_context(conn, task_id, is_platform_admin(user), user.id),
            user,
            "manage_work",
            "Tarefa não encontrada.",
        )
        _require_local_task(context)
        _validate_people(conn, context["workspace_id"], updates)
        if dependencies is not None:
            _validate_dependencies(conn, context["workspace_id"], dependencies, task_id)
        if not tasks_repo.update_task(conn, task_id, updates):
            raise _not_found("Tarefa não encontrada.")
        if custom_fields is not None:
            tasks_repo.replace_custom_fields(conn, task_id, custom_fields)
        if dependencies is not None:
            tasks_repo.replace_dependencies(conn, task_id, dependencies)
        if subtasks is not None:
            try:
                tasks_repo.replace_subtasks(conn, task_id, subtasks)
            except ValueError as exc:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Subtarefa não pertence à tarefa informada.",
                ) from exc
        task = tasks_repo.get_task(conn, task_id)
        if task["group_status"] in {"DONE", "CLOSED"} and task.get("recurrence") in {"weekly", "monthly"}:
            current_due = task.get("due_date") or datetime.now(timezone.utc)
            task["next_due_date"] = current_due + timedelta(days=7 if task["recurrence"] == "weekly" else 30)
            successor = tasks_repo.create_recurring_successor(conn, task)
            if successor:
                tasks_repo.copy_recurring_children(conn, task_id, successor["id"])
        return Task(**task)


def delete_task(task_id: UUID, user: CurrentUserResponse) -> None:
    with connect() as conn:
        context = _authorize(
            tasks_repo.find_task_context(conn, task_id, is_platform_admin(user), user.id),
            user,
            "manage_work",
            "Tarefa não encontrada.",
        )
        _require_local_task(context)
        if not tasks_repo.delete_task(conn, task_id):
            raise _not_found("Tarefa não encontrada.")


def add_subtask(task_id: UUID, title: str, user: CurrentUserResponse) -> dict:
    clean_title = title.strip()
    if not clean_title:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Título da subtarefa é obrigatório.")
    with connect() as conn:
        context = _authorize(
            tasks_repo.find_task_context(conn, task_id, is_platform_admin(user), user.id),
            user,
            "manage_work",
            "Tarefa não encontrada.",
        )
        _require_local_task(context)
        return dict(tasks_repo.add_subtask(conn, task_id, clean_title))


def toggle_subtask(subtask_id: UUID, user: CurrentUserResponse) -> dict:
    with connect() as conn:
        context = _authorize(
            tasks_repo.find_subtask_context(conn, subtask_id, is_platform_admin(user), user.id),
            user,
            "manage_work",
            "Subtarefa não encontrada.",
        )
        _require_local_task(context)
        row = tasks_repo.toggle_subtask(conn, subtask_id)
        if not row:
            raise _not_found("Subtarefa não encontrada.")
        return dict(row)


def delete_subtask(subtask_id: UUID, user: CurrentUserResponse) -> None:
    with connect() as conn:
        context = _authorize(
            tasks_repo.find_subtask_context(conn, subtask_id, is_platform_admin(user), user.id),
            user,
            "manage_work",
            "Subtarefa não encontrada.",
        )
        _require_local_task(context)
        if not tasks_repo.delete_subtask(conn, subtask_id):
            raise _not_found("Subtarefa não encontrada.")
