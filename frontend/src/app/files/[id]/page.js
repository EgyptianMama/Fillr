import Link from 'next/link';
import { MOCK_FILE_DETAIL } from '@/lib/mockData';

export default async function FileDetail({ params }) {
  const { id } = await params;
  const file = MOCK_FILE_DETAIL; // In reality, fetch by id

  return (
    <>
      <div className="breadcrumbs">
        <Link href="/">Home</Link><span className="sep">›</span>
        <Link href={`/repos/${file.repo_id}`}>{file.repo_name}</Link><span className="sep">›</span>
        <Link href={`/repos/${file.repo_id}/files`}>Files</Link><span className="sep">›</span>
        {file.path}
      </div>

      <div className="flex-between mb-lg">
        <div>
          <h1 className="page-title" style={{ fontSize: '16px' }}>📄 {file.path}</h1>
          <p className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
            {file.language} · {file.loc} lines · {(file.size_bytes / 1024).toFixed(1)} KB
          </p>
        </div>
        <Link href={`/repos/${file.repo_id}/ask`} className="btn btn--primary btn--small">
          Ask ❓
        </Link>
      </div>

      <div className="grid-2">
        {/* Symbols */}
        <div className="retro-window">
          <div className="retro-window__titlebar">
            <span className="retro-window__title">Symbols ({file.symbols.length})</span>
            <span className="retro-window__buttons">
              <span className="retro-window__btn"></span>
              <span className="retro-window__btn"></span>
              <span className="retro-window__btn"></span>
            </span>
          </div>
          <div className="retro-window__body">
            {file.symbols.length > 0 ? (
              <ul className="symbol-list">
                {file.symbols.map((sym, idx) => (
                  <div key={idx}>
                    <li className="symbol-item">
                      <span className="symbol-icon">🏷️</span>
                      <span className="symbol-name">{sym.name}</span>
                      <span className="badge badge--teal">{sym.kind}</span>
                      <span className="symbol-lines">lines {sym.start_line}-{sym.end_line}</span>
                    </li>
                    {sym.children && sym.children.map((child, cIdx) => (
                      <li key={`child-${cIdx}`} className="symbol-item symbol-item--nested">
                        <span className="symbol-icon">↳</span>
                        <span className="symbol-name">{child.name}</span>
                        <span className="badge badge--teal">{child.kind}</span>
                        <span className="symbol-lines">lines {child.start_line}-{child.end_line}</span>
                      </li>
                    ))}
                  </div>
                ))}
              </ul>
            ) : (
              <div className="empty-state">
                <div className="empty-state__text">No symbols found</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          {/* Imports */}
          <div className="retro-window">
            <div className="retro-window__titlebar">
              <span className="retro-window__title">Imports (→ outgoing)</span>
            </div>
            <div className="retro-window__body">
              {file.imports.length > 0 ? (
                <ul className="edge-list">
                  {file.imports.map((edge, idx) => (
                    <li key={idx} className="edge-item">
                      <Link href={`/files/${edge.target_id}`}>📄 {edge.target_path}</Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-muted" style={{ fontSize: '11px', textAlign: 'center' }}>No recognized local imports</div>
              )}
            </div>
          </div>

          {/* Imported By */}
          <div className="retro-window">
            <div className="retro-window__titlebar">
              <span className="retro-window__title">Imported By (← incoming)</span>
            </div>
            <div className="retro-window__body">
              {file.imported_by.length > 0 ? (
                <ul className="edge-list">
                  {file.imported_by.map((edge, idx) => (
                    <li key={idx} className="edge-item">
                      <Link href={`/files/${edge.source_id}`}>📄 {edge.source_path}</Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-muted" style={{ fontSize: '11px', textAlign: 'center' }}>Not imported by any local files</div>
              )}
            </div>
          </div>

          {/* Co-Changed */}
          <div className="retro-window">
            <div className="retro-window__titlebar">
              <span className="retro-window__title">Co-Changed Files</span>
            </div>
            <div className="retro-window__body">
              {file.co_changed.length > 0 ? (
                <ul className="edge-list">
                  {file.co_changed.map((edge, idx) => (
                    <li key={idx} className="edge-item">
                      <Link href={`/files/${edge.file_id}`}>📄 {edge.file_path}</Link>
                      <span className="edge-weight">×{edge.weight} commits</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-muted" style={{ fontSize: '11px', textAlign: 'center' }}>No significant co-change history</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2 mt-lg">
        {/* Commits */}
        <div className="retro-window">
          <div className="retro-window__titlebar">
            <span className="retro-window__title">Recent Commits</span>
          </div>
          <div className="retro-window__body">
            {file.recent_commits.length > 0 ? (
              <ul className="commit-list">
                {file.recent_commits.map((commit, idx) => (
                  <li key={idx} className="commit-item">
                    <span className="commit-sha">{commit.sha.substring(0, 7)}</span>
                    <span className="commit-message" title={commit.message}>{commit.message}</span>
                    <span className="commit-meta">{commit.author} · {commit.ago}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-muted" style={{ fontSize: '11px', textAlign: 'center' }}>No commit history</div>
            )}
          </div>
        </div>

        {/* Authors */}
        <div className="retro-window">
          <div className="retro-window__titlebar">
            <span className="retro-window__title">Top Authors</span>
          </div>
          <div className="retro-window__body">
            {file.top_authors.length > 0 ? (
              <ul className="edge-list">
                {file.top_authors.map((author, idx) => (
                  <li key={idx} className="edge-item">
                    <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>@{author.name}</span>
                    <span className="edge-weight">{author.commits} commits</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-muted" style={{ fontSize: '11px', textAlign: 'center' }}>No author data</div>
            )}
          </div>
        </div>
      </div>

      {/* Inline Ask Panel */}
      <div className="answer-panel mt-xl">
        <div className="section-header">
          <span style={{ fontSize: '12px' }}>❓</span>
          <span>Ask about {file.path}</span>
        </div>
        <form action={`/repos/${file.repo_id}/ask`} method="GET">
          <div className="form-group">
            <textarea
              name="q"
              className="form-input"
              placeholder="e.g. What does the run method do in this file?"
            ></textarea>
          </div>
          <button type="submit" className="btn btn--primary">Ask RepoLens</button>
        </form>
      </div>
    </>
  );
}
