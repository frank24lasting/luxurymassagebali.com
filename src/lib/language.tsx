import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Language = 'id' | 'en';
type Dictionary = Record<string, string>;

const dictionaries: Record<Language, Dictionary> = {
  id: {
    home: 'Beranda', services: 'Layanan', booking: 'Booking', blog: 'Blog', about: 'Tentang', contact: 'Kontak',
    searchPlaceholder: 'Cari massage, facial, artikel...', searchEmpty: 'Ketik 2 huruf untuk mencari', serviceLabel: 'Layanan', articleLabel: 'Artikel',
    bookNow: 'Booking', bookAppointment: 'Booking Sesi', seeAll: 'Lihat semua', seeAllServices: 'Lihat Semua Layanan', latestArticles: 'Artikel Terbaru',
    appGreeting: 'Halo, relaksasi apa yang Anda butuhkan?', heroTitle: 'Massage premium, langsung ke lokasi Anda', heroSubtitle: 'Terapis profesional datang ke hotel, villa, apartemen, atau rumah Anda di Bali.',
    heroBadge: 'Setiap hari 09.00–21.00', quickBook: 'Booking cepat', nearYou: 'Melayani seluruh Bali', popularServices: 'Layanan Populer', specialties: 'Spesialis Kami',
    natural: 'Produk pilihan', reviews: 'Ulasan', openDaily: 'Buka setiap hari', experience: 'Pengalaman', minutes: 'menit', from: 'Mulai',
    ctaEyebrow: 'Waktu untuk rileks', ctaTitle: 'Luxury treatment, tanpa perlu keluar dari tempat Anda', ctaText: 'Pilih treatment dan jadwal. Tim Luxury Massage Bali akan mengonfirmasi terapis terbaik untuk lokasi Anda.',
    callUs: 'Hubungi Kami', testimonials: 'Testimoni', whatTheySay: 'Kata Mereka', noResults: 'Tidak ada hasil cocok', read: 'Baca', language: 'Bahasa',
  },
  en: {
    home: 'Home', services: 'Services', booking: 'Booking', blog: 'Journal', about: 'About', contact: 'Contact',
    searchPlaceholder: 'Search massage, facial, journal...', searchEmpty: 'Type 2 letters to search', serviceLabel: 'Service', articleLabel: 'Article',
    bookNow: 'Book now', bookAppointment: 'Book a Session', seeAll: 'See all', seeAllServices: 'Explore Services', latestArticles: 'Latest Journal',
    appGreeting: 'Hello, how would you like to unwind?', heroTitle: 'Premium massage, delivered to you', heroSubtitle: 'Professional therapists come to your hotel, villa, apartment, or home anywhere in Bali.',
    heroBadge: 'Daily 09:00–21:00', quickBook: 'Quick booking', nearYou: 'Available across Bali', popularServices: 'Popular Services', specialties: 'Our Specialties',
    natural: 'Selected products', reviews: 'Reviews', openDaily: 'Open daily', experience: 'Experience', minutes: 'min', from: 'From',
    ctaEyebrow: 'Time to unwind', ctaTitle: 'Luxury treatment, without leaving your place', ctaText: 'Choose a treatment and preferred time. Luxury Massage Bali will confirm the best therapist for your location.',
    callUs: 'Contact Us', testimonials: 'Testimonials', whatTheySay: 'Guest Stories', noResults: 'No matching results', read: 'Read', language: 'Language',
  },
};

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}>({ language: 'id', setLanguage: () => undefined, t: (key) => key });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('luxury-massage-language');
    return saved === 'en' ? 'en' : 'id';
  });
  const value = useMemo(() => ({
    language,
    setLanguage: (next: Language) => {
      localStorage.setItem('luxury-massage-language', next);
      setLanguageState(next);
    },
    t: (key: string) => dictionaries[language][key] ?? dictionaries.id[key] ?? key,
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
