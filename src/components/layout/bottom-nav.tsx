import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Sparkles, CalendarDays, BookOpen, User, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// BOTTOM NAVIGATION (Mobile GoFood/Tiket.com Style)
// ============================================

const navItems = [
  { label: 'Beranda', icon: Home, path: '/' },
  { label: 'Layanan', icon: Sparkles, path: '/services' },
  { label: 'Booking', icon: CalendarDays, path: '/appointment', highlight: true },
  { label: 'Blog', icon: BookOpen, path: '/blog' },
  { label: 'Akun', icon: User, path: '/account' },
];

export function BottomNav() {
  const location = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle scroll to show/hide scroll-to-top button
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
      setShowScrollTop(window.scrollY > 300);
    }, { passive: true });
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-bottom">
        {/* Glassmorphism Background */}
        <div className="glassmorphism border-t border-white/10 backdrop-blur-xl">
          {/* Safe area padding */}
          <div className="pb-env(safe-area-inset-bottom)">
            <div className="flex items-center justify-around h-16">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                if (item.highlight) {
                  // Center floating button (Booking)
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="relative -mt-6 flex flex-col items-center"
                    >
                      <motion.div
                        whileTap={{ scale: 0.9 }}
                        className={cn(
                          'w-14 h-14 rounded-full flex items-center justify-center shadow-gold-lg',
                          'bg-gradient-gold transition-all duration-300'
                        )}
                      >
                        <Icon className="w-6 h-6 text-dark" />
                      </motion.div>
                      <span className="mt-1 text-[10px] font-medium text-primary">
                        {item.label}
                      </span>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex flex-col items-center justify-center py-2 px-4 transition-colors duration-200',
                      active ? 'text-primary' : 'text-gray-500 hover:text-gray-300'
                    )}
                  >
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className="relative"
                    >
                      <Icon className="w-5 h-5" />
                      {active && (
                        <motion.div
                          layoutId="bottomNavIndicator"
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                        />
                      )}
                    </motion.div>
                    <span className={cn(
                      'mt-1 text-[10px] font-medium transition-colors',
                      active && 'text-primary'
                    )}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 z-40 md:hidden w-10 h-10 rounded-full bg-primary text-dark shadow-gold flex items-center justify-center"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </motion.button>
      )}

      {/* Spacer for mobile bottom nav */}
      <div className="h-16 md:hidden" />
    </>
  );
}
