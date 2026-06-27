'use client';

import Link from 'next/link';
import { useSearchParams, useParams } from 'next/navigation';
import { MOCK_REPOS, MOCK_EXPLANATION } from '@/lib/mockData';

export default function AskPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  
  const repoId = params.id;
  const repo = MOCK_REPOS.find(r => r.id === repoId) || MOCK_REPOS[0];
  
  // Show mock explanation if a query was submitted
  const explanation = q ? MOCK_EXPLANATION : null;

  return (
    <>
      <div className="breadcrumbs">
        <Link href="/">Home</Link><span className="sep">›</span>
        <Link href={`/repos/${repo.id}`}>{repo.name}</Link><span className="sep">›</span>
        Ask
      </div>

      <div className="retro-window" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="retro-window__titlebar">
          <span className="retro-window__title">Ask about {repo.name}</span>
          <span className="retro-window__buttons">
            <span className="retro-window__btn"></span>
            <span className="retro-window__btn"></span>
            <span className="retro-window__btn"></span>
          </span>
        </div>
        <div className="retro-window__body">
          <form action={`/repos/${repo.id}/ask`} method="GET" id="ask-form">
            <div className="form-group">
              <textarea
                name="q"
                className="form-input"
                placeholder="e.g. How does authentication work in this repo? What files are involved?"
                defaultValue={q}
                autoFocus
              ></textarea>
            </div>
            <button type="submit" className="btn btn--primary">Ask</button>
          </form>

          {explanation && (
            <div className="answer-panel">
              <div className="context-bar">
                <span>🎯 Context Matched:</span>
                <span>📄 {explanation.context_summary.files_matched} files</span>
                <span>🔗 {explanation.context_summary.edges_included} edges</span>
                <span>📝 {explanation.context_summary.commits_included} commits</span>
              </div>

              <div className="answer-text">
                {explanation.answer.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              <div className="section-header">
                <span>📌</span>
                <span>Evidence / Citations</span>
              </div>
              <ul className="citations-list">
                {explanation.citations.map((cite, idx) => (
                  <li key={idx} className="citation-item">
                    {cite.type === 'file' ? (
                      <>
                        <Link href={`/files/${cite.id}`}>{cite.path}</Link>
                        <span className="badge badge--teal">file</span>
                      </>
                    ) : (
                      <>
                        <span className="commit-sha">{cite.sha.substring(0, 7)}</span>
                        <span>{cite.message}</span>
                        <span className="badge badge--teal">commit</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>

              <div className="answer-meta">
                <span>⚡ Cache: {explanation.cache_status}</span>
                <span>🤖 Model: {explanation.model_used}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
