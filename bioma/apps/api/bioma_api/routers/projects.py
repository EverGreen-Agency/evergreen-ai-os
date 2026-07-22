from uuid import UUID

from fastapi import APIRouter, Depends, status

from bioma_api.auth import current_user_from_request
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.projects import (
    ContractCreate, ContractUpdate, ProjectCreate, ProjectDeliverableCreate, ProjectDetail,
    ProjectDocumentCreate, ProjectPhaseCreate, ProjectPhaseUpdate, ProjectSummary, ProjectUpdate,
    ProjectUpdateCreate, ScopeItemCreate, ScopeItemUpdate,
)
from bioma_api.services import projects as project_service


workspace_router = APIRouter(prefix="/workspaces/{workspace_id}/projects", tags=["projects"])
router = APIRouter(tags=["projects"])


@workspace_router.get("", response_model=list[ProjectSummary])
def list_projects(workspace_id: UUID, user: CurrentUserResponse = Depends(current_user_from_request)):
    return project_service.list_projects(workspace_id, user)


@workspace_router.post("", response_model=ProjectDetail, status_code=status.HTTP_201_CREATED)
def create_project(workspace_id: UUID, payload: ProjectCreate, user: CurrentUserResponse = Depends(current_user_from_request)):
    return project_service.create_project(workspace_id, payload, user)


@router.get("/projects/{project_id}", response_model=ProjectDetail)
def get_project(project_id: UUID, user: CurrentUserResponse = Depends(current_user_from_request)):
    return project_service.get_project(project_id, user)


@router.patch("/projects/{project_id}", response_model=ProjectDetail)
def update_project(project_id: UUID, payload: ProjectUpdate, user: CurrentUserResponse = Depends(current_user_from_request)):
    return project_service.update_project(project_id, payload, user)


@router.post("/projects/{project_id}/contracts", response_model=ProjectDetail, status_code=status.HTTP_201_CREATED)
def create_contract(project_id: UUID, payload: ContractCreate, user: CurrentUserResponse = Depends(current_user_from_request)):
    return project_service.create_contract(project_id, payload, user)


@router.patch("/contracts/{contract_id}", response_model=ProjectDetail)
def update_contract(contract_id: UUID, payload: ContractUpdate, user: CurrentUserResponse = Depends(current_user_from_request)):
    return project_service.update_contract(contract_id, payload, user)


@router.post("/contracts/{contract_id}/scope-items", response_model=ProjectDetail, status_code=status.HTTP_201_CREATED)
def create_scope_item(contract_id: UUID, payload: ScopeItemCreate, user: CurrentUserResponse = Depends(current_user_from_request)):
    return project_service.create_scope_item(contract_id, payload, user)


@router.patch("/scope-items/{scope_item_id}", response_model=ProjectDetail)
def update_scope_item(scope_item_id: UUID, payload: ScopeItemUpdate, user: CurrentUserResponse = Depends(current_user_from_request)):
    return project_service.update_scope_item(scope_item_id, payload, user)


@router.post("/projects/{project_id}/deliverables", response_model=ProjectDetail, status_code=status.HTTP_201_CREATED)
def create_deliverable(project_id: UUID, payload: ProjectDeliverableCreate, user: CurrentUserResponse = Depends(current_user_from_request)):
    return project_service.create_deliverable(project_id, payload, user)


@router.post("/projects/{project_id}/phases", response_model=ProjectDetail, status_code=status.HTTP_201_CREATED)
def create_phase(project_id: UUID, payload: ProjectPhaseCreate, user: CurrentUserResponse = Depends(current_user_from_request)):
    return project_service.create_phase(project_id, payload, user)


@router.patch("/project-phases/{phase_id}", response_model=ProjectDetail)
def update_phase(phase_id: UUID, payload: ProjectPhaseUpdate, user: CurrentUserResponse = Depends(current_user_from_request)):
    return project_service.update_phase(phase_id, payload, user)


@router.post("/projects/{project_id}/documents", response_model=ProjectDetail, status_code=status.HTTP_201_CREATED)
def create_document(project_id: UUID, payload: ProjectDocumentCreate, user: CurrentUserResponse = Depends(current_user_from_request)):
    return project_service.create_document(project_id, payload, user)


@router.post("/projects/{project_id}/updates", response_model=ProjectDetail, status_code=status.HTTP_201_CREATED)
def create_project_update(project_id: UUID, payload: ProjectUpdateCreate, user: CurrentUserResponse = Depends(current_user_from_request)):
    return project_service.create_project_update(project_id, payload, user)
