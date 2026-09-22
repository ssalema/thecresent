import Settings from "../models/Settings.js";
import cloudinary, { assetFolder } from "../config/cloudinary.js";
import { cleanupTempFiles, destroyAsset } from "../utils/cloudinaryAssets.js";
import { SEO_KEYS, SOCIAL_KEYS } from "../validation/schemas.js";

const CLOUDINARY_FOLDER = assetFolder("settings");

const isTruthyFlag = (value) => value === true || value === "true" || value === "1";

const uploadAsset = async (file) => {
  const result = await cloudinary.uploader.upload(file.path, {
    folder: CLOUDINARY_FOLDER,
  });
  return { url: result.secure_url, publicId: result.public_id };
};

/**
 * GET /api/settings — public.
 *
 * Every website page, the admin panel and the receipt renderer read from here,
 * so it must never fail closed: an empty database is upserted into a blank
 * settings document rather than a 404.
 */
export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSingleton();
    res.json(settings);
  } catch (err) {
    console.error("Error fetching settings:", err);
    res.status(500).json({ message: "Unable to load organization settings" });
  }
};

/**
 * PUT /api/settings — admin only.
 *
 * Accepts multipart/form-data with optional `logo` / `favicon` files. The
 * route's schema validates and normalizes everything before this runs — a
 * pasted Google Maps `<iframe>` arrives here as the bare src, and a rejection
 * reports per-field errors keyed the way the form reads them
 * (`social.facebook`, `seo.metaTitle`). The previous Cloudinary asset is only
 * destroyed once the replacement is safely saved.
 *
 * Every field is optional and the distinction matters: `undefined` means "the
 * admin didn't send this, leave it alone", an empty string means "clear it".
 */
export const updateSettings = async (req, res) => {
  const uploaded = [];

  try {
    const body = req.validated.body;
    const files = req.files || {};

    const {
      organizationName,
      tagline,
      contactEmail,
      contactNumber,
      whatsappNumber,
      address,
      websiteUrl,
      mapEmbedUrl: normalizedMapSrc,
      social,
      seo,
    } = body;

    const settings = await Settings.getSingleton();

    // --- Uploads ----------------------------------------------------------
    // Done before the document is touched: if Cloudinary fails, the saved
    // settings are still the previous, consistent ones.
    let nextLogo;
    let nextFavicon;
    try {
      if (files.logo?.[0]) {
        nextLogo = await uploadAsset(files.logo[0]);
        uploaded.push(nextLogo);
      } else if (isTruthyFlag(body.removeLogo)) {
        nextLogo = { url: "", publicId: "" };
      }

      if (files.favicon?.[0]) {
        nextFavicon = await uploadAsset(files.favicon[0]);
        uploaded.push(nextFavicon);
      } else if (isTruthyFlag(body.removeFavicon)) {
        nextFavicon = { url: "", publicId: "" };
      }
    } catch (err) {
      for (let asset of uploaded) await destroyAsset(asset.publicId, asset.url);
      return res.status(500).json({
        message: err?.message ? `Image upload failed: ${err.message}` : "Image upload failed",
      });
    }

    // --- Apply ------------------------------------------------------------
    if (organizationName !== undefined) settings.organizationName = organizationName;
    if (tagline !== undefined) settings.tagline = tagline;
    if (contactEmail !== undefined) settings.contactEmail = contactEmail;
    if (contactNumber !== undefined) settings.contactNumber = contactNumber;
    if (whatsappNumber !== undefined) settings.whatsappNumber = whatsappNumber;
    if (address !== undefined) settings.address = address;
    if (websiteUrl !== undefined) settings.websiteUrl = websiteUrl;
    if (normalizedMapSrc !== undefined) settings.mapEmbedUrl = normalizedMapSrc;

    if (social) {
      for (let key of SOCIAL_KEYS) {
        if (social[key] !== undefined) settings.social[key] = social[key];
      }
    }

    if (seo) {
      for (let key of SEO_KEYS) {
        if (seo[key] !== undefined) settings.seo[key] = seo[key];
      }
    }

    // Remember what the new assets replace, then swap them in.
    const stale = [];
    if (nextLogo) {
      if (settings.logo?.publicId || settings.logo?.url) stale.push(settings.logo);
      settings.logo = nextLogo;
    }
    if (nextFavicon) {
      if (settings.favicon?.publicId || settings.favicon?.url) stale.push(settings.favicon);
      settings.favicon = nextFavicon;
    }

    await settings.save();

    // Only after the document is safely saved — a failed destroy must never
    // leave the DB pointing at an image we already deleted.
    for (let asset of stale) await destroyAsset(asset.publicId, asset.url);

    res.json({ message: "Organization settings updated successfully", settings });
  } catch (err) {
    console.error("Error updating settings:", err);
    for (let asset of uploaded) await destroyAsset(asset.publicId, asset.url);
    res.status(500).json({ message: "Unable to save organization settings" });
  } finally {
    cleanupTempFiles(req.files);
  }
};
