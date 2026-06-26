from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "RepoLens"
    app_version: str = "0.1.0"
    scratch_dir: str = ".repolens/scratch"
    retain_clones: bool = False
    max_repo_mb: int = 250
    max_files: int = 10_000
    max_file_bytes: int = 1_000_000
    clone_timeout_seconds: int = 120
    parse_timeout_seconds: int = 10
    git_timeout_seconds: int = 120
    llm_provider: str = "fake"
    llm_model: str = "fake"
    llm_timeout_seconds: int = 60
    llm_max_context_chars: int = 20_000


@lru_cache
def get_settings() -> Settings:
    return Settings()
