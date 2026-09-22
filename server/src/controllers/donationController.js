import Donation from "../models/Donation.js";
import { getRazorpay } from "../config/razorpay.js";
import { checkoutPayload, verifySignature } from "../utils/signature.js";
import {
  PAID,
  amountMatches,
  failedTransition,
  paidTransition,
  webhookTransition,
} from "../services/donationStatus.js";
import {
  compactFilter,
  dateRangeFilter,
  pageParams,
  paginated,
  searchFilter,
} from "../utils/pagination.js";

/**
 * Step 1: create a Razorpay order and store the pending donation.
 *
 * The route's schema has already required and trimmed the three text fields,
 * checked the mobile number, confirmed the type is one of ours (it reaches the
 * receipt and the admin records) and bounded the amount — see
 * validation/schemas.js.
 */
export const createOrder = async (req, res) => {
  try {
    const { name, mobile, type, amount: amountInRupees } = req.validated.body;

    const order = await getRazorpay().orders.create({
      amount: Math.round(amountInRupees * 100), // Razorpay works in paise
      currency: "INR",
      receipt: `donation_${Date.now()}`,
      notes: { name, mobile, type },
    });

    const donation = new Donation({
      name,
      mobile,
      amount: amountInRupees,
      type,
      razorpayOrderId: order.id,
      status: "created",
    });
    await donation.save();

    res.json({
      message: "Order created",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_API_KEY,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
};

// Step 2: verify the checkout signature and mark the donation as paid
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.validated.body;

    const secret = process.env.RAZORPAY_SECRET_KEY;
    if (!secret) {
      // Refuse rather than crash in the HMAC: an unconfigured server must not
      // report a payment as unverifiable-because-forged.
      console.error("RAZORPAY_SECRET_KEY is not set — cannot verify payments");
      return res.status(500).json({ error: "Payments are not configured" });
    }

    const isValid = verifySignature({
      secret,
      payload: checkoutPayload(razorpay_order_id, razorpay_payment_id),
      signature: razorpay_signature,
    });

    if (!isValid) {
      // Guarded to a still-pending donation. Without the guard this write is a
      // status downgrade anyone holding an order id can trigger, and since the
      // admin records read `status: "paid"` only, it erases a real donation
      // from the charity's books. `paid` is terminal — see
      // services/donationStatus.js.
      const { filter, update } = failedTransition(razorpay_order_id);
      await Donation.findOneAndUpdate(filter, update);
      return res.status(400).json({ error: "Payment verification failed" });
    }

    const { filter, update } = paidTransition(razorpay_order_id, {
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    const donation = await Donation.findOneAndUpdate(filter, update, { new: true });

    if (!donation) {
      return res.status(404).json({ error: "Donation order not found" });
    }

    res.json({ message: "Payment verified successfully", donation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to verify payment" });
  }
};

// Mark an abandoned/failed checkout so the record does not stay pending.
// Unauthenticated by necessity — it is called from the checkout modal's dismiss
// handler — so it carries no payload beyond the order id and can only ever move
// a still-pending donation to `failed`.
export const markPaymentFailed = async (req, res) => {
  try {
    const { razorpay_order_id } = req.validated.body;

    const { filter, update } = failedTransition(razorpay_order_id);
    await Donation.findOneAndUpdate(filter, update);

    res.json({ message: "Payment marked as failed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update payment status" });
  }
};

// Razorpay webhook: the authoritative payment status, independent of the
// browser. Mounted with express.raw() so the signature can be checked against
// the exact bytes Razorpay signed.
export const handleWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not set in server/.env");
      return res.status(500).json({ error: "Webhook not configured" });
    }

    const signature = req.headers["x-razorpay-signature"];
    if (!signature) {
      return res.status(400).json({ error: "Missing signature" });
    }

    // req.body is a Buffer here (express.raw), not a parsed object — the
    // signature covers the exact bytes, so it must be checked before parsing.
    if (!verifySignature({ secret, payload: req.body, signature })) {
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const { event, payload } = JSON.parse(req.body.toString("utf8"));
    const payment = payload?.payment?.entity;
    const orderId = payment?.order_id || payload?.order?.entity?.id;

    const transition = webhookTransition(event, {
      orderId,
      paymentId: payment?.id,
    });

    // Nothing to reconcile (a refund, a settlement, an event without an order)
    if (!transition) return res.json({ status: "ignored" });

    // Both checks below only guard the `paid` path. A `failed` transition that
    // matches nothing is the normal, expected case — its filter pins
    // `status: "created"` precisely so a late `payment.failed` cannot touch a
    // donation that has already been captured.
    if (transition.update.status === PAID) {
      const donation = await Donation.findOne({ razorpayOrderId: orderId }).lean();

      // Razorpay confirmed a capture against an order this database has never
      // heard of. The update below would match nothing and answer "ok", which
      // is money received and nothing recorded — reported by no one.
      //
      // The way here is createOrder(): the Razorpay order is created before the
      // Donation row is saved, so a failed save (or a deleted record) leaves a
      // payable order with nothing behind it. Everything needed to reconcile
      // the payment by hand is logged, because nothing else will surface it.
      if (!donation) {
        console.error(
          `Webhook captured payment for unknown order ${orderId}: payment ${payment?.id}, ` +
            `${payment?.amount} paise. No donation record exists — reconcile this manually.`
        );
        // A 200 for the same reason as the mismatch below: the signature was
        // valid, so a retry would replay this identical situation and bury the
        // line above under redelivery noise.
        return res.json({ status: "unmatched" });
      }

      // Razorpay derives the captured amount from the order we created, so a
      // mismatch should be impossible — which is why it is worth asserting. If
      // it ever fires, the money and the record disagree, and recording a
      // number no payment backs is worse than leaving the donation pending for
      // a human.
      if (!amountMatches(donation, payment?.amount)) {
        console.error(
          `Webhook amount mismatch for order ${orderId}: recorded ₹${donation.amount}, ` +
            `Razorpay captured ${payment?.amount} paise. Left unreconciled for review.`
        );
        // Still a 200: the signature was valid, so retrying changes nothing and
        // would only bury the log line above under redelivery noise.
        return res.json({ status: "amount_mismatch" });
      }
    }

    await Donation.findOneAndUpdate(transition.filter, transition.update);

    // Always 200 on a valid signature, otherwise Razorpay keeps retrying
    res.json({ status: "ok" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

/**
 * Sort orders the records screen offers.
 *
 * A key rather than a caller-supplied field name, so a query string can never
 * ask Mongo to sort on something unindexed. `_id` is the tiebreaker: without it
 * two donations sharing a timestamp (or an amount) can swap places between
 * pages, which shows the same row twice and hides another.
 */
const SORT_ORDERS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  amountDesc: { amount: -1, _id: -1 },
  amountAsc: { amount: 1, _id: 1 },
};

const SEARCH_FIELDS = ["name", "mobile", "razorpayPaymentId"];

/**
 * Everything the records table and the PDF receipt read — the receipt prints
 * the order id as its "Order Reference" and the status as its stamp, so both
 * have to travel with the row.
 *
 * `razorpaySignature` is deliberately the one field left behind: it is a
 * credential rather than a fact about the donation, nothing renders it, and it
 * has no business sitting in a browser's memory.
 */
const LIST_FIELDS =
  "name mobile amount type status razorpayOrderId razorpayPaymentId createdAt";

/**
 * GET /api/donations — admin, paginated.
 *
 * Filtering, sorting and slicing all happen in Mongo. They used to happen in
 * the browser over the entire collection, which meant every visit to this
 * screen downloaded every donation the charity had ever received.
 */
export const getDonations = async (req, res) => {
  try {
    const { search, type, from, to, sort } = req.validated.query;
    const { page, limit, skip } = pageParams(req.validated.query);

    // Only successful payments belong in the admin records.
    const filter = compactFilter(
      { status: "paid" },
      type ? { type } : undefined,
      dateRangeFilter(from, to),
      searchFilter(search, SEARCH_FIELDS)
    );

    // The three run concurrently: they are independent reads, and awaiting them
    // in sequence would make this screen three round trips deep.
    const [items, total, totals] = await Promise.all([
      Donation.find(filter)
        .select(LIST_FIELDS)
        .sort(SORT_ORDERS[sort] || SORT_ORDERS.newest)
        .skip(skip)
        .limit(limit)
        .lean(),
      Donation.countDocuments(filter),
      // Summed in Mongo, not in the browser: the header shows the total for
      // everything matching the filters, which is not what one page adds up to.
      Donation.aggregate([
        { $match: filter },
        { $group: { _id: null, amount: { $sum: "$amount" } } },
      ]),
    ]);

    res.json(
      paginated({ items, page, limit, total }, { totalAmount: totals[0]?.amount || 0 })
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch donations" });
  }
};

/**
 * GET /api/donations/types — admin.
 *
 * The type filter's options. Read off the records rather than the current form,
 * so a fund that has been retired from the donate page stays filterable. This
 * was derived in the browser from the full donation list; with that list now
 * paginated, the distinct values have to come from the collection itself.
 */
export const getDonationTypes = async (req, res) => {
  try {
    const types = await Donation.distinct("type", { status: "paid" });
    res.json(types.filter(Boolean).sort((a, b) => a.localeCompare(b)));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch donation types" });
  }
};
