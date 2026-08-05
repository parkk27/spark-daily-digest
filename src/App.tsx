import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RequireAuth from "@/components/RequireAuth";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import OAuthConsent from "@/pages/OAuthConsent";
import NotFound from "@/pages/NotFound";

// Protected modules are lazy-loaded so the public landing stays fast.
const HomePage = lazy(() => import("@/pages/HomePage"));
const NewsPage = lazy(() => import("@/pages/NewsPage"));
const TrendsPage = lazy(() => import("@/pages/TrendsPage"));
const ComparisonPage = lazy(() => import("@/pages/ComparisonPage"));
const CopilotPage = lazy(() => import("@/pages/CopilotPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const ActionRadarPage = lazy(() => import("@/pages/ActionRadarPage"));
const BookmarksPage = lazy(() => import("@/pages/BookmarksPage"));
const SourcesPage = lazy(() => import("@/pages/SourcesPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));

// Public, sample-data demo surfaces (no auth required).
const PreviewBriefPage = lazy(() => import("@/pages/preview/PreviewBriefPage"));
const PreviewComparePage = lazy(() => import("@/pages/preview/PreviewComparePage"));
const PreviewRadarPage = lazy(() => import("@/pages/preview/PreviewRadarPage"));
const CardPage = lazy(() => import("@/pages/CardPage"));


const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="container max-w-4xl space-y-4 py-12">
    <div className="h-8 w-1/3 animate-pulse rounded-md bg-secondary" />
    <div className="h-40 animate-pulse rounded-lg bg-secondary/60" />
  </div>
);

const protect = (element: React.ReactNode) => (
  <RequireAuth>
    <Suspense fallback={<PageFallback />}>{element}</Suspense>
  </RequireAuth>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <main>
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/signin" element={<AuthPage />} />
              <Route path="/signup" element={<AuthPage />} />
              <Route path="/auth" element={<Navigate to="/signin" replace />} />
              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />

              {/* Public preview (sample data) */}
              <Route
                path="/preview"
                element={<Suspense fallback={<PageFallback />}><PreviewBriefPage /></Suspense>}
              />
              <Route
                path="/preview/compare"
                element={<Suspense fallback={<PageFallback />}><PreviewComparePage /></Suspense>}
              />
              <Route
                path="/preview/radar"
                element={<Suspense fallback={<PageFallback />}><PreviewRadarPage /></Suspense>}
              />
              <Route
                path="/card/:cardId"
                element={<Suspense fallback={<PageFallback />}><CardPage /></Suspense>}
              />



              {/* Protected */}
              <Route path="/dashboard" element={protect(<HomePage />)} />
              <Route path="/news" element={protect(<NewsPage />)} />
              <Route path="/trends" element={protect(<TrendsPage />)} />
              <Route path="/compare" element={protect(<ComparisonPage />)} />
              <Route path="/copilot" element={protect(<CopilotPage />)} />
              <Route path="/settings" element={protect(<SettingsPage />)} />
              <Route path="/radar" element={protect(<ActionRadarPage />)} />
              <Route path="/bookmarks" element={protect(<BookmarksPage />)} />
              <Route path="/sources" element={protect(<SourcesPage />)} />
              <Route path="/profile" element={protect(<ProfilePage />)} />
              <Route path="/analytics" element={protect(<AnalyticsPage />)} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
