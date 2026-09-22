import { z } from "zod";
import { isEmail, isPhone, isUrl } from "../utils/validators.js";
import {
  atMost,
  blankOr,
  dateBoundary,
  jsonArray,
  jsonGroup,
  mapEmbed,
  objectId,
  optionalText,
  positiveInt,
  requiredSecret,
  requiredText,
  sortKey,
} from "./fields.js";

/**
 * One schema per route, and every message here is the message the caller sees.
 *
 * Length caps are generous — no honest submission comes near them — but they
 * exist so a writer cannot store a megabyte of text per request. Checks run in
 * the order they are chained, so the first thing wrong with a field is the only
 * thing reported about it.
 */

/* ---------------------------------------------------------------- contacts */

const MAX_CONTACT = { name: 100, email: 254, message: 5000 };

/**
 * POST /api/contacts — the only unauthenticated write in the API, so nothing
 * from the body is trusted. Unknown keys are stripped by z.object(), which is
 * what keeps this from becoming `new Contact(req.body)`.
 */
export const contactBody = z.object({
  name: requiredText("Your name is required").refine(atMost(MAX_CONTACT.name), {
    message: `Name must be ${MAX_CONTACT.name} characters or fewer`,
  }),
  email: requiredText("An email address is required")
    .refine(isEmail, { message: "Enter a valid email address" })
    .refine(atMost(MAX_CONTACT.email), { message: "That email address is too long" }),
  number: requiredText("A contact number is required").refine(isPhone, {
    message: "Enter a valid contact number (7–15 digits)",
  }),
  message: requiredText("Please write a message").refine(atMost(MAX_CONTACT.message), {
    message: `Message must be ${MAX_CONTACT.message} characters or fewer`,
  }),
});

export const contactIdParams = z.object({ id: objectId("Contact not found") });

/* ------------------------------------------------------- admin list queries */

/**
 * Query strings for the two paginated admin lists.
 *
 * These describe a *view*, not a submission, so nothing here rejects: a junk
 * `?page=abc` or an unknown `?sort=` falls back to the default rather than
 * 400ing a screen the admin is only trying to look at. What they do enforce is
 * that every value reaching Mongo is a number, a Date or one of a fixed set of
 * sort keys — a query string can never name a field to sort on or smuggle an
 * operator into the filter.
 *
 * The sort keys are the ones the collection has an index for; see the
 * SORT_ORDERS tables in the controllers.
 */
const MAX_SEARCH = 200;

const listQueryBase = {
  page: positiveInt,
  limit: positiveInt,
  // Capped, then used as an escaped literal — see searchFilter() in
  // utils/pagination.js. A pathological term is a slow scan, not an injection.
  search: optionalText.refine(atMost(MAX_SEARCH), {
    message: `Search term must be ${MAX_SEARCH} characters or fewer`,
  }),
  from: dateBoundary,
  to: dateBoundary,
};

const CONTACT_SORTS = ["newest", "oldest", "nameAsc", "nameDesc"];
const DONATION_SORTS = ["newest", "oldest", "amountDesc", "amountAsc"];

export const contactListQuery = z.object({
  ...listQueryBase,
  sort: sortKey(CONTACT_SORTS),
});

export const donationListQuery = z.object({
  ...listQueryBase,
  sort: sortKey(DONATION_SORTS),
});

/* -------------------------------------------------------------------- auth */

// Both fields share one message: which half was wrong is not the caller's
// business. The cap is well above any real password and keeps a crafted one
// from being handed to bcrypt.
const CREDENTIALS_REQUIRED = "Username and password are required";
const CREDENTIALS_TOO_LONG = "Username or password is too long";
const MAX_CREDENTIAL = 200;

export const loginBody = z.object({
  username: requiredText(CREDENTIALS_REQUIRED).refine(atMost(MAX_CREDENTIAL), {
    message: CREDENTIALS_TOO_LONG,
  }),
  // Never trimmed: a password's leading and trailing spaces are part of it.
  password: requiredSecret(CREDENTIALS_REQUIRED).refine(atMost(MAX_CREDENTIAL), {
    message: CREDENTIALS_TOO_LONG,
  }),
});

/* --------------------------------------------------------------- donations */

// Razorpay itself caps a single order, and a donation this large would be
// arranged with the organization directly rather than typed into a web form.
const MAX_DONATION_RUPEES = 500000;

const DONATION_REQUIRED = "Name and mobile are required";
const INVALID_AMOUNT = "Invalid donation amount";

// Anything that isn't a finite number — "", null, "abc", Infinity, an object —
// becomes 0 and is reported by the min check below. Folding every one of them
// into a single message keeps zod's own "expected number, received NaN" out of
// a donor's alert box.
const donationAmount = z.preprocess((value) => {
  const amount = Number(value === "" || value === null ? NaN : value);
  return Number.isFinite(amount) ? amount : 0;
}, z.number().min(1, INVALID_AMOUNT).max(
  MAX_DONATION_RUPEES,
  `For donations above ₹${MAX_DONATION_RUPEES.toLocaleString(
    "en-IN"
  )}, please contact us directly`
));

export const createOrderBody = z.object({
  name: requiredText(DONATION_REQUIRED).refine(atMost(100), {
    message: "Name must be 100 characters or fewer",
  }),
  mobile: requiredText(DONATION_REQUIRED).refine(isPhone, {
    message: "Enter a valid mobile number",
  }),
  amount: donationAmount,
});

// Gateway ids land straight in a database query, so they are capped rather than
// pattern-matched — Razorpay is free to change its id format, but not to send
// a kilobyte of it.
const gatewayId = (blank) =>
  requiredText(blank).refine(atMost(256), { message: blank });

