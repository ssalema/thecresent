import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Optional root folder for everything this deploy uploads, so staging and
// production can share one Cloudinary account without mixing their media.
// Unset (the default) keeps the historic layout — gallery/, projects/,
// settings/ at the account root.
const ROOT_FOLDER = (process.env.CLOUDINARY_FOLDER || "")
  .trim()
  .replace(/^\/+|\/+$/g, "");

/**
 * Folder an upload should land in: the section name, under the configured root
 * when there is one. Only ever applied at upload time — deletes go by the
 * publicId stored on the document, so assets uploaded under a different root
 * (or none) stay removable after this setting changes.
 */
export const assetFolder = (section) =>
  ROOT_FOLDER ? `${ROOT_FOLDER}/${section}` : section;

export default cloudinary;
