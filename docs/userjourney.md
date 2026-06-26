# RepoLens - User Journeys

## 1. Purpose

These journeys describe how RepoLens should feel to use and what learning value each journey creates while building it.

RepoLens is not being scoped as a startup MVP. It is a learning project, so the goal is to build the full system in layers and learn useful backend, database, static-analysis, and LLM patterns along the way.

## 2. Personas

| Persona | Context | What They Need |
|---|---|---|
| Priya | Junior engineer joining an unfamiliar codebase | A map of important files and who/what depends on them |
| Tomas | Tech lead preparing a refactor | Evidence of coupling, risk, and ownership |
| Solo Dev | Returning to an old side project | Help remembering why code exists |
| Builder | You, building RepoLens | Practice with FastAPI, workers, Postgres, git mining, and grounded LLMs |

## 3. Journey: Priya - Onboarding

| Step | Trigger | Action | System Response | Outcome |
|---|---|---|---|---|
| 1 | Told to understand `auth.py` | Submits repo URL | Job is created with staged progress | She sees the system working instead of waiting blindly |
| 2 | Ingestion finishes | Opens repo overview | Sees file counts, parse warnings, top connected files | She gets a first mental model |
| 3 | Opens `auth.py` | Views file detail | Imports, imported-by files, symbols, callers, recent commits | She sees dependencies and history together |
| 4 | Wonders why `session.py` changes with `auth.py` | Asks an explanation question | RepoLens cites co-change edges and commits | She understands coupling with evidence |
| 5 | Plans a small change | Checks authorship and recent changes | Sees who touched the file most | She knows who to ask for context |

## 4. Journey: Tomas - Refactor Audit

| Step | Trigger | Action | System Response | Outcome |
|---|---|---|---|---|
| 1 | Planning a module split | Re-ingests repo | Updated graph and history | Current evidence before refactor |
| 2 | Suspects hidden coupling | Filters high co-change pairs without import edges | Finds suspicious file pairs | Coupling is visible, not anecdotal |
| 3 | Needs to explain risk | Asks LLM why two modules are coupled | Answer cites commits and changed files | He gets a citable refactor note |
| 4 | Checks blast radius | Browses callers and imported-by edges | Sees direct and transitive dependents | Refactor scope becomes clearer |

## 5. Journey: Solo Dev - Returning Later

| Step | Trigger | Action | System Response | Outcome |
|---|---|---|---|---|
| 1 | Opens old project | Submits local or remote repo | Ingestion runs | Project becomes browsable |
| 2 | Forgets why a module exists | Asks "why does this file exist?" | LLM uses early commits and neighbors | Memory is restored from evidence |
| 3 | Finds old stable core file | Opens file detail | Many callers, few recent changes | Knows to treat it carefully |

## 6. Journey: Builder - Learning Path

This is the most important journey for the project.

| Step | Building Goal | What You Learn | Visible Result |
|---|---|---|---|
| 1 | FastAPI skeleton | Routes, schemas, validation | Docs page and health check |
| 2 | Postgres schema | Modeling, migrations, indexes | Tables created by Alembic |
| 3 | Job queue | Async workflow, row locks, retries | `POST /repos` creates pollable job |
| 4 | Clone worker | Subprocess, timeouts, scratch files | Worker clones a repo |
| 5 | Parser | Python AST and static analysis | Files/symbols/imports stored |
| 6 | Git miner | Git internals and history parsing | Commits and file changes stored |
| 7 | Graph builder | Derived relationships and SQL | Imports/calls/co-change visible |
| 8 | LLM context | Grounding and prompt design | `/explain` answers with citations |
| 9 | Cache | Hashing and cost control | Repeated question returns instantly |
| 10 | UI | HTMX and user feedback | Browse repo from browser |

## 7. Key User-Facing Moments

Important moments to design carefully:

- After submission, show `job_id`, current stage, and progress.
- During parse, show files parsed and parse errors.
- On repo overview, show "what was indexed" and "what was skipped."
- On file detail, show structure and history together.
- Before or with an LLM answer, show what context was matched.
- In every LLM answer, show citations to file paths and commit SHAs.

## 8. Product Risks That Still Matter

Even as a learning project, these are worth handling because they teach good engineering:

- Wrong context selection can create wrong LLM answers.
- Python static call graphs are approximate.
- Co-change can be noisy because large commits create false coupling.
- `git blame` can be slow on large repos.
- Large repos need limits and cancellation.
- Source code and commit messages can contain prompt-injection text.

## 9. Learning-Friendly Scope Rules

Build the full thing, but layer it:

- Build one complete path before adding breadth.
- Prefer full re-ingestion before incremental re-ingestion.
- Prefer Python-only before multi-language parsing.
- Prefer file-centered pages before graph visualization.
- Prefer a fake LLM client in tests before real provider integration.
- Prefer simple matching before embeddings.

## 10. Definition of "Good Enough" for v1

RepoLens v1 is successful when:

- A public Python repo can be submitted.
- A worker ingests it and reaches `ready`.
- The database contains files, symbols, imports, commits, file commits, and co-change edges.
- A user can open a file and see its graph/history context.
- `/explain` returns a grounded answer with citations.
- A repeated explanation can be served from cache.
- Basic tests cover parser, git miner, API, and one full ingestion.
