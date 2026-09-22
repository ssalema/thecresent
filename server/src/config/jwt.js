import jwt from "jsonwebtoken";

/**
 * Token issuing and verification for the admin session.
 *
 * Two tokens, two secrets, two lifetimes:
 *
 *   access  — short (JWT_ACCESS_EXPIRES, 15m). Sent as a Bearer header on every
 *             request and held in the panel's sessionStorage, where any script
 *             on the origin can read it. Its whole defence is being short-lived.
 *   refresh — long (JWT_REFRESH_EXPIRES, 7d). Never touches JavaScript: it
 *             travels as an httpOnly cookie scoped to /api/auth, so it is only
 *             ever sent to the two endpoints that consume it, and is exchanged
 *             for a fresh access token when the old one runs out.
 *
 * The secrets are deliberately separate. Sharing one would let an access token
 * be replayed at /auth/refresh — the very thing the split is there to prevent —
 * so `typ` is stamped on each token and checked on verify as a second lock: a
 * token of the wrong kind is rejected even if the secrets were ever made equal.
 */

// JWT_SECRET is the name this project used before the split. Reading it as a
// fallback keeps an already-deployed server signing valid tokens through the
// changeover instead of 500ing on every login the moment it is redeployed.
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "";

const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "7d";

// HS256 everywhere, pinned on both sides. Without `algorithms` on verify, a
// token whose header says {"alg":"none"} is handed to the verifier to
// interpret, which is the classic JWT confusion attack.
const ALGORITHM = "HS256";

/**
 * Whether the process can issue sessions at all.
 *
 * Checked at startup (a loud warning) and again in the login handler, which
 * answers 500 rather than minting tokens signed with an empty string — an
 * unset secret is not a weak secret, it is no signature at all.
 */
export const jwtConfigError = () => {
  if (!ACCESS_SECRET) return "JWT_ACCESS_SECRET is not set";
  if (!REFRESH_SECRET) return "JWT_REFRESH_SECRET is not set";
  if (ACCESS_SECRET === REFRESH_SECRET)
    return "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different";
  return null;
};

export const signAccessToken = (payload) =>
  jwt.sign({ ...payload, typ: "access" }, ACCESS_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: ACCESS_EXPIRES,
  });

export const signRefreshToken = (payload) =>
  jwt.sign({ ...payload, typ: "refresh" }, REFRESH_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: REFRESH_EXPIRES,
  });

const verify = (token, secret, expectedType) => {
  const decoded = jwt.verify(token, secret, { algorithms: [ALGORITHM] });
  // Tokens minted before `typ` existed carry none; treat a missing one as the
  // kind whose secret just validated it rather than locking out a live session.
  if (decoded.typ && decoded.typ !== expectedType) {
    throw new Error(`Expected a ${expectedType} token`);
  }
  return decoded;
};

export const verifyAccessToken = (token) => verify(token, ACCESS_SECRET, "access");
export const verifyRefreshToken = (token) => verify(token, REFRESH_SECRET, "refresh");

/**
 * Cookie options for the refresh token.
 *
 * httpOnly     — unreadable from JavaScript, so an XSS on the panel cannot walk
 *                away with a seven-day session.
 * path         — only sent to /api/auth/refresh and /api/auth/logout. Nothing
 *                else has any use for it.
 * sameSite     — in production the panel and the API are usually on different
 *                registrable domains (a Vercel front-end, a Render API), and a
 *                cross-site cookie needs None, which browsers only accept with
 *                Secure. In development both sides are localhost — same site,
 *                different ports — so Lax works and does not require TLS.
 * maxAge       — matches JWT_REFRESH_EXPIRES so the cookie and the token it
 *                carries expire together instead of the browser keeping a dead
 *                token around to send.
 */
const DAY = 24 * 60 * 60 * 1000;

// "7d" / "12h" / "30m" / "3600" (seconds) — the subset of the jsonwebtoken
// syntax worth supporting here. Anything unrecognised falls back to 7 days,
// which only affects when the browser drops the cookie: the token's own `exp`
// is still what decides whether a session is live.
const durationToMs = (value) => {
  const match = /^(\d+)\s*([smhd])?$/.exec(String(value).trim());
  if (!match) return 7 * DAY;
  const amount = Number(match[1]);
  const unit = match[2] || "s";
  const scale = { s: 1000, m: 60000, h: 3600000, d: DAY };
  return amount * scale[unit];
};

export const REFRESH_COOKIE = "adminRefreshToken";

const baseCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/api/auth",
  };
};

export const refreshCookieOptions = () => ({
  ...baseCookieOptions(),
  maxAge: durationToMs(REFRESH_EXPIRES),
});

/**
 * The same cookie without maxAge, for res.clearCookie.
 *
 * A browser matches httpOnly/path/sameSite before it will drop a cookie, so
 * those must be identical — but maxAge must not be passed: express sets its own
 * expiry-in-the-past to delete the cookie and a maxAge here overrides it, so
 * the "cleared" cookie is quietly re-set with a fresh seven-day life instead.
 */
export const clearCookieOptions = baseCookieOptions;
