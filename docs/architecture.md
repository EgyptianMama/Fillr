# RepoLens - Architecture

## 1. Overview

RepoLens mines a git repository's structure and history into a queryable Postgres-backed knowledge graph. The system reads code and git metadata first, then uses an LLM only as a synthesis layer over that gathered evidence.

The main architectural rule is:

> Structure first, LLM second.

This keeps RepoLens useful as a learning project for FastAPI, async workers, Postgres, static analysis, git mining, and grounded LLM usage. The LLM should explain evidence; it should not invent the evidence.

## 2. Core Capabilities

RepoLens should eventually support these capabilities:

- Ingest a public git repository from a URL and optional branch.
- Track ingestion progress through a job lifecycle.
- Parse Python source files for files, imports, classes, functions, and call sites.
- Mine git history for commits, file changes, authorship, and co-change relationships.
- Store graph edges in Postgres and query them through FastAPI endpoints.
- Assemble a bounded, cited context packet for an LLM explanation.
- Cache LLM responses by context and question hash.
- Show a small web UI for repository status, file browsing, graph neighbors, history, and explanations.

## 3. High-Level Components

```text
Client / Web UI
      |
      v
FastAPI app ----------------------+
  - validation                    |
  - REST endpoints                |
  - HTML/HTMX views               |
  - context assembly              |
      |                           |
      v                           v
Postgres queue <------------- PostgreSQL
      |                     - repositories
      v                     - files
Worker process               - symbols
  - clone repo               - edges
  - parse source             - commits
  - mine git                 - file_commits
  - build graph              - jobs
  - update progress          - llm_cache
      |
      v
Scratch clone storage
```

## 4. Component Responsibilities

### 4.1 FastAPI App

The API should stay thin. It validates requests, writes jobs, reads already-computed data, and assembles LLM context. It should not clone repositories or parse source code inline.

Endpoint groups:

| Group | Endpoint | Purpose |
|---|---|---|
| Ingestion | `POST /repos` | Submit a repo URL and create an ingestion job |
| Ingestion | `GET /jobs/{job_id}` | Poll status, progress, errors, and result metadata |
| Repositories | `GET /repos` | List ingested repositories |
| Repositories | `GET /repos/{repo_id}` | Show repo summary and readiness |
| Files | `GET /repos/{repo_id}/files` | List indexed files with filtering/search |
| Files | `GET /files/{file_id}` | File detail: symbols, imports, callers, history summary |
| Graph | `GET /files/{file_id}/edges` | Direct graph neighbors |
| Graph | `GET /files/{file_id}/callers` | Direct and optionally transitive callers |
| History | `GET /files/{file_id}/history` | Commits and authors touching a file |
| Synthesis | `POST /repos/{repo_id}/explain` | Ask a grounded natural-language question |

### 4.2 Worker

The worker claims queued jobs from Postgres using `SELECT ... FOR UPDATE SKIP LOCKED`, runs the ingestion pipeline, and writes progress after each stage.

Worker responsibilities:

- Claim one job atomically.
- Mark stale in-progress jobs as retryable if the worker dies.
- Clone into a job-specific scratch directory.
- Enforce resource limits before and during ingestion.
- Persist partial parse errors without failing the whole job.
- Write rows in batches to keep ingestion reasonably fast.
- Clean scratch files after completion unless retention is enabled.

### 4.3 Parser / Analyzer

The v1 analyzer is Python-only and uses the standard `ast` module.

It should extract:

- File inventory: path, language, line count, size.
- Imports: `import x`, `import x as y`, `from x import y`, relative imports.
- Symbols: classes, functions, async functions, methods.
- Call sites: best-effort function/method names and source locations.

Important limitation:

Python call graphs are approximate. Dynamic dispatch, decorators, monkey patching, dependency injection, framework routing, and runtime imports can hide real calls. RepoLens should label call edges as "static-best-effort" rather than implying perfect truth.

### 4.4 Git History Miner

The git miner shells out to git commands instead of using GitPython.

Primary commands:

- `git log --numstat --date=iso-strict`
- `git blame --line-porcelain`
- `git ls-files`

It should compute:

- Commit records.
- File-to-commit records with additions/deletions.
- Last touched date per file.
- Author concentration per file.
- Co-change candidate edges between files changed in the same commit.

Noise controls are important. Co-change should ignore or downweight:

- Very large commits above a configurable file-count threshold.
- Generated/vendor directories.
- Lockfiles and dependency update commits where appropriate.
- Pure formatting commits if they can be detected by message or file pattern.

### 4.5 PostgreSQL Store

Postgres stores both graph data and operational metadata. It is intentionally used for more than CRUD so the project teaches relational modeling, indexing, job queues, recursive queries, and caching.

Core tables:

