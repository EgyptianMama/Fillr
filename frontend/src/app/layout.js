'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getUser, logout as doLogout } from '@/lib/auth';
import './globals.css';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Apply theme from local storage or default to dark
    const storedTheme = localStorage.getItem('repolens-theme');
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.setAttribute('data-theme', storedTheme);
    } else {
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      const initialTheme = prefersLight ? 'light' : 'dark';
      setTheme(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
    }
  }, []);

  // Load auth state and listen for changes
  useEffect(() => {
    const loadUser = () => setUser(getUser());
    loadUser();

    window.addEventListener('auth-change', loadUser);
    window.addEventListener('storage', loadUser);
    return () => {
      window.removeEventListener('auth-change', loadUser);
      window.removeEventListener('storage', loadUser);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('repolens-theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleLogout = () => {
    doLogout();
    setUser(null);
    window.dispatchEvent(new Event('auth-change'));
    router.push('/');
  };

  return (
    <html lang="en" data-theme={theme}>
      <head>
        <title>RepoLens</title>
        <meta name="description" content="Understand any Python repository with structure, history, and AI explanations." />
      </head>
      <body>
        <div className="stars"></div>
        <div className="page-wrapper">
          <header className="site-header">
            <div className="container">
              <Link href="/" className="site-logo">REPOLENS</Link>
              <nav className="site-nav">
                <Link href="/" className={pathname === '/' ? 'active' : ''}>Home</Link>
                <Link href="/repos" className={pathname === '/repos' ? 'active' : ''}>Repos</Link>

                {user ? (
                  <div className="user-menu">
                    <span className="user-menu__greeting">
                      👾 <span className="user-menu__name">{user.username}</span>
                    </span>
                    <button className="btn btn--small btn--secondary" onClick={handleLogout}>
                      Log out
                    </button>
                  </div>
                ) : (
                  <Link href="/login" className={pathname === '/login' || pathname === '/signup' ? 'active' : ''}>
                    Sign In
                  </Link>
                )}

                <button 
                  className="theme-toggle" 
                  onClick={toggleTheme} 
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? '☀' : '☾'}
                </button>
              </nav>
            </div>
          </header>
          <main className="main-content">
            <div className="container">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
