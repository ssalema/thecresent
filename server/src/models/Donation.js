import mongoose from "mongoose";
import { CREATED, DONATION_STATUSES } from "../services/donationStatus.js";

// The status vocabulary is owned by the state machine in services/, not by the
// schema — the rules that move a donation between these values and the list of
// values itself must not be able to drift apart.
const donationSchema = mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  mobile: { type: String, required: true, trim: true, maxlength: 20 },
  amount: { type: Number, required: true, min: 1 }, // Number for amount
  type: { type: String, required: true, trim: true, maxlength: 40 },
  // Unique: this is the natural key every payment callback and webhook looks a
  // donation up by, and the database is the only place that can actually
  // guarantee two rows never answer to the same order — a retried create-order
  // would otherwise leave one of them permanently unreconcilable.
  razorpayOrderId: { type: String, required: true, unique: true },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  status: {
    type: String,
    enum: DONATION_STATUSES,
    default: CREATED,
  },
  createdAt: { type: Date, default: Date.now },
});

/**
 * Indexes for the admin records screen, which always filters to paid donations
 * and then sorts one of four ways. Each index carries `status` first (the
 * constant every query shares), then the sort key, then `_id` to match the
 * tiebreaker the controller sorts on — an index that stops short of the
 * tiebreaker still leaves an in-memory sort behind.
 *
 * Without these it is a collection scan plus a sort that grows with every
 * donation ever *attempted*, paid or not.
 */
donationSchema.index({ status: 1, createdAt: -1, _id: -1 });
donationSchema.index({ status: 1, amount: -1, _id: -1 });

// The same, narrowed by the type filter.
donationSchema.index({ status: 1, type: 1, createdAt: -1, _id: -1 });

export default mongoose.model("Donation", donationSchema);
