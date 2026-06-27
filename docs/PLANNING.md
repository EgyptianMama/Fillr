# RepoLens - Planning Document

## 1. Goal

Build RepoLens as a learning project that covers FastAPI, Postgres, async job processing, static code analysis, git mining, LLM grounding, caching, and a small web UI.

The plan is divided into milestones. Each milestone should leave the project in a runnable state and produce something observable.

## 2. Workstreams

| Workstream | Owns |
|---|---|
| API | FastAPI routes, schemas, validation, error responses |
| Database | schema, migrations, indexes, repository functions |
| Worker | queue claiming, job lifecycle, retries, progress |
| Ingestion | clone, file discovery, parser, git miner, graph builder |
| LLM | context assembly, provider client, prompts, caching |
| UI | Jinja templates, HTMX polling, file and explanation pages |
| Testing | fixtures, unit tests, integration tests, fake LLM |
| DevOps | Docker Compose, config, logging, local setup |

## 3. Milestone 0 - Project Skeleton

Objective:

Create a runnable Python/FastAPI project with basic tooling.

Tasks:

- Create Python package structure under `repolens/`.
- Add dependency management file (`pyproject.toml` recommended).
- Add FastAPI app with `/health`.
- Add Pydantic settings.
- Add ruff, black, and pytest configuration.
- Add basic README with local run commands.

Acceptance criteria:

- `uvicorn` can start the API.
- `GET /health` returns OK.
- `pytest` runs at least one smoke test.

## 4. Milestone 1 - Database and Migrations

Objective:

Create the core schema and make the app talk to Postgres.

Tasks:

- Add Docker Compose with Postgres.
- Add SQLAlchemy/SQLModel setup.
- Add Alembic.
- Create migrations for:
  - `repositories`
  - `jobs`
  - `files`
  - `symbols`
  - `edges`
  - `commits`
  - `file_commits`
  - `parse_errors`
  - `llm_cache`
- Add indexes listed in `architecture.md`.
- Add database session dependency for FastAPI.

Acceptance criteria:

- `alembic upgrade head` creates all tables.
- API can open a database session.
- A test can insert and read a repository row.

## 5. Milestone 2 - Repo Submission and Job Queue

Objective:

Implement the async job contract before implementing ingestion.

Tasks:

- Add `POST /repos`.
- Add URL and branch validation.
- Insert or reuse repository rows.
- Insert queued ingestion jobs.
- Add `GET /jobs/{job_id}`.
- Implement Postgres job claiming with `SKIP LOCKED`.
- Add worker loop that claims jobs and marks a fake job `ready`.
- Add attempt count, timestamps, progress fields, and error fields.

Acceptance criteria:

- Submitting a repo returns `202`, `repo_id`, and `job_id`.
- Worker can claim the job.
- Polling job status shows stage/progress.
- Fake worker path can move job from `queued` to `ready`.

## 6. Milestone 3 - Clone and File Discovery

Objective:

Make the worker clone a real repo and discover supported files.

Tasks:

- Implement scratch directory management.
- Implement safe git clone with timeout.
- Store current commit SHA.
- Implement `git ls-files` discovery.
- Add file filters:
  - binary files
  - oversized files
  - dependency folders
  - generated folders
- Insert `files` rows.
- Track file counts in job progress.
- Clean scratch clone after completion unless retained.

Acceptance criteria:

- Worker can clone a small public repo.
- `files` table contains discovered Python files.
- Job progress reaches at least clone/discovery stages.
- Clone failures produce useful job errors.

## 7. Milestone 4 - Python AST Parser

Objective:

Parse Python files into symbols and structural edge candidates.

Tasks:

- Build parser module with a database-independent output model.
- Extract imports.
- Extract classes, functions, async functions, and methods.
- Extract best-effort call sites.
- Add parser tests using small fixture files.
- Persist symbols.
- Persist import/call candidates or direct edges where resolvable.
- Store per-file parse errors.

Acceptance criteria:

- Parser unit tests pass for imports, symbols, methods, and calls.
- Ingested repo has `symbols` rows.
- Parse errors do not fail the whole job.

