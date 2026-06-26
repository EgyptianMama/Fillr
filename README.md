# RepoLens

RepoLens is a learning project for building a FastAPI-backed repository analysis system.

The first implementation slice provides:

- `GET /health`
- `POST /repos`
- `GET /repos`
- `GET /repos/{repo_id}`
- `GET /jobs/{job_id}`

The current API uses an in-memory store so the request/response contract can be exercised before the Postgres schema and worker are added.

## Project Layout

```text
docs/                 Architecture, workflow, stack, journey, and planning docs
src/repolens/         Application package
  api/                FastAPI app, route modules, request/response schemas
  core/               Settings and shared infrastructure
  db/                 Future database models, migrations, and repositories
  ingest/             Future clone, discovery, parser, git miner, graph builder
  llm/                Future LLM client, prompts, context assembly, cache logic
  services/           Application service layer
  web/                Future templates and static files
  worker/             Future queue worker and job orchestration
tests/                Automated tests grouped by layer
```

## Local Setup

```text
python -m venv .venv
.venv\Scripts\activate
python -m pip install -e .[dev]
uvicorn repolens.api.main:app --reload
pytest
```

## Next Implementation Slice

The next slice should replace the in-memory store with Postgres-backed `repositories` and `jobs` tables, plus an Alembic migration.
