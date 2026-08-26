import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin, MessageCircle, Phone, Sparkles } from 'lucide-react';
import { useBrandingSettings } from '@/lib/branding';
import { useContactSettings } from '@/lib/contact';

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
  const { phone, email, address, openHour, closeHour, googleMapsUrl, getWhatsAppUrl } = useContactSettings();
  const currentYear = new Date().getFullYear();
  const displayLogo = logoFooterUrl || logoUrl;

  return (
    <footer className="border-t border-primary/10 bg-dark-lighter">
      <div className="section-container py-12 lg:py-16">
        {/* MOBILE VIEW ONLY: Centered Movie / Film Credits Style */}
        <div className="flex flex-col items-center text-center md:hidden space-y-8">
          {/* Logo & Tagline */}
          <div className="flex flex-col items-center text-center">
            <Link to="/" className="inline-flex max-w-full items-center justify-center py-1" aria-label={`${siteName} beranda`}>
              {displayLogo ? (
                <img
                  src={displayLogo}
                  alt={`${siteName} logo`}
                  width="320"
                  height="88"
                  loading="lazy"
                  decoding="async"
                  className="h-20 sm:h-24 w-auto max-w-[280px] sm:max-w-[360px] object-contain drop-shadow-sm mx-auto"
                />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-gold shadow-sm">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="block font-heading text-2xl font-bold text-text-primary">{siteName}</span>
                    <span className="block text-xs uppercase tracking-[0.2em] text-secondary">{tagline}</span>
                  </div>
                </div>
              )}
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-text-secondary mx-auto">
              Massage dan wellness premium langsung ke hotel, villa, apartemen, atau rumah Anda di Bali. Privat, higienis, dan mudah dipesan.
            </p>
            <a
              href={getWhatsAppUrl('Halo Luxury Massage Bali, saya ingin bertanya tentang layanan massage.')}
              target="_blank"
              rel="noreferrer"
              className="btn-primary mt-5 inline-flex items-center justify-center gap-2 text-sm mx-auto"
            >
              <MessageCircle className="h-4 w-4" /> Chat WhatsApp
            </a>
          </div>

          {/* Quicklinks: Movie Credits Style with Pipe Separator */}
          <div className="w-full space-y-6 pt-4 border-t border-primary/10">
            {/* Layanan */}
            <div className="space-y-2">
              <h2 className="font-body text-xs font-black uppercase tracking-[0.25em] text-primary">
                LAYANAN
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-text-secondary">
                {footerLinks.layanan.map((link, idx) => (
                  <span key={link.path} className="inline-flex items-center">
                    <Link to={link.path} className="transition hover:text-primary font-medium">
                      {link.label}
                    </Link>
                    {idx < footerLinks.layanan.length - 1 && (
                      <span className="ml-2 text-primary/30 select-none">|</span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Informasi */}
            <div className="space-y-2">
              <h2 className="font-body text-xs font-black uppercase tracking-[0.25em] text-primary">
                INFORMASI
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-text-secondary">
                {footerLinks.informasi.map((link, idx) => (
                  <span key={link.path} className="inline-flex items-center">
                    <Link to={link.path} className="transition hover:text-primary font-medium">
                      {link.label}
                    </Link>
                    {idx < footerLinks.informasi.length - 1 && (
                      <span className="ml-2 text-primary/30 select-none">|</span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Bantuan */}
            <div className="space-y-2">
              <h2 className="font-body text-xs font-black uppercase tracking-[0.25em] text-primary">
                BANTUAN
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-text-secondary">
                {footerLinks.bantuan.map((link, idx) => (
                  <span key={link.path} className="inline-flex items-center">
                    <Link to={link.path} className="transition hover:text-primary font-medium">
                      {link.label}
                    </Link>
                    {idx < footerLinks.bantuan.length - 1 && (
                      <span className="ml-2 text-primary/30 select-none">|</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* DESKTOP VIEW: Multi-Column Layout */}
        <div className="hidden md:grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="inline-flex max-w-full items-center gap-3 py-1" aria-label={`${siteName} beranda`}>
              {displayLogo ? (
                <img
                  src={displayLogo}
                  alt={`${siteName} logo`}
                  width="320"
                  height="88"
                  loading="lazy"
                  decoding="async"
                  className="h-20 sm:h-24 md:h-28 lg:h-32 w-auto max-w-[320px] sm:max-w-[400px] md:max-w-[480px] object-contain drop-shadow-sm"
                />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-gold shadow-sm">
                    <Sparkles className="h-7 w-7 text-white" />
                  </div>
                  <span>
                    <span className="block font-heading text-2xl font-bold text-text-primary sm:text-3xl">{siteName}</span>
                    <span className="block text-xs uppercase tracking-[0.2em] text-secondary">{tagline}</span>
                  </span>
                </div>
              )}
            </Link>
            <p className="mt-5 max-w-md text-sm leading-7 text-text-secondary">
              Massage dan wellness premium langsung ke hotel, villa, apartemen, atau rumah Anda di Bali. Privat, higienis, dan mudah dipesan.
            </p>
            <a
              href={getWhatsAppUrl('Halo Luxury Massage Bali, saya ingin bertanya tentang layanan massage.')}
              target="_blank"
              rel="noreferrer"
              className="btn-primary mt-6 gap-2 text-sm"
            >
              <MessageCircle className="h-4 w-4" /> Chat WhatsApp
            </a>
          </div>

          <FooterColumn title="Layanan" links={footerLinks.layanan} />
          <FooterColumn title="Informasi" links={footerLinks.informasi} />
          <FooterColumn title="Bantuan" links={footerLinks.bantuan} />
        </div>

        {/* Contact info bar */}
        <div className="mt-12 grid gap-4 rounded-2xl border border-primary/10 bg-white/90 p-5 text-sm text-text-secondary sm:grid-cols-2 lg:grid-cols-4 shadow-sm">
          <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="flex items-start gap-3 transition hover:text-primary">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {address}
          </a>
          <a href={`tel:${phone.replace(/\s+/g, '')}`} className="flex items-center gap-3 transition hover:text-primary">
            <Phone className="h-4 w-4 shrink-0 text-primary" /> {phone}
          </a>
          <a href={`mailto:${email}`} className="flex items-center gap-3 transition hover:text-primary">
            <Mail className="h-4 w-4 shrink-0 text-primary" /> {email}
          </a>
          <span className="flex items-center gap-3">
            <Clock className="h-4 w-4 shrink-0 text-primary" /> Setiap hari, {openHour}–{closeHour}
          </span>
        </div>
      </div>

      <div className="border-t border-primary/10">
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
            <Link to={link.path} className="text-sm text-text-secondary transition hover:text-primary font-medium">{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
