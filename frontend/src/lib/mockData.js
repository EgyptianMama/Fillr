export const MOCK_REPOS = [
  {
    id: "repo-001",
    url: "https://github.com/pallets/flask",
    name: "pallets/flask",
    default_branch: "main",
    status: "ready",
    current_commit_sha: "abc123f",
    last_ingested_at: "2 hours ago",
    file_count: 142,
    python_file_count: 98,
    symbol_count: 450,
    edge_count: 1200,
    commit_count: 340,
    parse_error_count: 3,
    top_connected: [
      { path: "src/flask/app.py", incoming: 12, outgoing: 8, id: "file-002" },
      { path: "src/flask/wrappers.py", incoming: 9, outgoing: 5, id: "file-005" },
      { path: "src/flask/blueprints.py", incoming: 7, outgoing: 6, id: "file-006" },
    ],
    suspicious_coupling: [
      {
        file_a: "src/flask/auth.py",
        file_b: "src/flask/sessions.py",
        shared_commits: 15,
      },
    ],
  },
  {
    id: "repo-002",
    url: "https://github.com/psf/requests",
    name: "psf/requests",
    default_branch: "main",
    status: "ingesting",
    progress_percent: 45,
    stage: "Parsing",
    job_id: "job-002",
  },
  {
    id: "repo-003",
    url: "https://github.com/django/django",
    name: "django/django",
    default_branch: "main",
    status: "failed",
    error: "Clone timeout: repository exceeded 250 MB limit",
  },
];

export const MOCK_JOB = {
  id: "job-001",
  repo_id: "repo-001",
  repo_name: "pallets/flask",
  branch: "main",
  status: "parsing",
  progress_percent: 45,
  stages: [
    { name: "Cloning", status: "completed", detail: "completed in 8s" },
    { name: "Discovering", status: "completed", detail: "142 files found" },
    { name: "Parsing", status: "active", detail: "62 / 98 Python files" },
    { name: "Mining", status: "waiting", detail: "waiting..." },
    { name: "Building Graph", status: "waiting", detail: "waiting..." },
    { name: "Summarizing", status: "waiting", detail: "waiting..." },
  ],
  started_ago: "45 seconds ago",
};

export const MOCK_FILE_TREE = {
  "src": {
    "flask": {
      "__init__.py": { id: "file-001", loc: 45, symbols: 12 },
      "app.py": { id: "file-002", loc: 580, symbols: 28 },
      "blueprints.py": { id: "file-006", loc: 210, symbols: 15 },
      "cli.py": { id: "file-007", loc: 165, symbols: 8 },
      "config.py": { id: "file-008", loc: 95, symbols: 6 },
      "ctx.py": { id: "file-009", loc: 180, symbols: 11 },
      "helpers.py": { id: "file-010", loc: 240, symbols: 19 },
      "sessions.py": { id: "file-011", loc: 135, symbols: 9 },
      "wrappers.py": { id: "file-005", loc: 190, symbols: 14 },
      "testing.py": { id: "file-012", loc: 110, symbols: 7 },
      "json": {
        "__init__.py": { id: "file-013", loc: 30, symbols: 3 },
        "provider.py": { id: "file-014", loc: 55, symbols: 4 },
        "tag.py": { id: "file-015", loc: 45, symbols: 5 },
      },
    },
  },
  "tests": {
    "test_app.py": { id: "file-020", loc: 320, symbols: 22 },
    "test_blueprints.py": { id: "file-021", loc: 180, symbols: 12 },
    "test_helpers.py": { id: "file-022", loc: 150, symbols: 10 },
    "conftest.py": { id: "file-023", loc: 85, symbols: 6 },
  },
};

export const MOCK_FILES_FLAT = [
  { id: "file-001", path: "src/flask/__init__.py", language: "python", loc: 45, symbols: 12 },
  { id: "file-002", path: "src/flask/app.py", language: "python", loc: 580, symbols: 28 },
  { id: "file-005", path: "src/flask/wrappers.py", language: "python", loc: 190, symbols: 14 },
  { id: "file-006", path: "src/flask/blueprints.py", language: "python", loc: 210, symbols: 15 },
  { id: "file-007", path: "src/flask/cli.py", language: "python", loc: 165, symbols: 8 },
  { id: "file-008", path: "src/flask/config.py", language: "python", loc: 95, symbols: 6 },
  { id: "file-009", path: "src/flask/ctx.py", language: "python", loc: 180, symbols: 11 },
  { id: "file-010", path: "src/flask/helpers.py", language: "python", loc: 240, symbols: 19 },
  { id: "file-011", path: "src/flask/sessions.py", language: "python", loc: 135, symbols: 9 },
  { id: "file-012", path: "src/flask/testing.py", language: "python", loc: 110, symbols: 7 },
  { id: "file-013", path: "src/flask/json/__init__.py", language: "python", loc: 30, symbols: 3 },
  { id: "file-014", path: "src/flask/json/provider.py", language: "python", loc: 55, symbols: 4 },
  { id: "file-015", path: "src/flask/json/tag.py", language: "python", loc: 45, symbols: 5 },
  { id: "file-020", path: "tests/test_app.py", language: "python", loc: 320, symbols: 22 },
  { id: "file-021", path: "tests/test_blueprints.py", language: "python", loc: 180, symbols: 12 },
  { id: "file-022", path: "tests/test_helpers.py", language: "python", loc: 150, symbols: 10 },
  { id: "file-023", path: "tests/conftest.py", language: "python", loc: 85, symbols: 6 },
];

