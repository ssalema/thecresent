import { FaCompass, FaHome, FaImages, FaEnvelope } from "react-icons/fa";
import { Button, Card, IconBadge, PageHero, Section } from "../components/ui";

/**
 * The catch-all route: a URL that matches nothing.
 *
 * A mistyped or long-dead link used to render the navbar and footer with an
 * empty band between them, which reads as a broken site rather than a wrong
 * address. This says what happened and offers the three places a visitor who
 * landed here most likely wanted.
 */
const NotFound = () => (
  <div className="bg-gray-50 pt-16">
    <PageHero
      title="Page Not Found"
      subtitle="The page you were looking for has moved, or the link that brought you here is no longer valid."
    />

    <Section>
      <Card className="mx-auto max-w-2xl text-center">
        <div className="flex justify-center">
          <IconBadge icon={FaCompass} tone="blue" />
        </div>

        <p className="mt-5 text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          404
        </p>

        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-gray-600">
          Nothing lives at this address. Head back to the home page, or pick up
          from one of the sections below.
        </p>

        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Button to="/" icon={FaHome} size="md">
            Back to Home
          </Button>
          <Button to="/projects" variant="secondary" icon={FaImages} size="md">
            Our Projects
          </Button>
          <Button to="/contact" variant="secondary" icon={FaEnvelope} size="md">
            Contact Us
          </Button>
        </div>
      </Card>
    </Section>
  </div>
);

export default NotFound;