const PAYMENT_INCOMPLETE = "Incomplete payment details";

export const verifyPaymentBody = z.object({
  razorpay_order_id: gatewayId(PAYMENT_INCOMPLETE),
  razorpay_payment_id: gatewayId(PAYMENT_INCOMPLETE),
  razorpay_signature: gatewayId(PAYMENT_INCOMPLETE),
});

export const failedPaymentBody = z.object({
  razorpay_order_id: gatewayId("Order id is required"),
});

/* ------------------------------------------------------- projects, gallery */

/**
 * The admin panel describes the *final* image list as an ordered array of
 * slots. Everything the editor can do falls out of that one description:
 *
 *   unchanged  → an "existing" slot, kept as-is (never re-uploaded)
 *   added      → a "new" slot, uploaded and appended
 *   replaced   → the old image's slot swapped for a "new" one
 *   deleted    → the image simply has no slot
 *
 * `publicId` is optional because documents written before it existed are
 * identified by URL alone.
 */
const INVALID_SLOTS = "Invalid image slot payload";

const imageSlot = z.union([
  z.object({
    type: z.literal("existing"),
    publicId: z.string().optional(),
    url: z.string().optional(),
  }),
  z.object({
    type: z.literal("new"),
    fileIndex: z.number().int().nonnegative(),
  }),
]);

const slots = jsonArray(imageSlot, INVALID_SLOTS);

const PROJECT_REQUIRED = "Project name and description are required";
const PROJECT_CATEGORIES = ["current", "upcoming", "completed"];

// A plain refine rather than z.enum: the enum's own message lists every valid
// option back at the caller, which is noise in a form field.
const projectCategory = requiredText("Choose a valid project category").refine(
  (value) => PROJECT_CATEGORIES.includes(value),
  { message: "Choose a valid project category" }
);

export const projectCreateBody = z.object({
  name: requiredText(PROJECT_REQUIRED).refine(atMost(150), {
    message: "Project name must be 150 characters or fewer",
  }),
  category: projectCategory,
  description: requiredText(PROJECT_REQUIRED).refine(atMost(10000), {
    message: "Description must be 10000 characters or fewer",
  }),
});

// An update carries only what the admin actually changed, so every field is
// optional — an absent one leaves the stored value alone.
export const projectUpdateBody = z.object({
  name: optionalText.refine(atMost(150), {
    message: "Project name must be 150 characters or fewer",
  }),
  category: projectCategory.optional(),
  description: optionalText.refine(atMost(10000), {
    message: "Description must be 10000 characters or fewer",
  }),
  slots,
});

export const projectIdParams = z.object({ id: objectId("Project not found") });

export const galleryCreateBody = z.object({
  title: requiredText("Title is required").refine(atMost(150), {
    message: "Title must be 150 characters or fewer",
  }),
});

export const galleryUpdateBody = z.object({
  title: optionalText.refine(atMost(150), {
    message: "Title must be 150 characters or fewer",
  }),
  slots,
});

export const galleryIdParams = z.object({ id: objectId("Gallery not found") });

/* ---------------------------------------------------------------- settings */

export const SOCIAL_KEYS = ["facebook", "instagram", "twitter", "linkedin", "youtube"];
export const SEO_KEYS = ["metaTitle", "metaDescription", "metaKeywords"];

const SOCIAL_LABELS = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "Twitter (X)",
  linkedin: "LinkedIn",
  youtube: "YouTube",
};

// Built from SOCIAL_KEYS rather than declared inline, so adding a network is a
// one-line change here and in the admin form.
const socialGroup = z.object(
  Object.fromEntries(
    SOCIAL_KEYS.map((key) => [
      key,
      optionalText.refine(blankOr(isUrl), {
        message: `Enter a valid ${SOCIAL_LABELS[key]} URL`,
      }),
    ])
  )
);

const seoGroup = z.object({
  metaTitle: optionalText.refine(atMost(70), {
    message: "Meta title should be 70 characters or fewer",
  }),
  metaDescription: optionalText.refine(atMost(320), {
    message: "Meta description should be 320 characters or fewer",
  }),
  metaKeywords: optionalText,
});

/**
 * PUT /api/settings — a partial update. `undefined` means "the admin didn't
 * send this field, leave it alone"; an empty string means "clear it". That
 * distinction is why nothing here has a default.
 */
export const settingsUpdateBody = z.object({
  organizationName: optionalText
    .refine((value) => value === undefined || value !== "", {
      message: "Organization name is required",
    })
    .refine(atMost(120), {
      message: "Organization name must be 120 characters or fewer",
    }),
  tagline: optionalText,
  contactEmail: optionalText.refine(blankOr(isEmail), {
    message: "Enter a valid email address",
  }),
  contactNumber: optionalText.refine(blankOr(isPhone), {
    message: "Enter a valid contact number (7–15 digits)",
  }),
  whatsappNumber: optionalText.refine(blankOr(isPhone), {
    message: "Enter a valid WhatsApp number (7–15 digits)",
  }),
  address: optionalText,
  websiteUrl: optionalText.refine(blankOr(isUrl), {
    message: "Enter a valid URL starting with http:// or https://",
  }),
  // Only a Google Maps embed is accepted — this value is rendered as an iframe
  // src on the public Contact page. See isMapEmbedUrl in utils/validators.js.
  mapEmbedUrl: mapEmbed(
    "Paste a Google Maps embed link (https://www.google.com/maps/embed?…) or its full <iframe> code"
  ),
  social: jsonGroup(socialGroup),
  seo: jsonGroup(seoGroup),
  // Multipart sends these as the strings "true" / "1"; the controller reads
  // them as flags.
  removeLogo: z.unknown().optional(),
  removeFavicon: z.unknown().optional(),
});
