/**
 * Auth helpers — login, register, logout, token management.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('repolens-token');
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('repolens-user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveAuth(token, user) {
  localStorage.setItem('repolens-token', token);
  localStorage.setItem('repolens-user', JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem('repolens-token');
  localStorage.removeItem('repolens-user');
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Login failed');
  }

  const data = await res.json();
  saveAuth(data.token, data.user);
  return data;
}

export async function register(email, username, password) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Registration failed');
  }

  const data = await res.json();
  saveAuth(data.token, data.user);
  return data;
}

export async function fetchMe() {
  const token = getToken();
  if (!token) return null;

  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    logout();
    return null;
  }

  return res.json();
}
