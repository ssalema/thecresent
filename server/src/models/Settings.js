import mongoose from "mongoose";

// Every image the organization owns is stored the same way as galleries and
// projects: the Cloudinary URL plus the publicId needed to delete it later.
const assetSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
  },
  { _id: false }
);

/**
 * Organization Settings — the single source of truth for every piece of
 * organization information shown anywhere in the website, the admin panel,
 * receipts and PDFs.
 *
 * This collection holds exactly one document. `key` is unique and immutable so
 * a second one can never be created, and `getSingleton()` upserts it on first
 * read — a fresh database serves empty strings rather than 404ing.
 */
const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "organization",
      unique: true,
      immutable: true,
    },

    // --- General information ---
    organizationName: { type: String, default: "", trim: true },
    tagline: { type: String, default: "", trim: true },
    contactEmail: { type: String, default: "", trim: true },
    contactNumber: { type: String, default: "", trim: true },
    whatsappNumber: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    websiteUrl: { type: String, default: "", trim: true },
    mapEmbedUrl: { type: String, default: "", trim: true },

    // --- Branding ---
    logo: { type: assetSchema, default: () => ({}) },
    favicon: { type: assetSchema, default: () => ({}) },

    // --- Social media ---
    social: {
      facebook: { type: String, default: "", trim: true },
      instagram: { type: String, default: "", trim: true },
      twitter: { type: String, default: "", trim: true },
      linkedin: { type: String, default: "", trim: true },
      youtube: { type: String, default: "", trim: true },
    },

    // --- SEO ---
    seo: {
      metaTitle: { type: String, default: "", trim: true },
      metaDescription: { type: String, default: "", trim: true },
      metaKeywords: { type: String, default: "", trim: true },
    },
  },
  { timestamps: true }
);

/**
 * Read the one settings document, creating it on first use.
 *
 * Deliberately a find-then-create rather than an upsert: Mongoose stamps
 * `updatedAt` on every findOneAndUpdate, so an upsert here would make a plain
 * page view look like an edit. The unique index on `key` makes the create safe
 * if two first requests race.
 */
settingsSchema.statics.getSingleton = async function () {
  const existing = await this.findOne({ key: "organization" });
  if (existing) return existing;

  try {
    return await this.create({ key: "organization" });
  } catch (err) {
    if (err?.code === 11000) return this.findOne({ key: "organization" });
    throw err;
  }
};

export default mongoose.model("Settings", settingsSchema);
