/**
 * Bakes Organization Settings into index.html at build time.
 *
 * <OrganizationHead /> already writes the title, SEO meta, Open Graph tags and
 * favicon at runtime, which is enough for browsers and for Google. It is not
 * enough for link-preview scrapers — WhatsApp, Facebook, Slack, LinkedIn and
 * most others read the raw HTML and never run the bundle, so they would only
 * ever see the placeholder `Loading…` title this file ships with.
 *
 * So the same values are fetched once from `GET /api/settings` during the build
 * and written straight into the served HTML. The runtime component then finds
 * those exact tags by selector and rewrites them in place rather than stacking
 * duplicates, so the two paths agree instead of competing.
 *
 * The trade-off this buys: previews are a snapshot of the last deploy. Editing
 * the meta title in the admin panel updates the live page immediately but not
 * the preview cards until the site is rebuilt.
 *
 * The build must never depend on the API being awake — a free-tier server that
 * is asleep, or a wrong URL, degrades to today's runtime-only behaviour with a
 * warning rather than failing the deploy.
 */

const FETCH_TIMEOUT_MS = 15000;

const escapeAttr = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// An empty value emits nothing at all. A `content=""` tag is worse than a
// missing one: scrapers treat it as an intentional blank instead of falling
// back to the page's own text.
const metaTag = (attr, key, content) =>
  content ? `    <meta ${attr}="${key}" content="${escapeAttr(content)}" />\n` : "";

const fetchSettings = async (apiBase) => {
  const url = `${apiBase.replace(/\/+$/, "")}/settings`;
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};

/**
 * Mirrors <OrganizationHead /> exactly, including both of its fallbacks:
 * metaTitle cascades to the organization name, metaDescription to the tagline,
 * and the favicon to the logo. Any change to one belongs in the other.
 */
const buildHead = (settings) => {
  const { organizationName = "", tagline = "", websiteUrl = "" } = settings;
  const { metaTitle = "", metaDescription = "", metaKeywords = "" } = settings.seo || {};
  const logoUrl = settings.logo?.url || "";
  const faviconUrl = settings.favicon?.url || "";

  const title = metaTitle || organizationName;
  const description = metaDescription || tagline;
  const iconUrl = faviconUrl || logoUrl;

  let head = "";
  head += metaTag("name", "description", description);
  head += metaTag("name", "keywords", metaKeywords);

  head += metaTag("property", "og:site_name", organizationName);
  head += metaTag("property", "og:title", title);
  head += metaTag("property", "og:description", description);
  head += metaTag("property", "og:image", logoUrl);
  head += metaTag("property", "og:url", websiteUrl);
  head += metaTag("property", "og:type", "website");

  head += metaTag("name", "twitter:card", logoUrl ? "summary_large_image" : "summary");
  head += metaTag("name", "twitter:title", title);
  head += metaTag("name", "twitter:description", description);
  head += metaTag("name", "twitter:image", logoUrl);

  // No `type` attribute: the upload may be a .png or an .ico, and declaring the
  // wrong one is worse than letting the browser sniff it.
  if (iconUrl) {
    head += `    <link rel="icon" href="${escapeAttr(iconUrl)}" />\n`;
    head += `    <link rel="apple-touch-icon" href="${escapeAttr(iconUrl)}" />\n`;
  }

  return { title, head };
};

export default function organizationMeta() {
  let apiBase = "";

  return {
    name: "organization-meta",
    // Build only. The dev server has no scrapers to satisfy, and this would
    // put a network call in front of every page reload.
    apply: "build",

    configResolved(config) {
      // Build time: there is no page to derive a host from, so an unset
      // VITE_API_URL falls back to a local API on VITE_API_PORT (5000).
      apiBase =
        config.env.VITE_API_URL ||
        `http://localhost:${config.env.VITE_API_PORT || 5000}/api`;
    },

    async transformIndexHtml(html) {
      let settings;
      try {
        settings = await fetchSettings(apiBase);
      } catch (err) {
        console.warn(
          `\n[organization-meta] Could not read settings from ${apiBase} (${err.message}).\n` +
            `[organization-meta] Building without baked-in meta tags: the site is fine, but\n` +
            `[organization-meta] link previews will fall back to the placeholder title.\n`
        );
        return html;
      }

      const { title, head } = buildHead(settings);
      let out = html;

      if (title) {
        out = out.replace(
          /<title>[\s\S]*?<\/title>/,
          `<title>${escapeAttr(title)}</title>`
        );
      }

      // Appended just before </head> rather than via the `tags` API so the
      // block lands after the placeholder title and reads as one unit in the
      // built file.
      out = out.replace(
        "</head>",
        `\n    <!-- Baked in at build time from Organization Settings; see plugins/organizationMeta.js -->\n${head}  </head>`
      );

      console.log(`[organization-meta] Baked in settings for "${title || "(unnamed)"}"`);
      return out;
    },
  };
}
