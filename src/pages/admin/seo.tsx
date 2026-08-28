import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, Code2, Copy, ExternalLink, Globe, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageTransition } from '@/components/ui/motion';
import { supabase } from '@/lib/supabase';
import {
  DEFAULT_SCHEMA_SETTINGS,
  normalizeSchemaSettings,
  parseJsonLd,
  type BusinessSchemaSettings,
  type SchemaSettings,
} from '@/lib/schema-settings';
import { buildCompleteSchema, getSiteUrl, serializeJsonLd } from '@/lib/seo';

const inputClass = 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
const labelClass = 'mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400';
const textareaClass = `${inputClass} resize-y font-mono`;

const defaultRoutes = ['/', '/services', '/massage', '/facial', '/body-treatment', '/spa-package', '/couple-package', '/blog', '/appointment', '/about', '/contact', '/gallery', '/faq'];

function csv(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function BusinessEditor({ value, onChange }: { value: BusinessSchemaSettings; onChange: (value: BusinessSchemaSettings) => void }) {
  const field = (key: keyof BusinessSchemaSettings, next: string | number | null | string[]) => onChange({ ...value, [key]: next });
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {([
        ['name', 'Business Name'], ['legalName', 'Legal Name'], ['telephone', 'Telephone'], ['email', 'Email'],
        ['logo', 'Logo URL'], ['image', 'Main Image URL'], ['streetAddress', 'Street Address'], ['addressLocality', 'City / Locality'],
        ['addressRegion', 'Region'], ['postalCode', 'Postal Code'], ['addressCountry', 'Country Code'], ['googleMapsUrl', 'Google Maps URL'],
        ['opens', 'Opening Time'], ['closes', 'Closing Time'], ['priceRange', 'Price Range'], ['currenciesAccepted', 'Currency'],
      ] as Array<[keyof BusinessSchemaSettings, string]>).map(([key, label]) => (
        <label key={key}><span className={labelClass}>{label}</span><input className={inputClass} value={String(value[key] ?? '')} onChange={(event) => field(key, event.target.value)} /></label>
      ))}
      <label><span className={labelClass}>Latitude</span><input type="number" step="any" className={inputClass} value={value.latitude ?? ''} onChange={(event) => field('latitude', event.target.value === '' ? null : Number(event.target.value))} /></label>
      <label><span className={labelClass}>Longitude</span><input type="number" step="any" className={inputClass} value={value.longitude ?? ''} onChange={(event) => field('longitude', event.target.value === '' ? null : Number(event.target.value))} /></label>
      <label className="md:col-span-2"><span className={labelClass}>Description</span><textarea rows={4} className={inputClass} value={value.description} onChange={(event) => field('description', event.target.value)} /></label>
      <label className="md:col-span-2"><span className={labelClass}>Schema Types — comma separated</span><input className={inputClass} value={value.businessTypes.join(', ')} onChange={(event) => field('businessTypes', csv(event.target.value))} /></label>
      <label className="md:col-span-2"><span className={labelClass}>Service Areas — comma separated</span><input className={inputClass} value={value.areaServed.join(', ')} onChange={(event) => field('areaServed', csv(event.target.value))} /></label>
      <label className="md:col-span-2"><span className={labelClass}>Payment Methods — comma separated</span><input className={inputClass} value={value.paymentAccepted.join(', ')} onChange={(event) => field('paymentAccepted', csv(event.target.value))} /></label>
      <label className="md:col-span-2"><span className={labelClass}>Social / Profile URLs — comma separated</span><input className={inputClass} value={value.sameAs.join(', ')} onChange={(event) => field('sameAs', csv(event.target.value))} /></label>
    </div>
  );
}