export const MOCK_FILE_DETAIL = {
  id: "file-002",
  repo_id: "repo-001",
  repo_name: "pallets/flask",
  path: "src/flask/app.py",
  language: "python",
  loc: 580,
  size_bytes: 14200,
  symbols: [
    {
      name: "Flask", kind: "class", start_line: 45, end_line: 520, children: [
        { name: "__init__", kind: "method", start_line: 89, end_line: 142 },
        { name: "run", kind: "method", start_line: 312, end_line: 345 },
        { name: "route", kind: "method", start_line: 200, end_line: 215 },
        { name: "add_url_rule", kind: "method", start_line: 216, end_line: 250 },
        { name: "before_request", kind: "method", start_line: 260, end_line: 275 },
      ]
    },
    { name: "create_app", kind: "function", start_line: 525, end_line: 580, children: [] },
  ],
  imports: [
    { target_path: "src/flask/config.py", target_id: "file-008" },
    { target_path: "src/flask/ctx.py", target_id: "file-009" },
    { target_path: "src/flask/helpers.py", target_id: "file-010" },
    { target_path: "src/flask/wrappers.py", target_id: "file-005" },
  ],
  imported_by: [
    { source_path: "src/flask/__init__.py", source_id: "file-001" },
    { source_path: "src/flask/blueprints.py", source_id: "file-006" },
    { source_path: "src/flask/testing.py", source_id: "file-012" },
  ],
  co_changed: [
    { file_path: "src/flask/wrappers.py", file_id: "file-005", weight: 12 },
    { file_path: "src/flask/sessions.py", file_id: "file-011", weight: 8 },
    { file_path: "src/flask/ctx.py", file_id: "file-009", weight: 5 },
  ],
  recent_commits: [
    { sha: "abc123f", message: "Fix route decorator edge case", author: "@david", ago: "3d ago", additions: 12, deletions: 5 },
    { sha: "def456a", message: "Add async view support", author: "@sarah", ago: "1w ago", additions: 45, deletions: 8 },
    { sha: "789ghib", message: "Refactor app initialization", author: "@david", ago: "2w ago", additions: 30, deletions: 22 },
    { sha: "aaa111b", message: "Update error handling in route", author: "@mike", ago: "3w ago", additions: 8, deletions: 3 },
    { sha: "bbb222c", message: "Add before_request hooks", author: "@david", ago: "1mo ago", additions: 55, deletions: 0 },
  ],
  top_authors: [
    { name: "david", commits: 42 },
    { name: "sarah", commits: 18 },
    { name: "mike", commits: 7 },
  ],
};

export const MOCK_EXPLANATION = {
  question: "Why does app.py always change together with wrappers.py?",
  answer: "Based on the repository evidence, app.py and wrappers.py are tightly coupled because the Flask class (app.py:45-520) directly references Request and Response types defined in wrappers.py.\n\nThe import edge from app.py to wrappers.py confirms a direct dependency. Additionally, 12 shared commits (co-change edge, weight=12) show these files are consistently modified together.\n\nCommits abc123f and def456a demonstrate that changes to request handling in wrappers.py require corresponding updates to the Flask application class. This is expected coupling — the Flask class is the primary consumer of the request/response wrappers.",
  citations: [
    { type: "file", path: "src/flask/app.py", id: "file-002" },
    { type: "file", path: "src/flask/wrappers.py", id: "file-005" },
    { type: "commit", sha: "abc123f", message: "Fix route decorator edge case" },
    { type: "commit", sha: "def456a", message: "Add async view support" },
  ],
  context_summary: { files_matched: 2, edges_included: 5, commits_included: 8 },
  cache_status: "miss",
  model_used: "ollama/llama3",
};
