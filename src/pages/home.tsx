import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ArrowRight,
  MapPin,
  MessageCircle,
  BookOpen,
  Sparkles,
  Flower2,
  Heart,
  Gem,
  Leaf,
  ShieldCheck,
  Star,
  Clock,
  Compass,
  Zap,
} from 'lucide-react';
import { SEOHead } from '@/components/seo/seo-head';
import { PageTransition } from '@/components/ui/motion';
import { HeroPhotoSlider } from '@/components/hero/hero-photo-slider';
import { HeroVideo } from '@/components/hero/hero-video';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/language';
import { useContactSettings } from '@/lib/contact';
import type { Article, HeroSlide, Service } from '@/lib/types';

type MobilePromo = { title: string; subtitle: string; image_url: string; link: string; badge: string };

const DEMO_HERO_SLIDES: HeroSlide[] = [
  {
    id: '1',
    type: 'image',
    media_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1600&q=85',
    thumbnail_url: '',
    headline: 'Luxury Home Massage\nDelivered in Bali',
    subheadline: '✦ Private 5-Star Wellness Concierge ✦',
    cta_text: 'Book Villa Session',
    cta_link: '/appointment',
    sort_order: 0,
    is_active: true,
    animation_preset: 'kenburns',
  },
];

const DEMO_PROMOS: MobilePromo[] = [
  {
    title: 'Signature Balinese',
    subtitle: 'Relaksasi otot mendalam di villa',
    image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=900&q=80',
    link: '/services/balinese-massage',
    badge: 'Popular',
  },
  {
    title: 'Couple Sanctuary',
    subtitle: 'Side-by-side romantic ritual',
    image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&q=80',
    link: '/services/couple-package',
    badge: 'VIP Choice',
  },
  {
    title: 'Volcanic Hot Stone',
    subtitle: 'Melt away fatigue & jetlag',
    image_url: 'https://images.unsplash.com/photo-1600334130728-8e36bfa9fa7c?w=900&q=80',
    link: '/services/hot-stone-massage',
    badge: 'Trending',
  },
  {
    title: 'Radiance Herbal Facial',
    subtitle: 'Fresh glow with natural botanicals',
    image_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=900&q=80',
    link: '/services/herbal-facial',
    badge: 'Glow',
  },
];

const DEMO_SERVICES: Service[] = [
  {
    id: '1',
    name: 'Balinese Traditional Massage',
    slug: 'balinese-massage',
    description: 'Teknik pijat pusaka Bali dengan tekanan telapak dan jempol untuk melancarkan sirkulasi dan melepas ketegangan otot.',
    duration_minutes: 60,
    price: 350000,
    category: 'Massage',
    image_url: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=700&q=80',
    is_active: true,
    sort_order: 0,
    created_at: '',
  },
  {
    id: '2',
    name: 'Volcanic Hot Stone Therapy',
    slug: 'hot-stone-massage',
    description: 'Batu basal vulkanik hangat diletakkan di titik energi untuk relaksasi tingkat sel dan pelemasan otot mendalam.',
    duration_minutes: 90,
    price: 450000,
    category: 'Massage',
    image_url: 'https://images.unsplash.com/photo-1600334130728-8e36bfa9fa7c?w=700&q=80',
    is_active: true,
    sort_order: 1,
    created_at: '',
  },
  {
    id: '3',
    name: 'Balinese Herbal Facial Glow',
    slug: 'herbal-facial',
    description: 'Perawatan wajah holistik dengan rempah dan ekstrak bunga Bali untuk membersihkan pori dan mencerahkan kulit.',
    duration_minutes: 75,
    price: 300000,
    category: 'Facial',
    image_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=700&q=80',
    is_active: true,
    sort_order: 2,
    created_at: '',
  },
  {
    id: '4',
    name: 'Royal Javanese Lulur Scrub',
    slug: 'royal-lulur',
    description: 'Ritual lulur tradisional putri keraton berbahan kunyit dan beras wangi untuk eksfoliasi kulit halus berkilau.',
    duration_minutes: 120,
    price: 500000,
    category: 'Body Treatment',
    image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=700&q=80',
    is_active: true,
    sort_order: 3,
    created_at: '',
  },
  {
    id: '5',
    name: 'VIP Couple Retreat Sanctuary',
    slug: 'couple-package',
    description: 'Paket spa romantis side-by-side untuk pasangan di villa Anda, lengkap dengan essential oils pilihan dan ritual santai.',
    duration_minutes: 120,
    price: 900000,
    category: 'Couple Package',
    image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=700&q=80',
    is_active: true,
    sort_order: 4,
    created_at: '',
  },
];

