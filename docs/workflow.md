# RepoLens - Workflow

## 1. Purpose

This document describes the end-to-end flow from "user submits a repo URL" to "user gets a grounded answer." It also defines the lifecycle of async ingestion jobs and the repeatable query-time explanation flow.

Read this alongside `architecture.md` for component responsibilities and `PLANNING.md` for implementation milestones.

## 2. Pipeline Stages

1. Submission
2. Job claim
3. Clone
4. File discovery
5. Static parse
6. Git mining
7. Graph assembly
8. Summary calculation
9. Ready
10. Query-time synthesis

Embedding generation is deferred until v2.

## 3. Stage Details

### 3.1 Submission

Input:

- `POST /repos`
- Repo URL
- Optional branch
- Optional `retain_clone` flag for development

Actions:

- Validate URL format and allowed scheme.
- Normalize URL and branch.
- Create or reuse a `repositories` row.
- Create an `ingest_repo` job unless a job for the same repo/branch is already active.

Output:

- `202 Accepted`
- `repo_id`
- `job_id`
- Initial job status URL

Failure modes:

- Malformed URL: reject synchronously.
- Unsupported scheme: reject synchronously.
- Duplicate active job: return the existing job instead of creating another.

### 3.2 Job Claim

Input:

- Queued job in Postgres.

Actions:

- Worker claims one job using `FOR UPDATE SKIP LOCKED`.
- Job moves from `queued` to `cloning`.
- Worker records `started_at`, `updated_at`, and attempt count.

Failure modes:

- Worker crashes after claiming: another worker may recover the stale job after a timeout.

### 3.3 Clone

Input:

- Repo URL and branch.

Actions:

- Clone into a job-specific scratch directory.
- Prefer full history for learning and git mining.
- Enforce clone timeout and size limits.
- Skip submodules in v1.

Output:

- Local checkout path.
- Current commit SHA.
- Clone metadata.

Failure modes:

- Auth failure: mark job failed.
- Timeout/network failure: retry once with backoff.
- Repo too large: fail with a clear resource-limit message.

### 3.4 File Discovery

Input:

- Local checkout.

Actions:

- Use `git ls-files` where possible.
- Exclude `.git`, virtualenvs, dependency folders, generated folders, binaries, and files over the configured size limit.
- Count files by language.

Output:

- Initial `files` rows or in-memory file inventory.
- Total parseable Python file count for progress reporting.

Failure modes:

- Empty repo or no supported files: job can still complete as `ready` with a warning.

### 3.5 Static Parse

Input:

- Python files from discovery.

Actions:

- Read file content safely.
- Run `ast.parse`.
- Extract imports, classes, functions, async functions, methods, and call sites.
- Store symbols and best-effort edge candidates.
- Store parse errors per file without stopping the job.

Output:

- `files`
- `symbols`
- import edge candidates
- call edge candidates
- `parse_errors`

Failure modes:

- Syntax error in one file: log and continue.
- Decode error: log and continue.
- File parse timeout: log and continue.

### 3.6 Git Mining

Input:

- Local repo `.git` history.

Actions:

- Parse `git log --numstat`.
- Store commits and file-to-commit changes.
- Run blame for supported files, or defer full blame if it is too slow.
- Track partial history if clone depth is limited.

Output:

- `commits`
- `file_commits`
- file-level history summaries
- author concentration data

Failure modes:

- Shallow history: continue and mark result as partial.
- Git command failure: retry the command if transient, otherwise mark the job failed if history mining cannot continue at all.

### 3.7 Graph Assembly

Input:

- File rows
- Symbol rows
- Import and call candidates
- File commit data

Actions:

- Resolve import candidates to known files where possible.
- Write import edges.
- Write call edges with a confidence/metadata marker.
- Derive co-change edges from commits.
- Downweight or skip large noisy commits.

Output:

- `edges` rows for `import`, `calls`, and `co_change`.

Failure modes:

- Unresolved imports/calls are stored as metadata or skipped, but do not fail ingestion.

### 3.8 Summary Calculation

Actions:

- Count files, symbols, edges, commits, parse errors.
- Compute top central files by incoming/outgoing edges.
- Compute files with high co-change but no import edge.
- Store status warnings such as partial parse or partial history.

Output:

- Repo summary visible in `GET /repos/{repo_id}` and the UI.

