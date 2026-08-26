/**
 * Admin Layout - Premium Glassmorphism Admin Dashboard Layout
 */

import { useEffect, useRef, useState, Suspense, Component, type ReactNode } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, FileText, Image, Settings,
  ChevronLeft, ChevronRight, LogOut, Bell, Search,
  Menu, X, Eye, BarChart3, Users, Star, Globe, FileStack,
  Volume2, Smartphone, FileImage, RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/admin-auth';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { requestBrowserNotificationPermission, showOrderNotification } from '@/lib/admin-notifications';
import { useBrandingSettings } from '@/lib/branding';

// Error boundary to catch render crashes inside admin pages
interface AdminPageErrorProps { children: ReactNode; onReset: () => void; }
interface AdminPageErrorState { hasError: boolean; }
class AdminPageErrorBoundary extends Component<AdminPageErrorProps, AdminPageErrorState> {
  constructor(props: AdminPageErrorProps) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-bold text-white">Something went wrong</p>
          <p className="mt-2 text-sm text-gray-400">Halaman ini gagal dimuat.</p>
          <button onClick={() => { this.setState({ hasError: false }); this.props.onReset(); }} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-dark"><RefreshCw className="h-4 w-4" /> Coba Lagi</button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface AdminNavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly exact?: boolean;
  readonly badge?: string;
}

