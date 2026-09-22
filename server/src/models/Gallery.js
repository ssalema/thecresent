import mongoose from "mongoose";

const gallerySchema = mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 150 },
  // Ordered — the array order is the order shown on the website gallery.
  images: [{ url: String, publicId: String }],
  // Both the website gallery and the admin dashboard sort by this.
  createdAt: { type: Date, default: Date.now },
});

// Newest first, with `_id` matching the controller's tiebreaker so two galleries
// uploaded in the same second keep a stable order.
gallerySchema.index({ createdAt: -1, _id: -1 });

export default mongoose.model("Gallery", gallerySchema);
