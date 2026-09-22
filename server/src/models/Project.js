import mongoose from "mongoose";

const projectSchema = mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 150 },
  category: { type: String, enum: ["current", "upcoming", "completed"], required: true },
  // shown on the project details page
  description: { type: String, required: true, trim: true, maxlength: 10000 },
  images: [{ url: String, publicId: String, position: String }], // position to place in details page
  createdAt: { type: Date, default: Date.now },
});

// The website lists projects oldest-first and the admin dashboard newest-first;
// one index walked in either direction serves both. `_id` matches the
// tiebreaker the controllers sort on.
projectSchema.index({ createdAt: 1, _id: 1 });

export default mongoose.model("Project", projectSchema);
