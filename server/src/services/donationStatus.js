/**
 * The donation payment state machine, as pure data.
 *
 * A donation moves `created → paid` or `created → failed`, and four different
 * inputs can drive it: the checkout callback, the browser reporting an abandoned
 * modal, and two kinds of Razorpay webhook. Each of those used to build its own
 * Mongo filter inline, and they did not agree — the checkout callback's failure
 * path had no status guard at all, so a stale or forged verify request could
 * flip an already-paid donation to `failed` and drop it out of the admin's
 * records (which read `status: "paid"` only).
 *
 * So the rules live here, in one place, with one invariant:
 *
 *   **`paid` is terminal.** Nothing may move a donation out of it.
 *
 * Every function returns a plain `{ filter, update }` for findOneAndUpdate,
 * which is what makes the rules assertable without a database.
 */

export const CREATED = "created";
export const PAID = "paid";
const FAILED = "failed";

export const DONATION_STATUSES = [CREATED, PAID, FAILED];

/**
 * The checkout signature verified, or a webhook confirmed the capture.
 *
 * Unfiltered by status on purpose: the target state *is* `paid`, so re-applying
 * it to an already-paid donation is a no-op that costs one write. That is what
 * makes a webhook redelivery — or a webhook and a browser callback racing —
 * harmless.
 */
export const paidTransition = (orderId, { paymentId, signature } = {}) => ({
  filter: { razorpayOrderId: orderId },
  update: {
    status: PAID,
    // Only overwrite what we were actually given: a webhook carries a payment
    // id but no checkout signature, and blanking the stored one would lose it.
    ...(paymentId ? { razorpayPaymentId: paymentId } : {}),
    ...(signature ? { razorpaySignature: signature } : {}),
  },
});

/**
 * The payment did not go through: a bad signature, a dismissed modal, or a
 * `payment.failed` webhook.
 *
 * Guarded to `created`. Two reasons, and both have bitten this flow:
 *   - A donation that is already `paid` must never be un-paid. Razorpay is the
 *     authority on that, and it has already said yes.
 *   - A donor who retries after one declined card produces a `payment.failed`
 *     for the first attempt that can land *after* the second attempt succeeded.
 */
export const failedTransition = (orderId) => ({
  filter: { razorpayOrderId: orderId, status: CREATED },
  update: { status: FAILED },
});

/**
 * Map a Razorpay webhook event to a transition, or null for events this system
 * has nothing to reconcile (refunds, settlements, payouts).
 */
export const webhookTransition = (event, { orderId, paymentId } = {}) => {
  if (!orderId) return null;

  switch (event) {
    case "payment.captured":
    case "order.paid":
      return paidTransition(orderId, { paymentId });

    case "payment.failed":
      return failedTransition(orderId);

    default:
      return null;
  }
};

/**
 * Does the amount Razorpay captured match what we recorded when the order was
 * created?
 *
 * Razorpay sets the order amount server-side from our own create-order call, so
 * a mismatch should be impossible — which is precisely why it is worth
 * asserting. If one ever appears it means the order was created somewhere other
 * than here, and marking that donation `paid` on our say-so would put a number
 * in the charity's records that no money backs.
 *
 * Rupees are stored; Razorpay reports paise. An absent amount on the payload
 * (some events carry no entity) is treated as "nothing to contradict".
 */
export const amountMatches = (donation, paymentAmountInPaise) => {
  if (paymentAmountInPaise === undefined || paymentAmountInPaise === null) {
    return true;
  }

  const expected = Math.round(Number(donation?.amount) * 100);
  const actual = Number(paymentAmountInPaise);

  if (!Number.isFinite(expected) || !Number.isFinite(actual)) return false;
  return expected === actual;
};
