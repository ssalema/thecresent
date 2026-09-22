import { z } from "zod";
import { extractMapSrc } from "../utils/validators.js";

/**
 * Zod building blocks shared by every route schema.
 *
 * The format rules themselves still live in utils/validators.js — these wrap
 * them so a schema reads as a description of the payload rather than a pile of
 * if-statements. The admin panel and the website mirror the same rules in their
 * own schemas, but the server is the authority.
 */

// Bodies arrive from three places: JSON, multipart/form-data (where everything
// is a string) and query strings. Coercing here means a schema never has to
// care which, and a stray number or boolean is read as the text the caller
// meant.
//
// An object or array where text was expected is junk rather than a value, and
// reads as blank — so the field reports its own "required" wording instead of
// zod's "expected string, received object", and "[object Object]" is never
// stored.
const coerce = (value, { trim }) => {
  if (value === undefined) return undefined;
  if (value === null) return "";
  if (typeof value === "object") return "";
  const asString = String(value);
  return trim ? asString.trim() : asString;
};

const asText = (value) => coerce(value, { trim: true });

/**
 * A required, trimmed string. `blank` is the message shown when it is missing
 * or empty — "not sent" and "sent empty" are the same thing to a required
 * field, and both deserve the field's own wording rather than zod's "Required".
 */
export const requiredText = (blank) =>
  z.preprocess(
    (value) => (value === undefined ? "" : asText(value)),
    z.string({ invalid_type_error: blank }).min(1, blank)
  );

/**
 * An optional, trimmed string.
 *
 * `undefined` survives as `undefined`, which is what lets a partial update tell
 * "leave this field alone" apart from "clear this field" (an empty string).
 */
export const optionalText = z.preprocess(
  asText,
  z.string({ invalid_type_error: "Expected text" }).optional()
);

/** Like requiredText but never trimmed — a password's spaces are the user's. */
export const requiredSecret = (blank) =>
  z.preprocess(
    (value) => (value === undefined ? "" : coerce(value, { trim: false })),
    z.string({ invalid_type_error: blank }).min(1, blank)
  );

/**
 * Google Maps hands admins a full `<iframe …>` snippet. Accept either that or
 * the bare src and keep only the URL, so the frontend can drop it into `src=`.
 * Blank clears the field; absent leaves it alone.
 */
export const mapEmbed = (message) =>
  z.preprocess(asText, z.string().optional()).transform((value, ctx) => {
    if (value === undefined || value === "") return value;

    const src = extractMapSrc(value);
    if (!src) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
      return z.NEVER;
    }
    return src;
  });

/**
 * A field that travels as JSON because multipart/form-data flattens objects to
 * strings. A plain object is accepted too, for callers that post
 * application/json. Anything unparseable reads as "not sent", which is how the
 * hand-rolled parser this replaces behaved.
 */
export const jsonGroup = (schema) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === "") return undefined;
    if (typeof value === "object") return Array.isArray(value) ? undefined : value;
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : undefined;
    } catch {
      return undefined;
    }
  }, schema.optional());

/**
 * A JSON-encoded array. Unlike jsonGroup, a malformed payload here is an error
 * rather than an omission: the caller meant to describe something and got it
 * wrong, and silently ignoring that would discard their edit.
 *
 * Unparseable JSON, a non-array and a bad element all report the same message
 * at the field itself — the caller cannot act on "index 3 failed the second
 * branch of a union", and the admin panel builds this payload rather than a
 * person typing it.
 */
export const jsonArray = (schema, invalidMessage) =>
  z
    .unknown()
    .transform((value, ctx) => {
      if (value === null || value === "") return undefined;

      let parsed = value;
      if (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: invalidMessage });
          return z.NEVER;
        }
      }

      const result = z.array(schema).safeParse(parsed);
      if (!result.success) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: invalidMessage });
        return z.NEVER;
      }
      return result.data;
    })
    // Outside the transform, so an absent field short-circuits and never has
    // to be represented as a successful "undefined" result.
    .optional();

/** Mongo ObjectId, checked here so a CastError never becomes a 500. */
export const objectId = (message) => z.string().regex(/^[a-f\d]{24}$/i, { message });

/**
 * A positive integer from a query string, where everything arrives as text.
 *
 * Absent stays absent so the caller can apply its own default; anything that
 * isn't a whole number ≥ 1 (`"abc"`, `"0"`, `"-3"`, `"1.5"`) is treated the same
 * way — a pager reading a junk `?page=` should show page one, not a 400.
 */
export const positiveInt = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : undefined;
}, z.number().int().min(1).optional());

/**
 * A date boundary from a query string — either a full ISO instant or a bare
 * `YYYY-MM-DD`. An unparseable value reads as "no bound" rather than an error,
 * for the same reason as positiveInt: a filter is a view, not a submission.
 */
export const dateBoundary = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}, z.date().optional());

/**
 * One of a fixed set of sort keys, falling back to the first when the caller
 * asks for something unknown. The key names an ordering the endpoint supports;
 * the ordering itself is a server-side lookup, so a query string can never
 * inject a sort on an unindexed field.
 */
export const sortKey = (allowed) =>
  z.preprocess((value) => {
    const key = asText(value);
    return key && allowed.includes(key) ? key : allowed[0];
  }, z.enum(allowed));

/* ------------------------------------------------------------- predicates */
/* These return booleans, never messages — `.refine` treats any truthy return
   as a pass, so a helper that returned its own error text would never fail. */

/** Length cap that tolerates an absent optional field. */
export const atMost = (max) => (value) => value === undefined || value.length <= max;

/** Format check that treats absent and blank as "not set". */
export const blankOr = (predicate) => (value) =>
  value === undefined || value === "" || predicate(value);
