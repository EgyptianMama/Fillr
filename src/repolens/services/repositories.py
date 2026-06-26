from dataclasses import dataclass, field
from datetime import UTC, datetime
from threading import Lock
from typing import Any
from urllib.parse import urlparse
from uuid import uuid4

from repolens.api.schemas import JobStatus, RepositoryStatus


def utc_now() -> datetime:
    return datetime.now(UTC)


@dataclass(slots=True)
class RepositoryRecord:
    id: str
    url: str
    default_branch: str | None
    status: RepositoryStatus
    retain_clone: bool
    current_commit_sha: str | None
    last_ingested_at: datetime | None
    created_at: datetime
    updated_at: datetime


@dataclass(slots=True)
class JobRecord:
    id: str
    repo_id: str
    type: str
    status: JobStatus
    stage: str
    progress_percent: int
    error: str | None
    attempts: int
    result: dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)
    started_at: datetime | None = None
    finished_at: datetime | None = None


@dataclass(slots=True)
class RepositorySubmission:
    repo_id: str
    job_id: str
    status_url: str
    repository: RepositoryRecord
    job: JobRecord


class RepositoryService:
    """Temporary in-memory repository/job service.

    This gives the API a useful contract before the Postgres repository layer exists.
    Milestone 1 should replace this storage with database-backed repository functions.
    """

    def __init__(self) -> None:
        self._lock = Lock()
        self._repositories: dict[str, RepositoryRecord] = {}
        self._repo_by_key: dict[tuple[str, str | None], str] = {}
        self._jobs: dict[str, JobRecord] = {}

    def submit_repository(
        self,
        *,
        url: str,
        branch: str | None,
        retain_clone: bool,
    ) -> RepositorySubmission:
        normalized_url = normalize_repo_url(url)
        normalized_branch = normalize_branch(branch)
        key = (normalized_url, normalized_branch)

        with self._lock:
            now = utc_now()
            repo_id = self._repo_by_key.get(key)
            if repo_id is None:
                repo_id = str(uuid4())
                repository = RepositoryRecord(
                    id=repo_id,
                    url=normalized_url,
                    default_branch=normalized_branch,
                    status=RepositoryStatus.QUEUED,
                    retain_clone=retain_clone,
                    current_commit_sha=None,
                    last_ingested_at=None,
                    created_at=now,
                    updated_at=now,
                )
                self._repositories[repo_id] = repository
                self._repo_by_key[key] = repo_id
            else:
                repository = self._repositories[repo_id]
                repository.status = RepositoryStatus.QUEUED
                repository.retain_clone = retain_clone
                repository.updated_at = now

            job = JobRecord(
                id=str(uuid4()),
                repo_id=repo_id,
                type="ingest_repo",
                status=JobStatus.QUEUED,
                stage="queued",
                progress_percent=0,
                error=None,
                attempts=0,
                created_at=now,
                updated_at=now,
            )
            self._jobs[job.id] = job

            return RepositorySubmission(
                repo_id=repo_id,
                job_id=job.id,
                status_url=f"/jobs/{job.id}",
                repository=repository,
                job=job,
            )

    def list_repositories(self) -> list[RepositoryRecord]:
        with self._lock:
            return sorted(
                self._repositories.values(),
                key=lambda repo: repo.created_at,
                reverse=True,
            )

    def get_repository(self, repo_id: str) -> RepositoryRecord | None:
        with self._lock:
            return self._repositories.get(repo_id)

    def get_job(self, job_id: str) -> JobRecord | None:
        with self._lock:
            return self._jobs.get(job_id)


def normalize_repo_url(url: str) -> str:
    stripped = url.strip()
    if stripped.startswith("git@"):
        return stripped.removesuffix("/")

    parsed = urlparse(stripped)
    normalized_path = parsed.path.rstrip("/")
    return parsed._replace(path=normalized_path).geturl()


def normalize_branch(branch: str | None) -> str | None:
    if branch is None:
        return None
    return branch.strip() or None
