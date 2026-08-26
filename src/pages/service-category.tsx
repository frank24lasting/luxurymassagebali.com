import { motion } from 'framer-motion';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, Gem, Heart, Shield, Sparkles, Star } from 'lucide-react';
import { SEOHead } from '@/components/seo/seo-head';
import { PageTransition, InViewAnimate, StaggerItem, StaggerWrapper } from '@/components/ui/motion';

interface ServiceCategoryPageData {
  readonly slug: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly intro: string;
  readonly longCopy: string;
  readonly idealFor: readonly string[];
  readonly rituals: readonly { readonly name: string; readonly duration: string; readonly description: string }[];
  readonly highlights: readonly string[];
  readonly gradient: string;
}

const CATEGORY_PAGES: readonly ServiceCategoryPageData[] = [
  {
    slug: 'massage',
    title: 'Massage Rituals',
    eyebrow: 'Signature Balinese Bodywork',
    intro: 'Pijatan premium untuk melepas tegang, memperbaiki sirkulasi, dan mengembalikan rasa ringan pada tubuh setelah aktivitas Bali yang padat.',
    longCopy: 'Setiap sesi massage Luxury Massage Bali dirancang sebagai perjalanan terapeutik: konsultasi singkat, pemilihan tekanan, teknik Balinese stroke, acupressure lembut, dan aromatherapy hangat. Cocok untuk wisatawan, pasangan, pekerja aktif, dan tamu yang membutuhkan pemulihan mendalam tanpa kehilangan nuansa luxury spa.',
    idealFor: ['Otot tegang', 'Jet lag', 'Deep relaxation', 'Pemulihan energi'],
    rituals: [
      { name: 'Balinese Signature Massage', duration: '60–90 menit', description: 'Kombinasi long stroke, palm pressure, dan aromatherapy untuk relaksasi total.' },
      { name: 'Deep Tissue Recovery', duration: '75–120 menit', description: 'Tekanan lebih fokus untuk bahu, punggung, pinggang, dan area overworked.' },
      { name: 'Hot Stone Harmony', duration: '90 menit', description: 'Batu hangat vulkanik membantu melepas kekakuan dan menenangkan sistem saraf.' },
    ],
    highlights: ['Terapis berpengalaman', 'Oil premium', 'Tekanan dapat disesuaikan', 'Treatment room nyaman'],
    gradient: 'from-amber-400/25 via-orange-500/10 to-emerald-500/15',
  },
  {
    slug: 'facial',
    title: 'Facial Treatments',
    eyebrow: 'Glow, Hydrate, Restore',
    intro: 'Perawatan wajah untuk membersihkan, menutrisi, dan mengembalikan tampilan segar dengan pendekatan gentle namun detail.',
    longCopy: 'Facial Luxury Massage Bali fokus pada pengalaman premium yang tetap nyaman untuk kulit tropis. Proses meliputi cleansing, exfoliation, massage wajah, masker, hydration layer, dan finishing touch agar kulit terasa lebih bersih, lembap, dan terlihat glowing alami.',
    idealFor: ['Kulit kusam', 'Dehidrasi', 'Pori tersumbat', 'Pre-event glow'],
    rituals: [
      { name: 'Hydra Glow Facial', duration: '60 menit', description: 'Hydrating facial untuk kulit tampak segar, lembut, dan bercahaya.' },
      { name: 'Purifying Herbal Facial', duration: '75 menit', description: 'Cleansing mendalam dengan sentuhan herbal untuk rasa bersih maksimal.' },
      { name: 'Royal Lift Massage Facial', duration: '90 menit', description: 'Facial massage premium untuk tampilan wajah lebih rileks dan sculpted.' },
    ],
    highlights: ['Gentle technique', 'Masker sesuai kebutuhan', 'Face massage detail', 'Aftercare guidance'],
    gradient: 'from-rose-300/25 via-fuchsia-500/10 to-amber-400/15',
  },
  {
    slug: 'body-treatment',
    title: 'Body Treatment',
    eyebrow: 'Scrub, Mask, Renewal',
    intro: 'Ritual tubuh untuk mengangkat sel kulit mati, melembutkan kulit, dan memberi sensasi spa tropis yang mewah.',
    longCopy: 'Body treatment kami menggabungkan body scrub, body mask, steam/warm towel ritual, dan hydration finish. Dirancang untuk tamu yang ingin kulit terasa lebih halus, wangi, dan segar setelah aktivitas outdoor, pantai, atau perjalanan panjang.',
    idealFor: ['Kulit kering', 'Sun exposure', 'Body renewal', 'Ritual sebelum acara'],
    rituals: [
      { name: 'Royal Lulur Body Ritual', duration: '90 menit', description: 'Lulur klasik untuk kulit terasa halus, bersih, dan bercahaya.' },
      { name: 'Tropical Body Polish', duration: '75 menit', description: 'Scrub aromatik dengan hydration finish untuk rasa segar.' },
      { name: 'Detox Clay Body Mask', duration: '90 menit', description: 'Masker tubuh untuk sensasi bersih, tenang, dan renewed.' },
    ],
    highlights: ['Body scrub premium', 'Warm towel ritual', 'Hydration finish', 'Aroma spa elegan'],
    gradient: 'from-emerald-400/25 via-lime-400/10 to-amber-400/15',
  },
  {
    slug: 'spa-package',
    title: 'Spa Package',
    eyebrow: 'Curated Full Experience',
    intro: 'Paket spa lengkap untuk pengalaman lebih panjang: massage, scrub, facial, dan ritual relaksasi dalam satu perjalanan mewah.',
    longCopy: 'Spa Package dibuat untuk tamu yang ingin menikmati pengalaman lengkap tanpa memilih treatment satu per satu. Setiap paket dikurasi agar alurnya nyaman: body relaxation, skin renewal, hydration, lalu finishing yang membuat tubuh terasa ringan dan pikiran lebih tenang.',
    idealFor: ['Full day relaxation', 'Hadiah spesial', 'Holiday ritual', 'Self-care premium'],
    rituals: [
      { name: 'Bali Escape Package', duration: '120 menit', description: 'Massage dan body polish untuk pengalaman spa kompak namun mewah.' },
      { name: 'Royal Spa Journey', duration: '180 menit', description: 'Massage, lulur, mask, dan mini facial dalam satu ritual lengkap.' },
      { name: 'After Sun Recovery', duration: '120 menit', description: 'Cooling body care dan relaxation massage setelah aktivitas pantai.' },
    ],
    highlights: ['Alur treatment dikurasi', 'Durasi fleksibel', 'Cocok untuk gift', 'Premium end-to-end care'],
    gradient: 'from-primary/30 via-amber-500/10 to-sky-400/10',
  },
  {
    slug: 'couple-package',
    title: 'Couple Package',
    eyebrow: 'Romantic Spa Moment',
    intro: 'Ritual spa untuk dua orang dengan suasana intim, tenang, dan premium—cocok untuk honeymoon, anniversary, atau quality time di Bali.',
    longCopy: 'Couple Package menghadirkan pengalaman relaksasi bersama dalam tempo yang lembut dan elegan. Treatment dilakukan paralel dengan detail kenyamanan, aroma, dan flow yang dirancang agar pasangan dapat menikmati momen tenang tanpa distraksi.',
    idealFor: ['Honeymoon', 'Anniversary', 'Quality time', 'Romantic gift'],
    rituals: [
      { name: 'Couple Balinese Harmony', duration: '90 menit', description: 'Signature massage untuk dua orang dengan pressure yang disesuaikan.' },
      { name: 'Romantic Royal Couple Ritual', duration: '150 menit', description: 'Massage, body polish, dan hydration finish untuk pengalaman romantis.' },
      { name: 'Honeymoon Spa Journey', duration: '180 menit', description: 'Paket lengkap untuk pasangan yang menginginkan momen spa istimewa.' },
    ],
    highlights: ['Treatment paralel', 'Atmosfer romantis', 'Detail private', 'Cocok untuk pasangan'],
    gradient: 'from-pink-400/25 via-rose-500/10 to-primary/20',
  },
];

