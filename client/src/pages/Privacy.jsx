import { useMemo } from "react";
import LegalPage from "../components/LegalPage";
import { useOrganization } from "../context/OrganizationContext";

/**
 * Privacy Policy.
 *
 * Only the words live here; the layout is `LegalPage`, shared with the Terms
 * and Refund pages.
 *
 * The clauses describe what the site actually does — the contact form collects
 * a name, email, phone number and message; the donate form a name, mobile
 * number, amount, fund and an optional note; the payment itself is handled on
 * Razorpay's checkout and never touches our servers. Keep this page honest: if
 * a form starts collecting something new, say so here.
 */

/** Bump this whenever the clauses below actually change. */
const LAST_UPDATED = "8 September 2026";

const Privacy = () => {
  const { organizationName } = useOrganization();
  const name = organizationName || "our organization";

  const sections = useMemo(
    () => [
      {
        id: "what-we-collect",
        title: "Information We Collect",
        body: [
          "We only ask for what we need to answer you or to process a contribution. Nothing on this site requires you to create an account, and we do not ask for information we have no use for.",
          "When you write to us through the contact form, we collect:",
          {
            list: [
              "Your name, so we know who we are replying to.",
              "Your email address and phone number, so we can reply.",
              "The message you write.",
            ],
          },
          "When you make a donation, we collect:",
          {
            list: [
              "Your name and mobile number, for the receipt and for our donation records.",
              "The amount and the fund you chose to support.",
              "An optional note, if you choose to leave one with your contribution.",
              "The reference the payment gateway returns once a payment succeeds or fails.",
            ],
          },
          "We do not collect sensitive personal data through this website, and we ask that you do not send any to us through its forms.",
        ],
      },
      {
        id: "payment-data",
        title: "Payment Information",
        body: [
          "We never see, handle or store your card number, UPI ID, net-banking credentials or any other payment instrument. Those details are entered on the secure checkout operated by our payment gateway partner, Razorpay, and are processed under their own security standards and privacy policy.",
          "What comes back to us is the outcome of the payment and its reference number — enough to acknowledge your contribution and to trace it if something goes wrong, and nothing more.",
        ],
      },
      {
        id: "how-we-use",
        title: "How We Use Your Information",
        body: [
          "Your information is used for the purpose you gave it to us for, and for our own records. In practice that means:",
          {
            list: [
              "Replying to your query, request or offer of support.",
              "Processing your donation, acknowledging it, and issuing a receipt.",
              "Keeping the accounting and donation records we are required to keep.",
              "Sending you occasional updates about our work, where you have asked to receive them.",
              "Understanding, in aggregate, which programmes supporters respond to — never by singling out an individual.",
            ],
          },
          "We do not use your information to profile you, and we do not make automated decisions about you.",
        ],
      },
      {
        id: "sharing",
        title: "Who We Share It With",
        body: [
          `We do not sell, rent or trade your personal information. Ever. ${name} shares it only where there is a reason to, and only as far as that reason requires:`,
          {
            list: [
              "With our payment gateway, to process a donation you have chosen to make.",
              "With the service providers who host this site and store its images, who process data only on our instructions.",
              "With our auditors and, where the law requires it, with a regulator, tax authority or court.",
            ],
          },
          "Where a project update or photograph would identify a donor or a beneficiary, we publish it only with that person's consent.",
        ],
      },
      {
        id: "cookies",
        title: "Cookies and Analytics",
        body: [
          "This site does not use advertising or tracking cookies, and it does not build a profile of you across other websites.",
          "The payment gateway sets its own cookies on its checkout, and embedded content such as a map or a social media feed may do the same. Those are governed by the privacy policies of the services concerned, and your browser settings let you block or clear them at any time.",
        ],
      },
      {
        id: "security",
        title: "How We Protect It",
        body: [
          "The site is served over an encrypted connection, payments are handled entirely on the gateway's own secured checkout, and access to our records is restricted to the people who administer them.",
          "No system connected to the internet can be guaranteed absolutely secure, and we do not claim otherwise. What we can say is that we take the safeguarding of your information seriously, and that if a breach ever affected your data we would tell you and the relevant authority promptly.",
        ],
      },
      {
        id: "retention",
        title: "How Long We Keep It",
        body: [
          "Enquiries are kept for as long as they are useful to the conversation and to our records, and are then removed.",
          "Donation records are kept for as long as the law requires us to keep our financial and tax records, which is longer than we would otherwise hold them. This is an obligation we cannot waive, even at a donor's request.",
        ],
      },
      {
        id: "your-rights",
        title: "Your Choices and Rights",
        body: [
          "It is your information, and you remain in control of it. You may ask us to:",
          {
            list: [
              "Tell you what information about you we hold, and why.",
              "Correct anything that is wrong or out of date.",
              "Delete information we no longer need to keep — subject to the accounting records described above.",
              "Stop sending you updates, at any time and without giving a reason.",
            ],
          },
          "Write to us using the details at the foot of this page and we will act on your request within a reasonable period. There is no charge for asking.",
        ],
      },
      {
        id: "children",
        title: "Children",
        body: [
          "This website is not directed at children, and we do not knowingly collect information from anyone under 18. If you believe a child has sent us their details, please tell us and we will remove them.",
        ],
      },
      {
        id: "changes",
        title: "Changes to This Policy",
        body: [
          "As our work and this website change, this policy will change with them. The current version is always the one published here, and the date at the top tells you when it was last revised. Where a change materially affects how we use your information, we will make that clear rather than quietly amend the text.",
        ],
      },
    ],
    [name],
  );

  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="What we collect, why we collect it, and what we will never do with it."
      updated={LAST_UPDATED}
      intro={[
        `${name} is trusted with two things by the people who support us: their contribution and their information. This policy explains how we look after the second.`,
        "It covers this website and the forms on it. It is written to be read, not to be scrolled past — if anything in it is unclear, please ask us.",
      ]}
      sections={sections}
      related={[
        { label: "Terms & Conditions", to: "/terms-and-conditions" },
        { label: "Refund Policy", to: "/refund-policy" },
        { label: "Contact Us", to: "/contact" },
      ]}
    />
  );
};

export default Privacy;
