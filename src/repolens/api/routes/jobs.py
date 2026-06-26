from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from repolens.api.deps import get_repository_service
from repolens.api.schemas import JobResponse
from repolens.services.repositories import RepositoryService

router = APIRouter(prefix="/jobs", tags=["jobs"])
RepositoryServiceDep = Annotated[RepositoryService, Depends(get_repository_service)]


@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: str,
    service: RepositoryServiceDep,
) -> JobResponse:
    job = service.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobResponse.model_validate(job)
