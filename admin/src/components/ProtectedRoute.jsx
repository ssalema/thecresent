import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { getToken, hasStoredToken } from "../lib/auth";
import { restoreSession } from "../lib/api";

/**
 * Gate for every admin page.
 *
 * The access token lives for 15 minutes in sessionStorage, so "no usable token"
 * is the normal state of a tab that was just opened or left alone over lunch —
 * not proof that nobody is signed in. The refresh cookie is the real session,
 * and only the server can read it, so the check has to be asynchronous: ask
 * once, and hold the render until there is an answer.
 */
const ProtectedRoute = ({ children }) => {
  // A live access token needs no round trip; that is the common case on every
  // navigation after the first.
  const [status, setStatus] = useState(() => (getToken() ? "in" : "checking"));

  // Read before the refresh attempt, which clears the stale token on failure —
  // asking afterwards would always say "never logged in" and swallow the
  // "your session expired" notice on the login screen.
  const hadToken = useRef(hasStoredToken());

  useEffect(() => {
    if (status !== "checking") return;

    let cancelled = false;
    restoreSession().then((ok) => {
      if (!cancelled) setStatus(ok ? "in" : "out");
    });

    return () => {
      cancelled = true;
    };
  }, [status]);

  // Deliberately blank rather than a spinner: the refresh is a single local
  // request and a flash of loading UI on every guarded route is worse than a
  // frame of nothing.
  if (status === "checking") return null;
  if (status === "in") return children;

  // A token that was present but is now unusable means the session ran out; no
  // token at all just means nobody has logged in yet.
  return <Navigate to={hadToken.current ? "/login?expired=1" : "/login"} replace />;
};

export default ProtectedRoute;
