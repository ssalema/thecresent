import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import OrganizationHead from "./components/OrganizationHead";
import { PageSkeleton } from "./components/ui/skeletons";

// Lazy load pages so the login screen does not carry the whole panel with it.
// Each page becomes its own chunk, fetched the first time it is opened.
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const UploadProject = lazy(() => import("./pages/UploadProject"));
const Inbox = lazy(() => import("./pages/Inbox"));
const DonationRecords = lazy(() => import("./pages/DonationRecords"));
const GalleryDashboard = lazy(() => import("./pages/GalleryDashboard"));
const UploadGallery = lazy(() => import("./pages/UploadGallery"));
const OrganizationSettings = lazy(() => import("./pages/OrganizationSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => {
  return (
    <>
      {/* Title and favicon, driven by Organization Settings */}
      <OrganizationHead pageTitle="Admin Panel" />

      {/* A screen that throws mid-render shows the error card instead of
          unmounting the panel into a white page. */}
      <ErrorBoundary>
        {/* The route chunk downloads behind a skeleton of the panel shell,
            rather than a blank screen. */}
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <UploadProject />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gallery"
              element={
                <ProtectedRoute>
                  <GalleryDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gallery/upload"
              element={
                <ProtectedRoute>
                  <UploadGallery />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inbox"
              element={
                <ProtectedRoute>
                  <Inbox />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donations"
              element={
                <ProtectedRoute>
                  <DonationRecords />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <OrganizationSettings />
                </ProtectedRoute>
              }
            />

            {/* Anything else. Behind ProtectedRoute so an unknown admin URL
                sends a logged-out visitor to the login screen, not into a
                panel-shaped page. */}
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <NotFound />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
};

export default App;
