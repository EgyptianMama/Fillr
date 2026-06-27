'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Dispatch a storage event so layout picks up the change
      window.dispatchEvent(new Event('auth-change'));
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="retro-window auth-window">
        <div className="retro-window__titlebar">
          <span className="retro-window__title">Sign In</span>
          <span className="retro-window__buttons">
            <span className="retro-window__btn"></span>
            <span className="retro-window__btn"></span>
            <span className="retro-window__btn"></span>
          </span>
        </div>
        <div className="retro-window__body">
          <div className="auth-header">
            <div className="auth-icon">🔐</div>
            <p className="auth-description">Welcome back, explorer.</p>
          </div>

          {error && (
            <div className="auth-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                type="email"
                id="login-email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                type="password"
                id="login-password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="btn btn--primary auth-submit"
              disabled={loading}
            >
              {loading ? '⏳ Signing in...' : '→ Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            <span className="text-muted">No account yet?</span>{' '}
            <Link href="/signup">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
