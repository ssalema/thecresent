import crypto from "crypto";

/**
 * HMAC-SHA256 signature checking, shared by the two places Razorpay asks for it.
 *
 * The checkout callback signs `<order_id>|<payment_id>` with the API secret; the
 * webhook signs the raw request body with the webhook secret. Same primitive,
 * different inputs — and getting either one subtly wrong (a plain `===`, a
 * missing length guard in front of timingSafeEqual) is the kind of mistake that
 * still passes every manual test, so it lives in one place.
 */

/**
 * Constant-time comparison of two signature strings.
 *
 * `crypto.timingSafeEqual` throws when the buffers differ in length, so the
 * length is checked first. That does leak the length — but a signature's length
 * is fixed and public (64 hex characters for SHA-256), so there is nothing there
 * to learn. What must not leak is *where* two same-length signatures diverge,
 * and that is exactly what timingSafeEqual protects.
 */
const timingSafeEqualHex = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") return false;

  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;

  return crypto.timingSafeEqual(bufA, bufB);
};

/** The hex HMAC-SHA256 of `payload` (a string or Buffer) under `secret`. */
const hmacSha256Hex = (secret, payload) =>
  crypto.createHmac("sha256", secret).update(payload).digest("hex");

/**
 * True when `signature` is the HMAC of `payload` under `secret`.
 *
 * A missing secret returns false rather than throwing: an unconfigured server
 * must reject payment callbacks, not 500 on them. Callers check for the secret
 * separately so they can log the misconfiguration — this is the backstop.
 */
export const verifySignature = ({ secret, payload, signature }) => {
  if (!secret || !signature || payload === undefined || payload === null) {
    return false;
  }
  return timingSafeEqualHex(signature, hmacSha256Hex(secret, payload));
};

/** The exact string Razorpay's checkout callback signs. */
export const checkoutPayload = (orderId, paymentId) => `${orderId}|${paymentId}`;