const adminNav: readonly AdminNavItem[] = [
  { path: '/langitdewata', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/langitdewata/appointments', label: 'Appointments', icon: Calendar, badge: 'pending' },
  { path: '/langitdewata/hero', label: 'Hero', icon: Image },
  { path: '/langitdewata/mobile-promos', label: 'Mobile Promo', icon: Smartphone },
  { path: '/langitdewata/popup-flyer', label: 'Popup Flyer', icon: FileImage },
  { path: '/langitdewata/services', label: 'Services', icon: Star },
  { path: '/langitdewata/pages', label: 'Pages', icon: FileStack },
  { path: '/langitdewata/articles', label: 'Articles', icon: FileText },
  { path: '/langitdewata/media', label: 'Media', icon: Image },
  { path: '/langitdewata/seo', label: 'SEO', icon: Globe },
  { path: '/langitdewata/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/langitdewata/users', label: 'Users', icon: Users },
  { path: '/langitdewata/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [errorPageKey, setErrorPageKey] = useState(0);
  const seenRealtimeIds = useRef(new Set<string>());
  const queryClient = useQueryClient();
  const { siteName, logoUrl, logoAdminUrl } = useBrandingSettings();
  const adminLogoSrc = logoAdminUrl || logoUrl;

  // Recovery when user returns to the tab
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [queryClient]);

  const { data: notificationItems = [] } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, customer_name, appointment_date, appointment_time, status, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  const unreadCount = notificationItems.filter(item => item.status === 'pending').length;

  useEffect(() => {
    const channel = supabase
      .channel('admin-layout-appointment-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'appointments' }, (payload) => {
        const id = payload.new?.id as string | undefined;
        if (id && seenRealtimeIds.current.has(id)) return;
        if (id) seenRealtimeIds.current.add(id);
        showOrderNotification((payload.new?.customer_name as string | undefined) || 'Customer baru');
        queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
        queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-dark flex">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col bg-dark-lighter border-r border-white/5 fixed h-full z-30 transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}>
        {/* Logo */}
        <div className="h-20 flex items-center px-4 border-b border-white/5">
          <Link to="/langitdewata" className="flex items-center min-w-0" aria-label={siteName}>
            {adminLogoSrc ? (
              <img src={adminLogoSrc} alt={`${siteName} admin logo`} className="max-h-14 w-auto max-w-[200px] object-contain drop-shadow" />
            ) : (
              <>
                <div className="w-11 h-11 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold flex-shrink-0">
                  <span className="text-dark font-heading font-bold text-lg">{siteName.charAt(0).toUpperCase()}</span>
                </div>
                {!collapsed && (
                  <div className="min-w-0 ml-3">
                    <span className="block truncate text-white font-heading font-semibold text-base">{siteName}</span>
                    <p className="text-[10px] text-primary -mt-0.5 tracking-widest uppercase font-bold">Admin Panel</p>
                  </div>
                )}
              </>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {adminNav.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
                {!collapsed && (
                  <>
                    <span className="font-medium text-sm">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-amber-500 text-dark text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-12 flex items-center justify-center border-t border-white/5 text-gray-500 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>

        {/* User */}
        <div className={cn(
          "p-4 border-t border-white/5",
          collapsed && "flex justify-center"
        )}>
          {collapsed ? (
            <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
              <span className="text-dark font-bold text-sm">{user?.email?.[0]?.toUpperCase() || 'A'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center flex-shrink-0">
                <span className="text-dark font-bold text-sm">{user?.email?.[0]?.toUpperCase() || 'A'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.email || 'Admin'}</p>
                <p className="text-[10px] text-primary tracking-wide">Administrator</p>
              </div>
              <button
                onClick={signOut}
                className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="lg:hidden fixed left-0 top-0 h-full w-72 bg-dark-lighter border-r border-white/5 z-50 flex flex-col"
          >
            <div className="h-20 flex items-center justify-between px-4 border-b border-white/5">
              <div className="flex items-center min-w-0">
                {adminLogoSrc ? (
                  <img src={adminLogoSrc} alt={`${siteName} admin logo`} className="max-h-12 w-auto max-w-[190px] object-contain drop-shadow" />
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
                      <span className="text-dark font-heading font-bold text-lg">{siteName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0 ml-3">
                      <span className="block truncate text-white font-heading font-semibold">{siteName}</span>
                      <p className="text-[10px] text-primary -mt-0.5 tracking-widest uppercase font-bold">Admin</p>
                    </div>
                  </>
                )}
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {adminNav.map((item) => {
                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-amber-500 text-dark text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/5">
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">Sign Out</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile App Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-dark/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 backdrop-blur-2xl shadow-[0_-20px_60px_rgba(0,0,0,0.45)]">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1 rounded-[1.35rem] bg-white/[0.03] p-1">
          {adminNav.slice(0, 5).map((item) => {
            const isActive = item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'relative flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold tracking-[-0.01em] transition-all active:scale-95',
                  isActive ? 'bg-primary text-dark shadow-gold' : 'text-gray-400 hover:bg-white/5 hover:text-white',
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                <span className="max-w-full truncate leading-none">{item.label}</span>
                {item.badge && <span className="absolute right-1.5 top-1 h-2 w-2 rounded-full bg-amber-400" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className={cn("flex-1 lg:ml-64 min-h-screen transition-all duration-300", collapsed && "lg:ml-20")}>
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-[58px] border-b border-white/5 bg-dark/90 backdrop-blur-2xl lg:h-16">
          <div className="flex h-full items-center justify-between gap-3 px-3 lg:px-6">
            {/* Mobile Menu */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 text-gray-300 transition-colors hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1 lg:hidden">
              <p className="truncate text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{siteName}</p>
              <h1 className="truncate text-[15px] font-bold leading-tight text-white">Admin Command App</h1>
            </div>

            {/* Search */}
            <div className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div className="relative">
                <button onClick={() => setNotificationsOpen(open => !open)} className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 text-gray-300 transition-colors hover:text-white">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white">{unreadCount}</span>}
                </button>
                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.96 }} className="absolute right-0 top-12 z-50 w-[min(92vw,380px)] overflow-hidden rounded-3xl border border-white/10 bg-dark-lighter/95 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
                      <div className="border-b border-white/5 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-white">Notifikasi Order</p>
                            <p className="text-xs text-gray-500">Appointment terbaru masuk di sini.</p>
                          </div>
                          <button onClick={requestBrowserNotificationPermission} className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-dark">
                            <Volume2 className="mr-1 inline h-3 w-3" /> Aktifkan
                          </button>
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto p-2">
                        {notificationItems.length === 0 ? (
                          <div className="p-6 text-center text-sm text-gray-500">Belum ada notifikasi.</div>
                        ) : notificationItems.map(item => (
                          <Link key={item.id} to="/langitdewata/appointments" onClick={() => setNotificationsOpen(false)} className="block rounded-2xl p-3 transition-colors hover:bg-white/5">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary shadow-gold" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-white">Ada order masuk!!</p>
                                <p className="truncate text-xs text-gray-400">{item.customer_name || 'Customer'} · {item.appointment_date} {item.appointment_time}</p>
                              </div>
                              <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase text-amber-300">{item.status}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* View Site */}
              <Link
                to="/"
                target="_blank"
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>View Site</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content wrapped with ErrorBoundary and Suspense */}
        <div className="px-3 pb-28 pt-4 text-[12.5px] leading-relaxed sm:px-4 lg:p-6 lg:text-sm">
          <AdminPageErrorBoundary onReset={() => { setErrorPageKey(k => k + 1); queryClient.invalidateQueries(); }}>
            <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary animate-bounce" /><div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.15s' }} /><div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.3s' }} /></div></div>}>
              <Outlet key={`${location.pathname}-${errorPageKey}`} />
            </Suspense>
          </AdminPageErrorBoundary>
        </div>
      </main>
    </div>
  );
}
