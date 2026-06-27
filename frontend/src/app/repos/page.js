import Link from 'next/link';
import { MOCK_REPOS } from '@/lib/mockData';

export default function ReposList() {
  return (
    <>
      <h1 className="page-title" style={{ fontSize: '18px' }}>Repositories</h1>
      <p className="page-subtitle">All analyzed repositories.</p>

      <div className="retro-window">
        <div className="retro-window__titlebar">
          <span className="retro-window__title">Your Repositories</span>
          <span className="retro-window__buttons">
            <span className="retro-window__btn"></span>
            <span className="retro-window__btn"></span>
            <span className="retro-window__btn"></span>
          </span>
        </div>
        <div className="retro-window__body">
          {MOCK_REPOS.length > 0 ? (
            MOCK_REPOS.map((repo) => (
              <Link
                key={repo.id}
                href={
                  repo.status === 'ready' ? `/repos/${repo.id}` :
                  repo.status === 'ingesting' ? `/jobs/${repo.job_id || 'job-001'}` :
                  `/repos/${repo.id}`
                }
                className="retro-inner-card repo-card"
                style={{ display: 'flex' }}
              >
                <div className="repo-card__info">
                  <div className="repo-card__name">📦 {repo.name}</div>
                  {repo.status === 'ready' && (
                    <div className="repo-card__stats">
                      {repo.file_count || '—'} files · {repo.symbol_count || '—'} symbols · {repo.commit_count || '—'} commits
                    </div>
                  )}
                  {repo.status === 'ingesting' && (
                    <div className="repo-card__stats">Stage: {repo.stage || 'Processing'} ({repo.progress_percent || 0}%)</div>
                  )}
                  {repo.status === 'failed' && (
                    <div className="repo-card__stats text-error">{repo.error || 'Unknown error'}</div>
                  )}
                  <div className="repo-card__time">{repo.last_ingested_at || ''}</div>
                </div>
                <div>
                  {repo.status === 'ready' && <span className="badge badge--ready">✅ Ready</span>}
                  {repo.status === 'ingesting' && <span className="badge badge--active">⏳ {repo.progress_percent || 0}%</span>}
                  {repo.status === 'failed' && <span className="badge badge--failed">❌ Failed</span>}
                </div>
              </Link>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-state__icon">📭</div>
              <div className="empty-state__text">No repositories yet</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
