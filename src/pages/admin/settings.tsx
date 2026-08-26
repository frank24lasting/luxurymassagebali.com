import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, CalendarClock, Globe, Image, MapPin, Menu, MessageCircle, Palette, Save, Search, Settings, Shield, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { MediaPickerButton } from '@/components/ui/media-picker';

type SettingValue = Record<string, unknown>;
type SettingKey = 'contact_info' | 'seo_global' | 'branding' | 'navigation' | 'footer' | 'booking_rules' | 'theme' | 'social_links' | 'analytics' | 'maintenance';

const defaults: Record<SettingKey, SettingValue> = {
  contact_info: { phone: '+6281353681757', whatsapp: '+6281353681757', email: 'hello@luxurymassagebali.com', address: 'Bali, Indonesia', google_maps_url: 'https://maps.app.goo.gl/SbephNzX2QaKfiEB9?g_st=iwb', open_hour: '09:00', close_hour: '21:00', timezone: 'Asia/Makassar' },
  seo_global: { title: 'Luxury Massage Bali — Premium Home Massage', description: 'Premium massage dan wellness treatment langsung ke villa, hotel, apartemen, atau rumah Anda di Bali.', keywords: 'luxury massage bali, home massage bali, balinese massage, out call massage bali', og_image: '', robots: 'index,follow', canonical: 'https://luxurymassagebali.com' },
  branding: { site_name: 'Luxury Massage Bali', logo_text: 'Luxury Massage Bali', tagline: 'Private Wellness, Delivered', logo_mode: 'text', logo_url: '', logo_size_nav: '140', logo_size_mobile: '120', logo_size_admin: '100', logo_size_footer: '150', logo_size_loader: '150', logo_scale_nav: '1', logo_scale_mobile: '1', logo_scale_admin: '1', logo_scale_footer: '1', favicon_url: '/favicon.svg', primary_cta: 'Book Appointment', admin_path: '/langitdewata' },
  navigation: { home: '/', services: '/services', booking: '/appointment', blog: '/blog', about: '/tentang', contact: '/kontak', gallery: '/gallery' },
  footer: { headline: 'Luxury Massage Bali', description: 'Premium home massage and wellness service across Bali.', copyright: '© Luxury Massage Bali', privacy_url: '/kebijakan-privasi', terms_url: '/syarat-ketentuan', refund_url: '/refund-policy' },
  booking_rules: { whatsapp_template: 'Halo Luxury Massage Bali, saya ingin booking.', min_notice_hours: '2', max_days_ahead: '30', deposit_required: 'false', cancellation_policy: 'Pembatalan mendadak dapat dikenakan biaya operasional.' },
  theme: { primary_color: '#214038', dark_color: '#0c1a16', accent_color: '#19322c', mode: 'dark', radius: '20' },
  social_links: { instagram: '', facebook: '', tiktok: '', youtube: '', tripadvisor: '', google_business: '' },
  analytics: { google_analytics_id: 'G-XXXXXXXXXX', meta_pixel_id: '', tiktok_pixel_id: '', whatsapp_conversion_tracking: 'true' },
  maintenance: { enabled: 'false', message: 'Website sedang maintenance sebentar.', allow_admin_bypass: 'true' },
};

async function fetchSetting(key: SettingKey): Promise<SettingValue> {
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', key).maybeSingle();
  if (error) throw new Error(error.message);
  return { ...defaults[key], ...((data?.value as SettingValue | null) ?? {}) };
}

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
      toast.success('Berhasil disimpan. Logo website langsung diperbarui.', {
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
    { id: 'branding', label: 'Branding', icon: Building2 },
    { id: 'navigation', label: 'Navigation', icon: Menu },
    { id: 'footer', label: 'Footer', icon: Globe },
    { id: 'booking_rules', label: 'Booking Rules', icon: CalendarClock },
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'social_links', label: 'Social Links', icon: MessageCircle },
    { id: 'analytics', label: 'Pixels', icon: Image },
    { id: 'maintenance', label: 'Maintenance', icon: Shield },
  ] as const, []);

  return <div className="space-y-6"><div><h1 className="text-3xl font-bold text-white">Website Settings</h1><p className="mt-2 text-sm text-gray-400">Pusat kontrol Luxury Massage Bali: konten global, SEO, booking, theme, footer, navigation, social, analytics, maintenance.</p></div><div className="grid gap-6 xl:grid-cols-[300px_1fr]"><aside className="rounded-2xl border border-white/10 bg-dark-card p-4">{tabs.map((tab) => <button key={tab.id} onClick={() => setActive(tab.id)} className={`mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold ${active === tab.id ? 'bg-primary text-dark' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><tab.icon className="h-4 w-4" /> {tab.label}</button>)}</aside><main className="rounded-2xl border border-white/10 bg-dark-card p-6"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><Settings className="h-6 w-6 text-primary" /><div><h2 className="text-xl font-bold text-white">{tabs.find((tab) => tab.id === active)?.label}</h2><p className="text-xs text-gray-500">Database key: {active}</p></div></div><button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()} className="group inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 font-bold text-white shadow-clean transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"><Save className={`h-4 w-4 ${saveMutation.isPending ? 'animate-pulse' : 'transition group-hover:rotate-12'}`} /> {saveMutation.isPending ? 'Saving...' : 'Save'}</button></div>{active === 'branding' && <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5"><h3 className="text-sm font-bold uppercase tracking-widest text-primary">Navigation Logo</h3><div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white p-2">{String(draft.logo_url ?? '') ? <img src={String(draft.logo_url)} alt="Navigation logo preview" className="h-full w-full object-contain" /> : <span className="text-2xl font-bold text-dark">LM</span>}</div><div className="flex-1"><p className="text-sm text-gray-300">Pilih logo dari Media Library untuk menu desktop dan mobile, atau gunakan wordmark teks bawaan.</p><div className="mt-3 flex flex-wrap gap-2"><MediaPickerButton onSelect={(url) => updateDraft('logo_url', url)} className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-dark">Choose From Media Library</MediaPickerButton><button type="button" onClick={() => updateDraft('logo_url', '')} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-gray-300">Use Text Logo</button></div></div></div></div>}<div className="mt-6 grid gap-4 md:grid-cols-2">{Object.entries(draft).map(([key, value]) => <label key={key} className="block"><span className="text-xs font-semibold uppercase tracking-widest text-gray-500">{key.replaceAll('_', ' ')}</span><textarea value={String(value ?? '')} onChange={(event) => updateDraft(key, event.target.value)} rows={key.includes('description') || key.includes('template') || key.includes('policy') || key.includes('message') ? 4 : 2} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-primary" /></label>)}</div><div className="mt-6 rounded-2xl border border-primary/20 bg-primary/10 p-5"><Sparkles className="h-5 w-5 text-primary" /><p className="mt-3 text-sm leading-relaxed text-gray-300">Semua value disimpan sebagai JSON di `site_settings`, sehingga frontend tetap dinamis tanpa hardcode.</p></div></main></div></div>;
}
