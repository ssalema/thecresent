import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LuFileText, LuChevronRight, LuMail, LuPhone, LuMapPin } from "react-icons/lu";
import Skeleton from "react-loading-skeleton";
import { PageHero, Section, Card, IconBadge } from "./ui";
import { CONTACT_LINK, FOCUS_RING, TRANSITION } from "./ui/tokens";
import {
  useOrganizationContext,
  telHref,
  mailtoHref,
} from "../context/OrganizationContext";

/**
 * The shared layout behind Terms & Conditions, Privacy Policy and Refund Policy.
 *
 * The three are the same document with different words in it, so they are one
 * layout driven by data rather than three near-copies of the same markup — the
 * pattern `PageHero` already established for the inner pages.
 *
 * A page is the site's standard hero, then a two-column body: a contents rail
 * that sticks under the navbar on desktop, and the clauses themselves on the
 * white `Card` surface every other page uses. It closes with the organization's
 * own contact details, because each of these documents ends by telling the
 * reader who to write to — and those details come from Organization Settings,
 * never hardcoded, the same contract the rest of the site keeps.
 *
 * A section is `{ id, title, body }`, where each body entry is either a
 * paragraph string or `{ list: [...] }` for a bulleted block.
 */

/* ------------------------------------------------------------------ pieces */

/** One clause: the numbered heading, then its paragraphs and lists. */
const Clause = ({ index, id, title, body }) => (
  <Card id={id} className="scroll-mt-24">
    <h2 className="flex items-start gap-3 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
      <span
        className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700 ring-1 ring-inset ring-blue-100"
        aria-hidden="true"
      >
        {index}
      </span>
      {title}
    </h2>

    <div className="mt-4 space-y-4 sm:pl-11">
      {body.map((entry, i) =>
        typeof entry === "string" ? (
          <p key={i} className="text-sm leading-relaxed text-gray-600 sm:text-base">
            {entry}
          </p>
        ) : (
          <ul key={i} className="space-y-2.5">
            {entry.list.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-600 sm:text-base"
              >
                <LuChevronRight
                  size={16}
                  strokeWidth={2.5}
                  className="mt-1 flex-shrink-0 text-blue-600"
                  aria-hidden="true"
                />
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  </Card>
);

/** One line of the closing contact card. */
const ContactRow = ({ icon, label, children }) => (
  <li className="flex items-start gap-3">
    <IconBadge icon={icon} />
    <div className="min-w-0 pt-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <div className="mt-0.5 break-words text-sm text-gray-800 sm:text-base">
        {children}
      </div>
    </div>
  </li>
);


/* -------------------------------------------------------------------- page */

const LegalPage = ({ title, subtitle, updated, intro, sections, related = [] }) => {
  const { organization, loading } = useOrganizationContext();
  const { organizationName, address, contactNumber, contactEmail } = organization;

  // Which clause the reader is in, so the contents rail can mark their place.
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const headings = sections
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean);
    if (!headings.length) return undefined;

    // The band just under the fixed navbar: whichever clause crosses it is the
    // one being read.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="bg-gray-50 pt-16">
      <PageHero title={title} subtitle={subtitle} />

      <Section containerClassName="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
        {/* ------------------------------------------------- contents rail */}
        <aside className="lg:col-span-4 xl:col-span-3">
          <div className="lg:sticky lg:top-24">
            <Card padding="compact">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                <LuFileText size={15} strokeWidth={2} aria-hidden="true" />
                On this page
              </p>

              <nav aria-label="Contents" className="mt-4">
                <ol className="space-y-1">
                  {sections.map(({ id, title: clause }, i) => (
                    <li key={id}>
                      <a
                        href={`#${id}`}
                        aria-current={active === id ? "true" : undefined}
                        className={`flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm leading-snug ${TRANSITION} ${FOCUS_RING} focus-visible:ring-blue-500 ${
                          active === id
                            ? "bg-blue-50 font-semibold text-blue-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <span className="w-4 flex-shrink-0 text-right tabular-nums">
                          {i + 1}.
                        </span>
                        <span className="min-w-0">{clause}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>

              {related.length > 0 && (
                <div className="mt-5 border-t border-gray-100 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                    Related
                  </p>
                  <ul className="mt-3 space-y-1">
                    {related.map(({ label, to }) => (
                      <li key={to}>
                        <Link
                          to={to}
                          className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 ${TRANSITION} hover:bg-gray-50 hover:text-blue-700 ${FOCUS_RING} focus-visible:ring-blue-500`}
                        >
                          <LuChevronRight
                            size={15}
                            strokeWidth={2.5}
                            className={`flex-shrink-0 text-blue-600 ${TRANSITION} group-hover:translate-x-0.5`}
                            aria-hidden="true"
                          />
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </div>
        </aside>

        {/* ---------------------------------------------------- the clauses */}
        <div className="space-y-6 lg:col-span-8 xl:col-span-9">
          {/* The preamble, on the blue-tinted card About uses for an aside. */}
          <Card tone="blue" className="shadow-e2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
              Last updated: {updated}
            </p>
            {loading ? (
              <Skeleton height={16} count={3} containerClassName="mt-4 block" />
            ) : (
              intro.map((paragraph, i) => (
                <p
                  key={i}
                  className={`${
                    i === 0 ? "mt-4" : "mt-3"
                  } text-sm leading-relaxed text-gray-700 sm:text-base`}
                >
                  {paragraph}
                </p>
              ))
            )}
          </Card>

          {sections.map((section, i) => (
            <Clause key={section.id} index={i + 1} {...section} />
          ))}

          {/* ----------------------------------------------- who to write to */}
          <Card>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              Questions About This Policy?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
              If anything here is unclear, or you would like to raise any of the
              matters described above, write to us and a person will answer you.
            </p>

            <ul className="mt-6 space-y-4">
              {loading ? (
                <>
                  <Skeleton height={40} containerClassName="block" />
                  <Skeleton height={40} containerClassName="block" />
                </>
              ) : (
                <>
                  {contactEmail && (
                    <ContactRow icon={LuMail} label="Email">
                      <a href={mailtoHref(contactEmail)} className={CONTACT_LINK}>
                        {contactEmail}
                      </a>
                    </ContactRow>
                  )}
                  {contactNumber && (
                    <ContactRow icon={LuPhone} label="Phone">
                      <a href={telHref(contactNumber)} className={CONTACT_LINK}>
                        {contactNumber}
                      </a>
                    </ContactRow>
                  )}
                  {address && (
                    <ContactRow icon={LuMapPin} label="Address">
                      {organizationName ? `${organizationName}, ` : ""}
                      {address}
                    </ContactRow>
                  )}
                </>
              )}
            </ul>
          </Card>
        </div>
      </Section>
    </div>
  );
};

export default LegalPage;
