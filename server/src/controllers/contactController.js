import Contact from "../models/Contact.js";
import {
  compactFilter,
  dateRangeFilter,
  pageParams,
  paginated,
  searchFilter,
} from "../utils/pagination.js";

/**
 * POST /api/contacts — public.
 *
 * This is the only unauthenticated write in the API, so nothing from the body
 * is trusted. `validate(contactBody)` on the route has already required,
 * format-checked, trimmed and length-capped every field and stripped everything
 * it doesn't name, so what arrives here is exactly the four fields below and
 * nothing else. The route is rate limited as well (see config/security.js) —
 * validation stops junk, the limiter stops volume.
 */
export const addContact = async (req, res) => {
  try {
    const { name, email, number, message } = req.validated.body;

    await new Contact({ name, email, number, message }).save();

    res.status(201).json({ message: "Thank you for contacting us" });
  } catch (err) {
    console.error("Error saving contact:", err);
    res.status(500).json({ message: "Your message could not be sent" });
  }
};

/**
 * Sort orders the inbox offers.
 *
 * A key rather than a caller-supplied field name, so a query string can never
 * ask Mongo to sort on something unindexed. `_id` is the tiebreaker: without it
 * two messages sharing a timestamp can swap places between pages, which shows
 * one twice and hides the other.
 */
const SORT_ORDERS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  nameAsc: { name: 1, _id: 1 },
  nameDesc: { name: -1, _id: -1 },
};

const SEARCH_FIELDS = ["name", "email", "number", "message"];

/**
 * GET /api/contacts — admin, paginated.
 *
 * Filtering, sorting and slicing all happen in Mongo. They used to happen in
 * the browser over the entire collection: the inbox is fed by an
 * unauthenticated public form, so it is the fastest-growing thing in the
 * database and the last place that should be sent whole.
 *
 * The full `message` body is still returned — the reading pane opens from the
 * row without a second request, and one page of them is a modest payload.
 */
export const getContacts = async (req, res) => {
  try {
    const { search, from, to, sort } = req.validated.query;
    const { page, limit, skip } = pageParams(req.validated.query);

    const filter = compactFilter(
      dateRangeFilter(from, to),
      searchFilter(search, SEARCH_FIELDS)
    );

    // Independent reads, so they overlap rather than queue.
    const [items, total] = await Promise.all([
      Contact.find(filter)
        .sort(SORT_ORDERS[sort] || SORT_ORDERS.newest)
        .skip(skip)
        .limit(limit)
        .lean(),
      Contact.countDocuments(filter),
    ]);

    res.json(paginated({ items, page, limit, total }));
  } catch (err) {
    console.error("Error fetching contacts:", err);
    res.status(500).json({ message: "Unable to load messages" });
  }
};

// Delete contact by ID (admin). A malformed id is rejected by the route's
// param schema, so anything reaching here is a well-formed ObjectId.
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.validated.params.id);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.json({ message: "Contact deleted successfully" });
  } catch (err) {
    console.error("Error deleting contact:", err);
    // The driver's message can echo the query back; keep it in the log only.
    res.status(500).json({ message: "Unable to delete this message" });
  }
};
