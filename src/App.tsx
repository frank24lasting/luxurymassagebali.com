import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
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
  const { siteName, logoUrl, logoStickyUrl, logoFooterUrl } = useBrandingSettings();
  const displayLogo = logoUrl || logoStickyUrl || logoFooterUrl;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#10251f] px-6">
      {/* Soft ambient background glow */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.2, 0.45, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="pointer-events-none absolute h-72 w-72 rounded-full bg-gradient-to-tr from-[#19322c] via-[#245246] to-[#a8c8ba]/20 blur-3xl"
      />

      <div className="relative flex flex-col items-center gap-6 text-center" role="status" aria-label={`Memuat ${siteName}`}>
        {/* Animated Brand Logo Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative flex items-center justify-center"
        >
          {displayLogo ? (
            <motion.div
              animate={{
                y: [0, -6, 0],
                filter: [
                  'drop-shadow(0 10px 20px rgba(168, 200, 186, 0.15))',
                  'drop-shadow(0 16px 30px rgba(168, 200, 186, 0.35))',
                  'drop-shadow(0 10px 20px rgba(168, 200, 186, 0.15))',
                ],
              }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="p-3"
            >
              <img
                src={displayLogo}
                alt={`${siteName} logo`}
                width="280"
                height="80"
                className="h-20 sm:h-24 md:h-28 w-auto max-w-[260px] sm:max-w-[320px] object-contain"
              />
            </motion.div>
          ) : (
            <motion.div
              animate={{
                scale: [1, 1.06, 1],
                rotate: [0, 4, -4, 0],
              }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="grid h-20 w-20 place-items-center rounded-2xl border border-white/20 bg-gradient-gold shadow-glass-lg"
            >
              <Sparkles className="h-9 w-9 text-primary animate-pulse" />
            </motion.div>
          )}
        </motion.div>

        {/* Text & Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <p className="font-heading text-2xl font-bold tracking-wide text-white sm:text-3xl">{siteName}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-[#a8c8ba]">Luxury Wellness Experience</p>
        </motion.div>

        {/* Shimmering Smooth Progress Indicator */}
        <div className="relative h-1 w-36 overflow-hidden rounded-full bg-white/10">
          <motion.div
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="h-full w-20 rounded-full bg-gradient-to-r from-transparent via-[#dcebe4] to-transparent shadow-[0_0_12px_#dcebe4]"
          />
        </div>
        <span className="sr-only">Memuat halaman...</span>
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