### 3.9 Ready

Actions:

- Mark job `ready`.
- Mark repository `ready`.
- Store `last_ingested_at` and `current_commit_sha`.
- Clean scratch clone unless retained.

All graph and history endpoints become queryable.

## 4. Query-Time Synthesis

This flow runs every time a user asks a question.

1. User sends `POST /repos/{repo_id}/explain`.
2. API validates that the repo is `ready`.
3. API matches the question to target files/symbols.
4. API returns or includes "matched context" so the user can see what was selected.
5. API assembles a bounded context packet.
6. API hashes the context and question.
7. API checks `llm_cache`.
8. On cache miss, API calls the configured LLM provider.
9. API validates that the response includes citations or evidence references.
10. API stores the response JSON in `llm_cache`.
11. API returns answer, citations, context summary, and cache status.

v1 target matching:

- Exact file path match.
- Symbol name match.
- Keyword match over paths, symbol names, and commit messages.

v2 target matching:

- Embedding search with `pgvector`.
- Better reranking using graph neighbors.

## 5. Job State Machine

```text
queued
  -> cloning
  -> discovering_files
  -> parsing
  -> mining
  -> graph_building
  -> summarizing
  -> ready

Any active state may move to:
  -> retrying
  -> failed
  -> cancelled
```

| State | Meaning | Progress Signal |
|---|---|---|
| `queued` | Job created, waiting for worker | Position or created time |
| `cloning` | Repo is being cloned | Stage message, elapsed time |
| `discovering_files` | Files are being counted and filtered | Files discovered |
| `parsing` | Python files are being parsed | Files parsed / total |
| `mining` | Git log/blame is being processed | Commits processed / estimated total |
| `graph_building` | Edges are being resolved and written | Edge batches written |
| `summarizing` | Repo-level stats are being calculated | Percent complete |
| `ready` | Ingestion completed | Terminal success |
| `retrying` | Transient failure, waiting before retry | Attempt count and next retry time |
| `failed` | Unrecoverable failure | Terminal with error |
| `cancelled` | User cancelled job | Terminal with reason |

## 6. Re-ingestion

Re-ingestion should be implemented after basic ingestion works.

Desired behavior:

- Fetch latest commit SHA.
- If unchanged, do not re-ingest.
- If changed, parse only changed files when possible.
- Mine only new commits.
- Remove rows for deleted files.
- Recompute edges touching changed files.
- Invalidate affected context hashes naturally by including current commit SHA in context.

Learning note:

It is acceptable to start with full re-ingestion and later replace it with incremental behavior. Full re-ingestion is simpler and easier to test.

## 7. Error Handling

Error categories:

- Validation errors: return `4xx` immediately.
- Clone errors: job failure or retry depending on type.
- Resource-limit errors: job failure with clear message.
- Parse errors: per-file warning, job continues.
- Git mining errors: job may continue with partial history if enough data exists.
- Graph assembly errors: fail the job if database writes are inconsistent.
- LLM errors: return a clear error for `/explain`; do not hide it behind stale cache.

Every error should include:

- Human-readable message.
- Machine-readable code.
- Stage where it happened.
- Whether retry is possible.

## 8. Cancellation and Cleanup

Useful for learning async job control:

- Add `POST /jobs/{job_id}/cancel`.
- Worker checks cancellation between stages and between large batches.
- Cancelled jobs clean scratch directories.
- Cancelled jobs preserve existing completed repo data from earlier ingestions.

## 9. Sequence: Ingestion

```text
Client -> API: POST /repos
API -> Postgres: insert repository/job
API -> Client: 202 repo_id/job_id

Worker -> Postgres: claim queued job
Worker -> Git: clone repository
Worker -> Filesystem: discover and read files
Worker -> Parser: parse AST
Worker -> Git: mine log/blame
Worker -> Postgres: write files/symbols/commits/edges
Worker -> Postgres: mark job and repo ready

Client -> API: GET /jobs/{job_id}
API -> Client: ready + summary
```

## 10. Sequence: Explanation

```text
Client -> API: POST /repos/{repo_id}/explain
API -> Postgres: load repo status
API -> Postgres: match files/symbols/history
API -> Postgres: check llm_cache
API -> LLM provider: send structured context on cache miss
LLM provider -> API: answer
API -> Postgres: store response
API -> Client: answer + citations + matched context
```
