import mongoose from "mongoose";

// Anyone on the internet can create one of these, so the schema is the last
// line of defence behind the controller's validation and the rate limiter.
const contactSchema = mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  number: { type: String, required: true, trim: true, maxlength: 20 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  createdAt: { type: Date, default: Date.now },
});

/**
 * The inbox sorts by date or by name, and pages through the result. Each index
 * ends in `_id` to match the controller's tiebreaker — without it Mongo can
 * still sort in memory, and two messages sharing a timestamp can swap places
 * between pages.
 *
 * A descending index also serves the ascending sort (Mongo can walk either
 * direction), so `newest`/`oldest` share one and `nameAsc`/`nameDesc` the other.
 */
contactSchema.index({ createdAt: -1, _id: -1 });
contactSchema.index({ name: 1, _id: 1 });

export default mongoose.model("Contact", contactSchema);
