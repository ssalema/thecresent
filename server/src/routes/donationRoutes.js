import express from "express";
import {
  createOrder,
  verifyPayment,
  markPaymentFailed,
  getDonations,
  getDonationTypes,
} from "../controllers/donationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { donationLimiter } from "../config/security.js";
import { noStore } from "../middleware/cacheMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  createOrderBody,
  donationListQuery,
  failedPaymentBody,
  verifyPaymentBody,
} from "../validation/schemas.js";

const router = express.Router();

// This flow reports a single `error` string rather than per-field errors — the
// donate form shows it in one alert, so that is the shape it is validated in.
const validateDonation = (body) => validate({ body }, { style: "error" });

// Throttled: each call writes a Donation row and hits the Razorpay API.
router.post(
  "/create-order",
  donationLimiter,
  validateDonation(createOrderBody),
  createOrder
); // Create a Razorpay order
router.post(
  "/verify",
  donationLimiter,
  validateDonation(verifyPaymentBody),
  verifyPayment
); // Verify signature and save donation
router.post(
  "/failed",
  donationLimiter,
  validateDonation(failedPaymentBody),
  markPaymentFailed
); // Mark abandoned/failed checkout
// NOTE: POST /webhook is mounted directly in server.js — it needs the raw body,
// and it is deliberately not rate limited so Razorpay's retries always land.
// Its payload is authenticated by an HMAC signature rather than a schema.
// Donor records are personal data — never cached by a proxy or the browser.
// The query describes a view rather than a submission, so its schema falls back
// to defaults instead of rejecting; see validation/schemas.js.
router.get(
  "/",
  protect,
  noStore,
  validate({ query: donationListQuery }),
  getDonations
);

// The distinct funds present in the records, for the type filter's options.
router.get("/types", protect, noStore, getDonationTypes);

export default router;
