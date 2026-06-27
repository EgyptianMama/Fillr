from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from repolens.api.routes import auth, health, jobs, repos
from repolens.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version=settings.app_version)

    # Allow CORS from Next.js frontend (dev and prod)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "*"],  # Update for prod
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # API routes
    app.include_router(health.router)
    app.include_router(auth.router, prefix="/api")
    app.include_router(repos.router, prefix="/api")
    app.include_router(jobs.router, prefix="/api")

    return app


app = create_app()
