/**
 * Cloudinary delivery transformations.
 *
 * Images are stored at whatever size the admin uploaded — often a full-size phone
 * photo — and were previously served at full size to every device. Cloudinary
 * resizes and re-encodes on delivery, so asking for the size we actually paint
 * costs nothing extra and is cached at its edge from then on.
 *
 *   f_auto  → WebP/AVIF where the browser supports it, JPEG where it does not
 *   q_auto  → per-image quality chosen by Cloudinary's own analysis
 *   w_<n>   → capped width; c_limit never upscales a smaller original
 *
 * Any non-Cloudinary URL (a blob: preview, a data: URI, an empty value) is
 * handed back untouched, so this is always safe to wrap around a src.
 */
const UPLOAD_MARKER = "/upload/";

export const cloudinaryUrl = (url, { width, quality = "auto" } = {}) => {
  if (typeof url !== "string" || !url.includes("res.cloudinary.com")) return url;

  const [prefix, rest] = url.split(UPLOAD_MARKER);
  if (!rest) return url;

  // Already transformed (a leading segment like `w_400,c_limit`) — leave it be
  // rather than stacking a second set of instructions on top.
  if (/^[a-z]{1,2}_[^/]*\//.test(rest)) return url;

  const parts = ["f_auto", `q_${quality}`];
  if (width) parts.push(`w_${width}`, "c_limit");

  return `${prefix}${UPLOAD_MARKER}${parts.join(",")}/${rest}`;
};

/**
 * `srcset` for a responsive image, so a phone downloads the phone-sized file.
 * Pair it with a `sizes` attribute describing the painted width.
 */
export const cloudinarySrcSet = (url, widths = [400, 800, 1200, 1600]) => {
  if (typeof url !== "string" || !url.includes("res.cloudinary.com")) return undefined;
  return widths.map((w) => `${cloudinaryUrl(url, { width: w })} ${w}w`).join(", ");
};
