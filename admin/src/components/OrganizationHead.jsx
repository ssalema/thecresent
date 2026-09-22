import { useEffect } from "react";
import { useOrganization } from "../context/OrganizationContext";

// Find the tag if it exists, otherwise create it — so repeated updates (an
// admin saving new SEO settings) rewrite the same node instead of stacking.
const upsertTag = (tagName, selector, attributes) => {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(tagName);
    document.head.appendChild(el);
  }
  for (let [key, value] of Object.entries(attributes)) el.setAttribute(key, value);
  return el;
};

const setMeta = (attr, key, content) => {
  const selector = `meta[${attr}="${key}"]`;
  if (!content) {
    document.head.querySelector(selector)?.remove();
    return;
  }
  upsertTag("meta", selector, { [attr]: key, content });
};

/**
 * Applies the organization's branding to the document head: page title, SEO
 * meta tags, Open Graph preview and the browser favicon. Rendered once from
 * App, so uploading a new favicon or editing the meta title in the admin panel
 * is reflected on the next page load with no code change or redeploy.
 *
 * `pageTitle` lets an individual page prefix the organization name.
 */
const OrganizationHead = ({ pageTitle }) => {
  const organization = useOrganization();

  const { organizationName, tagline, websiteUrl } = organization;
  const { metaTitle, metaDescription, metaKeywords } = organization.seo;
  const logoUrl = organization.logo?.url || "";
  const faviconUrl = organization.favicon?.url || "";

  useEffect(() => {
    const baseTitle = metaTitle || organizationName;
    if (baseTitle) {
      document.title = pageTitle ? `${pageTitle} | ${baseTitle}` : baseTitle;
    }

    const description = metaDescription || tagline;
    setMeta("name", "description", description);
    setMeta("name", "keywords", metaKeywords);

    setMeta("property", "og:site_name", organizationName);
    setMeta("property", "og:title", document.title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", logoUrl);
    setMeta("property", "og:url", websiteUrl);
    setMeta("property", "og:type", "website");

    setMeta("name", "twitter:card", logoUrl ? "summary_large_image" : "summary");
    setMeta("name", "twitter:title", document.title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", logoUrl);
  }, [
    pageTitle,
    metaTitle,
    metaDescription,
    metaKeywords,
    organizationName,
    tagline,
    websiteUrl,
    logoUrl,
  ]);

  useEffect(() => {
    // The favicon field is optional, so it cascades to the logo the same way
    // metaTitle cascades to the organization name. Without this an admin who
    // uploads a logo but skips the favicon keeps the placeholder in the tab.
    const iconUrl = faviconUrl || logoUrl;
    if (!iconUrl) return;

    // Replace whatever the static index.html shipped with, including the
    // apple-touch variant, so every surface picks up the uploaded icon. The
    // static tag declares type="image/svg+xml"; the upload may be a .png or
    // .ico, so the type is dropped and the browser sniffs it instead.
    const icon = upsertTag("link", 'link[rel="icon"]', { rel: "icon", href: iconUrl });
    icon.removeAttribute("type");
    upsertTag("link", 'link[rel="apple-touch-icon"]', {
      rel: "apple-touch-icon",
      href: iconUrl,
    });
  }, [faviconUrl, logoUrl]);

  return null;
};

export default OrganizationHead;
