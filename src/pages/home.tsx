import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight, MapPin, MessageCircle, BookOpen, Sparkles, Flower2, Heart, Gem, Leaf } from 'lucide-react';
import { SEOHead } from '@/components/seo/seo-head';
import { PageTransition, InViewAnimate } from '@/components/ui/motion';
import { HeroPhotoSlider } from '@/components/hero/hero-photo-slider';
import { HeroVideo } from '@/components/hero/hero-video';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/language';
import type { Article, HeroSlide, Service } from '@/lib/types';

type MobilePromo = { title: string; subtitle: string; image_url: string; link: string; badge: string };

const DEMO_HERO_SLIDES: HeroSlide[] = [
  { id: '1', type: 'image', media_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1400&q=80', thumbnail_url: '', headline: 'Luxury Massage,\nDelivered in Bali', subheadline: 'Private Wellness Experience', cta_text: 'Book Now', cta_link: '/appointment', sort_order: 0, is_active: true, animation_preset: 'kenburns' },
];
const DEMO_PROMOS: MobilePromo[] = [
  { title: 'Balinese Massage Deals', subtitle: 'Mulai Rp350K hari ini', image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=900&q=80', link: '/services/balinese-massage', badge: 'Promo' },
  { title: 'Couple Spa Ritual', subtitle: 'Private room & aromatherapy', image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&q=80', link: '/services/couple-package', badge: 'Best' },
  { title: 'Herbal Facial Glow', subtitle: 'Fresh skin after beach day', image_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=900&q=80', link: '/services/herbal-facial', badge: 'New' },
];
const DEMO_SERVICES: Service[] = [
  { id: '1', name: 'Balinese Massage', slug: 'balinese-massage', description: 'Pijatan tradisional Bali untuk menghilangkan ketegangan otot dan merilekskan tubuh', duration_minutes: 60, price: 350000, category: 'Massage', image_url: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&q=80', is_active: true, sort_order: 0, created_at: '' },
  { id: '2', name: 'Hot Stone Massage', slug: 'hot-stone-massage', description: 'Pijatan dengan batu panas vulkanik untuk relaksasi mendalam dan pemulihan energi', duration_minutes: 90, price: 450000, category: 'Massage', image_url: 'https://images.unsplash.com/photo-1600334130728-8e36bfa9fa7c?w=600&q=80', is_active: true, sort_order: 1, created_at: '' },
  { id: '3', name: 'Herbal Facial', slug: 'herbal-facial', description: 'Perawatan wajah dengan ramuan herbal tradisional Bali untuk kulit glowing dan sehat', duration_minutes: 75, price: 300000, category: 'Facial', image_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80', is_active: true, sort_order: 2, created_at: '' },
  { id: '4', name: 'Royal Lulur', slug: 'royal-lulur', description: 'Ritual perawatan tubuh kerajaan Jawa untuk kulit cerah bercahaya', duration_minutes: 120, price: 500000, category: 'Body Treatment', image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80', is_active: true, sort_order: 3, created_at: '' },
  { id: '5', name: 'Couple Package', slug: 'couple-package', description: 'Paket spa romantis untuk pasangan dengan treatment eksklusif', duration_minutes: 120, price: 900000, category: 'Couple Package', image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80', is_active: true, sort_order: 4, created_at: '' },
];
const DEMO_ARTICLES: Pick<Article, 'id' | 'title' | 'slug' | 'excerpt' | 'cover_image' | 'category' | 'created_at' | 'published_at'>[] = [
  { id: 'a1', title: 'Manfaat Balinese Massage untuk Tubuh', slug: 'manfaat-balinese-massage', excerpt: 'Ritual pijat Bali untuk melepas tegang dan memulihkan energi.', cover_image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&q=80', category: 'Wellness', created_at: '2026-07-01', published_at: '2026-07-01' },
  { id: 'a2', title: 'Tips Spa Setelah Seharian di Pantai', slug: 'tips-spa-setelah-pantai', excerpt: 'Cara memilih treatment singkat setelah aktivitas outdoor.', cover_image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80', category: 'Tips', created_at: '2026-07-02', published_at: '2026-07-02' },
  { id: 'a3', title: 'Facial Herbal untuk Kulit Glowing', slug: 'facial-herbal-kulit-glowing', excerpt: 'Bahan alami dan langkah perawatan wajah sehat.', cover_image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80', category: 'Beauty', created_at: '2026-07-03', published_at: '2026-07-03' },
];

export default function Home() {
  const { t, language } = useLanguage();
  const { data: heroSlides = DEMO_HERO_SLIDES } = useQuery<HeroSlide[]>({ queryKey: ['hero-slides'], queryFn: async () => { const { data, error } = await supabase.from('hero_slides').select('*').eq('is_active', true).order('sort_order'); if (error || !data?.length) return DEMO_HERO_SLIDES; return data as HeroSlide[]; } });
  const { data: mobilePromos = DEMO_PROMOS } = useQuery<MobilePromo[]>({ queryKey: ['mobile-hero-promos'], queryFn: async () => { const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'mobile_hero_promos').maybeSingle(); const promos = (data?.value as { promos?: MobilePromo[] } | null)?.promos; if (error || !promos?.length) return DEMO_PROMOS; return promos; } });
  const { data: services = DEMO_SERVICES } = useQuery<Service[]>({ queryKey: ['services-featured'], queryFn: async () => { const { data, error } = await supabase.from('services').select('*, prices:service_prices(*)').eq('is_active', true).order('sort_order').limit(8); if (error || !data?.length) return DEMO_SERVICES; return data as Service[]; } });
  const { data: articles = DEMO_ARTICLES } = useQuery({ queryKey: ['home-latest-articles'], queryFn: async () => { const { data, error } = await supabase.from('articles').select('id,title,slug,excerpt,cover_image,category,created_at,published_at').eq('status', 'published').order('published_at', { ascending: false }).limit(8); if (error || !data?.length) return DEMO_ARTICLES; return data as typeof DEMO_ARTICLES; } });
  const firstHero = heroSlides.find((slide) => slide.is_active) ?? DEMO_HERO_SLIDES[0];
  const hasVideoHero = heroSlides.some((slide) => slide.type === 'video' && slide.is_active);
  const videoSlide = heroSlides.find((slide) => slide.type === 'video' && slide.is_active);
  const appIcons = [
    { label: 'Massage', icon: Sparkles, path: '/services' }, { label: 'Facial', icon: Flower2, path: '/services' }, { label: 'Lulur', icon: Leaf, path: '/services' },
    { label: 'Couple', icon: Heart, path: '/services' }, { label: 'Package', icon: Gem, path: '/services' }, { label: 'Booking', icon: CalendarDays, path: '/appointment' },
    { label: language === 'en' ? 'Articles' : 'Artikel', icon: BookOpen, path: '/blog' },
  ];

  return <PageTransition>
    <SEOHead pageSEO={{ path: '/', title: 'Luxury Massage Bali — Premium Home Massage & Wellness', description: language === 'en' ? 'Premium massage and wellness treatments delivered to your villa, hotel, apartment, or home across Bali.' : 'Massage dan wellness premium langsung ke villa, hotel, apartemen, atau rumah Anda di Bali.', ogImage: firstHero?.media_url }} />

    <section id="hero" className="relative overflow-hidden bg-[#07100c] pb-5 pt-[92px] text-white lg:hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,200,186,0.08),transparent_36%),linear-gradient(180deg,rgba(7,16,12,0.2),rgba(7,16,12,1))]" />
      <div className="relative z-10 px-4">
        <p className="text-[11px] font-black text-primary">{t('appGreeting')}</p>
        <h1 className="mt-1 text-[22px] font-black leading-tight tracking-[-0.04em]">{t('heroTitle')}</h1>
        <div className="-mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
          {mobilePromos.map((promo, index) => <Link key={`${promo.title}-${index}`} to={promo.link || '/services'} className="relative h-40 min-w-[86vw] snap-center overflow-hidden rounded-[1.6rem] border border-white/10 bg-dark/40 shadow-xl"><img src={promo.image_url} alt={promo.title} width="900" height="520" decoding="async" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-dark/90 via-dark/35 to-transparent" /><div className="absolute left-4 top-4 max-w-[58%]"><span className="rounded-full bg-primary px-2.5 py-1 text-[9px] font-black text-dark">{promo.badge}</span><h2 className="mt-3 line-clamp-2 text-lg font-black leading-tight text-white">{promo.title}</h2><p className="mt-1 line-clamp-2 text-[11px] font-semibold text-gray-200">{promo.subtitle}</p></div></Link>)}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-3 rounded-[1.75rem] border border-primary/10 bg-transparent p-3 shadow-none">
          {appIcons.map((item) => <Link key={item.label} to={item.path} className="flex flex-col items-center gap-1.5"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-gold text-dark shadow-gold"><item.icon className="h-5 w-5" /></div><span className="text-center text-[10px] font-bold leading-tight text-gray-200">{item.label}</span></Link>)}
        </div>
      </div>
    </section>

    <section className="relative hidden h-screen min-h-[600px] max-h-[900px] overflow-hidden text-white lg:block">
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
    </section>

    <section className="bg-dark px-4 py-6 lg:py-10">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary/15 via-white/[0.04] to-emerald-500/10 p-5 shadow-[0_28px_90px_rgba(168,200,186,0.12)] lg:p-8"
        >
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
                <Sparkles className="h-4 w-4" /> Home Service / Out Call Only
              </p>
              <h2 className="mt-5 max-w-3xl font-heading text-2xl font-black leading-tight tracking-[-0.04em] text-white md:text-4xl lg:text-5xl">
                Luxury treatment datang langsung ke villa, hotel, apartemen, atau rumah Anda.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-300 md:text-base">
                Luxury Massage Bali melayani <strong className="text-primary">HOME SERVICE / OUT CALL</strong> di Bali. Nikmati massage, facial, body treatment, dan couple package secara privat tanpa perlu keluar dari akomodasi.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
              {[
                { title: 'Datang ke Lokasi', text: 'Terapis menuju hotel, villa, rumah, atau apartemen Anda.' },
                { title: 'Private & Nyaman', text: 'Treatment berlangsung personal di ruang pilihan Anda.' },
                { title: 'Booking Wajib', text: 'Jadwal dikonfirmasi lebih dulu lewat WhatsApp.' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-sm font-black text-white">{item.title}</p>
                  <p className="mt-2 text-xs leading-5 text-gray-400">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>

    <section id="services" className="bg-dark py-8 lg:py-20"><div className="section-container"><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-primary">✦ {t('specialties')} ✦</p><h2 className="mt-1 text-xl font-black text-white lg:text-5xl">{t('popularServices')}</h2></div><Link to="/services" className="text-xs font-bold text-primary">{t('seeAll')}</Link></div><div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">{services.map((service) => {
      const prices = service.prices || [];
      const lowestPrice = prices.length > 0 ? Math.min(...prices.map(p => p.price)) : (service.price ?? 0);
      const durationLabel = prices.length > 0 ? `${prices.length} Opsi` : (service.duration_minutes ? `${service.duration_minutes} ${t('minutes')}` : 'Flexible');
      return <Link key={service.id} to={`/services/${service.slug}`} className="group min-w-[74vw] snap-start overflow-hidden rounded-[1.75rem] border border-white/10 bg-dark-card shadow-xl transition hover:-translate-y-1 hover:border-primary/40 sm:min-w-[340px] lg:min-w-0"><div className="relative h-44 overflow-hidden"><img src={service.image_url} alt={service.name} width="600" height="360" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" decoding="async" /><div className="absolute inset-0 bg-gradient-to-t from-dark/90 to-transparent" /><span className="absolute left-3 top-3 rounded-full bg-dark/85 px-3 py-1 text-[10px] font-black text-primary">{service.category}</span></div><div className="p-4"><h3 className="line-clamp-1 text-sm font-black text-white">{service.name}</h3><p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-400">{service.description}</p><div className="mt-4 flex items-center justify-between"><div><p className="text-[10px] text-gray-500">{t('from')}</p><p className="text-sm font-black text-primary">Rp {lowestPrice.toLocaleString('id-ID')}</p></div><p className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold text-gray-300">{durationLabel}</p></div></div></Link>
    })}</div></div></section>

    <section className="bg-dark py-4 lg:py-16"><div className="section-container"><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-primary"><BookOpen className="mr-1 inline h-3 w-3" /> Blog</p><h2 className="mt-1 text-xl font-black text-white lg:text-4xl">{t('latestArticles')}</h2></div><Link to="/blog" className="text-xs font-bold text-primary">{t('seeAll')}</Link></div><div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">{articles.map((article) => <Link key={article.id} to={`/blog/${article.slug}`} className="min-w-[78vw] snap-start overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] sm:min-w-[360px] lg:min-w-0"><div className="h-40 bg-primary/10">{article.cover_image ? <img src={article.cover_image} alt={article.title} className="h-full w-full object-cover" loading="lazy" /> : null}</div><div className="p-4"><p className="text-[10px] font-black uppercase tracking-widest text-primary">{article.category}</p><h3 className="mt-2 line-clamp-2 text-sm font-black text-white">{article.title}</h3><p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-400">{article.excerpt}</p><p className="mt-4 inline-flex items-center gap-1 text-[11px] font-black text-primary">{t('read')} <ArrowRight className="h-3 w-3" /></p></div></Link>)}</div></div></section>

    <section className="bg-dark-lighter py-12 lg:py-20"><div className="section-container"><motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="overflow-hidden rounded-[2rem] bg-gradient-brand p-6 lg:p-12"><p className="text-xs font-black uppercase tracking-widest text-primary">✦ {t('ctaEyebrow')} ✦</p><h2 className="mt-3 text-2xl font-black text-white lg:text-4xl">{t('ctaTitle')}</h2><p className="mt-3 max-w-2xl text-sm text-gray-300">{t('ctaText')}</p><div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2"><Button variant="gold" className="h-[52px] w-full" leftIcon={<CalendarDays className="h-4 w-4" />}><Link to="/appointment">{t('bookAppointment')}</Link></Button><a href="https://wa.me/6281353681757?text=Halo%20Luxury%20Massage%20Bali%2C%20saya%20ingin%20bertanya" target="_blank" rel="noreferrer" className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-5 py-3 text-sm font-bold text-primary transition hover:bg-primary hover:text-dark"><MessageCircle className="h-4 w-4" /> CHAT ADMIN VIA WHATSAPP</a></div></motion.div></div></section>

    <section className="bg-dark py-12 lg:py-20"><div className="section-container"><InViewAnimate className="mb-8 text-center"><p className="text-xs font-black uppercase tracking-widest text-primary">✦ {t('testimonials')} ✦</p><h2 className="mt-2 text-2xl font-black text-white lg:text-5xl">{t('whatTheySay')}</h2></InViewAnimate><div className="grid gap-4 md:grid-cols-3">{[{ name: 'Sarah M.', location: 'Jakarta', comment: language === 'en' ? 'Best spa experience I have had in Bali. The Balinese massage was amazing.' : 'Pengalaman spa terbaik yang pernah saya rasakan di Bali. Massage Balinese-nya luar biasa!' }, { name: 'Michael T.', location: 'Australia', comment: 'The hot stone massage was absolutely incredible. The therapists are highly skilled.' }, { name: 'Dewi R.', location: 'Bali', comment: language === 'en' ? 'The herbal facial always makes my skin feel fresh and glowing.' : 'Herbal facial-nya selalu bikin kulit saya glowing dan segar!' }].map((review) => <div key={review.name} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"><p className="text-sm leading-6 text-gray-300">"{review.comment}"</p><div className="mt-5 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-gold text-sm font-black text-dark">{review.name[0]}</div><div><p className="text-sm font-bold text-white">{review.name}</p><p className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="h-3 w-3" />{review.location}</p></div></div></div>)}</div></div></section>
  </PageTransition >;
}