## 8. Milestone 5 - Git History Miner

Objective:

Mine commit and file-change history.

Tasks:

- Parse `git log --numstat --date=iso-strict`.
- Store `commits`.
- Store `file_commits`.
- Handle renamed files where visible in git output.
- Add optional blame pass for author concentration.
- Add tests using a generated local git repo.
- Add partial-history warning field.

Acceptance criteria:

- Known fixture repo produces expected commit/file-change rows.
- Ingested repo shows recent commits per file.
- Git command failures are handled with stage-specific errors.

## 9. Milestone 6 - Graph Assembly

Objective:

Create queryable graph edges.

Tasks:

- Resolve import edges from parsed imports to known files.
- Persist call edges with confidence metadata.
- Derive co-change edges from `file_commits`.
- Ignore/downweight noisy large commits.
- Add graph query repository functions.
- Add endpoints:
  - `GET /files/{file_id}/edges`
  - `GET /files/{file_id}/history`
  - `GET /files/{file_id}`

Acceptance criteria:

- File detail returns imports, imported-by files, calls, co-changed files, and history.
- Co-change edges have weights.
- Basic graph queries are covered by tests.

## 10. Milestone 7 - Repo Summary and Search

Objective:

Make ingested repos easier to explore.

Tasks:

- Add `GET /repos`.
- Add `GET /repos/{repo_id}`.
- Add `GET /repos/{repo_id}/files`.
- Add path and symbol search.
- Compute repo summary:
  - file count
  - symbol count
  - edge count
  - commit count
  - parse error count
  - top connected files
  - high co-change/no-import pairs

Acceptance criteria:

- Repo overview shows useful ingestion summary.
- User can find a file by path or symbol name.

## 11. Milestone 8 - LLM Context and Explanation

Objective:

Build grounded explanation without embeddings first.

Tasks:

- Implement target matching:
  - path match
  - symbol match
  - keyword match
- Build context packet from graph and history.
- Add fake LLM client for tests.
- Add real provider adapter behind an interface.
- Add prompt template that asks for citations and uncertainty.
- Add `POST /repos/{repo_id}/explain`.
- Return answer, citations, context summary, and cache status.

Acceptance criteria:

- Explanation endpoint works with fake client.
- Real provider can be configured through env vars.
- Response includes evidence references.
- Wrong/weak context can be surfaced to the user.

## 12. Milestone 9 - LLM Cache

Objective:

Control cost and make repeated explanations fast.

Tasks:

- Compute `context_hash`.
- Compute `question_hash`.
- Include current commit SHA in context hash.
- Store response JSON in `llm_cache`.
- Return cache hit/miss in API response.
- Add tests for cache hit and invalidation after repo commit changes.

Acceptance criteria:

- Same question and same context produce cache hit.
- Changed context produces cache miss.

## 13. Milestone 10 - Web UI

Objective:

Add a small usable interface.

Tasks:

- Add base Jinja layout.
- Add repo submission page.
- Add job status page with HTMX polling.
- Add repo overview page.
- Add file browser.
- Add file detail page.
- Add explanation form and result panel.
- Show parse/history warnings.

Acceptance criteria:

- User can submit a repo from browser.
- Job progress updates without manual refresh.
- User can browse file details.
- User can ask a question and see answer plus citations.

## 14. Milestone 11 - Re-ingestion and Cancellation

Objective:

Make job control more realistic.

Tasks:

- Add `POST /jobs/{job_id}/cancel`.
- Worker checks cancellation between stages.
- Add full re-ingestion for existing repo.
- Add current commit SHA check.
- Skip re-ingestion if unchanged.
- Later: replace full re-ingestion with incremental parsing/mining.

Acceptance criteria:

- Active job can be cancelled safely.
- Re-submitting unchanged repo does not duplicate all data.
- Re-submitting changed repo refreshes graph data.

## 15. Milestone 12 - Hardening and Observability

Objective:

Make the system easier to debug and safer to run.

Tasks:

