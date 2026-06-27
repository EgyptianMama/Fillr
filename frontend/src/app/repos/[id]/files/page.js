'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MOCK_REPOS, MOCK_FILE_TREE, MOCK_FILES_FLAT } from '@/lib/mockData';
import { useParams } from 'next/navigation';

function TreeNode({ name, node, pathPrefix = '' }) {
  const [isOpen, setIsOpen] = useState(pathPrefix === '');

  if (node.loc !== undefined) {
    // It's a file
    return (
      <li className="file-tree__file">
        <Link href={`/files/${node.id}`}>
          <span className="file-icon">📄</span>
          <span>{name}</span>
          <span className="file-tree__meta">{node.symbols} symbols</span>
        </Link>
      </li>
    );
  }

  // It's a folder
  return (
    <li className={`file-tree__folder ${isOpen ? 'open' : ''}`}>
      <div className="file-tree__folder-name" onClick={() => setIsOpen(!isOpen)}>
        <span className="folder-icon">▶</span>
        <span>📁 {name}</span>
      </div>
      <ul className="file-tree__children">
        {Object.entries(node).map(([key, value]) => (
          <TreeNode key={key} name={key} node={value} pathPrefix={`${pathPrefix}${key}/`} />
        ))}
      </ul>
    </li>
  );
}

export default function FileBrowser() {
  const params = useParams();
  const repoId = params.id;
  const repo = MOCK_REPOS.find(r => r.id === repoId) || MOCK_REPOS[0];
  
  const [search, setSearch] = useState('');

  const filteredFiles = search 
    ? MOCK_FILES_FLAT.filter(f => f.path.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <>
      <div className="breadcrumbs">
        <Link href="/">Home</Link><span className="sep">›</span>
        <Link href={`/repos/${repo.id}`}>{repo.name}</Link><span className="sep">›</span>
        Files
      </div>

      <div className="retro-window">
        <div className="retro-window__titlebar">
          <span className="retro-window__title">File Browser</span>
          <span className="retro-window__buttons">
            <span className="retro-window__btn"></span>
            <span className="retro-window__btn"></span>
            <span className="retro-window__btn"></span>
          </span>
        </div>
        <div className="retro-window__body">
          {/* Search Bar */}
          <div className="form-group mb-lg">
            <input
              type="text"
              name="search"
              className="form-input"
              placeholder="🔍 Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Tree View (Default) */}
          {!search && (
            <ul className="file-tree">
              <li className="file-tree__folder open">
                <div className="file-tree__folder-name">
                  <span className="folder-icon" style={{ transform: 'rotate(90deg)' }}>▶</span>
                  <span>📁 {repo.name}</span>
                </div>
                <ul className="file-tree__children" style={{ display: 'block' }}>
                  {Object.entries(MOCK_FILE_TREE).map(([key, value]) => (
                    <TreeNode key={key} name={key} node={value} />
                  ))}
                </ul>
              </li>
            </ul>
          )}

          {/* Flat List View (Search Results) */}
          {search && (
            filteredFiles.length > 0 ? (
              <ul className="file-list-flat">
                {filteredFiles.map(f => (
                  <li key={f.id} className="file-list-flat__item">
                    <div className="file-list-flat__path">
                      <Link href={`/files/${f.id}`}>📄 {f.path}</Link>
                    </div>
                    <div className="file-list-flat__stats">
                      <span>{f.loc} lines</span>
                      <span>{f.symbols} symbols</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">
                <div className="empty-state__icon">🔍</div>
                <div className="empty-state__text">No files found matching "{search}"</div>
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}
