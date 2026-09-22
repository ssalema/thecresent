import multer from "multer";
import os from "os";
import path from "path";

/**
 * One upload policy for every route that accepts files.
 *
 * Previously only the settings route enforced a size cap and a type check,
 * while the gallery and project routes accepted thirty files of any type and
 * any size. The browser-side size / image-only rule is a convenience for the
 * admin, never enforcement — this is the enforcement.
 */
const MB = 1024 * 1024;

// Photos: 5 MB. A web page never needs an image this large, but the admins
// upload straight from a phone or a camera and have no way to shrink one first;
// the cap is here to stop abuse, not to make them fight their own photos.
// Cloudinary stores the original and delivery is resized on the fly (see
// utils/cloudinary), so a heavier upload costs storage and one slow request,
// rather than page weight.
export const MAX_IMAGE_BYTES = 5 * MB;

// Branding: 2 MB. A logo and a favicon are small, deliberate files — one is
// drawn at a couple of hundred pixels and the other at 32. Nothing legitimate
// gets near this, so the tighter cap costs the admin nothing.
export const MAX_BRANDING_BYTES = 2 * MB;

export const MAX_IMAGES_PER_REQUEST = 30;

/**
 * How many images may be on their way to Cloudinary at once.
 *
 * These uploads are almost entirely waiting — one round trip per file, each
 * carrying megabytes — so running them one at a time made a thirty-image
 * project cost thirty sequential round trips. Four at a time is the useful part
 * of that curve: enough to hide the latency, not so many that a single admin's
 * upload saturates the instance's outbound bandwidth or trips Cloudinary's own
 * concurrency limits, which would turn a slow save into a failed one.
 */
export const UPLOAD_CONCURRENCY = 4;

const sizeLabel = (bytes) => `${bytes / MB} MB`;

// The formats a browser can display and Cloudinary can transform. SVG is
// deliberately absent: it is a document that can carry <script>, and it would be
// served back from our own asset host under an admin's name.
const ALLOWED_TYPES = ["jpeg", "png", "webp", "gif", "avif"];
const ALLOWED_MIME = new RegExp(`^image/(${ALLOWED_TYPES.join("|")})$`);

const TYPE_LIST = ALLOWED_TYPES.map((t) => t.toUpperCase()).join(", ");

// Temp files live outside the project directory: nothing under the server root
// is served statically any more, and the OS cleans this up if a crash leaves a
// file behind. Every upload is streamed on to Cloudinary and then unlinked by
// cleanupTempFiles(). Multer removes the files it had already written when it
// aborts a request itself, so a rejection here leaves nothing behind either.
const TEMP_DIR = path.join(os.tmpdir(), "charity-uploads");

/** A rejection the caller caused and can act on — never a 500. */
const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

const imageOnly = (req, file, cb) => {
  if (!ALLOWED_MIME.test(file.mimetype)) {
    return cb(badRequest(`Only image files (${TYPE_LIST}) are allowed`));
  }
  cb(null, true);
};

export const createUploader = ({
  maxFiles = MAX_IMAGES_PER_REQUEST,
  maxBytes = MAX_IMAGE_BYTES,
} = {}) =>
  multer({
    dest: TEMP_DIR,
    limits: {
      fileSize: maxBytes,
      files: maxFiles,
      fields: 50,
      // Guards against a body made of thousands of tiny parts, which costs
      // parsing time long before any single limit above is reached.
      parts: maxFiles + 50,
      // The length of a form field's *name* ("images", "slots"). Anything
      // longer is a crafted request, not a form the admin panel submitted.
      fieldNameSize: 200,
    },
    fileFilter: imageOnly,
  });

// Multer reports every refusal as an error code; each one is something the admin
// can fix, so each gets a sentence rather than multer's own wording. The two
// that quote a limit are filled in per route, since the caps differ.
const MULTER_MESSAGES = {
  LIMIT_UNEXPECTED_FILE: "Unexpected file field",
  LIMIT_PART_COUNT: "Too many parts in this upload",
  LIMIT_FIELD_COUNT: "Too many form fields in this upload",
  LIMIT_FIELD_KEY: "A form field name was too long",
  LIMIT_FIELD_VALUE: "A form field value was too long",
};

/**
 * Multer rejects oversized/non-image files before the controller runs, and its
 * raw error would surface as an unhelpful 500. Wrap an upload middleware so the
 * failure comes back in the same shape controllers use for validation errors.
 *
 * Anything that is *not* a refusal — a full disk, an unwritable temp directory —
 * is passed to the error handler instead, so a server fault is never reported to
 * the admin as a problem with their photos.
 *
 * Pass the same limits given to createUploader(), so the sentence an admin reads
 * quotes this route's numbers rather than the defaults.
 */
export const handleUploadErrors = (
  uploadMiddleware,
  { maxFiles = MAX_IMAGES_PER_REQUEST, maxBytes = MAX_IMAGE_BYTES } = {}
) => {
  const messages = {
    ...MULTER_MESSAGES,
    LIMIT_FILE_SIZE: `Each image must be ${sizeLabel(maxBytes)} or smaller`,
    LIMIT_FILE_COUNT: `You can upload at most ${maxFiles} ${
      maxFiles === 1 ? "image" : "images"
    } at a time`,
  };

  return (req, res, next) =>
    uploadMiddleware(req, res, (err) => {
      if (!err) return next();

      // Every MulterError is a malformed or oversized request, so all of them
      // are 400s — the table covers the ones an admin can actually hit, and the
      // rest (a body with no field name, say) keep multer's own wording.
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: messages[err.code] || err.message });
      }

      // Our own fileFilter rejection, tagged by badRequest().
      if (err.status === 400) return res.status(400).json({ message: err.message });

      next(err);
    });
};
