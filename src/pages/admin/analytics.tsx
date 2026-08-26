import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Calendar, FileText, MousePointerClick, RefreshCw, Star, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

async function countTable(table: string): Promise<number> {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function fetchSetting(key: string): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', key).maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.value as Record<string, unknown>) ?? {};
}

export default function AdminAnalytics() {
  const queryClient = useQueryClient();
  const [gaId, setGaId] = useState('');
  const { data: services = 0 } = useQuery({ queryKey: ['analytics-services'], queryFn: () => countTable('services') });
  const { data: articles = 0 } = useQuery({ queryKey: ['analytics-articles'], queryFn: () => countTable('articles') });
  const { data: bookings = 0 } = useQuery({ queryKey: ['analytics-bookings'], queryFn: () => countTable('appointments') });
  const { data: settings = {} } = useQuery({ queryKey: ['settings-analytics'], queryFn: () => fetchSetting('analytics') });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const value = { ...settings, google_analytics_id: gaId || settings.google_analytics_id || '', whatsapp_conversion_tracking: true };
      const { error } = await supabase.from('site_settings').upsert({ key: 'analytics', value });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings-analytics'] }),
  });

  const cards = [
    { label: 'Active Services', value: services, icon: Star, tone: 'text-primary' },
    { label: 'Published Content', value: articles, icon: FileText, tone: 'text-blue-400' },
    { label: 'Total Bookings', value: bookings, icon: Calendar, tone: 'text-green-400' },
    { label: 'WA Conversion', value: `${bookings}`, icon: MousePointerClick, tone: 'text-purple-400' },
  ];

  return <div className="space-y-6"><div><h1 className="text-3xl font-bold text-white">Analytics Center</h1><p className="mt-2 text-sm text-gray-400">Ringkasan performa website, konten, layanan, dan booking WhatsApp.</p></div><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <div key={card.label} className="rounded-2xl border border-white/10 bg-dark-card p-5"><card.icon className={`h-6 w-6 ${card.tone}`} /><p className="mt-4 text-3xl font-bold text-white">{card.value}</p><p className="text-sm text-gray-500">{card.label}</p></div>)}</section><section className="grid gap-6 xl:grid-cols-[1fr_380px]"><div className="rounded-2xl border border-white/10 bg-dark-card p-6"><div className="flex items-center gap-3"><BarChart3 className="h-6 w-6 text-primary" /><h2 className="text-xl font-bold text-white">Performance Snapshot</h2></div><div className="mt-6 h-72 rounded-2xl border border-white/10 bg-gradient-to-br from-primary/20 via-white/[0.03] to-transparent p-6"><div className="flex h-full items-end gap-4">{[services, articles, bookings, Math.max(bookings * 2, 1)].map((value, index) => <div key={index} className="flex-1 rounded-t-2xl bg-primary/70" style={{ height: `${Math.min(100, Math.max(12, Number(value) * 12))}%` }} />)}</div></div></div><div className="rounded-2xl border border-white/10 bg-dark-card p-6"><TrendingUp className="h-7 w-7 text-primary" /><h2 className="mt-4 text-xl font-bold text-white">Tracking Settings</h2><label className="mt-5 block text-xs text-gray-500">Google Analytics ID</label><input value={gaId || String(settings.google_analytics_id ?? '')} onChange={(event) => setGaId(event.target.value)} placeholder="G-XXXXXXXXXX" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" /><button onClick={() => saveMutation.mutate()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-dark"><RefreshCw className="h-4 w-4" /> Save Tracking</button></div></section></div>;
}