const DEMO_ARTICLES: Pick<Article, 'id' | 'title' | 'slug' | 'excerpt' | 'cover_image' | 'category' | 'created_at' | 'published_at'>[] = [
  {
    id: 'a1',
    title: 'Manfaat Balinese Massage untuk Jetlag & Pegal Wisatawan',
    slug: 'manfaat-balinese-massage',
    excerpt: 'Kombinasi akupresur dan minyak aromaterapi murni memulihkan energi tubuh Anda secara instan.',
    cover_image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&q=80',
    category: 'Wellness',
    created_at: '2026-07-01',
    published_at: '2026-07-01',
  },
  {
    id: 'a2',
    title: 'Mengapa Layanan Home Service Spa Jadi Pilihan Favorit di Bali',
    slug: 'tips-spa-setelah-pantai',
    excerpt: 'Nikmati kemewahan spa bintang lima langsung di kenyamanan villa privat Anda tanpa macet.',
    cover_image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80',
    category: 'Lifestyle',
    created_at: '2026-07-02',
    published_at: '2026-07-02',
  },
  {
    id: 'a3',
    title: 'Rahasia Kulit Berkilau dengan Facial Herbal Alami Tropis',
    slug: 'facial-herbal-kulit-glowing',
    excerpt: 'Nutrisi alami dari bahan organik Bali yang meremajakan dan menyegarkan tekstur kulit.',
    cover_image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80',
    category: 'Beauty',
    created_at: '2026-07-03',
    published_at: '2026-07-03',
  },
];

const COVERAGE_AREAS = [
  'Canggu',
  'Seminyak',
  'Ubud',
  'Uluwatu',
  'Jimbaran',
  'Sanur',
  'Nusa Dua',
  'Kuta / Legian',
];

