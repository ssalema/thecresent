import cloudinary from "../config/cloudinary.js";
import fs from "fs";

// Remove multer's temp files. Accepts either upload.fields()'s object-of-arrays
// or upload.array()'s flat array. Safe to call twice — already-deleted files
// are ignored.
export const cleanupTempFiles = (files) => {
  if (!files) return;
  const groups = Array.isArray(files) ? [files] : Object.values(files);
  for (let group of groups) {
    for (let file of group) {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        if (err.code !== "ENOENT") console.error("Error removing temp file:", err);
      }
    }
  }
};

// Older documents were saved before we stored publicId, so fall back to parsing
// it out of the secure_url: .../upload/[transformations/][v123/]<public_id>.<ext>
const publicIdFromUrl = (url) => {
  if (typeof url !== "string") return null;

  const afterUpload = url.split("/upload/")[1];
  if (!afterUpload) return null;

  const segments = afterUpload.split("?")[0].split("/");

  // Skip a leading transformation segment (w_400,c_fill) and the version (v1234567)
  if (/^[a-z]{1,3}_[^/]+$/.test(segments[0])) segments.shift();
  if (/^v\d+$/.test(segments[0])) segments.shift();

  const publicId = segments.join("/");
  return publicId ? publicId.replace(/\.[^./]+$/, "") : null;
};

// Best-effort asset removal — never block the DB write on it.
export const destroyAsset = async (publicId, url) => {
  const id = publicId || publicIdFromUrl(url);
  if (!id) return;
  try {
    await cloudinary.uploader.destroy(id);
  } catch (err) {
    console.error(`Error deleting Cloudinary asset ${id}:`, err.message);
  }
};
