import { Component } from "react";
import { useLocation } from "react-router-dom";
import { FaExclamationTriangle, FaHome, FaRedo } from "react-icons/fa";
import { Button, Card, IconBadge, Section } from "./ui";

/**
 * The last line of defence for a render that throws.
 *
 * Without it a single bad field on one page unmounts the whole tree and the
 * visitor is left staring at a white screen with no way back. This catches the
 * throw, keeps the navbar and footer around it, and offers the two things that
 * actually recover: reload, or go home.
 *
 * It also catches the other common failure — a lazy page chunk that 404s after
 * a redeploy, because the visitor is still holding the previous build's file
 * names. Reloading fetches the new index.html and fixes it, which is why
 * reloading is the primary action.
 */
class ErrorBoundaryInner extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Nothing is shipped to a logging service yet; the console is at least
    // where a developer looking at a bug report will think to look.
    console.error("Unhandled error while rendering:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="bg-gray-50 pt-16">
        <Section>
          <Card className="mx-auto max-w-2xl text-center">
            <div className="flex justify-center">
              <IconBadge icon={FaExclamationTriangle} tone="amber" />
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Something went wrong
            </h1>

            <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-gray-600">
              This page could not be displayed. Reloading usually fixes it — if
              it does not, please let us know what you were trying to do.
            </p>

            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Button
                icon={FaRedo}
                size="md"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
              <Button to="/" variant="secondary" icon={FaHome} size="md">
                Back to Home
              </Button>
            </div>
          </Card>
        </Section>
      </div>
    );
  }
}

/**
 * A caught boundary never un-catches itself, so without this the visitor would
 * stay on the error card even after navigating away. Keying it by path throws
 * the broken instance away and mounts a fresh one on every route change.
 */
const ErrorBoundary = ({ children }) => {
  const { pathname } = useLocation();
  return <ErrorBoundaryInner key={pathname}>{children}</ErrorBoundaryInner>;
};

export default ErrorBoundary;