export default function Home() {
  const { t, language } = useLanguage();
  const { getWhatsAppUrl } = useContactSettings();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedArea, setSelectedArea] = useState<string>('Canggu');

  const { data: heroSlides = DEMO_HERO_SLIDES } = useQuery<HeroSlide[]>({
    queryKey: ['hero-slides'],
    queryFn: async () => {
      const { data, error } = await supabase.from('hero_slides').select('*').eq('is_active', true).order('sort_order');
      if (error || !data?.length) return DEMO_HERO_SLIDES;
      return data as HeroSlide[];
    },
  });

  const { data: mobilePromos = DEMO_PROMOS } = useQuery<MobilePromo[]>({
    queryKey: ['mobile-hero-promos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'mobile_hero_promos')
        .maybeSingle();
      const promos = (data?.value as { promos?: MobilePromo[] } | null)?.promos;
      if (error || !promos?.length) return DEMO_PROMOS;
      return promos;
    },
  });

  const { data: services = DEMO_SERVICES } = useQuery<Service[]>({
    queryKey: ['services-featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*, prices:service_prices(*)')
        .eq('is_active', true)
        .order('sort_order');
      if (error || !data?.length) return DEMO_SERVICES;
      return data as Service[];
    },
  });

  const { data: articles = DEMO_ARTICLES } = useQuery({
    queryKey: ['home-latest-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('id,title,slug,excerpt,cover_image,category,created_at,published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(6);
      if (error || !data?.length) return DEMO_ARTICLES;
      return data as typeof DEMO_ARTICLES;
    },
  });

  const firstHero = heroSlides.find((slide) => slide.is_active) ?? DEMO_HERO_SLIDES[0];
  const hasVideoHero = heroSlides.some((slide) => slide.type === 'video' && slide.is_active);
  const videoSlide = heroSlides.find((slide) => slide.type === 'video' && slide.is_active);

  const categories = ['All', 'Massage', 'Couple Package', 'Body Treatment', 'Facial'];

  const filteredServices = selectedCategory === 'All'
    ? services
    : services.filter((s) => s.category?.toLowerCase() === selectedCategory.toLowerCase());

  const appIcons = [
    { label: 'Massage', icon: Sparkles, path: '/services?cat=massage', color: 'from-amber-400/20 to-emerald-500/20' },
    { label: 'Couple', icon: Heart, path: '/services?cat=couple', color: 'from-rose-500/20 to-amber-400/20' },
    { label: 'Body Care', icon: Leaf, path: '/services?cat=body', color: 'from-emerald-400/20 to-teal-500/20' },
    { label: 'Facial', icon: Flower2, path: '/services?cat=facial', color: 'from-purple-400/20 to-pink-500/20' },
    { label: 'Packages', icon: Gem, path: '/services', color: 'from-amber-300/20 to-yellow-500/20' },
    { label: 'Booking', icon: CalendarDays, path: '/appointment', color: 'from-emerald-500/30 to-primary/30' },
    { label: 'Articles', icon: BookOpen, path: '/blog', color: 'from-blue-400/20 to-cyan-500/20' },
    { label: 'WhatsApp', icon: MessageCircle, path: getWhatsAppUrl('Halo Luxury Massage Bali, saya ingin konsultasi layanan.'), external: true, color: 'from-emerald-400/30 to-green-600/30' },
  ];

  return (
    <PageTransition>
      <SEOHead
        pageSEO={{
          path: '/',
          title: 'Luxury Massage Bali — Premium Home Massage & Villa Wellness',
          description:
            language === 'en'
              ? 'Ultra-premium massage and spa treatments delivered directly to your villa, resort, or home anywhere in Bali. Certified therapists, organic oils, instant booking.'
              : 'Layanan massage dan spa mewah bintang lima langsung ke villa, hotel, atau rumah Anda di Bali. Terapis bersertifikat, minyak organik murni, pemesanan cepat.',
          ogImage: firstHero?.media_url,
        }}
      />

      {/* ========================================================================= */}
      {/* 1. FUTURISTIC MOBILE APP INTERFACE (Mobile View < lg) */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-[#071410] pb-6 pt-[88px] text-white lg:hidden">
        {/* Futuristic Ambient Glow Background */}
        <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-emerald-500/15 blur-[90px]" />
        <div className="pointer-events-none absolute -right-20 top-40 h-80 w-80 rounded-full bg-amber-400/10 blur-[100px]" />

        <div className="relative z-10 px-4">
          {/* Dynamic Island / Live Status Indicator */}
          <div className="flex items-center justify-between rounded-full border border-emerald-400/25 bg-emerald-950/40 px-3.5 py-1.5 backdrop-blur-xl shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[11px] font-semibold text-emerald-200">Therapists Active in Bali</span>
            </div>
            <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
              ⚡ 45-60m Arrival
            </span>
          </div>

          {/* Luxury Greeting & Hero Header */}
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">✦ Exclusive Villa Service</p>
              <h1 className="mt-1 font-heading text-[26px] font-black leading-[1.15] tracking-tight text-white">
                Luxury Massage <br />
                <span className="bg-gradient-to-r from-emerald-200 via-amber-200 to-emerald-300 bg-clip-text text-transparent">
                  Direct to Your Villa
                </span>
              </h1>
            </div>
            <Link
              to="/appointment"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/30 to-emerald-500/20 shadow-[0_0_25px_rgba(212,175,55,0.25)] transition active:scale-90"
              aria-label="Direct Booking"
            >
              <Zap className="h-5 w-5 text-primary" />
            </Link>
          </div>

          {/* Interactive Futuristic Story Promo Carousel */}
          <div className="-mx-4 mt-5 flex snap-x gap-3.5 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {mobilePromos.map((promo, index) => (
              <Link
                key={`${promo.title}-${index}`}
                to={promo.link || '/services'}
                className="group relative h-48 min-w-[84vw] snap-center overflow-hidden rounded-[2rem] border border-white/15 bg-emerald-950/30 shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition duration-300 active:scale-[0.98]"
              >
                <img
                  src={promo.image_url}
                  alt={promo.title}
                  width="900"
                  height="520"
                  decoding="async"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark/95 via-dark/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-dark/90 via-transparent to-transparent" />

                {/* Badge Tag */}
                <div className="absolute left-4 top-4">
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-dark/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary backdrop-blur-md">
                    <Sparkles className="h-3 w-3" /> {promo.badge}
                  </span>
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-lg font-black leading-tight text-white drop-shadow-md">{promo.title}</h2>
                  <p className="mt-1 line-clamp-1 text-xs font-medium text-emerald-100/80">{promo.subtitle}</p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
                      Pesan Sekarang <ArrowRight className="h-3 w-3" />
                    </span>
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-gray-300 backdrop-blur-sm">
                      Outcall Ready
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Futuristic App Quick-Launch Grid (8 Icons) */}
          <div className="mt-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
            <div className="mb-2.5 flex items-center justify-between px-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-primary/90">✦ Menu Navigasi Cepat</span>
              <span className="text-[10px] text-gray-400">Pilih & Booking</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {appIcons.map((item) => {
                const content = (
                  <div className="group flex flex-col items-center gap-1.5 transition active:scale-90">
                    <div
                      className={`flex h-13 w-13 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br ${item.color} shadow-[0_8px_20px_rgba(0,0,0,0.25)] transition duration-300 group-hover:border-primary/50`}
                    >
                      <item.icon className="h-5 w-5 text-emerald-200 transition group-hover:scale-110 group-hover:text-primary" />
                    </div>
                    <span className="text-center text-[10px] font-bold tracking-tight text-gray-200">{item.label}</span>
                  </div>
                );

                if (item.external) {
                  return (
                    <a key={item.label} href={item.path} target="_blank" rel="noreferrer">
                      {content}
                    </a>
                  );
                }
                return (
                  <Link key={item.label} to={item.path}>
                    {content}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. DESKTOP HERO ULTRA-LUXURY (Desktop View >= lg) */}
      {/* ========================================================================= */}
      <section className="relative hidden h-screen min-h-[640px] max-h-[920px] overflow-hidden bg-dark text-white lg:block">
        {hasVideoHero && videoSlide ? (
          <HeroVideo
            videoUrl={videoSlide.media_url}
            posterUrl={videoSlide.thumbnail_url}
            headline={videoSlide.headline}
            subheadline={videoSlide.subheadline}
            ctaText={videoSlide.cta_text}
            ctaLink={videoSlide.cta_link}
          />
        ) : (
          <HeroPhotoSlider slides={heroSlides} autoPlayInterval={6000} />
        )}

        {/* Floating Desktop Cyber-Luxury Glass Badges */}
        <div className="pointer-events-none absolute bottom-12 right-12 z-20 hidden lg:flex flex-col gap-3">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex items-center gap-3.5 rounded-2xl border border-white/20 bg-dark/70 p-3.5 backdrop-blur-xl shadow-2xl"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">100% Certified Therapists</p>
              <p className="text-[11px] text-gray-400">Strict hygiene & 5-star protocol</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="flex items-center gap-3.5 rounded-2xl border border-white/20 bg-dark/70 p-3.5 backdrop-blur-xl shadow-2xl"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/20 text-primary">
              <Star className="h-5 w-5 fill-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">5.0 Star Guest Rating</p>
              <p className="text-[11px] text-gray-400">Trusted by hundreds of Bali villas</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. VILLA CONCIERGE EXPERIENCE & AREA SELECTOR (Interactive Flow) */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-dark px-4 py-8 lg:py-16">
        <div className="section-container">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-emerald-500/25 bg-gradient-to-br from-emerald-950/40 via-dark-card to-dark/90 p-6 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.7)] lg:p-10">
            {/* Ambient Backlight */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> 5-Star Home & Villa Spa Experience
                </div>
                <h2 className="mt-4 font-heading text-2xl font-black leading-tight text-white md:text-4xl lg:text-5xl">
                  Spa Bintang Lima Hadir di Ruang Pribadi Anda
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-gray-300 md:text-base">
                  Tidak perlu keluar villa atau menembus kemacetan Bali. Terapis profesional kami datang membawa matras, linen bersih, aromaterapi organik, dan musik relaksasi langsung ke hotel, villa, atau tempat tinggal Anda.
                </p>

                {/* 3 Steps Flow */}
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { step: '01', title: 'Pilih Treatment', desc: 'Tentukan menu pijat & waktu sesuai keinginan Anda.' },
                    { step: '02', title: 'Terapis Menuju Lokasi', desc: 'Terapis tiba membawa seluruh peralatan higienis lengkap.' },
                    { step: '03', title: 'Relaksasi Maksimal', desc: 'Nikmati sensasi spa mewah dalam privasi total.' },
                  ].map((item) => (
                    <div key={item.step} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
                      <span className="font-heading text-xl font-black text-primary">{item.step}</span>
                      <p className="mt-2 text-sm font-bold text-white">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-gray-400">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Area Quick Booker & WhatsApp Dock */}
              <div className="rounded-3xl border border-primary/25 bg-emerald-950/30 p-5 backdrop-blur-xl shadow-xl">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
                  <Compass className="h-4 w-4" /> Area Layanan Outcall Bali
                </div>
                <p className="mt-1 text-xs text-gray-400">Pilih area Anda untuk estimasi kedatangan terapis:</p>

                <div className="mt-3.5 flex flex-wrap gap-2">
                  {COVERAGE_AREAS.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => setSelectedArea(area)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition duration-200 ${selectedArea === area
                        ? 'border border-primary bg-primary text-dark shadow-md shadow-primary/20'
                        : 'border border-white/10 bg-white/5 text-gray-300 hover:border-white/20'
                        }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Status Wilayah ({selectedArea}):</span>
                    <span className="font-bold text-emerald-400">✓ Terapis Siap Berangkat</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="gold" className="h-11 flex-1 text-xs font-black" leftIcon={<CalendarDays className="h-4 w-4" />}>
                      <Link to="/appointment">Pesan Sekarang</Link>
                    </Button>
                    <a
                      href={getWhatsAppUrl(`Halo Luxury Massage Bali, saya di area ${selectedArea} ingin booking terapis`)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-3.5 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/30"
                    >
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FUTURISTIC TREATMENT EXPLORER WITH CATEGORY FILTER */}
      {/* ========================================================================= */}
      <section id="services" className="bg-dark py-8 lg:py-20">
        <div className="section-container">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">✦ Treatment Menu</p>
              <h2 className="mt-1 font-heading text-2xl font-black text-white lg:text-5xl">
                Pilihan Treatment Eksklusif
              </h2>
            </div>
            <Link to="/services" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition hover:underline">
              Lihat Seluruh Layanan <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Interactive Category Filter Pills */}
          <div className="-mx-4 mt-6 flex snap-x gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide lg:mx-0 lg:px-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded-full px-5 py-2 text-xs font-black transition duration-200 ${selectedCategory === cat
                  ? 'border border-primary bg-primary text-dark shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                  : 'border border-white/10 bg-white/[0.04] text-gray-300 hover:border-white/20'
                  }`}
              >
                {cat === 'All' ? '✨ Semua Treatment' : cat}
              </button>
            ))}
          </div>

          {/* Treatment Cards Grid */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filteredServices.map((service) => {
                const prices = service.prices || [];
                const lowestPrice = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : service.price ?? 0;
                const durationLabel =
                  prices.length > 0
                    ? `${prices.length} Opsi Durasi`
                    : service.duration_minutes
                      ? `${service.duration_minutes} ${t('minutes')}`
                      : 'Flexible';

                return (
                  <motion.div
                    key={service.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Link
                      to={`/services/${service.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-emerald-950/20 backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-[0_15px_35px_rgba(0,0,0,0.6)]"
                    >
                      {/* Image Thumbnail with Overlay */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={service.image_url}
                          alt={service.name}
                          width="600"
                          height="360"
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-108"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-dark/95 via-dark/25 to-transparent" />
                        <span className="absolute left-3.5 top-3.5 rounded-full border border-white/15 bg-dark/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary backdrop-blur-md">
                          {service.category}
                        </span>
                        <span className="absolute bottom-3 right-3 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold text-gray-200 backdrop-blur-md">
                          <Clock className="mr-1 inline h-3 w-3" /> {durationLabel}
                        </span>
                      </div>

                      {/* Card Content */}
                      <div className="flex flex-1 flex-col justify-between p-5">
                        <div>
                          <h3 className="line-clamp-1 font-heading text-base font-black text-white group-hover:text-primary transition-colors">
                            {service.name}
                          </h3>
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-400">{service.description}</p>
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-medium text-gray-500">Mulai dari</p>
                            <p className="text-sm font-black text-primary">Rp {lowestPrice.toLocaleString('id-ID')}</p>
                          </div>
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-dark">
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. GUEST TESTIMONIALS & TRUST BADGES (Futuristic Glass Cards) */}
      {/* ========================================================================= */}
      <section className="bg-dark-lighter py-10 lg:py-20">
        <div className="section-container">
          <div className="mb-8 text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">✦ Verified Guest Reviews</p>
            <h2 className="mt-1 font-heading text-2xl font-black text-white lg:text-5xl">
              Pengalaman Tamu Villa di Bali
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                name: 'Sarah M.',
                location: 'Canggu Villa Guest',
                rating: 5,
                comment:
                  'Terapis datang tepat waktu ke villa kami di Canggu. Pijatan Balinese sangat profesional, aromaterapi mawarnya membuat rileks setelah surfing seharian.',
              },
              {
                name: 'Alexander & Elena',
                location: 'Seminyak Honeymoon Resort',
                rating: 5,
                comment:
                  'We booked the couple sanctuary package. The therapists set up everything in our villa garden with total respect and tranquility. 5-star experience in Bali!',
              },
              {
                name: 'Dewi Rahmawati',
                location: 'Ubud Private Residence',
                rating: 5,
                comment:
                  'Herbal facial dan hot stone-nya luar biasa! Kulit jadi glowing dan badan enteng. Terapis sangat sopan dan higienis.',
              },
            ].map((review, i) => (
              <div
                key={i}
                className="flex flex-col justify-between rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl shadow-lg"
              >
                <div>
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(review.rating)].map((_, idx) => (
                      <Star key={idx} className="h-4 w-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="mt-4 text-xs leading-6 text-gray-300">"{review.comment}"</p>
                </div>
                <div className="mt-6 flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-gold text-sm font-black text-dark">
                    {review.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{review.name}</p>
                    <p className="flex items-center gap-1 text-[10px] text-primary">
                      <MapPin className="h-2.5 w-2.5" /> {review.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. WELLNESS JOURNAL / BLOG */}
      {/* ========================================================================= */}
      <section className="bg-dark py-8 lg:py-16">
        <div className="section-container">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                <BookOpen className="mr-1 inline h-3.5 w-3.5" /> Wellness Journal
              </p>
              <h2 className="mt-1 font-heading text-2xl font-black text-white lg:text-4xl">Artikel & Tips Spa</h2>
            </div>
            <Link to="/blog" className="text-xs font-bold text-primary hover:underline">
              Semua Artikel
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.slice(0, 3).map((article) => (
              <Link
                key={article.id}
                to={`/${article.slug}`}
                className="group flex flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] transition duration-300 hover:border-primary/40 hover:bg-white/[0.05]"
              >
                <div className="h-44 overflow-hidden bg-primary/10">
                  {article.cover_image && (
                    <img
                      src={article.cover_image}
                      alt={article.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-108"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">{article.category}</span>
                    <h3 className="mt-2 line-clamp-2 font-heading text-sm font-bold text-white group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-400">{article.excerpt}</p>
                  </div>
                  <p className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">
                    Baca Artikel <ArrowRight className="h-3 w-3" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. VIP DIRECT CONCIERGE CALL-TO-ACTION DOCK */}
      {/* ========================================================================= */}
      <section className="bg-dark pb-16 pt-6 lg:pb-24">
        <div className="section-container">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-primary/30 bg-gradient-to-r from-emerald-950 via-[#0f2d24] to-[#1a382e] p-6 lg:p-12 shadow-[0_20px_80px_rgba(0,0,0,0.8)]">
            <div className="relative z-10 grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-dark/60 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> Instant Villa Reservation
                </span>
                <h2 className="mt-4 font-heading text-2xl font-black text-white lg:text-4xl">
                  Siap Merasakan Relaksasi Mewah Hari Ini?
                </h2>
                <p className="mt-2 text-sm text-emerald-100/80">
                  Hubungi concierge kami sekarang untuk reservasi cepat. Terapis bersertifikat siap menuju villa Anda.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Button variant="gold" className="h-13 w-full text-xs font-black shadow-gold" leftIcon={<CalendarDays className="h-4 w-4" />}>
                  <Link to="/appointment">Booking Form Online</Link>
                </Button>
                <a
                  href={getWhatsAppUrl('Halo Luxury Massage Bali, saya ingin booking massage ke villa')}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-5 text-xs font-black text-emerald-200 transition hover:bg-emerald-500/30"
                >
                  <MessageCircle className="h-4 w-4" /> Chat WhatsApp Fast Track
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