function getCategoryPage(slug: string | undefined): ServiceCategoryPageData | null {
  if (!slug) return null;
  return CATEGORY_PAGES.find((page) => page.slug === slug) ?? null;
}

export default function ServiceCategoryPage() {
  const { categorySlug } = useParams();
  const page = getCategoryPage(categorySlug);

  if (!page) return <Navigate to="/services" replace />;

  return (
    <PageTransition>
      <SEOHead
        pageSEO={{
          path: `/${page.slug}`,
          title: `${page.title} — Luxury Massage Bali`,
          description: `${page.intro} Booking premium home massage di Bali dengan terapis berpengalaman.`,
          ogImage: '',
        }}
      />

      <main className="overflow-hidden bg-dark text-white">
        <section className="relative min-h-[92vh] px-4 pb-20 pt-32 sm:px-6 lg:px-8">
          <div className={`absolute inset-0 bg-gradient-to-br ${page.gradient}`} />
          <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/5 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <p className="mb-5 inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-primary">
                ✦ {page.eyebrow} ✦
              </p>
              <h1 className="max-w-4xl font-heading text-5xl font-black leading-[0.95] tracking-[-0.04em] text-white md:text-7xl lg:text-8xl">
                {page.title}
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-gray-200 md:text-lg">
                {page.intro}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link to="/appointment" className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-primary px-7 py-4 text-sm font-black text-dark shadow-gold transition-all hover:-translate-y-1 hover:shadow-gold-lg">
                  Book Treatment <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link to="/services" className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-sm font-bold text-white backdrop-blur-xl transition-all hover:border-primary/50 hover:bg-primary/10">
                  Explore All Services
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.92, rotate: -2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.8, delay: 0.12 }} className="relative">
              <div className="absolute -inset-8 rounded-[3rem] bg-primary/20 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                <div className="grid gap-4">
                  {page.idealFor.map((item, index) => (
                    <motion.div key={item} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + index * 0.08 }} className="flex items-center gap-4 rounded-3xl border border-white/10 bg-dark/60 p-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-dark shadow-gold">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-primary">Ideal For</p>
                        <p className="text-lg font-bold text-white">{item}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <InViewAnimate className="max-w-3xl">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-primary">Premium Treatment Philosophy</p>
              <h2 className="font-heading text-4xl font-black tracking-[-0.03em] md:text-6xl">Detail experience, bukan halaman biasa.</h2>
              <p className="mt-6 text-base leading-8 text-gray-300 md:text-lg">{page.longCopy}</p>
            </InViewAnimate>

            <StaggerWrapper className="mt-12 grid gap-5 lg:grid-cols-3">
              {page.rituals.map((ritual) => (
                <StaggerItem key={ritual.name}>
                  <motion.article whileHover={{ y: -8, scale: 1.02 }} className="group h-full rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition-colors hover:border-primary/50 hover:bg-primary/10">
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary group-hover:bg-primary group-hover:text-dark">
                        <Gem className="h-5 w-5" />
                      </div>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-gray-300"><Clock className="mr-1 inline h-3 w-3" />{ritual.duration}</span>
                    </div>
                    <h3 className="font-heading text-2xl font-bold text-white">{ritual.name}</h3>
                    <p className="mt-4 text-sm leading-7 text-gray-300">{ritual.description}</p>
                  </motion.article>
                </StaggerItem>
              ))}
            </StaggerWrapper>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <InViewAnimate className="rounded-[2rem] border border-primary/20 bg-primary/10 p-7">
              <Shield className="mb-5 h-10 w-10 text-primary" />
              <h2 className="font-heading text-3xl font-bold">Quality & Care Copyright</h2>
              <p className="mt-4 text-sm leading-7 text-gray-300">
                Konten treatment, nama ritual, deskripsi pengalaman, struktur layanan, dan copywriting pada halaman ini dibuat khusus untuk Luxury Massage Bali. Dilarang menyalin, menduplikasi, atau menggunakan ulang tanpa izin tertulis.
              </p>
              <p className="mt-5 text-xs font-bold uppercase tracking-widest text-primary">© {new Date().getFullYear()} Luxury Massage Bali. All rights reserved.</p>
            </InViewAnimate>

            <StaggerWrapper className="grid gap-4 sm:grid-cols-2">
              {page.highlights.map((highlight) => (
                <StaggerItem key={highlight}>
                  <div className="flex h-full items-start gap-4 rounded-3xl border border-white/10 bg-dark-lighter p-5">
                    <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                    <div>
                      <p className="font-bold text-white">{highlight}</p>
                      <p className="mt-2 text-sm leading-6 text-gray-400">Standar layanan premium dengan detail kecil yang terasa sejak awal sampai selesai.</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerWrapper>
          </div>
        </section>

        <section className="px-4 pb-28 sm:px-6 lg:px-8">
          <InViewAnimate className="mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-primary/20 via-white/[0.04] to-dark-lighter p-8 text-center shadow-[0_40px_110px_rgba(0,0,0,0.35)] md:p-12">
            <div className="mx-auto mb-6 flex w-max items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-primary">
              <Star className="h-4 w-4 fill-primary" />
              <span className="text-xs font-black uppercase tracking-widest">International-grade spa detail</span>
            </div>
            <h2 className="font-heading text-4xl font-black tracking-[-0.03em] md:text-6xl">Siap booking {page.title}?</h2>
            <p className="mx-auto mt-5 max-w-2xl text-gray-300">Pilih jadwal, isi form appointment, lalu sistem akan menyiapkan detail booking dan WhatsApp confirmation.</p>
            <Link to="/appointment" className="mt-8 inline-flex items-center justify-center gap-3 rounded-2xl bg-primary px-8 py-4 text-sm font-black text-dark shadow-gold transition-all hover:-translate-y-1 hover:shadow-gold-lg">
              Book Now <Heart className="h-4 w-4 fill-dark" />
            </Link>
          </InViewAnimate>
        </section>
      </main>
    </PageTransition>
  );
}
