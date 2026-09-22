const isProduction = () => process.env.NODE_ENV === "production";

export const notFound = (req, res) => {
  res.status(404).json({ message: `Not found: ${req.method} ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, next) => {
  const statusCode =
    err.status || err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

  // A rejected origin is the allowlist doing its job, not a server fault.
  if (err?.message?.includes("not allowed by CORS")) {
    return res.status(403).json({ message: "Origin not allowed" });
  }

  console.error(err);

  res.status(statusCode).json({
    // Internal failures must not describe themselves to the caller: the stack,
    // the driver's message and the query that produced it are all information
    // an attacker can use. Client errors (4xx) are ours to explain, so those
    // messages still pass through.
    message:
      statusCode >= 500 && isProduction()
        ? "Something went wrong. Please try again."
        : err.message,
    ...(isProduction() ? {} : { stack: err.stack }),
  });
};
