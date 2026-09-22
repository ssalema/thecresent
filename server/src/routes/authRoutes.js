import express from "express";
import { loginAdmin, logoutAdmin, refreshSession } from "../controllers/authController.js";
import { loginLimiter, refreshLimiter } from "../config/security.js";
import { validate } from "../middleware/validate.js";
import { loginBody } from "../validation/schemas.js";

const router = express.Router();

// Throttled: this is the only door into the admin panel. The schema reports a
// single message for either field, so a 400 never says which half was wrong.
router.post(
  "/login",
  loginLimiter,
  validate({ body: loginBody }, { style: "message" }),
  loginAdmin
);

// Swaps the httpOnly refresh cookie for a fresh access token. No body and no
// Authorization header — the cookie is the whole credential, which is why it is
// scoped to this path.
router.post("/refresh", refreshLimiter, refreshSession);

// Clears that cookie. Deliberately open: a session whose access token has
// already expired is exactly the one that needs to log out.
router.post("/logout", logoutAdmin);

export default router;
