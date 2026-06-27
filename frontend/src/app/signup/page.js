'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '@/lib/auth';

export default function SignUpPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (username.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }

    setLoading(true);
    try {
      await register(email, username, password);
      window.dispatchEvent(new Event('auth-change'));
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordTooShort = password && password.length < 6;

  return (
    <div className="auth-page">
      <div className="retro-window auth-window">
        <div className="retro-window__titlebar">
          <span className="retro-window__title">Create Account</span>
          <span className="retro-window__buttons">
            <span className="retro-window__btn"></span>
            <span className="retro-window__btn"></span>
            <span className="retro-window__btn"></span>
          </span>
        </div>
        <div className="retro-window__body">
          <div className="auth-header">
            <div className="auth-icon">🚀</div>
            <p className="auth-description">Join the mission. Analyze repositories.</p>
          </div>

          {error && (
            <div className="auth-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="signup-username">Username</label>
              <input
                type="text"
                id="signup-username"
                className="form-input"
                placeholder="commander_keen"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={2}
                maxLength={64}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-email">Email</label>
              <input
                type="email"
                id="signup-email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-password">Password</label>
              <input
                type="password"
                id="signup-password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              {passwordTooShort && (
                <p className="form-hint text-error">Must be at least 6 characters</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-confirm">Confirm Password</label>
              <input
                type="password"
                id="signup-confirm"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword && !passwordsMatch && (
                <p className="form-hint text-error">Passwords do not match</p>
              )}
              {passwordsMatch && (
                <p className="form-hint" style={{ color: 'var(--color-success)' }}>✓ Passwords match</p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn--primary auth-submit"
              disabled={loading}
            >
              {loading ? '⏳ Creating account...' : '→ Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            <span className="text-muted">Already have an account?</span>{' '}
            <Link href="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
