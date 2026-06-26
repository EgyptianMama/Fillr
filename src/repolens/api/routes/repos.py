from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from repolens.api.deps import get_repository_service
from repolens.api.schemas import (
    RepositoryCreateRequest,
    RepositoryCreateResponse,
    RepositoryResponse,
)
from repolens.services.repositories import RepositoryService

router = APIRouter(prefix="/repos", tags=["repositories"])
RepositoryServiceDep = Annotated[RepositoryService, Depends(get_repository_service)]


@router.post("", response_model=RepositoryCreateResponse, status_code=status.HTTP_202_ACCEPTED)
def create_repository(
    payload: RepositoryCreateRequest,
    service: RepositoryServiceDep,
) -> RepositoryCreateResponse:
    result = service.submit_repository(
        url=payload.url,
        branch=payload.branch,
        retain_clone=payload.retain_clone,
    )
    return RepositoryCreateResponse.model_validate(result)


@router.get("", response_model=list[RepositoryResponse])
def list_repositories(
    service: RepositoryServiceDep,
) -> list[RepositoryResponse]:
    return [RepositoryResponse.model_validate(repo) for repo in service.list_repositories()]


@router.get("/{repo_id}", response_model=RepositoryResponse)
def get_repository(
    repo_id: str,
    service: RepositoryServiceDep,
) -> RepositoryResponse:
    repo = service.get_repository(repo_id)
    if repo is None:
        raise HTTPException(status_code=404, detail="Repository not found")
    return RepositoryResponse.model_validate(repo)
