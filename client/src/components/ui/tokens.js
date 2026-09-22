/**
 * The public site's styling tokens.
 *
 * The mirror of the admin panel's tokens.js — the two apps are one product, so
 * a button, an input and a card are built from the same radii, shadows, focus
 * rings and motion on both sides of the login. What differs is only what the
 * public site actually has: heroes and project tiles instead of tables and
 * dialogs.
 *
 * This module imports nothing, so anything can depend on it without risking an
 * import cycle.
 *
 *   surface    white, rounded-xl, hairline ring, elevation e1
 *   control    44px tall, rounded-lg, gray-300 outline that darkens on hover
 *              and thickens to blue-600 on focus
 *   motion     200ms on the `standard` curve
 *   focus      2px blue-500 ring, keyboard-only on buttons, always on inputs
 *   touch      44px minimum hit area
 */

/* ------------------------------------------------------------------ motion */

/** The default state transition: colour, shadow and transform together. */
export const TRANSITION = 'transition duration-200 ease-standard';

/* ------------------------------------------------------------------- focus */

/**
 * The ring appears for keyboard users but not after a mouse press, so the site
 * doesn't leave a ring behind every click. Colour is supplied per variant.
 */
export const FOCUS_RING = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

/* ----------------------------------------------------------------- headings */

/**
 * Two heading sizes, so a band's title is the same size on every page.
 *
 * `SectionHeading` renders HEADING_1 — the title of a major band, the one a
 * visitor reads while scrolling past. HEADING_2 is the title of a block inside
 * a band: a card's own heading, a slider's category, the panels on Contact.
 * Anything smaller is a `h3` and stays at text-xl.
 *
 * Pages were previously splitting the difference at text-2xl flat, text-xl
 * sm:text-2xl and text-2xl sm:text-3xl, so two headings of equal rank on two
 * pages came out at different sizes.
 */
export const HEADING_1 = 'text-3xl font-bold tracking-tight sm:text-4xl';
export const HEADING_2 = 'text-2xl font-bold tracking-tight sm:text-3xl';

/* --------------------------------------------------------------- dark bands */

/**
 * The navy every dark band on the site is built on — the page hero, the home
 * call-to-action, the closing bands on About, Gallery and Donate.
 *
 * One navy, not two: blue-900 as the ground with a blue-950 gradient breathed
 * over the top and bottom edge. The footer is the exception and sits on flat
 * blue-950, as the last surface on the page rather than a band within it.
 */
export const DARK_BAND = 'bg-blue-900 text-white';

/** The top-and-bottom gradient that sits over a dark band's ground. */
export const DARK_BAND_OVERLAY =
  'bg-gradient-to-b from-blue-950/40 via-transparent to-blue-950/40';

/* ----------------------------------------------------------------- surfaces */

/**
 * A panel with its ground left out — the radius, elevation and hairline ring
 * only. `Card` adds the ground itself so it can offer a tinted variant without
 * a page having to override `bg-white` with `!important`; everything else
 * wants the white panel below.
 */
export const SURFACE_BASE = 'rounded-xl shadow-e1 ring-1 ring-gray-900/5';

/**
 * The white panel used for contact details, project details and form cards.
 * The hairline ring keeps the edge legible where the shadow alone washes out.
 */
export const SURFACE = `${SURFACE_BASE} bg-white`;

/** A tile that lifts under the cursor — project cards and gallery items. */
export const SURFACE_INTERACTIVE = `rounded-xl bg-white shadow-e1 ring-1 ring-gray-900/5 ${TRANSITION} hover:-translate-y-1 hover:shadow-e3`;

/**
 * A clickable photo that opens the lightbox — the gallery grid, the home
 * strip and the project detail shots. Add the size and any layout classes at
 * the call site; everything shared about how the tile looks lives here.
 */
export const MEDIA_TILE = `group relative block overflow-hidden rounded-xl shadow-e2 ${TRANSITION} hover:shadow-e3 ${FOCUS_RING} focus-visible:ring-blue-500`;

/* ------------------------------------------------------------------ controls */

/**
 * Inputs, textareas and selects. Focus is `focus:` rather than
 * `focus-visible:` — a text field should always show where the caret is,
 * however it was reached.
 */
export const controlClass = (error) =>
  [
    'w-full rounded-lg border bg-white text-gray-900 shadow-sm',
    'placeholder:text-gray-400',
    TRANSITION,
    'min-h-[44px] px-3.5 py-3',
    'focus:outline-none focus:ring-2',
    error
      ? 'border-red-400 hover:border-red-500 focus:border-red-500 focus:ring-red-500/25'
      : 'border-gray-300 hover:border-gray-400 focus:border-blue-600 focus:ring-blue-500/25',
    'disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500',
  ].join(' ');

/** The chevron drawn over a native <select> once its own arrow is removed. */
export const SELECT_CHEVRON =
  'pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400';

/**
 * A contact value that is something you can act on — a phone number, an email
 * address, a website. Contact, the legal pages and the footer each print the
 * same rows, so the link inside them behaves the same way in all three.
 */
export const CONTACT_LINK = `rounded-sm underline-offset-4 ${TRANSITION} hover:text-blue-700 hover:underline ${FOCUS_RING} focus-visible:ring-blue-500`;

/** Field labels, and the hint / error line underneath a control. */
export const LABEL = 'mb-1.5 block text-sm font-medium text-gray-700';
export const HINT = 'mt-1.5 text-sm text-gray-500';
export const ERROR_TEXT = 'mt-1.5 text-sm font-medium text-red-600';
