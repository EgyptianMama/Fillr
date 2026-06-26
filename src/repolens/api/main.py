from fastapi import FastAPI

from repolens.api.routes import health, jobs, repos
from repolens.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version=settings.app_version)

    app.include_router(health.router)
    app.include_router(repos.router)
    app.include_router(jobs.router)

    return app


app = create_app()
