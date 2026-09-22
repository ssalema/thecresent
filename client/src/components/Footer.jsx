import { Link } from "react-router-dom";
import {
  LuMapPin,
  LuPhone,
  LuMail,
  LuClock,
  LuGlobe,
  LuFacebook,
  LuInstagram,
  LuTwitter,
  LuLinkedin,
  LuYoutube,
  LuChevronRight,
  LuArrowRight,
  LuHandHeart,
  LuHeart,
  LuMailOpen,
  LuShieldCheck,
  LuAward,
  LuUsers,
} from "react-icons/lu";
import { FaWhatsapp } from "react-icons/fa";
import { motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import LogoMark from "./LogoMark";
import { OnDarkSkeletonTheme } from "./ui/skeletons";
import { FOCUS_RING, TRANSITION } from "./ui/tokens";
import {
  useOrganizationContext,
  telHref,
  mailtoHref,
  whatsappHref,
  socialLinks,
} from "../context/OrganizationContext";

/**
 * The site footer.
 *
 * Four columns over a navy band — who we are, how to reach us, where to go
 * next, and one standing ask — then a newsletter strip and a legal bar.
 *
 * It is the site's only dark surface besides the page hero, so it is built
 * from that band's blue-950 ground with blue-400 as the accent, rather than
 * introducing a second palette at the bottom of every page. Radii, elevation,
 * motion curve, focus ring and the 44px hit area all come from the shared
 * tokens, so a control down here behaves like one anywhere else.
 *
 * Every organization detail — name, logo, tagline, address, phone, email,
 * socials — comes from Organization Settings and renders nothing when blank,
 * the same contract the rest of the site keeps. The only text baked in is the
 * footer's own marketing copy, gathered into the constants below so there is
 * one obvious place to edit it.
 */

/* ---------------------------------------------------------- editable copy */

/** The blurb under the logo. */
const ABOUT_BLURB =
  "We work towards building a better tomorrow by empowering communities, supporting the needy, and spreading hope where it's needed most.";

/**
 * Opening hours. These are not part of the Organization record, so unlike the
 * address and the phone number they are copy rather than data — edit them here.
 */
const OFFICE_HOURS = ["Mon - Sat: 10:00 AM - 6:00 PM", "Sunday Closed"];

/** The line beside the copyright. */
const THANK_YOU =
  "Thank you for being a part of our journey towards a better and compassionate world.";

/** The reassurance row in the legal bar. */
const TRUST_BADGES = [
  { icon: LuShieldCheck, lines: ["Secure", "Donations"] },
  { icon: LuAward, lines: ["80G", "Certified"] },
  { icon: LuUsers, lines: ["Transparent", "& Trusted"] },
];

/**
 * Quick links, in the two stacks the column renders side by side. Only routes
 * the app actually serves are listed — a footer link that lands on the 404
 * page is worse than no link at all.
 */
const QUICK_LINKS = [
  [
    { label: "Home", to: "/" },
    { label: "About Us", to: "/about" },
    { label: "Our Projects", to: "/projects" },
    { label: "Gallery", to: "/gallery" },
  ],
  [
    { label: "Contact Us", to: "/contact" },
    { label: "Donate", to: "/donate" },
  ],
];

/**
 * The policy documents, in the strip under the legal bar rather than among the
 * quick links — they are what a visitor looks for at the very bottom of a page,
 * and a payment gateway expects to find them there too.
 */
const LEGAL_LINKS = [
  { label: "Terms & Conditions", to: "/terms-and-conditions" },
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Refund Policy", to: "/refund-policy" },
];

/* -------------------------------------------------------------- internals */

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

// Filled brand tiles rather than the light footer's tinted glyphs: on navy a
// white-on-brand circle is the version that stays legible.
const SOCIAL_ICONS = {
  facebook: { Icon: LuFacebook, className: "bg-[#1877F2]" },
  instagram: {
    Icon: LuInstagram,
    className: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
  },
  twitter: { Icon: LuTwitter, className: "bg-[#1DA1F2]" },
  linkedin: { Icon: LuLinkedin, className: "bg-[#0A66C2]" },
  youtube: { Icon: LuYoutube, className: "bg-[#FF0000]" },
};

/** The focus ring, re-offset against the footer's own background. */
const RING_ON_NAVY = `${FOCUS_RING} focus-visible:ring-blue-400 focus-visible:ring-offset-blue-950`;

/** A column title with the short rule under it. */
const ColumnHeading = ({ children }) => (
  <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-white">
    {children}
    <span className="mt-2.5 block h-0.5 w-9 rounded-full bg-blue-400" aria-hidden="true" />
  </h3>
);

/** One contact line: outlined icon, then the value. */
const ContactRow = ({ icon: Icon, children }) => (
  <li className="flex items-start gap-3.5">
    <Icon
      size={19}
      strokeWidth={1.75}
      className="mt-0.5 flex-shrink-0 text-blue-400"
      aria-hidden="true"
    />
    <span className="min-w-0 text-sm leading-relaxed text-blue-100/90">{children}</span>
  </li>
);

/** Placeholder for one `ContactRow` — 19px icon, then the value. */
const ContactRowSkeleton = ({ width }) => (
  <li className="flex items-start gap-3.5">
    <Skeleton width={19} height={19} />
    <Skeleton height={14} width={width} containerClassName="block min-w-0 flex-1" />
  </li>
);

/** Contact values are links wherever the value is something you can act on. */
const CONTACT_LINK = `rounded-sm underline-offset-4 ${TRANSITION} hover:text-white hover:underline ${RING_ON_NAVY}`;

/** One brand-coloured social button. */
const SocialTile = ({ href, label, icon: Icon, className }) => (
  <motion.a
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    title={label}
    aria-label={label}
    className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-e1 ${TRANSITION} hover:shadow-e3 ${FOCUS_RING} focus-visible:ring-white focus-visible:ring-offset-blue-950 ${className}`}
  >
    <Icon size={18} />
  </motion.a>
);

/* ---------------------------------------------------------------- footer */

const Footer = () => {
  const { organization, loading } = useOrganizationContext();
  const {
    organizationName,
    tagline,
    address,
    contactNumber,
    contactEmail,
    whatsappNumber,
    websiteUrl,
  } = organization;

  const links = socialLinks(organization);
  const whatsapp = whatsappHref(whatsappNumber);

  /*
   * There is no newsletter endpoint on the API, so rather than pretend to
   * subscribe the visitor and drop the address on the floor, the form opens
   * their mail client addressed to the organization — a real request a human
   * answers. If Settings has no contact email there is nowhere to send it, so
   * the whole strip is left out instead of rendering a button that does
   * nothing.
   */
  const subscribe = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get("email");
    window.location.href = `${mailtoHref(contactEmail)}?subject=${encodeURIComponent(
      "Newsletter subscription",
    )}&body=${encodeURIComponent(
      `Please subscribe me to your newsletter.\n\nEmail: ${email}`,
    )}`;
    form.reset();
  };

  return (
    <OnDarkSkeletonTheme>
      <motion.footer
        variants={fadeIn}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="relative overflow-hidden bg-blue-950 text-blue-100"
      >
        {/* The faint wash in the top-right corner. Decoration only, so it is
            drawn in CSS rather than shipped as another image. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-800/25 blur-3xl"
        />

        {/* --------------------------------------------------- four columns */}
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:gap-8 lg:px-8 lg:py-16">
          {/* 1 — the organization */}
          <div>
            <div className="flex items-start gap-4">
              <LogoMark
                className="h-[74px] w-[74px] flex-shrink-0"
                rounded="rounded-xl"
                textClassName="text-2xl"
              />
              <div className="min-w-0 flex-1">
                {loading ? (
                  <>
                    <Skeleton height={22} width="85%" containerClassName="block" />
                    <Skeleton height={12} width="65%" containerClassName="mt-3 block" />
                  </>
                ) : (
                  <>
                    {organizationName && (
                      <h2 className="text-xl font-bold leading-snug tracking-tight text-white">
                        {organizationName}
                      </h2>
                    )}
                    {tagline && (
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-blue-400">
                        {tagline}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            <p className="mt-6 text-sm leading-relaxed text-blue-100/80">
              {ABOUT_BLURB}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {loading &&
                [0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} circle width={40} height={40} />
                ))}

              {!loading && whatsapp && (
                <SocialTile
                  href={whatsapp}
                  label="WhatsApp"
                  icon={FaWhatsapp}
                  className="bg-[#25D366]"
                />
              )}

              {!loading &&
                links.map(({ key, label, url }) => {
                  const tile = SOCIAL_ICONS[key];
                  if (!tile) return null;
                  return (
                    <SocialTile
                      key={key}
                      href={url}
                      label={label}
                      icon={tile.Icon}
                      className={tile.className}
                    />
                  );
                })}
            </div>
          </div>

          {/* 2 — how to reach us */}
          <div>
            <ColumnHeading>Contact Us</ColumnHeading>
            <ul className="mt-6 space-y-4">
              {loading ? (
                <>
                  <ContactRowSkeleton width="90%" />
                  <ContactRowSkeleton width="55%" />
                  <ContactRowSkeleton width="75%" />
                  <ContactRowSkeleton width="80%" />
                </>
              ) : (
                <>
                  {address && <ContactRow icon={LuMapPin}>{address}</ContactRow>}

                  {contactNumber && (
                    <ContactRow icon={LuPhone}>
                      <a href={telHref(contactNumber)} className={CONTACT_LINK}>
                        {contactNumber}
                      </a>
                    </ContactRow>
                  )}

                  {contactEmail && (
                    <ContactRow icon={LuMail}>
                      <a
                        href={mailtoHref(contactEmail)}
                        className={`break-all ${CONTACT_LINK}`}
                      >
                        {contactEmail}
                      </a>
                    </ContactRow>
                  )}

                  {websiteUrl && (
                    <ContactRow icon={LuGlobe}>
                      <a
                        href={websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`break-all ${CONTACT_LINK}`}
                      >
                        {websiteUrl.replace(/^https?:\/\//, "")}
                      </a>
                    </ContactRow>
                  )}

                  <ContactRow icon={LuClock}>
                    {OFFICE_HOURS.map((line, i) => (
                      <span
                        key={line}
                        className={i === 0 ? "block" : "block text-blue-100/65"}
                      >
                        {line}
                      </span>
                    ))}
                  </ContactRow>
                </>
              )}
            </ul>
          </div>

          {/* 3 — where to go next */}
          <div>
            <ColumnHeading>Quick Links</ColumnHeading>
            <div className="mt-6 grid grid-cols-2 gap-x-4">
              {QUICK_LINKS.map((column, i) => (
                <ul key={i} className="space-y-3.5">
                  {column.map(({ label, to }) => (
                    <li key={to}>
                      <Link
                        to={to}
                        className={`group inline-flex items-center gap-2 rounded-sm text-sm text-blue-100/90 ${TRANSITION} hover:text-white ${RING_ON_NAVY}`}
                      >
                        <LuChevronRight
                          size={15}
                          strokeWidth={2.5}
                          className={`flex-shrink-0 text-blue-400 ${TRANSITION} group-hover:translate-x-0.5`}
                          aria-hidden="true"
                        />
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>

          {/* 4 — the standing ask */}
          <div>
            <ColumnHeading>Our Cause</ColumnHeading>
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-5 shadow-e1">
              <div className="flex items-start gap-4">
                <span
                  className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/15 ring-1 ring-inset ring-blue-400/25"
                  aria-hidden="true"
                >
                  <LuHandHeart size={26} strokeWidth={1.6} className="text-blue-300" />
                </span>
                <div className="min-w-0">
                  <p className="text-base font-bold leading-snug text-white">
                    Help Us Make A Difference
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-blue-100/80">
                    Your support can bring hope and change lives.
                  </p>
                </div>
              </div>

              <Link
                to="/donate"
                className={`mt-5 inline-flex min-h-[44px] items-center gap-2.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white shadow-e1 ${TRANSITION} hover:bg-blue-700 hover:shadow-e2 active:bg-blue-800 active:scale-[0.98] active:shadow-none ${RING_ON_NAVY}`}
              >
                Donate Now
                <LuArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------- newsletter */}
        {!loading && contactEmail && (
          <div className="relative border-y border-white/10 bg-white/[0.04]">
            <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
              <div className="flex items-center gap-5">
                <span
                  className="hidden h-[74px] w-[74px] flex-shrink-0 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-inset ring-blue-400/25 sm:flex"
                  aria-hidden="true"
                >
                  <LuMailOpen size={30} strokeWidth={1.5} className="text-blue-300" />
                </span>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-white">
                    Stay Updated
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-blue-100/80">
                    Subscribe to our newsletter to get the latest updates on our
                    projects and impact stories.
                  </p>
                </div>
              </div>

              {/* One control on desktop: the field and the button share an
                  outline, so the seam between them is the only inner edge. */}
              <form
                onSubmit={subscribe}
                className="flex w-full flex-col gap-3 sm:flex-row sm:gap-0"
              >
                <label htmlFor="footer-newsletter" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-newsletter"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Enter your email address"
                  className={`min-h-[52px] w-full flex-1 rounded-lg border border-white/15 bg-white/[0.06] px-4 text-sm text-white placeholder:text-blue-100/50 ${TRANSITION} hover:border-white/25 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 sm:rounded-r-none`}
                />
                <button
                  type="submit"
                  className={`min-h-[52px] flex-shrink-0 rounded-lg bg-blue-600 px-8 text-sm font-semibold uppercase tracking-wide text-white ${TRANSITION} hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] ${RING_ON_NAVY} sm:rounded-l-none`}
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------- legal bar */}
        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 pb-6 pt-8 text-center sm:px-6 lg:flex-row lg:justify-between lg:gap-6 lg:px-8 lg:text-left">
          <p className="flex max-w-sm items-center gap-3.5 text-sm leading-relaxed text-blue-100/80">
            <LuHeart
              size={32}
              strokeWidth={1.4}
              className="hidden flex-shrink-0 text-blue-400 sm:block"
              aria-hidden="true"
            />
            {THANK_YOU}
          </p>

          <p className="text-sm text-blue-100/80">
            © {new Date().getFullYear()}{" "}
            {loading ? (
              <Skeleton width={170} height={14} containerClassName="inline-block" />
            ) : (
              organizationName && (
                <span className="font-semibold text-blue-400">{organizationName}.</span>
              )
            )}{" "}
            All rights reserved.
          </p>

          <ul className="flex items-stretch divide-x divide-white/10">
            {TRUST_BADGES.map(({ icon: Icon, lines }) => (
              <li
                key={lines.join(" ")}
                className="flex flex-col items-center gap-1.5 px-5 text-xs leading-tight text-blue-100/80"
              >
                <Icon
                  size={20}
                  strokeWidth={1.6}
                  className="text-blue-400"
                  aria-hidden="true"
                />
                {lines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </li>
            ))}
          </ul>
        </div>

        {/* ------------------------------------------------- policy strip */}
        <div className="relative border-t border-white/10">
          <nav
            aria-label="Legal"
            className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-1.5 gap-y-1 px-4 py-5 sm:px-6 lg:px-8"
          >
            {LEGAL_LINKS.map(({ label, to }, i) => (
              <span key={to} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span className="text-blue-100/30" aria-hidden="true">
                    |
                  </span>
                )}
                <Link
                  to={to}
                  className={`rounded-sm px-2 py-1 text-xs text-blue-100/70 underline-offset-4 ${TRANSITION} hover:text-white hover:underline ${RING_ON_NAVY} sm:text-sm`}
                >
                  {label}
                </Link>
              </span>
            ))}
          </nav>
        </div>
      </motion.footer>
    </OnDarkSkeletonTheme>
  );
};

export default Footer;
