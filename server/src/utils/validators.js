// The format rules the whole API is validated against. validation/schemas.js
// wraps these in zod so routes read as a description of their payload; the
// admin panel and the website mirror the same rules in their own schemas so a
// problem is visible before saving, but the server is the authority.

/**
 * Characters that never appear in an unquoted email address but do carry
 * meaning in a URL.
 *
 * A submitted address is interpolated into links the admin then clicks — a
 * `mailto:` in the panel, a Gmail compose URL in the inbox — so one of these
 * getting through would let a submitter append parameters of their own (a
 * subject, a body, a bcc) to a message the admin sends from the charity's
 * mailbox. Everything an address may legitimately contain is still allowed;
 * this only rules out the punctuation that would break out of a URL.
 */
const EMAIL_URL_UNSAFE = /[&#?/\\%"<>]/;

export const isEmail = (value) => {
  const trimmed = String(value).trim();
  if (EMAIL_URL_UNSAFE.test(trimmed)) return false;
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(trimmed);
};

// Accepts the shapes people actually type: "+91 8347117507", "08347117507",
// "(022) 4567-8900". Anything that leaves fewer than 7 or more than 15 digits
// is not a dialable number.
export const isPhone = (value) => {
  const raw = String(value).trim();
  if (!/^\+?[\d\s\-().]+$/.test(raw)) return false;
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
};

export const isUrl = (value, { protocols = ["http:", "https:"] } = {}) => {
  try {
    const url = new URL(String(value).trim());
    return protocols.includes(url.protocol);
  } catch {
    return false;
  }
};

/**
 * Hosts a map embed may point at: google.com and its country domains, with or
 * without the www./maps. prefix Google's own snippets carry.
 *
 * Anchored at both ends, so `google.com.example.net` and `notgoogle.com` do not
 * match. The trailing group covers `google.de`, `google.co.uk` and
 * `google.com.au`.
 */
const MAP_EMBED_HOST = /^(www\.|maps\.)?google\.(com|[a-z]{2,3}(\.[a-z]{2,3})?)$/i;

/**
 * A URL that is safe to use as the map iframe's `src`.
 *
 * This is the one settings field whose value the website drops into an
 * `<iframe src>`, which makes it the one field where "any http(s) URL" is not a
 * good enough rule: whatever is stored here renders inside the charity's own
 * page, under its own domain, and a visitor reads it as the charity's content.
 * Anything that can write settings — a hijacked admin session, a link pasted
 * from the wrong tab — could otherwise frame arbitrary attacker-controlled
 * content there, including a convincing fake donation form.
 *
 * So the field is held to what it is actually for: a Google Maps embed, over
 * TLS. https only, because the site is served over TLS and a http frame is
 * blocked as mixed content anyway — accepting one only stores a value that
 * silently fails to render.
 */
export const isMapEmbedUrl = (value) => {
  try {
    const url = new URL(String(value).trim());
    return url.protocol === "https:" && MAP_EMBED_HOST.test(url.hostname);
  } catch {
    return false;
  }
};

// Google Maps gives admins a full <iframe …> snippet. Accept either that or the
// bare src, and hand back just the URL so the frontend can drop it into src=.
export const extractMapSrc = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const match = raw.match(/src=["']([^"']+)["']/i);
  const src = match ? match[1] : raw;
  return isMapEmbedUrl(src) ? src : "";
};