- Add structured logging.
- Add job heartbeat/stale recovery.
- Add resource limits.
- Add timeout handling for clone, parse, git, and LLM calls.
- Add better error codes.
- Add integration test for full ingestion.
- Add Docker Compose for `api`, `worker`, and `postgres`.

Acceptance criteria:

- A failed ingestion shows a clear reason.
- Worker crash can be recovered or retried.
- Full local stack runs through Docker Compose.

## 16. Milestone 13 - Deployment

Objective:

Deploy the full stack to Oracle Cloud Always Free for zero ongoing cost.

Tasks:

- Create `Dockerfile` for API and worker (shared image).
- Create `docker-compose.prod.yml` with Postgres, API, worker, and Caddy.
- Create `Caddyfile` for automatic TLS via Let's Encrypt.
- Set up Oracle Cloud ARM VM (VM.Standard.A1.Flex, 4 OCPU, 24 GB RAM).
- Configure DuckDNS for a free subdomain.
- Open firewall ports (22, 80, 443).
- Create GitHub Actions CI pipeline (test on every push).
- Create GitHub Actions deploy pipeline (SSH deploy on merge to main).
- Create systemd service for auto-start on VM boot.
- Create daily Postgres backup script with 7-day retention.
- Create `.env.example` with all environment variables documented.
- Write `docs/deployment.md` with full setup instructions.

Acceptance criteria:

- `docker compose -f docker-compose.prod.yml up -d` starts all services.
- Caddy serves HTTPS automatically with a valid TLS certificate.
- CI runs tests on every push.
- Merge to main triggers automatic deployment.
- VM reboot brings services back automatically.
- Backup script produces a valid SQL dump.
- Full user journey works over HTTPS: submit repo, watch ingestion, browse files, ask question, see answer.

## 17. Optional Milestone 14 - v2 Learning Extensions

Pick these after the core path works:

- Add `pgvector` embeddings.
- Add JS/TS parser.
- Add tree-sitter.
- Add graph visualization.
- Add exportable reports.
- Add auth.
- Add Celery or arq to compare against Postgres queue.

## 18. Suggested Work Division

For two people:

- Person A: API, database, schemas, endpoints, UI.
- Person B: worker, clone, parser, git miner, graph assembly.
- Shared: LLM context, integration tests, Docker Compose, deployment.

For three people:

- Person A: API/database/UI.
- Person B: worker/ingestion/parser/git.
- Person C: LLM/context/testing/devops/deployment.

For solo development:

1. Build vertical slices, not isolated layers.
2. Finish one repo submission through fake-ready job.
3. Replace fake-ready with clone.
4. Add parser.
5. Add git miner.
6. Add graph.
7. Add LLM.
8. Add UI polish.
9. Deploy to Oracle Cloud.

## 19. Dependency Order

```text
Skeleton
  -> Database
  -> Job Queue
  -> Clone/File Discovery
  -> Parser
  -> Git Miner
  -> Graph Assembly
  -> Repo/File APIs
  -> LLM Context
  -> Cache
  -> UI
  -> Re-ingestion/Cancellation
  -> Hardening
  -> Deployment
```

## 20. Project Checkpoints

Use these checkpoints to avoid getting lost:

- Checkpoint A: API starts and database migrates.
- Checkpoint B: Repo submission creates a pollable job.
- Checkpoint C: Worker clones and indexes file paths.
- Checkpoint D: Parser stores symbols/imports.
- Checkpoint E: Git miner stores commits/file changes.
- Checkpoint F: File detail endpoint shows structure and history.
- Checkpoint G: `/explain` returns cited answer.
- Checkpoint H: Browser UI can run the main workflow.
- Checkpoint I: Application is live on Oracle Cloud with HTTPS.

## 21. First Implementation Slice

The first practical slice should be:

1. Create FastAPI app.
2. Create Postgres schema for `repositories` and `jobs`.
3. Implement `POST /repos`.
4. Implement `GET /jobs/{job_id}`.
5. Implement worker that claims a job and marks it `ready`.

This gives you the backbone. Every later feature hangs from that loop.
