import { useMemo } from "react";
import LegalPage from "../components/LegalPage";
import { useOrganization } from "../context/OrganizationContext";

/**
 * Refund & Cancellation Policy.
 *
 * Only the words live here; the layout is `LegalPage`, shared with the Terms
 * and Privacy pages.
 *
 * A donation is a gift rather than a purchase, so the default is that it
 * stands — but a donor who paid twice, or typed an extra zero, should not have
 * to argue about it. The clauses below say plainly which case is which, and
 * how long each takes.
 */

/** Bump this whenever the clauses below actually change. */
const LAST_UPDATED = "8 September 2026";

/** How long a donor has to raise a refund request, in days. */
const REQUEST_WINDOW_DAYS = 7;

const Refund = () => {
  const { organizationName } = useOrganization();
  const name = organizationName || "our organization";

  const sections = useMemo(
    () => [
      {
        id: "donations-are-final",
        title: "Donations Are Ordinarily Final",
        body: [
          `A donation to ${name} is a voluntary gift, not the purchase of a good or a service. Once we receive it, it is committed to the work it was given for — often within days, as food, fees, medical aid or materials — and cannot be recalled from there.`,
          "For that reason donations are, as a rule, non-refundable. The exceptions below exist because genuine mistakes happen at a payment screen, and a donor should never be out of pocket for one.",
        ],
      },
      {
        id: "when-we-refund",
        title: "When We Will Refund",
        body: [
          "We will refund a contribution in full where:",
          {
            list: [
              "The same donation was charged more than once because of a duplicate submission or a gateway error.",
              "The amount charged differs from the amount you entered and confirmed.",
              "An amount was deducted but the donation never reached us or was recorded as failed.",
              "The donation was made from your account without your authorisation.",
              "You entered the wrong amount by clear mistake — an extra digit, for instance — and tell us promptly.",
            ],
          },
          `Please raise such a request within ${REQUEST_WINDOW_DAYS} days of the payment. We can still look at a later request, but a refund becomes harder to process once the contribution has been receipted and allocated.`,
        ],
      },
      {
        id: "when-we-cannot",
        title: "When We Cannot Refund",
        body: [
          "There are cases where we are not able to return a contribution, and it is fairer to say so here than after you have asked:",
          {
            list: [
              "A change of mind about a donation that was correctly made and correctly charged.",
              "A donation already spent on the project it was given for, or already released to a beneficiary.",
              "A donation against which a tax exemption receipt has been issued and claimed — that receipt cannot be unwound.",
              "A contribution made in someone else's name or from someone else's account with their permission.",
            ],
          },
        ],
      },
      {
        id: "how-to-request",
        title: "How to Request a Refund",
        body: [
          "Write to us using the contact details at the foot of this page, from the email address or phone number you used when donating, and tell us:",
          {
            list: [
              "The name the donation was made in, and the amount.",
              "The date of the payment.",
              "The payment reference shown on the confirmation screen, or in your bank or UPI statement.",
              "What went wrong, in a sentence.",
            ],
          },
          "The payment reference is the single most useful thing you can give us — with it, a contribution can usually be traced the same day.",
        ],
      },
      {
        id: "processing",
        title: "How a Refund Is Processed",
        body: [
          "We acknowledge every refund request when we receive it, and tell you our decision within 7 working days of having the details we need.",
          "An approved refund is returned through the original payment method — we cannot redirect it to a different card, account or person. Once we release it, the money typically reaches you within 5 to 10 working days, depending on your bank or card issuer. That last stretch is in their hands rather than ours.",
          "Refunds are made in Indian Rupees for the amount received. Where a bank, card network or currency conversion has taken its own charge on the original payment, that portion never reached us and cannot be refunded by us.",
        ],
      },
      {
        id: "failed-payments",
        title: "Failed and Pending Payments",
        body: [
          "If a payment fails or is declined, no amount is captured and there is nothing for us to refund. Where money has left your account against such an attempt, it is held by the gateway or your bank and is normally reversed automatically within 5 to 7 working days.",
          "If that has not happened by then, contact us with the payment reference and we will take it up with the gateway on your behalf.",
        ],
      },
      {
        id: "cancellation",
        title: "Cancelling a Recurring or Pledged Contribution",
        body: [
          "If you have set up a repeating contribution or pledged a future one, you may stop it at any time by writing to us — no reason required, and no questions asked. We will stop the next instalment provided you tell us at least 3 working days before it is due.",
          "Instalments already collected before that point are treated as ordinary donations under this policy.",
        ],
      },
      {
        id: "receipts",
        title: "Receipts and Tax Exemption",
        body: [
          "A refunded donation cannot also be a receipted one. If a receipt has already been issued against a contribution we later refund, that receipt is cancelled and must not be used to claim any tax exemption.",
          "Where you have already claimed it, tell us — we will confirm the position in writing so your records and ours agree.",
        ],
      },
      {
        id: "changes",
        title: "Changes to This Policy",
        body: [
          "We may revise this policy as our processes or our payment arrangements change. The version published here is the one that applies, and the date at the top tells you when it was last revised. A donation is always dealt with under the policy in force on the day it was made.",
        ],
      },
    ],
    [name],
  );

  return (
    <LegalPage
      title="Refund Policy"
      subtitle="When a donation can be returned, how to ask, and how long it takes."
      updated={LAST_UPDATED}
      intro={[
        `A donation is a gift, and gifts are not ordinarily returned — but a donor who was charged twice, or who typed one zero too many, should never have to argue their way to a refund.`,
        "This policy sets out exactly which situations we refund, which we cannot, and what happens once you ask. We would rather be plain about it than leave you guessing.",
      ]}
      sections={sections}
      related={[
        { label: "Terms & Conditions", to: "/terms-and-conditions" },
        { label: "Privacy Policy", to: "/privacy-policy" },
        { label: "Donate", to: "/donate" },
      ]}
    />
  );
};

export default Refund;
