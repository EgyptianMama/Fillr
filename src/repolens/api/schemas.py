from datetime import datetime
from enum import StrEnum
from typing import Any
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, Field, field_validator


class RepositoryStatus(StrEnum):
    QUEUED = "queued"
    READY = "ready"
    FAILED = "failed"


class JobStatus(StrEnum):
    QUEUED = "queued"
    CLONING = "cloning"
    DISCOVERING_FILES = "discovering_files"
    PARSING = "parsing"
    MINING = "mining"
    GRAPH_BUILDING = "graph_building"
    SUMMARIZING = "summarizing"
    READY = "ready"
    RETRYING = "retrying"
    FAILED = "failed"
    CANCELLED = "cancelled"


class HealthResponse(BaseModel):
    status: str


class RepositoryCreateRequest(BaseModel):
    url: str = Field(..., min_length=1, max_length=2048)
    branch: str | None = Field(default=None, max_length=255)
    retain_clone: bool = False

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https", "ssh", "git"}:
            raise ValueError("Repository URL must use http, https, ssh, or git scheme")
        if not parsed.netloc and not value.startswith("git@"):
            raise ValueError("Repository URL must include a host")
        return value

    @field_validator("branch")
    @classmethod
    def validate_branch(cls, value: str | None) -> str | None:
        if value is None:
            return value
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Branch cannot be blank")
        return cleaned


class RepositoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    url: str
    default_branch: str | None
    status: RepositoryStatus
    retain_clone: bool
    current_commit_sha: str | None
    last_ingested_at: datetime | None
    created_at: datetime
    updated_at: datetime


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    repo_id: str
    type: str
    status: JobStatus
    stage: str
    progress_percent: int
    error: str | None
    attempts: int
    result: dict[str, Any]
    created_at: datetime
    updated_at: datetime
    started_at: datetime | None
    finished_at: datetime | None


class RepositoryCreateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    repo_id: str
    job_id: str
    status_url: str
    repository: RepositoryResponse
    job: JobResponse
