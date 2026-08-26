import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useBrandingSettings } from '@/lib/branding';

const footerLinks = {
  layanan: [
    { label: 'Massage', path: '/massage' },
    { label: 'Facial', path: '/facial' },
    { label: 'Body Treatment', path: '/body-treatment' },
    { label: 'Spa Package', path: '/spa-package' },
    { label: 'Couple Package', path: '/couple-package' },
  ],
  informasi: [
    { label: 'Tentang Kami', path: '/about' },
    { label: 'Journal', path: '/blog' },
    { label: 'Galeri', path: '/gallery' },
    { label: 'Kontak', path: '/contact' },
    { label: 'FAQ', path: '/faq' },
  ],
  bantuan: [
    { label: 'Book Appointment', path: '/appointment' },
    { label: 'Cara Booking', path: '/how-to-book' },
    { label: 'Kebijakan Privasi', path: '/privacy' },
    { label: 'Syarat & Ketentuan', path: '/terms' },
    { label: 'Refund Policy', path: '/refund' },
  ],
} as const;

export function Footer() {
  const { siteName, tagline, logoUrl, logoFooterUrl } = useBrandingSettings();
  const currentYear = new Date().getFullYear();
  const displayLogo = logoFooterUrl || logoUrl;

  return (
    <footer className="border-t border-white/10 bg-dark-lighter">
      <div className="section-container py-12 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="inline-flex max-w-full items-center gap-3 py-1" aria-label={`${siteName} beranda`}>
              {displayLogo ? (
                <img
                  src={displayLogo}
                  alt={`${siteName} logo`}
                  width="260"
                  height="72"
                  loading="lazy"
                  decoding="async"
                  className="h-16 sm:h-18 md:h-20 lg:h-24 w-auto max-w-[260px] sm:max-w-[320px] md:max-w-[380px] object-contain drop-shadow-md"
                />
              ) : (
                <>
                  <img src="/favicon.svg" alt="" width="56" height="56" className="h-14 w-14 shrink-0" />
                  <span>
                    <span className="block font-heading text-2xl font-bold text-white">{siteName}</span>
                    <span className="block text-xs uppercase tracking-[0.2em] text-primary">{tagline}</span>
                  </span>
                </>
              )}
            </Link>
            <p className="mt-5 max-w-md text-sm leading-7 text-text-muted">
              Massage dan wellness premium langsung ke hotel, villa, apartemen, atau rumah Anda di Bali. Privat, higienis, dan mudah dipesan.
            </p>
            <a href="https://wa.me/6281353681757?text=Halo%20Luxury%20Massage%20Bali%2C%20saya%20ingin%20bertanya" target="_blank" rel="noreferrer" className="btn-primary mt-6 gap-2 text-sm">
              <MessageCircle className="h-4 w-4" /> Chat WhatsApp
            </a>
          </div>

          <FooterColumn title="Layanan" links={footerLinks.layanan} />
          <FooterColumn title="Informasi" links={footerLinks.informasi} />
          <FooterColumn title="Bantuan" links={footerLinks.bantuan} />
        </div>

        <div className="mt-12 grid gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-text-muted sm:grid-cols-2 lg:grid-cols-4">
          <a href="https://maps.app.goo.gl/SbephNzX2QaKfiEB9?g_st=iwb" target="_blank" rel="noreferrer" className="flex items-start gap-3 transition hover:text-white"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Bali, Indonesia</a>
          <a href="tel:+6281353681757" className="flex items-center gap-3 transition hover:text-white"><Phone className="h-4 w-4 shrink-0 text-primary" /> +62 813 5368 1757</a>
          <a href="mailto:hello@luxurymassagebali.com" className="flex items-center gap-3 transition hover:text-white"><Mail className="h-4 w-4 shrink-0 text-primary" /> hello@luxurymassagebali.com</a>
          <span className="flex items-center gap-3"><Clock className="h-4 w-4 shrink-0 text-primary" /> Setiap hari, 09.00–21.00</span>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="section-container flex flex-col items-center justify-between gap-3 py-6 text-center text-xs text-text-muted sm:flex-row sm:text-left">
          <p>© {currentYear} {siteName}. All rights reserved.</p>
          <p>
            DEVELOPS BY{' '}
            <a
              href="https://wa.me/628990090802"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-primary transition hover:underline"
            >
              TUKANGBUATWEBSITEBALI
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

interface FooterColumnProps {
  readonly title: string;
  readonly links: readonly { readonly label: string; readonly path: string }[];
}

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div>
      <h2 className="font-body text-xs font-black uppercase tracking-[0.2em] text-primary">{title}</h2>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.path}>
            <Link to={link.path} className="text-sm text-text-muted transition hover:text-white">{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
