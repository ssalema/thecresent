import axios from 'axios';
import { clearToken, getToken, setToken } from './auth';

/**
 * The one HTTP client the admin panel uses.
 *
 * Every page used to declare its own `API_BASE`, read the token itself and
 * hand-build `{ headers: { Authorization } }` on each call. Both jobs live here
 * now: import this and call `api.get('/projects')`.
 */
/**
 * Where the API lives.
 *
 * VITE_API_URL wins whenever it is set — that is how every deploy points the
 * app at its own API. With it unset the base is derived from the page the app
 * is served from, so a checkout moved to another host or port still reaches the
 * right server; only the API port is assumed, and VITE_API_PORT overrides it.
 */
const API_PORT = import.meta.env.VITE_API_PORT || '5000';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:${API_PORT}/api`;

const api = axios.create({
  baseURL: API_BASE,
  // Uploads are the slowest thing the panel does and they are not small.
  timeout: 60000,
  // The refresh token lives in an httpOnly cookie the browser will not attach
  // to a cross-origin request unless asked. Without this the session silently
  // ends after the access token's 15 minutes. The server must name this exact
  // origin in ADMIN_URL — a credentialed request is refused by a wildcard.
  withCredentials: true,
});

/**
 * Config for a multipart upload.
 *
 * The default 60s is generous for an API call and far too short for photos: a
 * batch of full-size camera images on a slow uplink can spend minutes on the
 * wire before the server has anything to answer with, and axios aborting
 * mid-transfer looks exactly like the connection dropping. Ten minutes is long
 * enough that a timeout means something is genuinely wrong.
 */
export const uploadConfig = {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 10 * 60 * 1000,
};

/**
 * Attach the session token to every request.
 *
 * Read per request rather than pinned at login: getToken() returns null once
 * the token has expired, so an expired session sends no header at all and gets
 * a clean 401 instead of presenting a token the server has already written off.
 */
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Renew the access token from the refresh cookie.
 *
 * Access tokens last 15 minutes; the refresh cookie lasts days. Rather than
 * throwing the admin back to the login screen every quarter hour, the panel
 * trades the cookie for a new token — the cookie is httpOnly, so this request
 * is the only way the panel can touch it, and it carries no Authorization
 * header of its own.
 *
 * Deliberately a bare axios call, not `api`: going through the instance would
 * put a failing refresh back through the interceptor below and loop.
 *
 * Single-flight. A page that fires six requests at once gets six 401s, and six
 * parallel refreshes would rotate the cookie six times — five of those tokens
 * land after the cookie has moved on. Every caller awaits the same promise.
 */
let refreshInFlight = null;

export const refreshSession = () => {
  refreshInFlight ??= axios
    .post(`${API_BASE}/auth/refresh`, null, { withCredentials: true })
    .then((res) => {
      setToken(res.data.token);
      return res.data.token;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
};

/**
 * Restore a session on page load.
 *
 * The access token is gone whenever a tab is opened fresh (sessionStorage) or
 * has simply expired, but the refresh cookie may still be good — so "no token"
 * is a question for the server, not a verdict. Resolves to true when the
 * session is live; never rejects, since the only answer callers need is whether
 * to render the panel or the login screen.
 */
export const restoreSession = async () => {
  if (getToken()) return true;
  try {
    await refreshSession();
    return true;
  } catch {
    clearToken();
    return false;
  }
};

/** Drop the refresh cookie server-side, then the access token here. */
export const endSession = async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    // The cookie may already be expired or the server unreachable. Signing out
    // locally is the part that matters and must not be blocked by either.
  }
  clearToken();
};

/**
 * A 401 means the access token has expired (or was never sent). Refresh once
 * and replay the request; only if that fails is the session really over, and
 * the admin goes to the login screen with an explanation rather than sitting on
 * a page whose every action silently fails.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const request = error?.config;
    const url = request?.url || '';

    // /auth/login and /auth/refresh answer 401 for their own reasons — a wrong
    // password, a dead cookie. Refreshing on those is pointless and, for
    // /auth/refresh, the loop this guard exists to stop.
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/refresh');

    if (status !== 401 || !request || isAuthCall || request._retried) {
      if (status === 401 && window.location.pathname !== '/login') {
        clearToken();
        window.location.replace('/login?expired=1');
      }
      return Promise.reject(error);
    }

    try {
      const token = await refreshSession();
      // One retry only. `_retried` rides along on the config that axios hands
      // back, so a request that 401s again after a successful refresh falls
      // through to the branch above instead of refreshing forever.
      request._retried = true;
      request.headers = { ...request.headers, Authorization: `Bearer ${token}` };
      return api(request);
    } catch {
      clearToken();
      if (window.location.pathname !== '/login') {
        window.location.replace('/login?expired=1');
      }
      return Promise.reject(error);
    }
  }
);

/** The message to show when a request fails, with a page-appropriate fallback. */
export const apiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error?.response?.data?.message || error?.response?.data?.error || fallback;

/**
 * True when the server answered a 4xx and said why.
 *
 * That message ("Each image must be 5 MB or smaller") is the actual reason and
 * describes something the admin can fix, so it belongs in the dialog's main text
 * rather than under a generic "check your connection" line — which is not only
 * unhelpful but wrong: the connection was fine, the request arrived and was
 * refused.
 */
export const isExplainedRequestError = (error) => {
  const status = error?.response?.status;
  if (!status || status < 400 || status >= 500) return false;
  const data = error.response.data;
  return Boolean(data?.message || data?.error);
};

/**
 * Per-field errors from a 400, keyed the way the server names them —
 * `{ 'social.facebook': 'Enter a…' }`. Null when the failure wasn't
 * field-level, so a caller can tell "fix these inputs" from "the server is down".
 */
export const apiFieldErrors = (error) => {
  const errors = error?.response?.data?.errors;
  return errors && typeof errors === 'object' ? errors : null;
};

export default api;
