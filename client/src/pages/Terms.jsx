import { useMemo } from "react";
import LegalPage from "../components/LegalPage";
import { useOrganization } from "../context/OrganizationContext";

/**
 * Terms & Conditions.
 *
 * The page is only the words — the layout, the contents rail and the closing
 * contact card all live in `LegalPage`, which the Privacy and Refund pages
 * render too. Edit the copy here; anything about how it looks belongs there.
 *
 * The organization name is read from Organization Settings rather than typed
 * in, so a rename in the admin panel carries through the document. Until the
 * record arrives it stands in as "our organization", which reads correctly in
 * every sentence below.
 */

/** Bump this whenever the clauses below actually change. */
const LAST_UPDATED = "8 September 2026";

const Terms = () => {
  const { organizationName, websiteUrl } = useOrganization();
  const name = organizationName || "our organization";
  const site = websiteUrl ? websiteUrl.replace(/^https?:\/\//, "") : "this website";

  const sections = useMemo(
    () => [
      {
        id: "acceptance",
        title: "Acceptance of These Terms",
        body: [
          `By browsing ${site}, making a donation, or submitting any form on it, you agree to these Terms & Conditions and to our Privacy Policy. If you do not agree with any part of them, please do not use the website.`,
          `We may update these terms from time to time — to reflect a change in the law, in our programmes, or in how the site works. The revised version takes effect once it is published here, and the "last updated" date above tells you when that was. Continuing to use the site after a change means you accept the updated terms.`,
        ],
      },
      {
        id: "about-us",
        title: "About Us and Our Work",
        body: [
          `${name} is a charitable organization. This website exists to describe our work, share the impact of the projects we run, and let supporters get in touch or contribute towards them.`,
          `We describe our projects as honestly and as currently as we can. Photographs, figures and project updates reflect our work at the time of publishing and may change as a project progresses — they are not a contractual promise of any particular outcome.`,
        ],
      },
      {
        id: "use-of-site",
        title: "Acceptable Use of the Website",
        body: [
          "You may read, share and link to anything on this site freely. What you may not do is anything that harms the site, its visitors, or the people we serve. Specifically, you agree not to:",
          {
            list: [
              "Use the site for any unlawful, fraudulent or deceptive purpose, or on behalf of anyone else without their permission.",
              "Attempt to gain unauthorised access to the site, the admin panel, our servers, or any data held on them.",
              "Interfere with the site's operation — including by introducing malware, scraping it at a scale that degrades it, or bypassing any security measure.",
              "Submit false, abusive or misleading information through the contact or donation forms, or impersonate another person or organization.",
              "Copy our name, logo, photographs or written material for commercial use, or in a way that suggests we endorse you.",
            ],
          },
          "We may restrict or refuse access to anyone who breaches these terms, and report unlawful activity to the appropriate authorities.",
        ],
      },
      {
        id: "donations",
        title: "Donations",
        body: [
          `Donations made through this site are voluntary contributions towards the work of ${name}. Where you tell us your contribution is for a particular project, we apply it to that purpose. If that project is already fully funded, has closed, or cannot proceed, we will apply your contribution to a comparable programme so the money still reaches the people it was given for.`,
          "You confirm that the funds you donate are lawfully yours to give, that the payment instrument you use belongs to you or is used with the holder's permission, and that the details you provide are accurate.",
          "Donations, receipts, cancellations and the limited circumstances in which a payment can be refunded are set out in full in our Refund Policy, which forms part of these terms.",
        ],
      },
      {
        id: "payments",
        title: "Payments and Receipts",
        body: [
          "Online payments are processed by our payment gateway partner, Razorpay. Your card, UPI or banking credentials are entered on the gateway's own secure checkout and are never seen or stored by us — we receive only the confirmation of the payment and the details you enter on our form.",
          "A payment is complete only when the gateway confirms it. If a payment fails or is declined, no amount is captured; if money has left your account against a failed attempt, it is normally reversed by your bank within the usual settlement period.",
          {
            list: [
              "Keep the payment reference shown on the confirmation screen — it is the fastest way for us to trace a contribution.",
              "Acknowledgement of a donation is sent to the contact details you provide, so please enter them correctly.",
              "Tax exemption receipts are issued in accordance with the certification we hold and the details you supply; we cannot issue one against incomplete or incorrect information.",
            ],
          },
        ],
      },
      {
        id: "content",
        title: "Intellectual Property",
        body: [
          `All content on this website — text, photographs, project write-ups, graphics, the ${name} name and logo — belongs to us or is used with permission, and is protected by applicable copyright and trademark law.`,
          "You may share or quote our material for personal, educational or non-commercial awareness purposes with clear credit to us. Any other reproduction, adaptation or commercial use needs our written permission first.",
        ],
      },
      {
        id: "your-content",
        title: "Information You Submit",
        body: [
          "When you send us a message, a query or a donation, you confirm the information is accurate and yours to share. You give us permission to store it and to use it to respond to you and to maintain our records.",
          "Please do not send us confidential information belonging to someone else, or anything unlawful or offensive, through the forms on this site.",
        ],
      },
      {
        id: "third-parties",
        title: "Third-Party Links and Services",
        body: [
          "The site links to external services — our social media pages, our payment gateway, and occasionally a partner or a news report about our work. Those services are run by other people under their own terms and privacy policies, and we do not control their content or their practices.",
          "We include such links because we believe they are useful, not as an endorsement of everything on them. Please read their terms before using them.",
        ],
      },
      {
        id: "availability",
        title: "Website Availability",
        body: [
          "We work to keep the site available and its information current, but we cannot promise it will be uninterrupted or error-free. Access may be suspended for maintenance, for upgrades, or because of a problem beyond our control, and we may change, withdraw or reorganise any part of the site without notice.",
        ],
      },
      {
        id: "liability",
        title: "Limitation of Liability",
        body: [
          "The website and its content are provided on an as-is basis. To the extent permitted by law, we are not liable for any indirect or consequential loss arising from your use of the site, from any inability to access it, or from your reliance on information published on it.",
          "Nothing in these terms limits any liability that cannot lawfully be limited, including liability for fraud.",
        ],
      },
      {
        id: "law",
        title: "Governing Law and Disputes",
        body: [
          "These terms are governed by the laws of India. Any dispute arising from them or from your use of this website is subject to the exclusive jurisdiction of the courts at the place where our registered office is situated.",
          "Before that, please write to us. Most concerns are resolved far more quickly by a conversation than by anything formal, and we would much rather have that conversation.",
        ],
      },
    ],
    [name, site],
  );

  return (
    <LegalPage
      title="Terms & Conditions"
      subtitle="The terms on which we offer this website, and on which you use it."
      updated={LAST_UPDATED}
      intro={[
        `These terms set out the agreement between you and ${name} when you use this website — what you can expect from us, and what we ask of you in return.`,
        "We have written them in plain language rather than legal shorthand, because a document nobody can read protects nobody. Please read them alongside our Privacy Policy and Refund Policy.",
      ]}
      sections={sections}
      related={[
        { label: "Privacy Policy", to: "/privacy-policy" },
        { label: "Refund Policy", to: "/refund-policy" },
        { label: "Contact Us", to: "/contact" },
      ]}
    />
  );
};

export default Terms;
