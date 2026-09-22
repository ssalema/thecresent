import { verifyAccessToken } from "../config/jwt.js";

export const protect = (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (!/^Bearer$/i.test(scheme || "") || !token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    // Access tokens only — config/jwt.js pins HS256 and rejects a refresh token
    // presented here, so the long-lived credential can never stand in for the
    // short one even though both are JWTs.
    req.admin = verifyAccessToken(token);
    next();
  } catch (error) {
    // The panel treats any 401 as "refresh, then retry once", so an expired
    // access token costs a round trip rather than a login.
    res.status(401).json({ message: "Invalid token" });
  }
};
