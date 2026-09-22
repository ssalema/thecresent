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
  projectCreateBody,
  projectIdParams,
  projectUpdateBody,
} from "../validation/schemas.js";
import {
  getProjects,
  getProjectById,
  addProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";

// Size-capped and image-only — see config/upload.js
const upload = handleUploadErrors(
  createUploader().array("images", MAX_IMAGES_PER_REQUEST)
);

// A malformed id reads as "not found" rather than "bad request": the two are
// indistinguishable to the caller, and saying which tells an enumerator
// something. Checked before publicCache so a 404 is never sent as cacheable.
const validateId = validate({ params: projectIdParams }, { style: "notFound" });

// Bodies here are multipart, so validation runs after multer has parsed them;
// a rejection cleans up the temp files multer already wrote.
const validateBody = (body) => validate({ body }, { style: "message" });

const router = express.Router();

router.get("/", publicCache(), getProjects);

router.get("/:id", validateId, publicCache(), getProjectById);

router.post("/", protect, upload, validateBody(projectCreateBody), addProject);

router.put(
  "/:id",
  protect,
  upload,
  validateId,
  validateBody(projectUpdateBody),
  updateProject
);

router.delete("/:id", protect, validateId, deleteProject);

export default router;
