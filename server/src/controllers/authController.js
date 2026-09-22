import crypto from "crypto";
import bcrypt from "bcryptjs";
import {
  REFRESH_COOKIE,
  clearCookieOptions,
  jwtConfigError,
  refreshCookieOptions,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../config/jwt.js";

/**
 * Admin login.
 *
 * The password is compared against ADMIN_PASSWORD_HASH, a bcrypt hash generated
 * with `npm run hash-password`. ADMIN_PASSWORD (plaintext) is still honoured so
 * an existing deployment keeps working through the changeover, but it logs a
 * warning on every start — anyone who can read the environment (a Render
 * dashboard viewer, a leaked backup, a crashed-process dump) can read that
 * password verbatim, and it is likely reused elsewhere.
 */
const PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";
const LEGACY_PASSWORD = process.env.ADMIN_PASSWORD || "";

if (!PASSWORD_HASH && LEGACY_PASSWORD) {
  console.warn(
    "⚠️  ADMIN_PASSWORD_HASH is not set — falling back to the plaintext " +
      "ADMIN_PASSWORD. Run `npm run hash-password` and replace it."
  );
}

// A plain === leaks the length of the matching prefix through its timing.
const safeEquals = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

const passwordMatches = async (password) => {
  if (PASSWORD_HASH) return bcrypt.compare(password, PASSWORD_HASH);
  if (LEGACY_PASSWORD) return safeEquals(password, LEGACY_PASSWORD);
  return false;
};

/**
 * Read one cookie off the request.
 *
 * Hand-rolled rather than mounting cookie-parser: this is the only cookie the
 * API ever reads, and a dependency that parses every cookie on every request
 * for its sake would be all cost. Values are URL-encoded on the way out by
 * res.cookie, so decode on the way back in.
 */
const readCookie = (req, name) => {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(index + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
};

// The access token goes back in the body for the panel to hold and attach as a
// Bearer header; the refresh token only ever leaves as an httpOnly cookie, so
// it never passes through JavaScript on either side.
const issueSession = (res, username) => {
  const claims = { username, role: "admin" };
  res.cookie(REFRESH_COOKIE, signRefreshToken(claims), refreshCookieOptions());
  return signAccessToken(claims);
};

export const loginAdmin = async (req, res) => {
  try {
    // Required, length-capped and (for the password) untrimmed by the route's
    // schema — see validation/schemas.js.
    const { username, password } = req.validated.body;

    const configError = jwtConfigError();
    if (configError) {
      console.error(`${configError} — refusing to issue tokens`);
      return res.status(500).json({ message: "Server is not configured for login" });
    }

    if (!PASSWORD_HASH && !LEGACY_PASSWORD) {
      console.error("Neither ADMIN_PASSWORD_HASH nor ADMIN_PASSWORD is set");
      return res.status(500).json({ message: "Server is not configured for login" });
    }

    const userOk = safeEquals(username, process.env.ADMIN_USERNAME || "");
    const passOk = await passwordMatches(password);

    // Both checks always run, so a wrong username and a wrong password take
    // the same time and cannot be told apart from the outside.
    if (!userOk || !passOk) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({ token: issueSession(res, username) });
  } catch (err) {
    console.error("Login failed:", err);
    res.status(500).json({ message: "Unable to sign in right now" });
  }
};

/**
 * Exchange the refresh cookie for a new access token.
 *
 * This is what makes a 15-minute access token workable: the panel calls it when
 * a request comes back 401, and on load when its stored token has already
 * expired, so an admin stays signed in for the refresh token's lifetime without
 * the long-lived credential ever being reachable by script.
 *
 * The refresh token is rotated on each use — the reply carries a fresh cookie
 * with a full lifetime, so an active session never hits the 7-day wall mid-work.
 *
 * There is no server-side token store, so a refresh token cannot be revoked
 * before it expires; logging out clears the cookie from that browser, which for
 * a single-admin panel is the honest limit of what this design buys. Changing
 * ADMIN_USERNAME invalidates every outstanding session, since the username is
 * re-checked below on every refresh.
 */
export const refreshSession = (req, res) => {
  const token = readCookie(req, REFRESH_COOKIE);
  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  const configError = jwtConfigError();
  if (configError) {
    console.error(`${configError} — refusing to issue tokens`);
    return res.status(500).json({ message: "Server is not configured for login" });
  }

  try {
    const { username } = verifyRefreshToken(token);

    // The credentials may have changed since this token was issued; a session
    // must not outlive the account it was opened with.
    if (!safeEquals(username || "", process.env.ADMIN_USERNAME || "")) {
      res.clearCookie(REFRESH_COOKIE, clearCookieOptions());
      return res.status(401).json({ message: "Not authorized" });
    }

    res.json({ token: issueSession(res, username) });
  } catch {
    // Expired, tampered with, or an access token presented in its place.
    res.clearCookie(REFRESH_COOKIE, clearCookieOptions());
    res.status(401).json({ message: "Session expired" });
  }
};

/**
 * End the session.
 *
 * Unauthenticated on purpose: the point is to drop the cookie, and refusing
 * because the access token has already expired would strand the very session
 * most in need of clearing. Clearing a cookie that is not there is a no-op.
 */
export const logoutAdmin = (req, res) => {
  // Same attributes as when it was set, minus maxAge — a browser matches path
  // and sameSite before it will drop a cookie, and a maxAge would override the
  // past expiry express uses to delete it, re-setting the cookie instead.
  res.clearCookie(REFRESH_COOKIE, clearCookieOptions());
  res.status(204).end();
};
