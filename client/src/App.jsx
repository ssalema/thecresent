import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import ScrollToTopButton from "./components/ScrollToTopButton";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import OrganizationHead from "./components/OrganizationHead";
import { PageSkeleton } from "./components/ui/skeletons";

// Lazy load pages for better performance
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetails = lazy(() => import("./pages/ProjectDetails"));
const Contact = lazy(() => import("./pages/Contact"));
const Donate = lazy(() => import("./pages/Donate"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Refund = lazy(() => import("./pages/Refund"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => {
  return (
    <div className="flex flex-col bg-gray-50">
      {/* Title, SEO meta tags and favicon, driven by Organization Settings */}
      <OrganizationHead />

      {/* Scroll restoration on route change */}
      <ScrollToTop />

      {/* Navbar */}
      <Navbar />

      {/* Page Content */}
      <main className="flex-grow">
        {/* A page that throws mid-render shows the error card in place of the
            content, with the navbar and footer still around it. */}
        <ErrorBoundary>
          {/* The route chunk downloads behind a skeleton of the page it becomes,
              rather than a spinner on an empty screen. */}
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetails />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/donate" element={<Donate />} />
              <Route path="/gallery" element={<Gallery />} />

              {/* The legal documents, linked from the footer's legal bar. */}
              <Route path="/terms-and-conditions" element={<Terms />} />
              <Route path="/privacy-policy" element={<Privacy />} />
              <Route path="/refund-policy" element={<Refund />} />

              {/* Anything else — a mistyped or dead link. */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Scroll to top floating button */}
      <ScrollToTopButton />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
