/**
 * Cache headers for the public read endpoints.
 *
 * These responses change only when an admin edits something, but they are
 * fetched on every page load of the website. A short shared-cache window with
 * `stale-while-revalidate` lets a CDN or the browser answer instantly and
 * refresh in the background, so an admin edit still appears within seconds.
 *
 * Express already sends a strong ETag for JSON bodies, so a revalidation that
 * finds nothing changed costs a 304 with no body.
 */
export const publicCache = ({ maxAge = 60, swr = 300 } = {}) => (req, res, next) => {
  res.set(
    "Cache-Control",
    `public, max-age=${maxAge}, stale-while-revalidate=${swr}`
  );
  next();
};

// Admin reads are per-session and must never be stored by a shared cache.
export const noStore = (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
};
