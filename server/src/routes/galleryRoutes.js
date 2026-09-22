import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  MAX_IMAGES_PER_REQUEST,
  createUploader,
  handleUploadErrors,
} from "../config/upload.js";
import { publicCache } from "../middleware/cacheMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  galleryCreateBody,
  galleryIdParams,
  galleryUpdateBody,
} from "../validation/schemas.js";
import {
  getGalleries,
  getGalleryById,
  addGallery,
  updateGallery,
  deleteGallery,
} from "../controllers/galleryController.js";

// Size-capped and image-only — see config/upload.js
const upload = handleUploadErrors(
  createUploader().array("images", MAX_IMAGES_PER_REQUEST)
);

// A malformed id reads as "not found" rather than "bad request". Checked before
// publicCache so a 404 is never sent as cacheable.
const validateId = validate({ params: galleryIdParams }, { style: "notFound" });

// Bodies here are multipart, so validation runs after multer has parsed them;
// a rejection cleans up the temp files multer already wrote.
const validateBody = (body) => validate({ body }, { style: "message" });

const router = express.Router();

// Public — the website gallery reads these
router.get("/", publicCache(), getGalleries);
router.get("/:id", validateId, publicCache(), getGalleryById);

// Admin
router.post("/", protect, upload, validateBody(galleryCreateBody), addGallery);
router.put(
  "/:id",
  protect,
  upload,
  validateId,
  validateBody(galleryUpdateBody),
  updateGallery
);
router.delete("/:id", protect, validateId, deleteGallery);

export default router;
