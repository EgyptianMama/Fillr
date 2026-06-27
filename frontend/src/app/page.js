'use client';

import Link from 'next/link';
import { MOCK_REPOS } from '@/lib/mockData';

export default function Home() {
  return (
    <>
      <h1 className="page-title">REPOLENS</h1>
      <p className="page-subtitle">Understand any Python repository with structure, history, and AI explanations.</p>

      <div className="grid-2">
        {/* Submit form */}
        <div className="retro-window">
          <div className="retro-window__titlebar">
            <span className="retro-window__title">Submit Repository</span>
            <span className="retro-window__buttons">
              <span className="retro-window__btn"></span>
              <span className="retro-window__btn"></span>
              <span className="retro-window__btn"></span>
            </span>
          </div>
          <div className="retro-window__body">
            <form action="/api/repos" method="POST" id="submit-form">
              <div className="form-group">
                <label className="form-label" htmlFor="repo-url">Repository URL</label>
                <input
                  type="text"
                  id="repo-url"
                  name="url"
                  className="form-input"
                  placeholder="https://github.com/user/repo"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="repo-branch">Branch (optional)</label>
                <input
                  type="text"
                  id="repo-branch"
                  name="branch"
                  className="form-input"
                  placeholder="main"
                />
                <p className="form-hint">Leave blank to use the repository's default branch.</p>
              </div>
              <button type="button" className="btn btn--primary" onClick={() => alert('Mock submit. In reality this will POST to backend.')}>Analyze</button>
            </form>
          </div>
        </div>

        {/* Recently analyzed repos */}
        <div className="retro-window">
          <div className="retro-window__titlebar">
            <span className="retro-window__title">Recently Analyzed</span>
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
                <div className="empty-state__text">No repositories yet. Submit one above!</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
