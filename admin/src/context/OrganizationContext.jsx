import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from '../lib/api';

/**
 * Shape of the organization record, with every field blank.
 *
 * This is deliberately empty: no organization detail is hardcoded anywhere in
 * the app, so until /api/settings answers there is simply nothing to show. Any
 * component reading a blank value is expected to render nothing for it.
 */
export const EMPTY_ORGANIZATION = {
  organizationName: "",
  tagline: "",
  contactEmail: "",
  contactNumber: "",
  whatsappNumber: "",
  address: "",
  websiteUrl: "",
  mapEmbedUrl: "",
  logo: { url: "", publicId: "" },
  favicon: { url: "", publicId: "" },
  social: {
    facebook: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    youtube: "",
  },
  seo: { metaTitle: "", metaDescription: "", metaKeywords: "" },
};

// The API may predate a field (or a network hiccup may hand back a partial
// object), so merge onto the empty shape rather than trusting the response.
export const normalizeOrganization = (data) => {
  const source = data && typeof data === "object" ? data : {};
  return {
    ...EMPTY_ORGANIZATION,
    ...source,
    logo: { ...EMPTY_ORGANIZATION.logo, ...(source.logo || {}) },
    favicon: { ...EMPTY_ORGANIZATION.favicon, ...(source.favicon || {}) },
    social: { ...EMPTY_ORGANIZATION.social, ...(source.social || {}) },
    seo: { ...EMPTY_ORGANIZATION.seo, ...(source.seo || {}) },
  };
};

// ---------------------------------------------------------------------------
// Link helpers — every tel:/mailto:/wa.me link in the app is built from these,
// so a number entered as "+91 8347 117507" still produces a dialable href.
// ---------------------------------------------------------------------------

export const digitsOnly = (value) => String(value ?? "").replace(/\D/g, "");

export const telHref = (number) => {
  const raw = String(number ?? "").trim();
  if (!raw) return "";
  const digits = digitsOnly(raw);
  if (!digits) return "";
  return `tel:${raw.startsWith("+") ? "+" : ""}${digits}`;
};

export const mailtoHref = (email) => {
  const value = String(email ?? "").trim();
  return value ? `mailto:${value}` : "";
};

export const whatsappHref = (number, message) => {
  const digits = digitsOnly(number);
  if (!digits) return "";
  const text = String(message ?? "").trim();
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
};

const SOCIAL_ORDER = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "twitter", label: "Twitter" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
];

// Only the networks the admin actually filled in get an icon.
export const socialLinks = (organization) =>
  SOCIAL_ORDER.map(({ key, label }) => ({
    key,
    label,
    url: String(organization?.social?.[key] ?? "").trim(),
  })).filter((link) => link.url);

/**
 * Up to two initials from the organization name.
 *
 * This is what stands in wherever a logo would go when none has been uploaded.
 * No mark is bundled with the app, so a fresh install never shows some other
 * organization's branding while its own settings are still empty.
 */
export const initialsOf = (name) =>
  String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

const OrganizationContext = createContext({
  organization: EMPTY_ORGANIZATION,
  loading: true,
  setOrganization: () => {},
});

/**
 * Loads the organization record once, at the root of the app, and shares it
 * with every component below. Nothing else in the app calls /api/settings on
 * render, so there are no duplicate requests.
 */
export const OrganizationProvider = ({ children }) => {
  const [organization, setOrganizationState] = useState(EMPTY_ORGANIZATION);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/settings')
      // A failure leaves the blank record in place: the panel still renders and
      // the settings screen can save a fresh one over it.
      .then((res) => setOrganizationState(normalizeOrganization(res.data)))
      .catch((err) => console.error("Error loading organization settings:", err))
      .finally(() => setLoading(false));
  }, []);

  // Lets the settings screen push the saved document straight into context after
  // a successful update, so the change is visible without a second round trip.
  const setOrganization = useCallback(
    (data) => setOrganizationState(normalizeOrganization(data)),
    []
  );

  const value = useMemo(
    () => ({ organization, loading, setOrganization }),
    [organization, loading, setOrganization]
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganizationContext = () => useContext(OrganizationContext);

// The common case: a component just wants the values.
export const useOrganization = () => useContext(OrganizationContext).organization;
