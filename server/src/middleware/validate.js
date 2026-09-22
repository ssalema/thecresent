import { cleanupTempFiles } from "../utils/cloudinaryAssets.js";

/**
 * Run a route's zod schemas over the request before the controller sees it.
 *
 * Controllers read `req.validated.body` / `.params`, never `req.body` — the
 * parsed value is trimmed, coerced and stripped of keys the schema doesn't
 * name, which is what keeps a write from being `new Model(req.body)`.
 *
 * The API reports validation in three shapes and every one of them predates
 * this middleware, so `style` picks the one a route already uses rather than
 * asking every caller to change at once:
 *
 *   fields    400 { message, errors: { field: message } }  — forms
 *   message   400 { message }                              — single-issue routes
 *   error     400 { error }                                — the donation flow
 *   notFound  404 { message }                              — a malformed :id
 */

const FIELD_ERROR_MESSAGE = "Please correct the highlighted fields";

// The first issue for a field is the only one worth showing: checks are chained
// in priority order, so anything after the first is a consequence of it.
const fieldErrors = (issues) => {
  const errors = {};
  for (let issue of issues) {
    const field = issue.path.join(".");
    if (field && !(field in errors)) errors[field] = issue.message;
  }
  return errors;
};

const respond = (res, issues, style, message) => {
  const first = issues[0]?.message || "Invalid request";

  switch (style) {
    case "error":
      return res.status(400).json({ error: first });
    case "message":
      return res.status(400).json({ message: first });
    // A bad id is indistinguishable from an id that simply isn't there, and
    // saying so tells an enumerator nothing.
    case "notFound":
      return res.status(404).json({ message: first });
    default:
      return res
        .status(400)
        .json({ message: message || FIELD_ERROR_MESSAGE, errors: fieldErrors(issues) });
  }
};

export const validate = (schemas, { style = "fields", message } = {}) => {
  const sources = Object.entries(schemas);

  return (req, res, next) => {
    const validated = {};

    for (let [source, schema] of sources) {
      const result = schema.safeParse(req[source]);

      if (!result.success) {
        // Multer has already written the upload to disk by the time validation
        // runs, and the controller's own cleanup never gets to run.
        cleanupTempFiles(req.files);
        return respond(res, result.error.issues, style, message);
      }

      validated[source] = result.data;
    }

    // Merged, not replaced: a route may chain two validate() calls (an id check
    // that 404s, then a body check that 400s), and the second must not wipe
    // what the first parsed.
    //
    // The parsed values live in their own bag rather than being written back
    // over req.body/req.params, which Express 5 turns into getters.
    req.validated = { ...req.validated, ...validated };
    next();
  };
};
