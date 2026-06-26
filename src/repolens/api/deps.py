from functools import lru_cache

from repolens.services.repositories import RepositoryService


@lru_cache
def get_repository_service() -> RepositoryService:
    return RepositoryService()
