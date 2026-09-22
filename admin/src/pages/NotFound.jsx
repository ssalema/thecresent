import { useNavigate } from 'react-router-dom';
import { FaCompass, FaHome } from 'react-icons/fa';
import { Button, Card, EmptyState, PageHeader, PageShell } from '../components/ui';

/**
 * The panel's catch-all route.
 *
 * Rendered inside the usual shell, so an admin who mistypes a URL still has
 * the sidebar and can navigate out — an unknown path is a wrong turn, not a
 * dead end. The route itself is behind ProtectedRoute, so a logged-out visitor
 * poking at admin URLs lands on the login screen rather than on this.
 */
const NotFound = () => {
  const navigate = useNavigate();

  return (
    <PageShell maxWidth="max-w-3xl">
      <PageHeader
        title="Page Not Found"
        description="This address does not match any screen in the panel."
      />

      <Card>
        <EmptyState
          icon={FaCompass}
          title="404 — nothing here"
          message="The link may be out of date, or the address may have been mistyped. Use the sidebar to pick a screen, or go back to the dashboard."
          action={
            <Button icon={FaHome} onClick={() => navigate('/')}>
              Back to Dashboard
            </Button>
          }
        />
      </Card>
    </PageShell>
  );
};

export default NotFound;
