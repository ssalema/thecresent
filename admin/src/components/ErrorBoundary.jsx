import { Component } from 'react';
import { useLocation } from 'react-router-dom';
import { FaExclamationTriangle, FaHome, FaRedo } from 'react-icons/fa';
import { Button } from './ui';
import { iconCircle, SURFACE } from './ui/tokens';

/**
 * The last line of defence for a render that throws.
 *
 * Without it a single bad record — a donation with a malformed date, a project
 * with no images — unmounts the whole panel and leaves a white screen with no
 * way back. This catches the throw and offers the two things that recover:
 * reload, or return to the dashboard.
 *
 * It also catches the other common failure: a lazy page chunk that 404s after
 * a redeploy, because the browser is still holding the previous build's file
 * names. Reloading fetches the new index.html, which is why it leads.
 *
 * The card is deliberately standalone rather than wrapped in PageShell — if
 * what threw was the sidebar or the organization context, the shell would
 * throw again and take the fallback down with it.
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
    console.error('Unhandled error while rendering:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className={`${SURFACE} w-full max-w-lg p-6 text-center sm:p-8`}>
          <div className="flex justify-center">
            <span className={`${iconCircle('red')} h-14 w-14 text-2xl`}>
              <FaExclamationTriangle />
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Something went wrong
          </h1>

          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-gray-600">
            This screen could not be displayed. Reloading usually fixes it. If it
            keeps happening, note what you were doing and report it — nothing you
            had already saved is affected.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button icon={FaRedo} onClick={() => window.location.reload()}>
              Reload Panel
            </Button>
            <Button
              variant="secondary"
              icon={FaHome}
              onClick={() => {
                // A full load rather than a route change: the tree that threw
                // is discarded along with whatever state put it there.
                window.location.assign('/');
              }}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * A caught boundary never un-catches itself, so without this the admin would
 * stay on the error card even after navigating away. Keying it by path throws
 * the broken instance away and mounts a fresh one on every route change.
 */
const ErrorBoundary = ({ children }) => {
  const { pathname } = useLocation();
  return <ErrorBoundaryInner key={pathname}>{children}</ErrorBoundaryInner>;
};

export default ErrorBoundary;
