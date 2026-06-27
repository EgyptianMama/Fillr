# RepoLens - Tech Stack

## 1. Stack at a Glance

| Layer | Technology | Why |
|---|---|---|
| Language | Python | Native `ast` module and strong FastAPI ecosystem |
| API Framework | FastAPI | Async-friendly, typed request/response models, good docs UI |
| Validation | Pydantic | Request schemas, response schemas, app settings |
| Database | PostgreSQL | Tables, indexes, recursive CTEs, queue, cache, future `pgvector` |
| ORM | SQLAlchemy 2.0 (async) | Industry standard, `mapped_column` style, full async support |
| DB Driver | asyncpg + psycopg2-binary | Async for app, sync for Alembic migrations |
| Migrations | Alembic | Versioned database schema |
| Async Processing | Postgres queue with `SKIP LOCKED` | No Redis dependency for v1; good learning value |
| Git Mining | `git` subprocess | Direct access to fast native git commands |
| LLM Client | Google Gemini API (free tier) | Zero cost, 15 RPM and 1M tokens/day on Flash |
| LLM Testing | FakeLLMClient | Canned responses for deterministic tests |
| Frontend | Server-rendered HTML + Jinja + HTMX | Simple UI without a separate SPA build pipeline |
| Reverse Proxy | Caddy | Automatic Let's Encrypt TLS, zero-config HTTPS |
| Containers | Docker Compose | Local `api`, `worker`, and `postgres` services |
| Deployment | Oracle Cloud Always Free | 4 ARM OCPUs, 24 GB RAM, zero cost |
| Domain | DuckDNS (free subdomain) | Free dynamic DNS, works with Caddy auto-TLS |
| CI/CD | GitHub Actions | Free for public repos, SSH deploy |
| Testing | pytest, httpx, testcontainers or Docker Compose | Unit, API, database, and worker integration tests |
| Formatting | ruff and black | Consistent code style |

## 2. Backend

FastAPI is a good fit because the API is mostly:

- Validate input.
- Create jobs.
- Read graph data.
- Return JSON or server-rendered HTML.
- Call a service layer for context assembly.

The API should not directly perform long-running ingestion. Heavy work belongs in the worker.

Recommended internal layers:

```text
repolens/
  api/
    routes/
    schemas.py
    deps.py
  core/
    config.py
    logging.py
  db/
    models.py
    session.py
    repositories.py
  ingest/
    clone.py
    discover.py
    parser.py
    git_miner.py
    graph_builder.py
  llm/
    client.py
    context.py
    prompts.py
  worker/
    main.py
    queue.py
  web/
    templates/
    static/
```

## 3. Database

Postgres is intentionally central to the project.

It teaches:

- Schema design.
- Foreign keys.
- Indexing.
- Recursive CTEs.
- Transaction boundaries.
- Queue claiming with row locks.
- Caching.
- Migrations.

Use SQLAlchemy 2.0 with async support and the `mapped_column` style. This is the finalized decision over SQLModel because SQLAlchemy is the industry standard, has better documentation, and provides more learning value for understanding ORMs.

Recommended approach:

- SQLAlchemy 2.0 models with `mapped_column` for core tables.
- asyncpg as the async driver, psycopg2-binary for Alembic.
- Alembic migrations for schema changes.
- Repository query functions for database access (in `db/queries/`).
- Raw SQL for `SKIP LOCKED`, recursive CTEs, and bulk insert paths.

## 4. Worker Queue

v1 should use Postgres:

```sql
SELECT *
FROM jobs
WHERE status = 'queued'
ORDER BY created_at
FOR UPDATE SKIP LOCKED
LIMIT 1;
```

This gives useful experience with:

- Atomic job claiming.
- Retries.
- Heartbeats.
- Stale job recovery.
- Progress updates.

Deferred alternatives:

- `arq` + Redis if you want async queue practice later.
- Celery if you want to learn a mature distributed task queue.

## 5. Parser

Use Python's standard `ast` module first.

Useful AST nodes:

- `ast.Import`
- `ast.ImportFrom`
- `ast.FunctionDef`
- `ast.AsyncFunctionDef`
- `ast.ClassDef`
- `ast.Call`
- `ast.Attribute`
- `ast.Name`

