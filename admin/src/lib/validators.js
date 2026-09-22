// Mirrors server/src/utils/validators.js so the admin sees a problem before saving.
// The server re-checks everything — this is convenience, not enforcement.
//
// These are the format rules; lib/schemas.js wraps them in zod so each form
// reads as a description of its fields. validateImage() stays outside that:
// the branding images are files, not form values.

// Mirrors isEmail in server/src/utils/validators.js — change both together.
// The unsafe set is punctuation that never appears in an unquoted address but
// would break out of the mailto: and compose URLs an address is dropped into.
const EMAIL_URL_UNSAFE = /[&#?/\\%"<>]/;

export const isEmail = (value) => {
  const trimmed = String(value).trim();
  if (EMAIL_URL_UNSAFE.test(trimmed)) return false;
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(trimmed);
};

export const isPhone = (value) => {
  const raw = String(value).trim();
  if (!/^\+?[\d\s\-().]+$/.test(raw)) return false;
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

export const isUrl = (value) => {
  try {
    const url = new URL(String(value).trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

// Mirrors isMapEmbedUrl in server/src/utils/validators.js — change both
// together. The value ends up as the map iframe's src on the public Contact
// page, so it is held to a Google Maps embed over https rather than to any URL:
// anything else framed there renders inside the charity's own page. The server
// is the authority; this is here so the form says so before saving.
const MAP_EMBED_HOST = /^(www\.|maps\.)?google\.(com|[a-z]{2,3}(\.[a-z]{2,3})?)$/i;

export const isMapEmbedUrl = (value) => {
  try {
    const url = new URL(String(value).trim());
    return url.protocol === 'https:' && MAP_EMBED_HOST.test(url.hostname);
  } catch {
    return false;
  }
};

// Admins usually paste the whole Google Maps <iframe>; keep just the src.
export const extractMapSrc = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const match = raw.match(/src=["']([^"']+)["']/i);
  const src = match ? match[1] : raw;
  return isMapEmbedUrl(src) ? src : '';
};

// Mirrors MAX_IMAGE_BYTES / MAX_BRANDING_BYTES in server/config/upload.js —
// change both together. Photos come off a phone and get the looser cap; the
// logo and favicon are small deliberate files and keep the tighter one.
const MB = 1024 * 1024;
export const MAX_IMAGE_BYTES = 5 * MB;
export const MAX_BRANDING_BYTES = 2 * MB;

// "5 MB" / "2 MB" — one source per cap, so no message can drift from the rule.
const sizeLabel = (bytes) => `${bytes / MB} MB`;
export const MAX_IMAGE_LABEL = sizeLabel(MAX_IMAGE_BYTES);
export const MAX_BRANDING_LABEL = sizeLabel(MAX_BRANDING_BYTES);

// Mirrors ALLOWED_TYPES in server/config/upload.js. Worth keeping in step: a
// phone photo saved as HEIC looks like a perfectly good image to the picker, and
// without this the admin only learns otherwise once the upload comes back.
const ALLOWED_TYPES = ['jpeg', 'png', 'webp', 'gif', 'avif'];
const ALLOWED_MIME = new RegExp(`^image/(${ALLOWED_TYPES.join('|')})$`);

/** For an <input accept="…"> so the file picker greys the rest out. */
export const IMAGE_ACCEPT = ALLOWED_TYPES.map((t) => `image/${t}`).join(',');

// Mirrors MAX_IMAGES_PER_REQUEST in server/config/upload.js. Only files that are
// actually uploaded count towards it — images already on Cloudinary are sent as
// ids, not bytes, so an edit never re-spends the budget on them.
const MAX_IMAGES_PER_UPLOAD = 30;

/** `maxBytes` defaults to the photo cap; branding passes MAX_BRANDING_BYTES. */
export const validateImage = (file, label, maxBytes = MAX_IMAGE_BYTES) => {
  if (!file) return null;
  if (!ALLOWED_MIME.test(file.type)) {
    return `${label} must be a JPG, PNG, WebP, GIF or AVIF image`;
  }
  if (file.size > maxBytes) {
    return `${label} must be ${sizeLabel(maxBytes)} or smaller`;
  }
  return null;
};

/**
 * Split a freshly picked batch into the files that may be added and the reasons
 * the rest were turned away.
 *
 * The server rejects the same files, but only after the whole multipart body has
 * been sent — on a slow connection that is a long wait for "too big". Screening
 * at pick time means the admin hears about it while they still have the file
 * picker in mind.
 *
 * `pendingCount` is how many not-yet-uploaded files the form already holds.
 */
export const screenImages = (files, pendingCount = 0) => {
  const accepted = [];
  const problems = [];

  files.forEach((file) => {
    const problem = validateImage(file, file.name);
    if (problem) {
      problems.push(problem);
      return;
    }
    if (pendingCount + accepted.length >= MAX_IMAGES_PER_UPLOAD) {
      problems.push(
        `${file.name} — only ${MAX_IMAGES_PER_UPLOAD} images can be uploaded at a time`
      );
      return;
    }
    accepted.push(file);
  });

  return { accepted, problems };
};
