'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { MOCK_JOB } from '@/lib/mockData';

export default function JobStatus() {
  const router = useRouter();
  const params = useParams();
  const [job, setJob] = useState(MOCK_JOB);

  useEffect(() => {
    // Mock polling
    const interval = setInterval(() => {
      if (job.status === 'ready') {
        clearInterval(interval);
        setTimeout(() => {
          router.push(`/repos/${job.repo_id}`);
        }, 2000);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [job, router]);

  return (
    <>
      <div className="breadcrumbs">
        <Link href="/">Home</Link><span className="sep">›</span>
        <Link href={`/repos/${job.repo_id}`}>{job.repo_name}</Link><span className="sep">›</span>
        Job Status
      </div>

      <div className="retro-window" style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div className="retro-window__titlebar">
          <span className="retro-window__title">Analyzing Repository</span>
          <span className="retro-window__buttons">
            <span className="retro-window__btn"></span>
            <span className="retro-window__btn"></span>
            <span className="retro-window__btn"></span>
          </span>
        </div>
        <div className="retro-window__body" id="job-status-body">
          <div className="flex-between mb-lg">
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{job.repo_name}</div>
              <div className="text-muted" style={{ fontSize: '12px' }}>Branch: {job.branch}</div>
            </div>
            <span className="badge badge--active">⏳ {job.status.toUpperCase()}</span>
          </div>

          {/* Progress bar */}
          <div className="progress-bar mb-lg">
            <div className="progress-bar__fill" style={{ width: `${job.progress_percent}%` }}></div>
            <span className="progress-bar__text">{job.progress_percent}%</span>
          </div>

          {/* Stages */}
          <ul className="stage-list">
            {job.stages.map((stage, idx) => (
              <li key={idx} className={`stage-item stage-item--${stage.status}`}>
                <span className="stage-icon">
                  {stage.status === 'completed' ? '✅' :
                   stage.status === 'active' ? '🔄' : '⬚'}
                </span>
                <span className="stage-name">{stage.name}</span>
                <span className="stage-detail">{stage.detail}</span>
              </li>
            ))}
          </ul>

          <div className="flex-between mt-lg">
            <span className="text-muted" style={{ fontSize: '12px' }}>⏱️ Started {job.started_ago}</span>
            <button className="btn btn--danger btn--small">Cancel Job</button>
          </div>

          {job.status === 'ready' && (
            <div className="mt-lg" style={{ textAlign: 'center' }}>
              <Link href={`/repos/${job.repo_id}`} className="btn btn--primary">
                View Repository →
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
