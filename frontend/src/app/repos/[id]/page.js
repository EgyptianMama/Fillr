import Link from 'next/link';
import { MOCK_REPOS } from '@/lib/mockData';

export default async function RepoOverview({ params }) {
  const { id } = await params;
  const repo = MOCK_REPOS.find(r => r.id === id) || MOCK_REPOS[0];

  return (
    <>
      <div className="breadcrumbs">
        <Link href="/">Home</Link><span className="sep">›</span>
        {repo.name}
      </div>

      <div className="flex-between mb-lg">
        <div>
          <h1 className="page-title" style={{ fontSize: '18px' }}>{repo.name}</h1>
          <p className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
            {repo.default_branch} · {repo.current_commit_sha || '—'} · {repo.last_ingested_at || '—'}
          </p>
        </div>
        <Link href={`/repos/${repo.id}`} className="btn btn--secondary btn--small">
          ↻ Re-analyze
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid-4 mb-xl">
        <div className="stat-card">
          <span className="stat-value">{repo.file_count || 0}</span>
          <span className="stat-label">Files</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{repo.symbol_count || 0}</span>
          <span className="stat-label">Symbols</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{repo.edge_count || 0}</span>
          <span className="stat-label">Edges</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{repo.commit_count || 0}</span>
          <span className="stat-label">Commits</span>
        </div>
      </div>

      <div className="grid-2">
        {/* Most Connected Files */}
        <div className="retro-window">
          <div className="retro-window__titlebar">
            <span className="retro-window__title">Most Connected Files</span>
            <span className="retro-window__buttons">
              <span className="retro-window__btn"></span>
              <span className="retro-window__btn"></span>
              <span className="retro-window__btn"></span>
            </span>
          </div>
          <div className="retro-window__body">
            {repo.top_connected?.length > 0 ? (
              <ul className="edge-list">
                {repo.top_connected.map((f, idx) => (
                  <li key={idx} className="edge-item">
                    <span>📄</span>
                    <Link href={`/files/${f.id}`}>{f.path}</Link>
                    <span className="edge-weight">{f.incoming} in · {f.outgoing} out</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">
                <div className="empty-state__text">No data yet</div>
              </div>
            )}
          </div>
        </div>

        {/* Suspicious Coupling */}
        <div className="retro-window">
          <div className="retro-window__titlebar">
            <span className="retro-window__title">Suspicious Coupling</span>
            <span className="retro-window__buttons">
              <span className="retro-window__btn"></span>
              <span className="retro-window__btn"></span>
              <span className="retro-window__btn"></span>
            </span>
          </div>
          <div className="retro-window__body">
            {repo.suspicious_coupling?.length > 0 ? (
              repo.suspicious_coupling.map((pair, idx) => (
                <div key={idx} className="warning-block">
                  <span>⚠️</span>
                  <div>
                    <strong>{pair.file_a}</strong> ↔ <strong>{pair.file_b}</strong><br />
                    <span className="text-muted" style={{ fontSize: '11px' }}>
                      Changed together {pair.shared_commits} times but don't import each other
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state__text">No suspicious coupling detected</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warnings */}
      {repo.parse_error_count > 0 && (
        <div className="mt-lg">
          <div className="warning-block">
            <span>⚠</span>
            <span>{repo.parse_error_count} files had parse errors during ingestion.</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-gap-md mt-xl">
        <Link href={`/repos/${repo.id}/files`} className="btn btn--primary">Browse Files</Link>
        <Link href={`/repos/${repo.id}/ask`} className="btn btn--secondary">Ask a Question</Link>
      </div>
    </>
  );
}
