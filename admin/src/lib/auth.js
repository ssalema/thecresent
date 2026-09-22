const TOKEN_KEY = 'adminToken';

/**
 * Access token storage.
 *
 * This holds the short-lived (15m) access token only. The refresh token that
 * keeps the session alive is an httpOnly cookie the browser handles on its own,
 * so it never appears here and no script — including an injected one — can read
 * it; lib/api.js trades it for a new access token whenever this one runs out.
 *
 * Deliberately knows nothing about HTTP: lib/api.js reads getToken() on every
 * request and handles 401s, so storing a token and sending one stay separate
 * concerns — and importing this file can never drag the HTTP client in with it.
 *
 * sessionStorage, not localStorage: the token is dropped when the tab closes.
 * That no longer ends the session by itself — the cookie survives, which is the
 * point of it — but it does mean a stolen token is per-tab and short-lived.
 * Script on this origin can still read it while it lasts; the 15-minute
 * lifetime is what limits that, not the choice of store.
 */
const store = window.sessionStorage;

// Tokens issued before the move to sessionStorage are still sitting in
// localStorage on every machine that has logged in, and would outlive every
// tab close from here on. Clear the old key once, at startup.
try {
  window.localStorage.removeItem(TOKEN_KEY);
} catch {
  // Storage can throw when cookies are blocked entirely; nothing to clean up.
}

// Read `exp` out of the JWT payload without pulling in a library. The signature
// is never checked here — only the server can do that. This is purely so the
// panel can tell an expired session apart from a live one before it makes a
// request that is guaranteed to 401.
const decodeExpiry = (token) => {
  try {
    const payload = String(token).split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const { exp } = JSON.parse(json);
    return typeof exp === 'number' ? exp : null;
  } catch {
    return null;
  }
};

const isTokenValid = (token) => {
  if (!token) return false;
  const exp = decodeExpiry(token);
  // Unreadable or non-expiring token: let the server be the judge.
  if (exp === null) return true;
  return exp * 1000 > Date.now();
};

// Returns the token only when it is still usable, so an expired session reads
// as logged out everywhere instead of failing at the first write.
export const getToken = () => {
  const token = store.getItem(TOKEN_KEY);
  return isTokenValid(token) ? token : null;
};

export const setToken = (token) => {
  store.setItem(TOKEN_KEY, token);
};

export const clearToken = () => {
  store.removeItem(TOKEN_KEY);
};

// True when a token is present regardless of whether it is still usable, which
// is what tells "your session ran out" apart from "you have not logged in yet".
// Callers ask through this rather than reading storage themselves, so which
// store holds the token stays a decision this file alone makes.
export const hasStoredToken = () => Boolean(store.getItem(TOKEN_KEY));
