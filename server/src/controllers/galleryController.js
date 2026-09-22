import Gallery from "../models/Gallery.js";
import cloudinary, { assetFolder } from "../config/cloudinary.js";
import { UPLOAD_CONCURRENCY } from "../config/upload.js";
import {
  cleanupTempFiles,
  destroyAsset,
} from "../utils/cloudinaryAssets.js";
import { mapWithLimit } from "../utils/concurrency.js";

const CLOUDINARY_FOLDER = assetFolder("gallery");

// Identity of a stored image. publicId is authoritative; the URL is the
// fallback for documents written before publicId existed.
const keyOf = (image) => image?.publicId || image?.url || null;

const uploadImage = async (file) => {
  const result = await cloudinary.uploader.upload(file.path, {
    folder: CLOUDINARY_FOLDER,
  });
  return { url: result.secure_url, publicId: result.public_id };
};

// A multi-image upload can fail part-way through. Anything already on
// Cloudinary at that point belongs to no document, so drop it. mapWithLimit()
// attaches exactly that set to the error it throws as `settled`.
const rollbackUploads = async (images = []) => {
  for (let img of images) {
    await destroyAsset(img.publicId, img.url);
  }
};

/**
 * Upload a batch of files together, rolling back on the first failure.
 *
 * Bounded concurrency rather than a `for … await` loop: these are round trips,
 * not computation, and thirty of them in sequence is the slowest thing the
 * panel does. See utils/concurrency.js for why this is not Promise.all.
 */
const uploadBatch = async (files) => {
  try {
    return await mapWithLimit(files, UPLOAD_CONCURRENCY, uploadImage);
  } catch (err) {
    await rollbackUploads(err.settled);
    // Tagged so the catch blocks below can tell an upload refusal — whose
    // message is Cloudinary's and is worth showing an admin — apart from a
    // database or programming fault, whose message describes our internals.
    err.isUploadFailure = true;
    throw err;
  }
};

/**
 * What to tell the admin about a failed write.
 *
 * Cloudinary's own message ("Stale request…", "File size too large…") is far
 * more actionable in the panel than a bare 500, so it is passed through — but
 * only for an error uploadBatch actually tagged. Everything else reaching these
 * catch blocks is a database or programming fault, and its message (a driver
 * error quoting the query, a stack-bearing TypeError) describes our internals
 * rather than anything the caller can act on. Those get one fixed sentence and
 * the real error stays on the server log, which is the same rule the global
 * error handler applies to every other 500.
 */
const writeFailureMessage = (err) =>
  err?.isUploadFailure && err.message
    ? `Image upload failed: ${err.message}`
    : "Something went wrong. Please try again.";

// Get all galleries (public — powers the website gallery page)
export const getGalleries = async (req, res) => {
  try {
    // Unpaginated on purpose: galleries only appear when an admin uploads one,
    // so the collection is bounded by human effort. See docs/ARCHITECTURE.md.
    //
    // `_id` is the tiebreaker so two galleries uploaded in the same second keep
    // a stable order between requests.
    //
    // .lean() skips hydrating a Mongoose document per row — this is read
    // straight to JSON and never modified.
    const galleries = await Gallery.find({})
      .sort({ createdAt: -1, _id: -1 })
      .lean();
    res.json(galleries);
  } catch (err) {
    console.error("Error fetching galleries:", err);
    res.status(500).json({ error: "Unable to load galleries" });
  }
};

// Get single gallery by ID (for edit prefill)
export const getGalleryById = async (req, res) => {
  try {
    // A malformed id is rejected by the route's param schema, so a CastError
    // can never reach here and become a 500.
    const gallery = await Gallery.findById(req.validated.params.id).lean();
    if (!gallery) return res.status(404).json({ message: "Gallery not found" });
    res.json(gallery);
  } catch (err) {
    console.error("Error fetching gallery:", err);
    res.status(500).json({ error: "Unable to load this gallery" });
  }
};

