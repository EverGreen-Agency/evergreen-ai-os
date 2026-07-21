from uuid import UUID
from fastapi import APIRouter, Depends, status
from bioma_api.auth import current_user_from_request
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.tasks import TaskList, TaskListCreate, Task, TaskCreate, TaskUpdate
from bioma_api.services import tasks as tasks_service

router = APIRouter(prefix="", tags=["tasks"])

@router.get("/workspaces/{workspace_id}/task-lists", response_model=list[TaskList])
def list_task_lists(
    workspace_id: UUID,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> list[TaskList]:
    return tasks_service.list_task_lists(workspace_id, user)

@router.post("/workspaces/{workspace_id}/task-lists", response_model=TaskList, status_code=status.HTTP_201_CREATED)
def create_task_list(
    workspace_id: UUID,
    data: TaskListCreate,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> TaskList:
    return tasks_service.create_task_list(workspace_id, data, user)

@router.get("/task-lists/{list_id}/tasks", response_model=list[Task])
def list_tasks(
    list_id: UUID,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> list[Task]:
    return tasks_service.get_tasks_in_list(list_id, user)

@router.post("/task-lists/{list_id}/tasks", response_model=Task, status_code=status.HTTP_201_CREATED)
def create_task(
    list_id: UUID,
    data: TaskCreate,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> Task:
    return tasks_service.create_task(list_id, data, user)

@router.patch("/tasks/{task_id}", response_model=Task)
def update_task(
    task_id: UUID,
    data: TaskUpdate,
    user: CurrentUserResponse = Depends(current_user_from_request),
) -> Task:
    return tasks_service.update_task(task_id, data, user)

@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: UUID,
    user: CurrentUserResponse = Depends(current_user_from_request),
):
    tasks_service.delete_task(task_id, user)
