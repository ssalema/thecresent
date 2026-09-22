import express from "express";
import { addContact, getContacts, deleteContact } from "../controllers/contactController.js";
import { protect } from "../middleware/authMiddleware.js";
import { contactLimiter } from "../config/security.js";
import { noStore } from "../middleware/cacheMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  contactBody,
  contactIdParams,
  contactListQuery,
} from "../validation/schemas.js";

const router = express.Router();

// Public route — throttled and fully validated, it is an unauthenticated write
// to the database.
router.post("/", contactLimiter, validate({ body: contactBody }), addContact);

// Admin routes
// Enquiries contain personal data — never cached.
// The query describes a view rather than a submission, so its schema falls back
// to defaults instead of rejecting; see validation/schemas.js.
router.get("/", protect, noStore, validate({ query: contactListQuery }), getContacts);
router.delete(
  "/:id",
  protect,
  validate({ params: contactIdParams }, { style: "notFound" }),
  deleteContact
);

export default router;
