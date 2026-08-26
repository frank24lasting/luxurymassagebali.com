import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { FloatingWhatsapp } from '@/components/layout/floating-whatsapp';
import { PromoPopup } from '@/components/promo-popup';
import { NoIndex } from '@/components/seo/seo-head';
import { AuthProvider, useAuth } from '@/lib/admin-auth';
import { useBrandingSettings } from '@/lib/branding';
import { LanguageProvider } from '@/lib/language';

function FaviconSync() {
  const { faviconUrl } = useBrandingSettings();

  useEffect(() => {
    if (!faviconUrl) return;
    const favLink = document.getElementById('app-favicon') as HTMLLinkElement | null;
    const appleFavLink = document.getElementById('app-apple-favicon') as HTMLLinkElement | null;
    if (favLink) favLink.href = faviconUrl;
    if (appleFavLink) appleFavLink.href = faviconUrl;
  }, [faviconUrl]);

  return null;
}

// ============================================
// LAZY LOADING — All routes lazy loaded
// ============================================

// Public Pages
const Home = lazy(() => import('@/pages/home'));
const Services = lazy(() => import('@/pages/services'));
const ServiceCategory = lazy(() => import('@/pages/service-category'));
const ServiceDetail = lazy(() => import('@/pages/service-detail'));
const Appointment = lazy(() => import('@/pages/appointment'));
const AppointmentConfirmation = lazy(() => import('@/pages/appointment-confirmation'));
const Blog = lazy(() => import('@/pages/blog'));
const BlogDetail = lazy(() => import('@/pages/blog-detail'));
const About = lazy(() => import('@/pages/about'));
const Contact = lazy(() => import('@/pages/contact'));
const Gallery = lazy(() => import('@/pages/gallery'));
const DynamicPage = lazy(() => import('@/pages/dynamic-page'));

// Admin Pages
const AdminLogin = lazy(() => import('@/pages/admin/login'));
const AdminDashboard = lazy(() => import('@/pages/admin/dashboard'));
const AdminAppointments = lazy(() => import('@/pages/admin/appointments'));
const AdminArticles = lazy(() => import('@/pages/admin/articles'));
const AdminArticleEditor = lazy(() => import('@/pages/admin/article-editor'));
const AdminServices = lazy(() => import('@/pages/admin/services'));
const AdminPages = lazy(() => import('@/pages/admin/pages'));
const AdminHero = lazy(() => import('@/pages/admin/hero'));
const AdminMobilePromos = lazy(() => import('@/pages/admin/mobile-promos'));
const AdminMedia = lazy(() => import('@/pages/admin/media'));
const AdminSEO = lazy(() => import('@/pages/admin/seo'));
const AdminAnalytics = lazy(() => import('@/pages/admin/analytics'));
const AdminUsers = lazy(() => import('@/pages/admin/users'));
const AdminSettings = lazy(() => import('@/pages/admin/settings'));
const AdminPopupFlyer = lazy(() => import('@/pages/admin/popup-flyer'));
const AdminLayoutComponent = lazy(() => import('@/pages/admin/layout'));

// ============================================
// QUERY CLIENT
// ============================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// ============================================
// LOADING FALLBACK
// ============================================

function PageLoader() {
  const { siteName } = useBrandingSettings();

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark px-6">
      <div className="flex flex-col items-center gap-5 text-center" role="status" aria-label={`Memuat ${siteName}`}>
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/15 bg-gradient-gold shadow-glass-lg">
          <img src="/favicon.svg" alt="" width="48" height="48" className="h-12 w-12" />
        </div>
        <div>
          <p className="font-heading text-xl font-semibold text-white">{siteName}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-text-muted">Preparing your experience</p>
        </div>
        <div className="h-1 w-28 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
        </div>
        <span className="sr-only">Loading</span>
      </div>
    </div>
  );
}

// ============================================
// LAYOUTS
// ============================================

// Public Layout (with Navbar, Footer, BottomNav, PromoPopup)
function PublicLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <FloatingWhatsapp />
      <BottomNav />
      <PromoPopup />
    </>
  );
}

// Admin Layout (without public nav) - Protected
function ProtectedAdminLayout() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated || !isAdmin) return <Navigate to="/langitdewata" replace />;

  return (
    <Suspense fallback={<PageLoader />}>
      <NoIndex />
      <AdminLayoutComponent />
    </Suspense>
  );
}

// ============================================
// APP — Root component
// ============================================

