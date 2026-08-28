import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, CalendarClock, Globe, MapPin, Menu, MessageCircle, MessageSquare, Palette, Save, Search, Settings, Shield, Sparkles, Trash2, CheckCircle2, PhoneCall, Mail, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { MediaPickerButton } from '@/components/ui/media-picker';
import { extractMapEmbedSrc, DEFAULT_MAP_EMBED_SRC } from '@/lib/contact';

type SettingValue = Record<string, unknown>;
type SettingKey = 'contact_info' | 'seo_global' | 'branding' | 'navigation' | 'footer' | 'booking_rules' | 'theme' | 'social_links' | 'maintenance';

const defaults: Record<SettingKey, SettingValue> = {
  contact_info: { phone: '+6281353681757', whatsapp: '+6281353681757', email: 'hello@luxurymassagebali.com', address: 'Bali, Indonesia', google_maps_url: 'https://maps.app.goo.gl/SbephNzX2QaKfiEB9?g_st=iwb', google_maps_embed: DEFAULT_MAP_EMBED_SRC, open_hour: '09:00', close_hour: '21:00', timezone: 'Asia/Makassar' },
  seo_global: { title: 'Luxury Massage Bali — Premium Home Massage', description: 'Premium massage dan wellness treatment langsung ke villa, hotel, apartemen, atau rumah Anda di Bali.', keywords: 'luxury massage bali, home massage bali, balinese massage, out call massage bali', og_image: '', robots: 'index,follow', canonical: 'https://luxurymassagebali.com' },
  branding: {
    site_name: 'Luxury Massage Bali',
    logo_text: 'Luxury Massage Bali',
    tagline: 'Private Wellness, Delivered',
    logo_mode: 'text',
    logo_url: '',
    logo_sticky_url: '',
    logo_footer_url: '',
    logo_admin_url: '',
    logo_login_url: '',
    logo_size_nav: '140',
    logo_size_mobile: '120',
    logo_size_admin: '100',
    logo_size_footer: '150',
    logo_size_loader: '150',
    logo_scale_nav: '1',
    logo_scale_mobile: '1',
    logo_scale_admin: '1',
    logo_scale_footer: '1',
    favicon_url: '/favicon.svg',
    primary_cta: 'Book Appointment',
    admin_path: '/langitdewata',
  },
  navigation: { home: '/', services: '/services', booking: '/appointment', blog: '/blog', about: '/tentang', contact: '/kontak', gallery: '/gallery' },
  footer: { headline: 'Luxury Massage Bali', description: 'Premium home massage and wellness service across Bali.', copyright: '© Luxury Massage Bali', privacy_url: '/kebijakan-privasi', terms_url: '/syarat-ketentuan', refund_url: '/refund-policy' },
  booking_rules: { whatsapp_template: 'Halo Luxury Massage Bali, saya ingin booking.', min_notice_hours: '2', max_days_ahead: '30', deposit_required: 'false', cancellation_policy: 'Pembatalan mendadak dapat dikenakan biaya operasional.' },
  theme: { primary_color: '#214038', dark_color: '#0c1a16', accent_color: '#19322c', mode: 'dark', radius: '20' },
  social_links: { instagram: '', facebook: '', tiktok: '', youtube: '', tripadvisor: '', google_business: '' },
  maintenance: { enabled: 'false', message: 'Website sedang maintenance sebentar.', allow_admin_bypass: 'true' },
};

async function fetchSetting(key: SettingKey): Promise<SettingValue> {
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', key).maybeSingle();
  if (error) throw new Error(error.message);
  return { ...defaults[key], ...((data?.value as SettingValue | null) ?? {}) };
}

interface LogoCardConfig {
  key: string;
  title: string;
  badge: string;
  desc: string;
  fallbackText: string;
  previewBg?: string;
}

