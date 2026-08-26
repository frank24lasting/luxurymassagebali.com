import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Compass, MapPin, MessageCircle, Navigation, Phone, Sparkles } from 'lucide-react';
import { SEOHead } from '@/components/seo/seo-head';
import { supabase } from '@/lib/supabase';
import { useContactSettings } from '@/lib/contact';

interface PageRow { id: string; title: string; slug: string; excerpt: string | null; content: unknown; seo_title: string | null; seo_description: string | null; is_published: boolean; updated_at: string; }

const MAP_EMBED_URL = 'https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3942.746425768273!2d115.20415287501628!3d-8.809876491242953!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zOMKwNDgnMzUuNiJTIDExNcKwMTInMjQuMiJF!5e0!3m2!1sid!2sid!4v1783526216809!5m2!1sid!2sid';

const fallbackPages: Record<string, { title: string; excerpt: string; content: string }> = {
  tentang: { title: 'Tentang Kami', excerpt: 'Luxury Massage Bali menghadirkan treatment home service premium di Bali.', content: 'Kami menghadirkan relaksasi, kecantikan, dan pemulihan tubuh langsung ke villa, hotel, apartemen, atau rumah Anda. Terapis profesional, produk higienis, dan jadwal fleksibel.' },
  kontak: { title: 'Kontak', excerpt: 'Hubungi Luxury Massage Bali untuk konsultasi dan reservasi.', content: 'Area layanan: Bali.' },
  contact: { title: 'Contact', excerpt: 'Contact Luxury Massage Bali for booking and consultation.', content: 'Service area: Bali.' },
  faq: { title: 'FAQ', excerpt: 'Pertanyaan umum sebelum booking Luxury Massage Bali.', content: 'Booking dilakukan lewat WhatsApp. Pilih layanan, durasi, lokasi, tanggal, dan jam. Tim akan mengonfirmasi ketersediaan terapis sebelum jadwal final.' },
  'cara-booking': { title: 'Cara Booking', excerpt: 'Reservasi mudah via WhatsApp.', content: 'Klik tombol Book Appointment, kirim nama, lokasi, layanan, tanggal, dan jam pilihan. Tim kami akan membalas untuk konfirmasi jadwal dan total biaya.' },
  'kebijakan-privasi': { title: 'Kebijakan Privasi', excerpt: 'Kami menjaga data reservasi pelanggan.', content: 'Data nama, nomor telepon, lokasi, dan preferensi layanan hanya digunakan untuk keperluan reservasi, operasional terapis, dan komunikasi layanan.' },
  'syarat-ketentuan': { title: 'Syarat & Ketentuan', excerpt: 'Ketentuan penggunaan layanan Luxury Massage Bali.', content: 'Pelanggan wajib memberikan alamat lengkap dan jadwal yang valid. Perubahan jadwal mengikuti ketersediaan terapis. Layanan dapat ditolak jika lokasi tidak aman.' },
  refund: { title: 'Refund Policy', excerpt: 'Kebijakan pembatalan dan pengembalian dana.', content: 'Refund mengikuti status booking dan waktu pembatalan. Pembatalan mendadak dapat dikenakan biaya operasional jika terapis sudah menuju lokasi.' },
  'refund-policy': { title: 'Refund Policy', excerpt: 'Kebijakan pembatalan dan pengembalian dana.', content: 'Refund mengikuti status booking dan waktu pembatalan. Pembatalan mendadak dapat dikenakan biaya operasional jika terapis sudah menuju lokasi.' },
};

const legacySlugAliases: Record<string, string> = {
  refund: 'refund-policy',
  'tentang-kami': 'tentang',
  contact: 'kontak',
};

async function fetchPage(slug: string): Promise<PageRow | null> {
  const candidateSlugs = [slug, legacySlugAliases[slug]].filter(Boolean);
  const { data, error } = await supabase.from('pages').select('*').in('slug', candidateSlugs).eq('is_published', true).limit(2);
  if (error && error.code !== '42P01') throw new Error(error.message);
  if (!data?.length) return null;
  return data.find((page) => page.slug === slug) ?? data[0] ?? null;
}

function renderPageContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!content || typeof content !== 'object') return '';
  return JSON.stringify(content)
    .replace(/[{}"\[\],:]/g, ' ')
    .replace(/type|content|text|paragraph|doc|heading|bulletList|orderedList|listItem/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function LuxuryMapCard() {
  const { phone, address, googleMapsUrl, getWhatsAppUrl } = useContactSettings();

  return (
    <motion.section
      initial={{ opacity: 0, y: 36, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      className="mt-10 overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/15 via-white/[0.04] to-emerald-500/10 p-1 shadow-[0_30px_120px_rgba(168,200,186,0.16)]"
    >
      <div className="relative overflow-hidden rounded-[1.85rem] bg-dark-card">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="grid gap-0 lg:grid-cols-[0.88fr_1.12fr]">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.15 }}
            className="relative z-10 flex flex-col justify-between p-6 md:p-8 lg:p-10"
          >
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
                <Compass className="h-4 w-4" /> Find Us
              </span>
              <h2 className="mt-6 font-heading text-3xl font-black leading-none tracking-[-0.04em] text-white md:text-5xl">
                Luxury Massage Bali
              </h2>
              <p className="mt-5 text-sm leading-7 text-gray-300 md:text-base">
                Kantor operasional kami berada di Bali. Seluruh treatment dilakukan sebagai home service di lokasi Anda.
              </p>
            </div>

            <div className="mt-8 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-black text-white">Area Layanan & Kantor</p>
                    <p className="mt-1 text-xs leading-6 text-gray-400">{address}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start gap-3">
                  <Phone className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-black text-white">WhatsApp Booking</p>
                    <p className="mt-1 text-xs leading-6 text-gray-400">{phone}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <motion.a
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-black text-dark shadow-gold"
              >
                <Navigation className="h-5 w-5" /> Open Google Maps
              </motion.a>
              <motion.a
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={getWhatsAppUrl('Halo Luxury Massage Bali, saya ingin reservasi/tanya jadwal.')}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-black text-white hover:border-primary/40"
              >
                <MessageCircle className="h-5 w-5" /> Chat Admin
              </motion.a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, delay: 0.25 }}
            className="relative min-h-[420px] overflow-hidden border-t border-white/10 lg:border-l lg:border-t-0"
          >
            <div className="absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-dark-card to-transparent" />
            <iframe
              title="Luxury Massage Bali operational location"
              src={MAP_EMBED_URL}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 h-full w-full grayscale-[20%] contrast-[1.08] saturate-[1.12]"
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-5 left-5 right-5 z-10 rounded-2xl border border-primary/30 bg-dark/85 p-4 shadow-2xl backdrop-blur-xl md:left-auto md:w-80"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Luxury Massage Bali</p>
              <p className="mt-1 text-sm font-bold text-white">Nusa Dua · Bali</p>
              <p className="mt-1 text-xs text-gray-400">Tap tombol Open Google Maps untuk navigasi langsung.</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

export default function DynamicPage() {
  const params = useParams();
  const location = useLocation();
  const { getWhatsAppUrl, googleMapsUrl } = useContactSettings();
  const slug = (params.slug ?? location.pathname.replace(/^\//, '')) || 'tentang';
  const { data } = useQuery({ queryKey: ['page', slug], queryFn: () => fetchPage(slug) });
  const fallback = fallbackPages[slug] ?? { title: 'Luxury Massage Bali', excerpt: 'Informasi Luxury Massage Bali', content: 'Konten halaman sedang disiapkan melalui dashboard admin.' };
  const page = data ?? { ...fallback, seo_title: fallback.title, seo_description: fallback.excerpt };
  const showMap = ['kontak', 'contact'].includes(slug) || ['kontak', 'contact'].includes(data?.slug ?? '') || /kontak|contact/i.test(page.title);

  return (
    <>
      <SEOHead pageSEO={{ path: `/${slug}`, title: page.seo_title ?? page.title, description: page.seo_description ?? page.excerpt ?? '', ogImage: '' }} />
      <main className="min-h-screen bg-dark pt-28 pb-24 text-white">
        <section className="section-container">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-primary hover:text-white"><ArrowLeft className="h-4 w-4" /> Kembali</Link>
          {showMap ? <LuxuryMapCard /> : null}
          <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-dark-card">
            <div className="relative p-8 md:p-14">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,200,186,0.24),transparent_35%)]" />
              <div className="relative z-10 max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"><Sparkles className="h-4 w-4" /> Luxury Massage Bali</span>
                <h1 className="mt-6 font-heading text-5xl font-bold md:text-7xl">{page.title}</h1>
                <p className="mt-5 text-lg leading-relaxed text-gray-300">{page.excerpt}</p>
              </div>
            </div>
            <div className="grid gap-8 border-t border-white/10 p-8 md:grid-cols-[1fr_320px] md:p-14">
              <article className="prose prose-invert max-w-none text-gray-300"><p className="whitespace-pre-line text-lg leading-9">{renderPageContent(page.content)}</p></article>
              <aside className="space-y-4">
                <a href={getWhatsAppUrl(`Halo Luxury Massage Bali, saya ingin booking/konsultasi tentang ${page.title}.`)} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 font-bold text-dark transition-all hover:shadow-gold"><MessageCircle className="h-5 w-5" /> Book Appointment</a>
                <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-semibold text-white hover:border-primary/40"><MapPin className="h-5 w-5" /> Lihat Maps</a>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><Calendar className="h-5 w-5 text-primary" /><p className="mt-3 text-sm text-gray-400">Reservasi home service tersedia setiap hari dengan konfirmasi jadwal via WhatsApp.</p></div>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