// Add gallery — one title, many images
export const addGallery = async (req, res) => {
  try {
    // Required, trimmed and length-capped by the route's schema.
    const { title } = req.validated.body;
    const files = req.files || [];

    if (files.length === 0) {
      return res.status(400).json({ message: "Please upload at least one image" });
    }

    // Rolls back the images that did upload if one of them fails.
    const images = await uploadBatch(files);

    const gallery = await Gallery.create({ title, images });
    res.status(201).json({ message: "Gallery added successfully", gallery });
  } catch (err) {
    console.error("Error adding gallery:", err);
    res.status(500).json({ message: writeFailureMessage(err) });
  } finally {
    cleanupTempFiles(req.files);
  }
};

// Update gallery — bifurcates the incoming slots into kept / uploaded / removed
export const updateGallery = async (req, res) => {
  try {
    const files = req.files || [];

    const gallery = await Gallery.findById(req.validated.params.id);
    if (!gallery) return res.status(404).json({ message: "Gallery not found" });

    // Parsed and shape-checked by the route's schema; absent when the admin
    // sent no plan at all.
    let slots = req.validated.body.slots;

    // No slot plan sent (e.g. a title-only edit): keep every existing image and
    // append whatever was uploaded.
    if (!slots) {
      slots = [
        ...gallery.images.map((img) => ({
          type: "existing",
          publicId: img.publicId,
          url: img.url,
        })),
        ...files.map((_, fileIndex) => ({ type: "new", fileIndex })),
      ];
    }

    const existingByKey = new Map();
    for (let img of gallery.images) {
      const key = keyOf(img);
      if (key) existingByKey.set(key, img);
    }

    // Every slot that needs a file uploaded, by its position in `slots`. The
    // uploads happen together and up front; the loop below then places them
    // back in slot order, so the admin's arrangement is preserved no matter
    // which upload finishes first.
    //
    // Indexed by slot rather than keyed by fileIndex: two slots may legitimately
    // point at the same file, and each still gets its own asset.
    const pendingSlots = [];
    slots.forEach((slot, index) => {
      if (slot?.type === "new" && files[slot.fileIndex]) pendingSlots.push(index);
    });

    // The document is untouched at this point, so a failure here has nothing
    // pointing at its partial uploads — uploadBatch drops them and the gallery
    // is left exactly as it was.
    const uploads = await uploadBatch(
      pendingSlots.map((index) => files[slots[index].fileIndex])
    );
    const uploadedBySlot = new Map(
      pendingSlots.map((index, position) => [index, uploads[position]])
    );

    const retainedKeys = new Set();
    const finalImages = [];

    slots.forEach((slot, index) => {
      if (slot?.type === "existing") {
        // Look the image up in the document rather than trusting the client's
        // copy of the URL — a stale slot is skipped, not written back.
        const match = existingByKey.get(keyOf(slot));
        if (!match) return;
        retainedKeys.add(keyOf(match));
        finalImages.push({ url: match.url, publicId: match.publicId });
      } else if (uploadedBySlot.has(index)) {
        finalImages.push(uploadedBySlot.get(index));
      }
    });

    if (finalImages.length === 0) {
      return res
        .status(400)
        .json({ message: "A gallery must keep at least one image" });
    }

    // Anything the admin dropped or replaced: no slot points at it any more.
    const removed = gallery.images.filter((img) => !retainedKeys.has(keyOf(img)));

    const { title } = req.validated.body;
    if (title) gallery.title = title;
    gallery.images = finalImages;
    await gallery.save();

    // Only after the document is safely saved — a failed destroy must never
    // leave the DB pointing at an image we already deleted.
    for (let img of removed) {
      await destroyAsset(img.publicId, img.url);
    }

    res.json({ message: "Gallery updated successfully", gallery });
  } catch (err) {
    console.error("Error updating gallery:", err);
    res.status(500).json({ message: writeFailureMessage(err) });
  } finally {
    cleanupTempFiles(req.files);
  }
};

// Delete gallery and every image it owns
export const deleteGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.validated.params.id);
    if (!gallery) return res.status(404).json({ message: "Gallery not found" });

    for (let img of gallery.images) {
      await destroyAsset(img.publicId, img.url);
    }

    await gallery.deleteOne();
    res.json({ message: "Gallery deleted successfully" });
  } catch (err) {
    console.error("Error deleting gallery:", err);
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
};