export default function App() {
  return (
    <AuthProvider>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <FaviconSync />
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route element={<PublicLayout />}>
                  <Route
                    path="/"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Home />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/services"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Services />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/services/:slug"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <ServiceDetail />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/appointment"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Appointment />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/appointment/confirmation"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <AppointmentConfirmation />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/blog"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Blog />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/blog/:slug"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <BlogDetail />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/about"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <About />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/contact"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Contact />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/gallery"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Gallery />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/:categorySlug(massage|facial|body-treatment|spa-package|couple-package)"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <ServiceCategory />
                      </Suspense>
                    }
                  />
                  {[
                    { from: 'layanan', to: '/services' },
                    { from: 'booking', to: '/appointment' },
                    { from: 'book-appointment', to: '/appointment' },
                    { from: 'blog-artikel', to: '/blog' },
                    { from: 'galeri', to: '/gallery' },
                    { from: 'refund-policy', to: '/refund' },
                  ].map((route) => (
                    <Route key={route.from} path={`/${route.from}`} element={<Navigate to={route.to} replace />} />
                  ))}
                  <Route
                    path="/:slug"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <DynamicPage />
                      </Suspense>
                    }
                  />
                </Route>

                {/* Admin Login (standalone) */}
                <Route
                  path="/langitdewata"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <AdminLogin />
                    </Suspense>
                  }
                />

                {/* Admin Protected Routes */}
                <Route path="/langitdewata" element={<ProtectedAdminLayout />}>
                  <Route
                    path="dashboard"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <AdminDashboard />
                      </Suspense>
                    }
                  />
                  <Route
                    path="appointments"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <AdminAppointments />
                      </Suspense>
                    }
                  />
                  <Route
                    path="articles"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <AdminArticles />
                      </Suspense>
                    }
                  />
                  <Route
                    path="articles/new"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <AdminArticleEditor />
                      </Suspense>
                    }
                  />
                  <Route
                    path="articles/:id/edit"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <AdminArticleEditor />
                      </Suspense>
                    }
                  />
                  <Route
                    path="services"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <AdminServices />
                      </Suspense>
                    }
                  />
                  <Route
                    path="pages"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <AdminPages />
                      </Suspense>
                    }
                  />
                  <Route
                    path="hero"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <AdminHero />
                      </Suspense>
                    }
                  />
                  <Route
                    path="mobile-promos"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <AdminMobilePromos />
                      </Suspense>
                    }
                  />
                  <Route
                    path="popup-flyer"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <AdminPopupFlyer />
                      </Suspense>
                    }
                  />
                  <Route
                    path="media"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <AdminMedia />
                      </Suspense>
                    }
                  />
                  <Route
                    path="seo"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <AdminSEO />
                      </Suspense>
                    }
                  />
                  <Route
                    path="analytics"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <AdminAnalytics />
                      </Suspense>
                    }
                  />
                  <Route
                    path="users"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <AdminUsers />
                      </Suspense>
                    }
                  />
                  <Route
                    path="settings"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <AdminSettings />
                      </Suspense>
                    }
                  />
                </Route>

                {/* 404 Not Found */}
                <Route
                  path="*"
                  element={
                    <div className="min-h-screen bg-dark flex items-center justify-center text-center px-4">
                      <div>
                        <h1 className="text-8xl font-heading font-bold text-primary mb-4">404</h1>
                        <p className="text-gray-400 text-lg mb-8">Halaman tidak ditemukan</p>
                        <a
                          href="/"
                          className="btn-primary"
                        >
                          Kembali ke Beranda
                        </a>
                      </div>
                    </div>
                  }
                />
              </Routes>
              {/* Toast Notifications */}
              <Toaster
                position="top-right"
                gutter={14}
                toastOptions={{
                  duration: 3600,
                  style: {
                    background: 'linear-gradient(135deg, rgba(25,50,44,0.98), rgba(33,64,56,0.98))',
                    color: '#f5faf7',
                    border: '1px solid rgba(220,235,228,0.18)',
                    borderRadius: '16px',
                    padding: '13px 15px',
                    minWidth: '260px',
                    boxShadow: '0 18px 45px rgba(4,18,14,0.28)',
                    fontSize: '13px',
                    fontWeight: 700,
                  },
                  success: {
                    iconTheme: { primary: '#dcebe4', secondary: '#19322c' },
                  },
                  error: {
                    iconTheme: { primary: '#fda4af', secondary: '#19322c' },
                    style: {
                      border: '1px solid rgba(253,164,175,0.4)',
                    },
                  },
                  loading: {
                    iconTheme: { primary: '#dcebe4', secondary: '#19322c' },
                  },
                }}
              />
            </BrowserRouter>
          </LanguageProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </AuthProvider>
  );
}