| Table | Key Columns | Purpose |
|---|---|---|
| `repositories` | id, url, default_branch, current_commit_sha, last_ingested_at, status | One row per tracked repo |
| `files` | id, repo_id, path, language, loc, size_bytes, content_hash | File inventory |
| `symbols` | id, file_id, qualified_name, kind, start_line, end_line | Functions/classes/methods per file |
| `edges` | id, repo_id, source_type, source_id, target_type, target_id, edge_type, weight, metadata | Imports, calls, co-change edges |
| `commits` | id, repo_id, sha, author_name, author_email, committed_at, message | Git commits |
| `file_commits` | file_id, commit_id, additions, deletions, old_path | File-to-commit join |
| `jobs` | id, repo_id, type, status, progress_percent, stage, error, attempts, timestamps | Async job lifecycle |
| `parse_errors` | id, repo_id, file_path, error_type, message | Non-fatal parser failures |
| `llm_cache` | id, repo_id, context_hash, question_hash, response_json, created_at | Synthesis cache |

Recommended indexes:

- `repositories(url, default_branch)`
- `files(repo_id, path)`
- `symbols(file_id, qualified_name)`
- `edges(repo_id, edge_type, source_type, source_id)`
- `edges(repo_id, edge_type, target_type, target_id)`
- `commits(repo_id, sha)`
- `file_commits(file_id, commit_id)`
- `jobs(status, created_at)`
- `llm_cache(repo_id, context_hash, question_hash)`

### 4.6 LLM Synthesis Layer

The LLM layer should be provider-agnostic and small. Its job is to transform a structured context packet into a readable answer.

Context packet shape:

- Matched question target: file path, symbol, or search terms.
- Why that target was selected.
- Relevant imports and imported-by edges.
- Relevant call edges.
- Co-changed files and weights.
- Recent commits touching the target.
- Parse warnings or partial-history warnings.

Response requirements:

- Answer in plain language.
- Include citations to file paths and commit SHAs.
- Explicitly say when evidence is weak or partial.
- Avoid pretending static call edges are complete.

Cache invalidation:

- Include repository commit SHA and selected context rows in `context_hash`.
- A new ingestion of the same repo should naturally change the context hash when relevant evidence changes.
- Do not return stale cache entries after the repository is re-ingested against a new commit.

### 4.7 Web UI

The v1 UI should be modest and useful:

- Repo submission form.
- Job status page with staged progress.
- Repo file browser.
- File detail page with imports, callers, co-changed files, authors, and recent commits.
- Explanation form that shows what context was matched before or alongside the answer.

Avoid starting with a complex graph visualization. A file-centered UI will teach the system better and be much easier to verify.

## 5. Data Flow

1. User submits a repository URL.
2. API validates it and inserts a `repositories` row and a queued `jobs` row.
3. Worker claims the job.
4. Worker clones the repo into scratch storage.
5. Worker indexes files and parses Python AST.
6. Worker mines git history.
7. Worker builds import, call, and co-change edges.
8. Worker writes summary metadata and marks the repo `ready`.
9. User browses graph and history through SQL-backed endpoints.
10. User asks an explanation question.
11. API selects target context, checks `llm_cache`, calls the LLM on miss, stores response, and returns answer plus citations.

## 6. Security and Resource Considerations

RepoLens should assume submitted repositories are untrusted.

Controls:

- Never execute repository code.
- Disable or skip submodules in v1 unless explicitly supported.
- Enforce clone timeout, max repo size, max file count, max file size, and max parse time per file.
- Ignore `.git`, virtualenvs, dependency folders, generated folders, and binary files.
- Sanitize paths and never allow writes outside the scratch directory.
- Keep LLM API keys in environment variables only.
- Do not log secrets or full source context at info level.
- Treat source comments and commit messages as untrusted text inside prompts.
- Add per-repo or per-user LLM rate limits once there is a UI.

## 7. Observability

Add this early because async systems are harder to debug without it:

- Structured logs with `repo_id`, `job_id`, `stage`, and `duration_ms`.
- Job progress table fields visible through `GET /jobs/{job_id}`.
- Worker heartbeat or `updated_at` timestamp.
- Counts after ingestion: files parsed, parse errors, commits mined, edges created.
- Clear error messages for clone failures, parser failures, git failures, and LLM failures.

## 8. Testing Strategy

Testing should grow with each subsystem:

- Parser unit tests using tiny fixture repos and expected edge lists.
- Git miner tests using a generated local git repo with known commits.
- API tests using FastAPI `TestClient` or `httpx`.
- Database tests using a disposable Postgres container.
- Worker integration test for one full ingestion.
- LLM client tests using a fake provider.
- Golden context tests: question plus repo state produces expected context packet.

## 9. Non-Goals for v1

- Perfect Python call graph accuracy.
- Multi-language analysis beyond basic file inventory.
- Real-time IDE integration.
- Advanced graph visualization.
- Authentication and multi-user permissions.
- Embedding-based semantic search.
- Distributed worker scaling.

## 10. Deferred Enhancements

- Embeddings with `pgvector`.
- JS/TS parser subprocess with the same edge-list contract.
- Better symbol resolution and import resolution.
- Rename-aware history analysis.
- Background re-ingestion scheduler.
- Exportable reports for architecture smells.
- More advanced graph metrics: centrality, instability, blast radius, ownership hotspots.
