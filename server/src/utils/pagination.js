/**
 * Paging for the admin list endpoints.
 *
 * Both admin lists used to return their whole collection and let the browser
 * filter, sort and slice it. That works at a hundred rows and quietly stops
 * working somewhere past ten thousand: contacts and donations grow with traffic
 * rather than with admin effort, so nothing about them is self-limiting. Every
 * such read is now bounded here.
 *
 * The public endpoints deliberately do NOT use this — see the note in
 * docs/ARCHITECTURE.md. Projects and galleries only grow when an admin uploads
 * something, so they stay small enough to send whole, and the website needs the
 * full set to build its category tabs in one request.
 */

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

/**
 * Read `page` / `limit` off a validated query.
 *
 * `limit` is clamped rather than rejected: a caller asking for 5000 rows wants
 * as many as it can get, and the cap is the answer to that — not a 400.
 */
export const pageParams = ({ page, limit } = {}) => {
  const safePage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  const requested = Number.isFinite(limit) && limit >= 1 ? Math.floor(limit) : DEFAULT_LIMIT;
  const safeLimit = Math.min(requested, MAX_LIMIT);

  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
};

/**
 * The response envelope every paginated endpoint returns.
 *
 * `total` is the count *after* filtering, which is what the pager and the
 * "N of M" line need. `extra` carries per-endpoint aggregates — the donation
 * list adds the summed amount, which cannot be computed from one page.
 */
export const paginated = ({ items, page, limit, total }, extra = {}) => ({
  items,
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
  hasMore: page * limit < total,
  ...extra,
});

/**
 * Escape a user's search term for use inside a RegExp.
 *
 * Without this a search for "a+b" is a syntax error and ".*" is a full scan
 * dressed up as a query — the term is typed by a person, not written as a
 * pattern, so every character in it is a literal.
 */
const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * A case-insensitive "contains" match across several fields.
 *
 * Returns undefined for a blank term so it can be spread into a filter object
 * without leaving an empty `$or` behind (which matches nothing).
 *
 * Note the cost: a leading-wildcard regex cannot use an index, so this scans
 * the documents the other filters have already narrowed to. That is the right
 * trade for an admin-only search over a filtered range — a text index would be
 * index-backed but would stop matching partial words, which is what the box is
 * actually used for.
 */
export const searchFilter = (term, fields) => {
  const trimmed = String(term ?? "").trim();
  if (!trimmed) return undefined;

  const pattern = new RegExp(escapeRegex(trimmed), "i");
  return { $or: fields.map((field) => ({ [field]: pattern })) };
};

/**
 * A `createdAt` range from validated Date objects, or undefined when both ends
 * are open. Either end may be omitted for an open-ended range.
 */
export const dateRangeFilter = (from, to) => {
  const range = {};
  if (from) range.$gte = from;
  if (to) range.$lte = to;
  return Object.keys(range).length ? { createdAt: range } : undefined;
};

/** Drop the undefined entries a filter builder leaves behind. */
export const compactFilter = (...parts) =>
  Object.assign({}, ...parts.filter(Boolean));