Keep the parser output independent from the database at first. A clean edge-list contract makes testing easier:

```python
ParsedFile(
    path="app/auth.py",
    imports=[...],
    symbols=[...],
    calls=[...],
    errors=[...],
)
```

## 6. Git Mining

Use subprocess calls to git:

- `git ls-files`
- `git rev-parse HEAD`
- `git log --numstat --date=iso-strict`
- `git blame --line-porcelain`

Implementation reminders:

- Always set a working directory.
- Always use timeouts.
- Prefer argument lists over shell strings.
- Treat git output as data that may contain unusual paths.
- Add tests with a temporary local git repo.

## 7. LLM Layer

The LLM layer should be behind a small interface:

```python
class LLMClient:
    async def complete(self, messages: list[Message]) -> LLMResponse:
        ...
```

Provider-specific code belongs in adapters. The rest of the app should only know about:

- `LLMClient`
- prompt templates
- context packet construction
- response parsing/validation

Learning goals:

- Prompt construction.
- Context budgeting.
- Grounded responses.
- Citations.
- Caching.
- Provider abstraction.
- Error handling.

## 8. Frontend

Use Jinja templates and HTMX for v1.

Pages:

- Submit repo.
- Job status.
- Repo overview.
- File browser.
- File detail.
- Explanation result.

HTMX is useful for:

- Polling job progress.
- Updating explanation panels.
- Loading file details without a full SPA.

A full React/Vite frontend can be a later learning branch if you want frontend depth.

## 9. Configuration

Use environment variables loaded into a Pydantic settings object.

Important settings:

- `DATABASE_URL`
- `SCRATCH_DIR`
- `MAX_REPO_MB`
- `MAX_FILES`
- `MAX_FILE_BYTES`
- `CLONE_TIMEOUT_SECONDS`
- `PARSE_TIMEOUT_SECONDS`
- `GIT_TIMEOUT_SECONDS`
- `LLM_PROVIDER`
- `LLM_API_KEY`
- `LLM_MODEL`
- `LLM_TIMEOUT_SECONDS`
- `LLM_MAX_CONTEXT_CHARS`
- `RETAIN_CLONES`

## 10. Local Development

Expected commands:

```text
docker compose up postgres
alembic upgrade head
uvicorn repolens.api.main:app --reload
python -m repolens.worker.main
pytest
ruff check .
black .
```

Docker Compose should eventually include:

- `api`
- `worker`
- `postgres`

During early development, running API and worker directly on the host is often easier for debugging.

## 11. Testing Tools

Recommended testing layers:

| Layer | Tooling | Example |
|---|---|---|
| Parser unit tests | pytest fixtures | Python file in, expected symbols/edges out |
| Git miner tests | temporary git repo | Known commits produce expected `file_commits` |
| API tests | httpx/FastAPI test client | `POST /repos` creates job |
| DB integration | Docker Postgres/testcontainers | migrations and repository queries |
| Worker integration | local fixture repo | full ingest reaches `ready` |
| LLM tests | fake client | context packet produces cached answer |

## 12. Deployment Stack

The application is deployed to Oracle Cloud Always Free:

| Component | Technology | Why |
|---|---|---|
| VM | Oracle Cloud VM.Standard.A1.Flex (ARM) | 4 OCPU, 24 GB RAM, free forever |
| Reverse Proxy | Caddy | Auto-TLS with Let's Encrypt, simpler than Nginx |
| Containers | Docker Compose | Same setup as local dev |
| Auto-start | systemd | Starts Docker Compose on VM boot |
| Domain | DuckDNS | Free subdomain, works with Caddy |
| CI/CD | GitHub Actions | Free for public repos, SSH deploy on merge |
| Backup | pg_dump + cron | Daily backup, 7-day retention |

See `docs/deployment.md` for full setup instructions.

## 13. Deferred / v2 Tech

- `pgvector` for semantic retrieval.
- JS/TS parsing using `acorn`, `esprima`, or tree-sitter.
- Redis-backed queue if Postgres queue becomes limiting.
- More interactive graph visualization.
- Authentication if the app becomes multi-user.
- Object storage if retained clones or snapshots grow large.
- Ollama for fully local/offline LLM as an alternative to Gemini.
