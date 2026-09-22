import axios from 'axios';

/**
 * The one HTTP client the website uses.
 *
 * Every page used to declare its own `API_BASE` constant and call `axios`
 * directly, which meant the base URL was written out in eight places and any
 * cross-cutting concern — a timeout, a header, error shaping — had to be added
 * to each call site. Import this instead and pass a path: `api.get('/projects')`.
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
  // A request left hanging shows a skeleton forever; failing lets the page say so.
  timeout: 20000,
});

/**
 * The message to show a visitor when a request fails.
 *
 * The API reports problems as `message` on most routes and as `error` on the
 * donation flow, and neither is present when the request never arrived. Callers
 * pass the wording that fits the page as the fallback.
 */
export const apiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error?.response?.data?.message || error?.response?.data?.error || fallback;

/**
 * Per-field errors from a 400, keyed by field name — `{ email: 'Enter a…' }`.
 *
 * Returns null when the failure wasn't a field-level rejection, so a caller can
 * tell "fix these inputs" apart from "the server is down".
 */
export const apiFieldErrors = (error) => {
  const errors = error?.response?.data?.errors;
  return errors && typeof errors === 'object' ? errors : null;
};

export default api;
