// MUST be the first import. ES modules are evaluated before the body of the
// module that imports them, so anything below reading process.env at its top
// level — authController's password hash, cloudinary.config() — would see an
// empty environment if dotenv were loaded further down. Do not reorder.
import "dotenv/config";

import express from "express";
import connectDB from "./config/db.js";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import donationRoutes from "./routes/donationRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import { handleWebhook } from "./controllers/donationController.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import mongoose from "mongoose";
import { corsOptions, apiLimiter, webhookLimiter } from "./config/security.js";
import { jwtConfigError } from "./config/jwt.js";

// Fail loudly at boot rather than at the admin's first login attempt. Not fatal
// on purpose: the public site is read-only and stays useful with the admin
// panel locked out, so a bad secret should not take the whole API down.
const jwtProblem = jwtConfigError();
if (jwtProblem) {
  console.error(`⚠️  ${jwtProblem} — admin login will be refused until it is fixed`);
}

// Awaited: the process used to start listening while the driver was still
// connecting, so every request in that window failed with an opaque buffering
// timeout instead of simply waiting for a server that was not up yet.
await connectDB();

const app = express();

// Render (and any reverse proxy) terminates TLS upstream. Without this the
// rate limiters would key every request to the proxy's IP and throttle all
// visitors as one. Trust exactly one hop, not an attacker-supplied chain.
app.set("trust proxy", 1);

// Nothing here renders HTML, so the restrictive defaults are all wanted. CSP
// is left off deliberately: it protects documents, and this process only ever
// returns JSON — the front-ends set their own headers at their own hosts.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(cors(corsOptions));
app.use(compression());

// Razorpay webhook needs the unparsed body to verify its signature, so it must
// be mounted before express.json() consumes the request stream — and therefore
// before the general apiLimiter as well.
//
// It gets a limiter of its own rather than none at all. Razorpay retries on
// failure and throttling those retries would lose payment confirmations, so
// webhookLimiter counts only requests that fail the signature check: a real
// delivery answers 2xx and is never counted, while a flood of forged ones is
// cut off. See config/security.js.
app.post(
  "/api/donations/webhook",
  webhookLimiter,
  express.raw({ type: "application/json" }),
  handleWebhook
);

// 100 kb is the express default and is ample for these JSON bodies; stating it
// explicitly keeps a future default change from widening the surface.
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Strip $-prefixed and dotted keys so a crafted body cannot smuggle query
// operators into a Mongoose call.
app.use(mongoSanitize());

// NOTE: the /uploads directory is no longer served. Multer writes unvalidated
// temp files there, and everything durable lives on Cloudinary — serving it
// made every in-flight upload publicly fetchable for nothing.

app.use("/api", apiLimiter);

// Cheap liveness probe for uptime checks and Render health.
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Landing route. Opening the service URL in a browser used to fall through to
// notFound and answer with a bare "Not found: GET /", which reads like a broken
// deploy. Answer with a plain confirmation instead — HTML for a browser, JSON
// for anything else (curl, uptime checks).
app.get("/", (req, res) => {
  if (req.accepts("html")) {
    return res.type("html").send(
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Charity API</title>
  </head>
  <body style="font-family: system-ui, sans-serif; padding: 2rem; line-height: 1.6">
    <h1>&#9989; Server is running</h1>
    <p>The Charity API is up. This is the backend &mdash; there is no website here.</p>
    <p>Health check: <a href="/api/health">/api/health</a></p>
  </body>
</html>`
    );
  }

  res.json({ status: "ok", message: "Charity API is running" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/settings", settingsRoutes);

app.use(notFound);

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

/**
 * Graceful shutdown.
 *
 * Render sends SIGTERM on every redeploy and then waits before killing the
 * process. Without this the socket closes mid-request, which for this API can
 * mean a Razorpay webhook that was mid-write gets no 200 — Razorpay retries, so
 * nothing is lost, but the same is not true of an admin's upload. Stop
 * accepting new connections, let the in-flight ones finish, then close the
 * database.
 */
const shutdown = async (signal) => {
  console.log(`${signal} received — shutting down`);

  // Force the issue if a connection refuses to drain. Exceeding the platform's
  // own grace period just means being killed mid-write instead.
  const failsafe = setTimeout(() => {
    console.error("Shutdown timed out — exiting anyway");
    process.exit(1);
  }, 10000);
  failsafe.unref();

  server.close(async () => {
    try {
      await mongoose.connection.close(false);
    } catch (err) {
      console.error("Error closing MongoDB connection:", err.message);
    }
    console.log("Shutdown complete");
    process.exit(0);
  });
};

for (let signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => shutdown(signal));
}
