import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  MAX_BRANDING_BYTES,
  createUploader,
  handleUploadErrors,
} from "../config/upload.js";
import { publicCache } from "../middleware/cacheMiddleware.js";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import { validate } from "../middleware/validate.js";
import { settingsUpdateBody } from "../validation/schemas.js";

// Same policy as every other upload route, but tighter — see config/upload.js.
// A logo and a favicon are the only files here and neither is a photograph.
// Declared once and given to both halves, so the cap that is enforced and the
// cap an admin is told about cannot drift apart.
const BRANDING_LIMITS = { maxFiles: 2, maxBytes: MAX_BRANDING_BYTES };

const handleUpload = handleUploadErrors(
  createUploader(BRANDING_LIMITS).fields([
    { name: "logo", maxCount: 1 },
    { name: "favicon", maxCount: 1 },
  ]),
  BRANDING_LIMITS
);

const router = express.Router();

// Public — the website, the admin panel and the receipt renderer all read this
// Both apps fetch this on every page load and it changes rarely.
router.get("/", publicCache({ maxAge: 300, swr: 3600 }), getSettings);

// Admin
// Validation runs after multer, since the body is multipart — a rejection
// there cleans up the temp files multer already wrote.
router.put(
  "/",
  protect,
  handleUpload,
  validate({ body: settingsUpdateBody }),
  updateSettings
);

export default router;
