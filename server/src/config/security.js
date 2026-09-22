import rateLimit from "express-rate-limit";

/**
 * CORS origin allowlist, taken straight from the environment.
 *
 * CLIENT_URL is the public site, ADMIN_URL the admin panel. Either may hold
 * several comma-separated origins (e.g. an apex plus a www host):
 *   CLIENT_URL=https://example.org,https://www.example.org
 *   ADMIN_URL=https://admin.example.org
 *
 * With both unset nothing is allowed rather than "*", so a misconfigured
 * production deploy fails closed instead of silently accepting every origin.
 */
const configuredOrigins = () =>
  [process.env.CLIENT_URL, process.env.ADMIN_URL]
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().replace(/\/+$/, ""))
    .filter(Boolean);

export const corsOptions = {
  origin: (origin, callback) => {
    // No Origin header: same-origin requests, curl, health checks, and the
    // Razorpay webhook. These are not browser cross-origin requests, so the
    // allowlist does not apply to them.
    if (!origin) return callback(null, true);

    if (configuredOrigins().includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
};

/**
 * Rate limits.
 *
 * Every limiter is keyed by IP. Render sits behind a proxy, so `trust proxy`
 * must be set on the app for the client IP (not the proxy's) to be the key.
 */

// Brute-force protection for the single admin account. Deliberately tight:
// a real admin never needs ten attempts in a quarter hour.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: "Too many login attempts. Try again in 15 minutes." },
});

// Public write endpoints (contact form). Stops database flooding by a bot.
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many messages sent from this network. Please try again later.",
  },
});

// Donation order creation writes a Donation row and calls Razorpay, so it is
// not free. Generous enough for a donor who retries a failed card.
export const donationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many payment attempts. Please try again shortly." },
});

/**
 * The Razorpay webhook.
 *
 * This endpoint is mounted ahead of `apiLimiter` because it must never drop a
 * payment confirmation, which left it as the one unthrottled route in the API:
 * anyone could point a flood at it, and every request cost an HMAC over up to
 * 100 kb plus (for a well-formed body) a database read, all before any
 * authentication could reject it.
 *
 * Two things together make throttling it safe. `skipSuccessfulRequests` means a
 * delivery Razorpay actually signed answers 2xx and is never counted, so no
 * volume of genuine webhooks — or of Razorpay's retries — accumulates against
 * this budget at all. And the key is the client IP, so the forged requests an
 * attacker sends spend their own address's budget, not the one Razorpay
 * delivers from. Only requests that fail the signature check count, and 100 of
 * those from one address in a quarter of an hour is someone probing rather than
 * a gateway talking.
 */
export const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "Too many webhook requests." },
});

// Catch-all backstop for the rest of the API.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down." },
});

// The refresh endpoint takes an httpOnly cookie rather than a password, so it
// is not brute-forceable in the way /login is — but it does mint tokens, and a
// client stuck in a refresh loop should not be able to hammer it. Successful
// refreshes are not counted: a legitimate session refreshes every 15 minutes
// all day and must never be locked out for it, while a caller who keeps failing
// is either broken or probing.
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: "Too many session refreshes. Please log in again." },
});