export default function AdminSEO() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'meta' | 'business' | 'routes'>('meta');
  const [meta, setMeta] = useState({ title: '', description: '', keywords: '', og_image: '' });
  const [settings, setSettings] = useState<SchemaSettings>(DEFAULT_SCHEMA_SETTINGS);
  const [selectedPath, setSelectedPath] = useState('/');
  const [overrideSource, setOverrideSource] = useState('{}');
  const [newPath, setNewPath] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-seo-settings'],
    queryFn: async () => {
      const { data: rows, error } = await supabase.from('site_settings').select('key,value').in('key', ['seo_global', 'json_ld']);
      if (error) throw error;
      const values = Object.fromEntries((rows || []).map((row) => [row.key, row.value]));
      return { meta: values.seo_global || {}, schema: normalizeSchemaSettings(values.json_ld) };
    },
  });

  useEffect(() => {
    if (!data) return;
    setMeta({ title: data.meta.title || '', description: data.meta.description || '', keywords: data.meta.keywords || '', og_image: data.meta.og_image || '' });
    setSettings(data.schema);
  }, [data]);

  useEffect(() => {
    setOverrideSource(JSON.stringify(settings.routeOverrides[selectedPath]?.schema || {}, null, 2));
  }, [selectedPath, settings.routeOverrides]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsed = parseJsonLd(overrideSource);
      if (tab === 'routes' && parsed.errors.length > 0) throw new Error(parsed.errors.join(' '));
      const nextSettings = tab === 'routes' && parsed.value
        ? { ...settings, routeOverrides: { ...settings.routeOverrides, [selectedPath]: { enabled: true, mode: settings.routeOverrides[selectedPath]?.mode || 'merge', schema: parsed.value } } }
        : settings;
      const { error } = await supabase.from('site_settings').upsert([
        { key: 'seo_global', value: meta },
        { key: 'json_ld', value: nextSettings },
      ], { onConflict: 'key' });
      if (error) throw error;
      return nextSettings;
    },
    onSuccess: (next) => {
      setSettings(next);
      queryClient.invalidateQueries({ queryKey: ['admin-seo-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-json-ld'] });
      toast.success('SEO dan JSON-LD berhasil disimpan.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const validation = useMemo(() => parseJsonLd(overrideSource), [overrideSource]);
  const preview = buildCompleteSchema({ settings, pageSEO: { path: selectedPath, title: meta.title || 'Luxury Massage Bali', description: meta.description || settings.business.description, ogImage: meta.og_image } });
  const routes = Array.from(new Set([...defaultRoutes, ...Object.keys(settings.routeOverrides)])).sort();

  const addRoute = () => {
    const path = newPath.trim().startsWith('/') ? newPath.trim() : `/${newPath.trim()}`;
    if (path === '/') return;
    setSettings((current) => ({ ...current, routeOverrides: { ...current.routeOverrides, [path]: { enabled: true, mode: 'merge', schema: { '@type': 'WebPage', name: path } } } }));
    setSelectedPath(path);
    setNewPath('');
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-white/[0.04] to-transparent p-6 md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div><p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Search Architecture</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-black text-white"><Globe className="h-8 w-8 text-primary" /> SEO & JSON-LD Manager</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-gray-400">Kelola meta, profil bisnis, dan override structured data setiap URL. Template otomatis tetap aktif jika override kosong atau invalid.</p></div>
            <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || isLoading} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 font-black text-dark disabled:opacity-50"><Save className="h-5 w-5" /> {saveMutation.isPending ? 'Saving...' : 'Save All'}</button>
          </div>
        </header>

        <nav className="flex overflow-x-auto rounded-2xl border border-white/10 bg-dark-card p-1.5">
          {([['meta', 'Meta Defaults'], ['business', 'Business Schema'], ['routes', 'URL Schemas']] as const).map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`min-w-max flex-1 rounded-xl px-5 py-3 text-sm font-bold ${tab === id ? 'bg-primary text-dark' : 'text-gray-400 hover:text-white'}`}>{label}</button>)}
        </nav>

        {tab === 'meta' && <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="space-y-5 rounded-3xl border border-white/10 bg-dark-card p-6"><label><span className={labelClass}>Default Meta Title</span><input className={inputClass} value={meta.title} onChange={(event) => setMeta({ ...meta, title: event.target.value })} /></label><label><span className={labelClass}>Meta Description</span><textarea rows={5} className={inputClass} value={meta.description} onChange={(event) => setMeta({ ...meta, description: event.target.value })} /></label><label><span className={labelClass}>Keywords</span><input className={inputClass} value={meta.keywords} onChange={(event) => setMeta({ ...meta, keywords: event.target.value })} /></label><label><span className={labelClass}>Default OG Image</span><input className={inputClass} value={meta.og_image} onChange={(event) => setMeta({ ...meta, og_image: event.target.value })} /></label></div>
          <div className="rounded-3xl bg-white p-6 text-[#202124]"><p className="text-sm">Luxury Massage Bali</p><p className="text-xs text-[#4d5156]">{getSiteUrl()}</p><h2 className="mt-3 text-xl text-[#1a0dab]">{meta.title || 'Page Title'}</h2><p className="mt-2 text-sm leading-6 text-[#4d5156]">{meta.description || 'Page description...'}</p></div>
        </section>}

        {tab === 'business' && <section className="rounded-3xl border border-white/10 bg-dark-card p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-xl font-black text-white">Global Local Business</h2><p className="mt-1 text-sm text-gray-500">Dipakai pada semua halaman melalui ID entitas sama.</p></div><button onClick={() => setSettings({ ...settings, business: DEFAULT_SCHEMA_SETTINGS.business })} className="inline-flex items-center gap-2 text-sm font-bold text-gray-400"><RotateCcw className="h-4 w-4" /> Reset</button></div><BusinessEditor value={settings.business} onChange={(business) => setSettings({ ...settings, business })} /></section>}

        {tab === 'routes' && <section className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-dark-card p-4"><div className="flex gap-2"><input className={inputClass} placeholder="/new-url" value={newPath} onChange={(event) => setNewPath(event.target.value)} /><button onClick={addRoute} className="rounded-xl bg-primary p-3 text-dark"><Plus className="h-5 w-5" /></button></div><div className="mt-4 max-h-[540px] space-y-1 overflow-y-auto">{routes.map((path) => <button key={path} onClick={() => setSelectedPath(path)} className={`w-full rounded-xl px-3 py-2.5 text-left text-sm ${selectedPath === path ? 'bg-primary text-dark font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>{path}</button>)}</div></aside>
          <div className="space-y-5 rounded-3xl border border-white/10 bg-dark-card p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Route Override</p><h2 className="mt-1 text-xl font-black text-white">{selectedPath}</h2></div><div className="flex gap-2"><select value={settings.routeOverrides[selectedPath]?.mode || 'merge'} onChange={(event) => setSettings((current) => ({ ...current, routeOverrides: { ...current.routeOverrides, [selectedPath]: { enabled: true, schema: validation.value || {}, mode: event.target.value as 'merge' | 'replace' } } }))} className={inputClass}><option value="merge">Merge template</option><option value="replace">Replace graph</option></select>{settings.routeOverrides[selectedPath] && <button onClick={() => { const next = { ...settings.routeOverrides }; delete next[selectedPath]; setSettings({ ...settings, routeOverrides: next }); setOverrideSource('{}'); }} className="rounded-xl border border-red-500/30 p-3 text-red-400"><Trash2 className="h-5 w-5" /></button>}</div></div><textarea rows={17} className={textareaClass} value={overrideSource} onChange={(event) => setOverrideSource(event.target.value)} spellCheck={false} />
            <div className={`rounded-xl border p-3 text-sm ${validation.errors.length ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'}`}>{validation.errors.length ? <><AlertCircle className="mr-2 inline h-4 w-4" />{validation.errors.join(' ')}</> : <><Check className="mr-2 inline h-4 w-4" />JSON-LD valid dan siap disimpan.</>}</div>
            <div className="flex flex-wrap gap-2"><button onClick={() => navigator.clipboard.writeText(serializeJsonLd(preview))} className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-bold text-white"><Copy className="h-4 w-4" /> Copy Generated Graph</button><a href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(`${getSiteUrl()}${selectedPath === '/' ? '' : selectedPath}`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-bold text-white"><ExternalLink className="h-4 w-4" /> Rich Results Test</a><a href="https://validator.schema.org/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-bold text-white"><Code2 className="h-4 w-4" /> Schema Validator</a></div>
          </div>
        </section>}
      </div>
    </PageTransition>
  );
}