const logoConfigs: LogoCardConfig[] = [
  {
    key: 'logo_url',
    title: 'Logo Utama / Navbar',
    badge: 'Desktop & Mobile Default',
    desc: 'Logo default pada header navigasi website saat posisi halaman berada di paling atas.',
    fallbackText: 'LM Header',
    previewBg: 'bg-dark/90',
  },
  {
    key: 'logo_sticky_url',
    title: 'Logo Sticky / Saat Scroll',
    badge: 'Navbar On Scroll',
    desc: 'Logo yang muncul otomatis di navbar saat pengunjung menggulir (scroll) halaman ke bawah.',
    fallbackText: 'LM Sticky',
    previewBg: 'bg-dark-lighter',
  },
  {
    key: 'logo_footer_url',
    title: 'Logo Footer',
    badge: 'Footer Website',
    desc: 'Logo yang ditampilkan pada bagian footer di seluruh halaman website.',
    fallbackText: 'LM Footer',
    previewBg: 'bg-dark',
  },
  {
    key: 'logo_admin_url',
    title: 'Logo Admin Panel (Sidebar)',
    badge: 'Admin Dashboard',
    desc: 'Logo yang ditampilkan di sidebar navigasi dan mobile menu admin backend.',
    fallbackText: 'LM Admin',
    previewBg: 'bg-dark-card',
  },
  {
    key: 'logo_login_url',
    title: 'Logo Login Admin',
    badge: 'Halaman Login Backend',
    desc: 'Logo yang ditampilkan pada box form login admin backend (/langitdewata).',
    fallbackText: 'LM Login',
    previewBg: 'bg-dark-lighter',
  },
  {
    key: 'favicon_url',
    title: 'Favicon / Browser Icon',
    badge: 'Browser Tab & Bookmark',
    desc: 'Icon tab browser, bookmark, dan shortcut mobile (format .ico, .png, atau .svg).',
    fallbackText: 'Favicon',
    previewBg: 'bg-white/10',
  },
];

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [active, setActive] = useState<SettingKey>('contact_info');
  const [drafts, setDrafts] = useState<Partial<Record<SettingKey, SettingValue>>>({});
  const query = useQuery({ queryKey: ['settings', active], queryFn: () => fetchSetting(active) });
  const draft = drafts[active] ?? query.data ?? defaults[active];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('site_settings').upsert({ key: active, value: draft }, { onConflict: 'key' });
      if (error) throw new Error(error.message);
    },
    onMutate: () => {
      toast.loading('Menyimpan pengaturan...', {
        id: 'settings-save',
        icon: '✨',
        style: {
          background: 'linear-gradient(135deg, rgba(17,24,39,0.98), rgba(45,74,62,0.96))',
          color: '#fff',
          border: '1px solid rgba(168,200,186,0.45)',
          borderRadius: '20px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
        },
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['settings', active] }),
        queryClient.invalidateQueries({ queryKey: ['public-branding'] }),
      ]);
      toast.success('Pengaturan berhasil disimpan! Logo langsung terupdate.', {
        id: 'settings-save',
        icon: '🌿',
        style: {
          background: 'linear-gradient(135deg, #19322c, #214038)',
          color: '#fff',
          border: '1px solid rgba(130,190,169,0.35)',
          borderRadius: '16px',
          boxShadow: '0 18px 50px rgba(8,25,20,0.32)',
        },
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal menyimpan pengaturan.', {
        id: 'settings-save',
        icon: '⚠️',
        style: {
          background: 'linear-gradient(135deg, #2a1212, #111827)',
          color: '#fff',
          border: '1px solid rgba(248,113,113,0.5)',
          borderRadius: '20px',
          boxShadow: '0 24px 80px rgba(239,68,68,0.22)',
        },
      });
    },
  });

  const updateDraft = (key: string, value: string) => setDrafts((items) => ({ ...items, [active]: { ...draft, [key]: value } }));

  const tabs = useMemo(() => [
    { id: 'contact_info', label: 'Contact & Maps', icon: MapPin },
    { id: 'seo_global', label: 'Global SEO', icon: Search },
    { id: 'branding', label: 'Branding & Logos', icon: Building2 },
    { id: 'navigation', label: 'Navigation', icon: Menu },
    { id: 'footer', label: 'Footer', icon: Globe },
    { id: 'booking_rules', label: 'Booking Rules', icon: CalendarClock },
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'social_links', label: 'Social Links', icon: MessageCircle },
    { id: 'maintenance', label: 'Maintenance', icon: Shield },
  ] as const, []);


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Website Settings</h1>
        <p className="mt-2 text-sm text-gray-400">
          Pusat kontrol Luxury Massage Bali: pergantian logo lengkap (Navbar, Sticky Scroll, Footer, Admin, Login), kontak, SEO, theme, dan aturan booking.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-dark-card p-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all ${active === tab.id ? 'bg-primary text-dark shadow-gold font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          ))}
        </aside>

        <main className="rounded-2xl border border-white/10 bg-dark-card p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Settings className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{tabs.find((tab) => tab.id === active)?.label}</h2>
                <p className="text-xs text-gray-400">Tersimpan di database table: <code className="text-primary font-mono">site_settings ({active})</code></p>
              </div>
            </div>
            <button
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-3 font-bold text-white shadow-clean transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save className={`h-4 w-4 ${saveMutation.isPending ? 'animate-pulse' : 'transition group-hover:rotate-12'}`} />
              {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>

          {/* Dedicated Branding & Multi-Logo Manager */}
          {active === 'branding' && (
            <div className="mt-6 space-y-8">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <h3 className="text-lg font-bold text-white">Manajemen Pergantian Logo Website & Admin</h3>
                </div>
                <p className="mt-1 text-sm text-gray-400">
                  Ganti logo untuk setiap penempatan secara spesifik. Jika logo tertentu dikosongkan, sistem akan otomatis menggunakan Logo Utama sebagai fallback.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {logoConfigs.map((cfg) => {
                  const currentVal = String(draft[cfg.key] ?? '');
                  const isConfigured = Boolean(currentVal.trim());

                  return (
                    <div
                      key={cfg.key}
                      className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-primary/40 hover:bg-white/[0.05]"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white text-base">{cfg.title}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${isConfigured ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/10 text-gray-400'}`}>
                            {cfg.badge}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-gray-400 leading-relaxed min-h-[32px]">{cfg.desc}</p>

                        {/* Preview Box */}
                        <div className="mt-4 flex items-center gap-4">
                          <div className={`flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 ${cfg.previewBg} p-2 shadow-inner`}>
                            {currentVal ? (
                              <img
                                src={currentVal}
                                alt={`${cfg.title} preview`}
                                className="h-full w-full object-contain"
                                onError={(e) => {
                                  // In case image URL is broken
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="text-center">
                                <span className="block text-xs font-bold text-gray-400">{cfg.fallbackText}</span>
                                <span className="text-[10px] text-gray-500">(Belum diset)</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <MediaPickerButton
                                onSelect={(url) => updateDraft(cfg.key, url)}
                                className="rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-dark hover:bg-primary-light transition-all"
                              >
                                Pilih Logo
                              </MediaPickerButton>
                              {currentVal && (
                                <button
                                  type="button"
                                  onClick={() => updateDraft(cfg.key, '')}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition-colors"
                                  title="Hapus / Kosongkan logo ini"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Reset
                                </button>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400 truncate max-w-[220px]">
                              {currentVal ? (
                                <span className="text-primary flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 shrink-0" /> Tersimpan
                                </span>
                              ) : (
                                <span className="text-gray-500 italic">Default: Menggunakan Logo Utama</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Manual input URL */}
                      <div className="mt-4 pt-3 border-t border-white/5">
                        <label className="block text-[11px] font-medium text-gray-400">
                          URL Direct / File Path:
                          <input
                            type="text"
                            value={currentVal}
                            onChange={(e) => updateDraft(cfg.key, e.target.value)}
                            placeholder="https://... atau /logo.png"
                            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition"
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Other Identity Settings */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <h4 className="text-sm font-bold uppercase tracking-wider text-primary">Informasi Identitas & Teks</h4>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Nama Website / Brand (site_name)</span>
                    <input
                      type="text"
                      value={String(draft.site_name ?? '')}
                      onChange={(e) => updateDraft('site_name', e.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-primary"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Tagline Website (tagline)</span>
                    <input
                      type="text"
                      value={String(draft.tagline ?? '')}
                      onChange={(e) => updateDraft('tagline', e.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-primary"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Logo Text / Wordmark (logo_text)</span>
                    <input
                      type="text"
                      value={String(draft.logo_text ?? '')}
                      onChange={(e) => updateDraft('logo_text', e.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-primary"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Tombol Utama Navbar (primary_cta)</span>
                    <input
                      type="text"
                      value={String(draft.primary_cta ?? '')}
                      onChange={(e) => updateDraft('primary_cta', e.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-primary"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Dedicated Contact & Global WhatsApp Manager */}
          {active === 'contact_info' && (
            <div className="mt-6 space-y-8">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-lg font-bold text-white">Pengaturan Nomor WhatsApp & Kontak Global</h3>
                </div>
                <p className="mt-1 text-sm text-gray-400">
                  Mengubah nomor WhatsApp dan kontak di sini akan otomatis mengubah seluruh tombol WhatsApp di seluruh website secara realtime (Floating button, Booking Form, Homepage Menu, Footer, Layanan, dan Halaman Kontak).
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 backdrop-blur-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400">✦ Live WhatsApp Preview & Test</span>
                    <p className="mt-1 text-sm font-bold text-white">
                      Nomor Aktif: <code className="text-primary font-mono">{String(draft.whatsapp || draft.phone || '+6281353681757')}</code>
                    </p>
                  </div>
                  <a
                    href={`https://wa.me/${String(draft.whatsapp || draft.phone || '6281353681757').replace(/\D/g, '')}?text=${encodeURIComponent('Halo Luxury Massage Bali, ini adalah pesan uji coba kontak WhatsApp.')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-xs font-bold text-white shadow-[0_4px_20px_rgba(37,211,102,0.35)] transition hover:bg-[#20bd5a]"
                  >
                    <MessageSquare className="h-4 w-4" /> Tes Buka WhatsApp
                  </a>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Nomor WhatsApp (whatsapp)
                  </span>
                  <p className="mt-1 text-xs text-gray-400">Nomor WhatsApp untuk seluruh tombol chat dan reservasi (contoh: +6281353681757 atau 081353681757).</p>
                  <input
                    type="text"
                    value={String(draft.whatsapp ?? '')}
                    onChange={(e) => updateDraft('whatsapp', e.target.value)}
                    placeholder="+6281353681757"
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white font-mono text-sm outline-none transition focus:border-primary"
                  />
                </label>

                <label className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <PhoneCall className="h-4 w-4" /> Nomor Telepon (phone)
                  </span>
                  <p className="mt-1 text-xs text-gray-400">Nomor telepon resmi yang ditampilkan pada info footer & kontak.</p>
                  <input
                    type="text"
                    value={String(draft.phone ?? '')}
                    onChange={(e) => updateDraft('phone', e.target.value)}
                    placeholder="+62 813 5368 1757"
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white font-mono text-sm outline-none transition focus:border-primary"
                  />
                </label>

                <label className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email Resmi (email)
                  </span>
                  <p className="mt-1 text-xs text-gray-400">Alamat email resmi untuk info kontak dan footer.</p>
                  <input
                    type="email"
                    value={String(draft.email ?? '')}
                    onChange={(e) => updateDraft('email', e.target.value)}
                    placeholder="hello@luxurymassagebali.com"
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white text-sm outline-none transition focus:border-primary"
                  />
                </label>

                <label className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> URL Google Maps Navigasi (google_maps_url)
                  </span>
                  <p className="mt-1 text-xs text-gray-400">Link navigasi Google Maps untuk tombol 'Open Google Maps'.</p>
                  <input
                    type="text"
                    value={String(draft.google_maps_url ?? '')}
                    onChange={(e) => updateDraft('google_maps_url', e.target.value)}
                    placeholder="https://maps.app.goo.gl/..."
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white text-sm outline-none transition focus:border-primary font-mono"
                  />
                </label>

                <label className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Google Maps Embed Code / Iframe (google_maps_embed)
                  </span>
                  <p className="mt-1 text-xs text-gray-400">
                    Tempelkan kode embed lengkap dari Google Maps (contoh: <code>&lt;iframe src="https://www.google.com/maps/embed?..." ...&gt;&lt;/iframe&gt;</code>) atau link embed langsung.
                  </p>
                  <textarea
                    rows={3}
                    value={String(draft.google_maps_embed ?? '')}
                    onChange={(e) => updateDraft('google_maps_embed', e.target.value)}
                    placeholder='<iframe src="https://www.google.com/maps/embed?..." width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>'
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white font-mono text-xs outline-none transition focus:border-primary"
                  />

                  {/* Live Map Preview Box */}
                  <div className="mt-4 rounded-xl border border-white/10 overflow-hidden bg-dark">
                    <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center justify-between text-xs text-gray-400">
                      <span className="font-bold text-white">✦ Live Embed Map Preview</span>
                      <span className="font-mono text-[10px] text-primary truncate max-w-xs">{extractMapEmbedSrc(String(draft.google_maps_embed ?? ''))}</span>
                    </div>
                    <div className="h-64 w-full">
                      <iframe
                        title="Admin Maps Preview"
                        src={extractMapEmbedSrc(String(draft.google_maps_embed ?? ''))}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                </label>

                <label className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Alamat / Area Layanan (address)
                  </span>
                  <p className="mt-1 text-xs text-gray-400">Alamat kantor atau keterangan area layanan home service yang tampil di footer & kontak.</p>
                  <textarea
                    rows={2}
                    value={String(draft.address ?? '')}
                    onChange={(e) => updateDraft('address', e.target.value)}
                    placeholder="Bali, Indonesia"
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white text-sm outline-none transition focus:border-primary"
                  />
                </label>

                <label className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Jam Buka (open_hour)
                  </span>
                  <input
                    type="text"
                    value={String(draft.open_hour ?? '')}
                    onChange={(e) => updateDraft('open_hour', e.target.value)}
                    placeholder="09:00"
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white font-mono text-sm outline-none transition focus:border-primary"
                  />
                </label>

                <label className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Jam Tutup (close_hour)
                  </span>
                  <input
                    type="text"
                    value={String(draft.close_hour ?? '')}
                    onChange={(e) => updateDraft('close_hour', e.target.value)}
                    placeholder="21:00"
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white font-mono text-sm outline-none transition focus:border-primary"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Generic Editor for other tabs */}
          {active !== 'branding' && active !== 'contact_info' && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {Object.entries(draft).map(([key, value]) => (
                <label key={key} className="block">
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">{key.replaceAll('_', ' ')}</span>
                  <textarea
                    value={String(value ?? '')}
                    onChange={(event) => updateDraft(key, event.target.value)}
                    rows={key.includes('description') || key.includes('template') || key.includes('policy') || key.includes('message') ? 4 : 2}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-primary font-mono text-xs"
                  />
                </label>
              ))}
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/10 p-5 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-gray-300">
              Semua konfigurasi logo, WhatsApp, dan branding otomatis tersimpan di Supabase (<code className="text-primary font-mono">site_settings</code>) dan langsung diterapkan secara realtime di seluruh komponen website.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

