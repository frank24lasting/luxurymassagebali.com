import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock, FileText, Menu, Search, Sparkles, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useBrandingSettings } from '@/lib/branding';
import { useLanguage } from '@/lib/language';
import { supabase } from '@/lib/supabase';
import type { Article, Service } from '@/lib/types';

const DEMO_SEARCH_SERVICES: Pick<Service, 'id' | 'name' | 'slug' | 'description' | 'category'>[] = [
  { id: 'demo-1', name: 'Balinese Massage', slug: 'balinese-massage', description: 'Pijatan tradisional Bali untuk relaksasi tubuh.', category: 'Massage' },
  { id: 'demo-2', name: 'Hot Stone Massage', slug: 'hot-stone-massage', description: 'Batu hangat vulkanik untuk pemulihan energi.', category: 'Massage' },
  { id: 'demo-3', name: 'Herbal Facial', slug: 'herbal-facial', description: 'Facial herbal untuk kulit segar dan terawat.', category: 'Facial' },
];

const DEMO_SEARCH_ARTICLES: Pick<Article, 'id' | 'title' | 'slug' | 'excerpt' | 'category'>[] = [
  { id: 'article-1', title: 'Manfaat Balinese Massage', slug: 'manfaat-balinese-massage', excerpt: 'Kenali manfaat massage tradisional Bali.', category: 'Wellness' },
  { id: 'article-2', title: 'Tips Relaksasi Setelah Pantai', slug: 'tips-spa-setelah-pantai', excerpt: 'Ritual singkat setelah aktivitas pantai.', category: 'Tips' },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const location = useLocation();
  const { siteName, tagline, logoUrl, logoStickyUrl } = useBrandingSettings();
  const { language, setLanguage, t } = useLanguage();

  const currentLogo = isScrolled ? (logoStickyUrl || logoUrl) : logoUrl;

  const navLinks = useMemo(() => [
    { label: t('home'), path: '/' },
    { label: t('services'), path: '/services' },
    { label: t('booking'), path: '/appointment' },
    { label: t('blog'), path: '/blog' },
    { label: t('about'), path: '/about' },
    { label: t('contact'), path: '/contact' },
  ], [t]);

  const { data: searchServices = DEMO_SEARCH_SERVICES } = useQuery({
    queryKey: ['navbar-search-services'],
    enabled: isSearchOpen,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id,name,slug,description,category')
        .eq('is_active', true)
        .order('sort_order')
        .limit(10);
      if (error || !data?.length) return DEMO_SEARCH_SERVICES;
      return data as typeof DEMO_SEARCH_SERVICES;
    },
  });

  const { data: searchArticles = DEMO_SEARCH_ARTICLES } = useQuery({
    queryKey: ['navbar-search-articles'],
    enabled: isSearchOpen,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('id,title,slug,excerpt,category')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(10);
      if (error || !data?.length) return DEMO_SEARCH_ARTICLES;
      return data as typeof DEMO_SEARCH_ARTICLES;
    },
  });

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsSearchOpen(false);
    setIsMenuOpen(false);
    setQuery('');
  }, [location.pathname]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 2) return [];
    const services = searchServices
      .filter((item) => `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(term))
      .slice(0, 4)
      .map((item) => ({ type: t('serviceLabel'), title: item.name, desc: item.category, path: `/services/${item.slug}`, icon: Sparkles }));
    const articles = searchArticles
      .filter((item) => `${item.title} ${item.excerpt} ${item.category}`.toLowerCase().includes(term))
      .slice(0, 4)
      .map((item) => ({ type: t('articleLabel'), title: item.title, desc: item.category, path: `/blog/${item.slug}`, icon: FileText }));
    return [...services, ...articles].slice(0, 6);
  }, [query, searchServices, searchArticles, t]);

  const searchPanel = (
    <div className="absolute left-0 right-0 top-[calc(100%+0.65rem)] overflow-hidden rounded-2xl border border-white/15 bg-dark-lighter shadow-glass-lg">
      {query.trim().length < 2 ? (
        <p className="px-4 py-4 text-sm text-text-muted">{t('searchEmpty')}</p>
      ) : results.length ? (
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.map((item) => (
            <Link key={`${item.type}-${item.path}`} to={item.path} className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-white/[0.07]">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{item.title}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-text-muted"><Clock className="h-3 w-3" /> {item.type} · {item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="px-4 py-4 text-sm text-text-muted">{t('noResults')}</p>
      )}
    </div>
  );

  return (
    <header className={cn('fixed inset-x-0 top-0 z-50 border-b transition-all duration-300', isScrolled || isMenuOpen || isSearchOpen ? 'border-white/10 bg-dark/95 shadow-glass py-1' : 'border-transparent bg-dark/85 py-2')}>
      <nav className="section-container" aria-label="Navigasi utama">
        <div className="flex min-h-[4.75rem] md:min-h-[5.5rem] items-center justify-between gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-3 py-1" aria-label={`${siteName} beranda`}>
            {currentLogo ? (
              <img
                src={currentLogo}
                alt={`${siteName} logo`}
                width="240"
                height="64"
                decoding="async"
                className="h-14 sm:h-16 md:h-18 lg:h-20 w-auto max-w-[220px] sm:max-w-[280px] md:max-w-[340px] object-contain drop-shadow-md transition-all duration-300"
              />
            ) : (
              <>
                <img src="/favicon.svg" alt="" width="52" height="52" className="h-12 w-12 shrink-0 sm:h-14 sm:w-14" />
                <span className="min-w-0">
                  <span className="block truncate font-heading text-xl font-bold leading-tight text-white sm:text-2xl">{siteName}</span>
                  <span className="hidden truncate text-[11px] font-semibold uppercase tracking-[0.2em] text-primary sm:block">{tagline}</span>
                </span>
              </>
            )}
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className={cn('rounded-lg px-3 py-2 text-sm font-semibold transition', location.pathname === link.path ? 'bg-white/10 text-primary' : 'text-text-secondary hover:bg-white/[0.06] hover:text-white')}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button id="navbar-search-toggle" type="button" onClick={() => { setIsSearchOpen((open) => !open); setIsMenuOpen(false); }} className="app-icon-button" aria-expanded={isSearchOpen} aria-controls="navbar-search-panel" aria-label="Cari">
              {isSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </button>
            <button id="language-toggle" type="button" onClick={() => setLanguage(language === 'id' ? 'en' : 'id')} className="app-icon-button text-xs font-black" aria-label="Switch language">
              {language.toUpperCase()}
            </button>
            <Link to="/appointment" className="btn-primary hidden min-h-10 px-4 py-2 text-sm sm:inline-flex">{t('bookNow')}</Link>
            <button id="mobile-menu-toggle" type="button" onClick={() => { setIsMenuOpen((open) => !open); setIsSearchOpen(false); }} className="app-icon-button lg:hidden" aria-expanded={isMenuOpen} aria-controls="mobile-menu" aria-label="Buka menu">
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isSearchOpen && (
          <div id="navbar-search-panel" className="relative pb-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-[calc(50%+0.5rem)] text-primary" />
            <input id="site-search" type="search" autoFocus autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchPlaceholder')} className="input-field h-12 pl-11" />
            {searchPanel}
          </div>
        )}

        {isMenuOpen && (
          <div id="mobile-menu" className="grid gap-1 border-t border-white/10 py-3 lg:hidden">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className={cn('rounded-xl px-4 py-3 text-sm font-semibold transition', location.pathname === link.path ? 'bg-white/10 text-primary' : 'text-text-secondary hover:bg-white/[0.06] hover:text-white')}>
                {link.label}
              </Link>
            ))}
            <Link to="/appointment" className="btn-primary mt-2 sm:hidden">{t('bookAppointment')}</Link>
          </div>
        )}
      </nav>
    </header>
  );
}
