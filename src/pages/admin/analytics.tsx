import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, BarChart3, Code2, RefreshCw, Search, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import {
  EMPTY_TRACKING_SETTINGS,
  isValidGa4Id,
  isValidGoogleAdsId,
  isValidGtmId,
  normalizeTrackingSettings,
  type GoogleTrackingSettings,
} from '@/lib/analytics';

async function fetchTrackingSettings(): Promise<GoogleTrackingSettings> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'analytics')
    .maybeSingle();
  if (error) throw new Error(error.message);
  const value = data?.value;
  return normalizeTrackingSettings(
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {},
  );
}

const fields = [
  { key: 'gtm_id', label: 'Google Tag Manager', placeholder: 'GTM-XXXXXXX', hint: 'Container ID dari Google Tag Manager.' },
  { key: 'google_ads_id', label: 'Google Ads', placeholder: 'AW-123456789', hint: 'Google tag ID dari akun Google Ads.' },
  { key: 'ga4_id', label: 'Google Analytics 4', placeholder: 'G-XXXXXXXXXX', hint: 'Measurement ID dari GA4 Web Data Stream.' },
  { key: 'search_console_verification', label: 'Google Search Console', placeholder: 'Kode verifikasi HTML tag', hint: 'Isi hanya nilai content dari meta google-site-verification.' },
] as const;

const conversionEvents = [
  'click_whatsapp',
  'booking_start',
  'booking_submit',
  'booking_complete',
  'click_phone',
  'generate_lead',
  'view_price',
  'click_google_maps',
  'click_email',
  'view_service',
  'page_view',
] as const;

export default function AdminAnalytics() {
  const queryClient = useQueryClient();
  const [overrides, setOverrides] = useState<Partial<GoogleTrackingSettings>>({});
  const { data: settings = EMPTY_TRACKING_SETTINGS, isLoading } = useQuery({
    queryKey: ['settings-analytics'],
    queryFn: fetchTrackingSettings,
  });
  const draft: GoogleTrackingSettings = { ...settings, ...overrides };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!isValidGtmId(draft.gtm_id)) throw new Error('Format GTM harus GTM-XXXXXXX.');
      if (!isValidGoogleAdsId(draft.google_ads_id)) throw new Error('Format Google Ads harus AW-123456789.');
      if (!isValidGa4Id(draft.ga4_id)) throw new Error('Format GA4 harus G-XXXXXXXXXX.');

      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'analytics', value: draft }, { onConflict: 'key' });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['settings-analytics'] }),
        queryClient.invalidateQueries({ queryKey: ['public-google-tracking'] }),
      ]);
      toast.success('Google tracking berhasil disimpan.');
    },
    onError: (error) => toast.error(error.message),
  });

  const updateField = (key: keyof GoogleTrackingSettings, value: string) => {
    setOverrides((current) => ({ ...current, [key]: value.trimStart() }));
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Google Tracking & Conversion</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-400">
          Satu pusat konfigurasi untuk GTM, Google Ads, Search Console, dan GA4. Script dimuat sekali di seluruh website.
        </p>
      </header>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-white/10 bg-dark-card p-6">
          <div className="flex items-center gap-3">
            <Code2 className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-white">Google Integration IDs</h2>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {fields.map((field) => (
              <label key={field.key} className="block">
                <span className="text-sm font-semibold text-white">{field.label}</span>
                <input
                  value={draft[field.key]}
                  onChange={(event) => updateField(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  spellCheck={false}
                  autoComplete="off"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-white outline-none transition focus:border-primary/60"
                />
                <span className="mt-1.5 block text-xs text-gray-500">{field.hint}</span>
              </label>
            ))}
          </div>
          <button
            type="button"
            disabled={isLoading || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-dark disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${saveMutation.isPending ? 'animate-spin' : ''}`} />
            {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Google Tracking'}
          </button>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-dark-card p-6">
            <BadgeCheck className="h-7 w-7 text-primary" />
            <h2 className="mt-4 text-lg font-bold text-white">Status</h2>
            <div className="mt-4 space-y-3 text-sm">
              {fields.map((field) => (
                <div key={field.key} className="flex items-center justify-between gap-3">
                  <span className="text-gray-400">{field.label}</span>
                  <span className={draft[field.key] ? 'text-emerald-400' : 'text-gray-600'}>
                    {draft[field.key] ? 'Terisi' : 'Belum'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-dark-card p-6">
            <Target className="h-7 w-7 text-primary" />
            <h2 className="mt-4 text-lg font-bold text-white">Conversion Events</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {conversionEvents.map((event) => (
                <code key={event} className="rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1.5 text-xs text-primary">{event}</code>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="rounded-2xl border border-white/10 bg-dark-card p-6">
        <div className="flex items-start gap-3">
          <Search className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h2 className="font-bold text-white">Langkah setelah menyimpan</h2>
            <p className="mt-1 text-sm text-gray-400">
              Buat trigger Custom Event di GTM atau tandai event sebagai Key Event di GA4. Untuk Google Ads, hubungkan GA4 atau buat conversion action memakai event yang sama.
            </p>
          </div>
        </div>
      </section>
      <BarChart3 className="sr-only" aria-hidden="true" />
    </div>
  );
}
