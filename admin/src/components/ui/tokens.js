/**
 * The admin panel's styling tokens.
 *
 * Every shared class string lives here so a radius, a focus ring or a shadow is
 * written once and every component that renders one stays in step. The UI kit
 * (ui.jsx), the toolbar (Filters.jsx), the pager (Pagination.jsx), the dialogs
 * and the loading placeholders (skeletons.jsx) all read from this file.
 *
 * This module deliberately imports nothing — `ui.jsx` pulls in `Sidebar`, which
 * pulls in `skeletons.jsx`, so anything those files share has to sit on a leaf
 * to avoid an import cycle.
 *
 * The design language, in one place:
 *
 *   surface    white, rounded-xl, hairline ring, elevation e1
 *   control    44px tall, rounded-lg, gray-300 outline that darkens on hover
 *              and thickens to blue-600 on focus
 *   motion     200ms on the `standard` curve; dialogs use `emphasized`
 *   focus      2px blue-500 ring, keyboard-only on buttons, always on inputs
 *   touch      44px minimum hit area below `sm`
 */

/* ------------------------------------------------------------------ motion */

/** The default state transition: colour, shadow and transform together. */
export const TRANSITION = 'transition duration-200 ease-standard';

/* ------------------------------------------------------------------- focus */

/**
 * Buttons and other click targets: the ring appears for keyboard users but not
 * after a mouse press, so the panel doesn't leave a ring behind every click.
 * The colour is supplied per variant; this is the shape of the ring only.
 */
export const FOCUS_RING = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

/** Same, without the offset — for controls that sit flush inside a group. */
export const FOCUS_RING_TIGHT = 'focus:outline-none focus-visible:ring-2';

/* ----------------------------------------------------------------- surfaces */

/**
 * The white panel every screen is built from. The hairline ring keeps the edge
 * legible on the gray-50 canvas, where a shadow alone washes out.
 */
export const SURFACE = 'rounded-xl bg-white shadow-e1 ring-1 ring-gray-900/5';

/** A record rendered as a card at the mobile breakpoint. */
export const MOBILE_CARD = 'rounded-xl bg-white p-4 shadow-e1 ring-1 ring-gray-900/5';

/* ------------------------------------------------------------------ controls */

/**
 * Inputs, textareas and selects.
 *
 * `size` is 'md' for form fields and 'sm' for the filter toolbar, which sits
 * above a table and has to stay compact. Both keep a 44px hit area on a phone.
 *
 * Focus is `focus:` rather than `focus-visible:` — a text field should always
 * show where the caret is, however it was reached.
 */
export const controlClass = (error, size = 'md') =>
  [
    'w-full rounded-lg border bg-white text-gray-900 shadow-sm',
    'placeholder:text-gray-400',
    TRANSITION,
    size === 'sm' ? 'min-h-[44px] px-3 py-2.5 text-sm sm:min-h-0' : 'min-h-[44px] px-3.5 py-3',
    'focus:outline-none focus:ring-2',
    error
      ? 'border-red-400 hover:border-red-500 focus:border-red-500 focus:ring-red-500/25'
      : 'border-gray-300 hover:border-gray-400 focus:border-blue-600 focus:ring-blue-500/25',
    'disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500',
  ].join(' ');

/** The chevron drawn over a native <select> once its own arrow is removed. */
export const SELECT_CHEVRON =
  'pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400';

/** Field labels, and the hint / error line underneath a control. */
export const LABEL = 'mb-1.5 block text-sm font-medium text-gray-700';
export const HINT = 'mt-1.5 text-sm text-gray-500';
export const ERROR_TEXT = 'mt-1.5 text-sm font-medium text-red-600';

/* -------------------------------------------------------------------- table */

/**
 * The table shell and its header row. `DataTable` and `TableSkeleton` render
 * the same markup from these, so the placeholder lines up column-for-column
 * with the rows that replace it.
 */
export const TABLE_SHELL = 'overflow-x-auto rounded-xl border border-gray-200 bg-white';
export const TABLE = 'min-w-full divide-y divide-gray-200 text-sm';
export const THEAD = 'bg-gray-50';
export const THEAD_CELL =
  'whitespace-nowrap px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600';
export const TBODY = 'divide-y divide-gray-100 bg-white';
export const TD_CELL = 'px-4 py-3.5 align-middle text-gray-700';

/* -------------------------------------------------------------------- misc */

/**
 * Circled icon beside a card, modal or empty-state heading.
 *
 * Blue is the panel's accent and the default, but the circle carries meaning
 * wherever the heading does: an error card is red, a warning amber. The tints
 * are the same soft-fill / inset-ring pair `Badge` uses, so a heading badge and
 * a status pill of the same colour read as one family.
 */
const ICON_CIRCLE_TONES = {
  blue: 'bg-blue-50 text-blue-600 ring-blue-100',
  gray: 'bg-gray-100 text-gray-500 ring-gray-200',
  green: 'bg-green-50 text-green-600 ring-green-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  red: 'bg-red-50 text-red-600 ring-red-100',
};

export const iconCircle = (tone = 'blue') =>
  `flex flex-shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${
    ICON_CIRCLE_TONES[tone] || ICON_CIRCLE_TONES.blue
  }`;

/** The accent-toned circle, which is what most headings want. */
export const ICON_CIRCLE = iconCircle('blue');

/**
 * The small uppercase caption above a value: the label half of a `CardRow`, and
 * every field label in a detail view. Written once so a record read as a card
 * on a phone and the same record read in a dialog are labelled identically.
 */
export const META_LABEL =
  'text-xs font-medium uppercase tracking-wide text-gray-500';

/**
 * A dashed drop target: the upload tile in `ImageGrid` and the logo / favicon
 * pickers in Organization Settings. Both wrap a hidden <input>, so the ring is
 * `focus-within:` — the box is what the admin sees, but the input is what
 * actually takes focus.
 *
 * The flex direction is left to the caller: a square tile stacks its icon over
 * its caption, a one-line picker sets them side by side. Tailwind emits
 * `flex-row` before `flex-col`, so a direction fixed here could not be
 * overridden at the call site however the class strings were ordered.
 */
export const DROPZONE = `flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-600 ${TRANSITION} hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 active:scale-[0.98] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/25`;
