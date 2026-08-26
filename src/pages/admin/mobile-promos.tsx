import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Plus, Trash2, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { MediaPickerButton } from '@/components/ui/media-picker';

type Promo = { title: string; subtitle: string; image_url: string; link: string; badge: string };

const DEFAULT_PROMOS: Promo[] = [
  { title: 'Balinese Massage Deals', subtitle: 'Mulai Rp350K hari ini', image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=900&q=80', link: '/services/balinese-massage', badge: 'Promo' },
  { title: 'Couple Spa Ritual', subtitle: 'Private room & aromatherapy', image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&q=80', link: '/services/couple-package', badge: 'Best' },
];

export default function AdminMobilePromos() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Promo[]>(DEFAULT_PROMOS);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-mobile-promos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'mobile_hero_promos').maybeSingle();
      if (error) throw error;
      const promos = (data?.value as { promos?: Promo[] } | null)?.promos;
      setDraft(promos?.length ? promos : DEFAULT_PROMOS);
      return promos?.length ? promos : DEFAULT_PROMOS;
    },
  });

  const promos = useMemo(() => draft.length ? draft : (data ?? DEFAULT_PROMOS), [draft, data]);
  const update = (index: number, key: keyof Promo, value: string) => setDraft((items) => items.map((item, i) => i === index ? { ...item, [key]: value } : item));
  const add = () => setDraft((items) => [...items, { title: 'New Promo', subtitle: 'Short mobile promo text', image_url: '', link: '/services', badge: 'Promo' }]);
  const remove = (index: number) => setDraft((items) => items.filter((_, i) => i !== index));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('site_settings').upsert({ key: 'mobile_hero_promos', value: { promos } }, { onConflict: 'key' });
      if (error) throw error;
    },
    onMutate: () => toast.loading('Saving mobile promos...', { id: 'mobile-promos' }),
    onSuccess: () => { toast.success('Mobile hero promos saved', { id: 'mobile-promos' }); queryClient.invalidateQueries({ queryKey: ['admin-mobile-promos'] }); queryClient.invalidateQueries({ queryKey: ['mobile-hero-promos'] }); },
    onError: (error) => toast.error(error.message, { id: 'mobile-promos' }),
  });

  return <div className="space-y-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-black text-white">Mobile Hero Promo</h1><p className="mt-2 text-sm text-gray-400">Atur carousel promo khusus mobile seperti aplikasi Gojek.</p></div><button onClick={() => saveMutation.mutate()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-dark"><Save className="h-4 w-4" /> Save Promos</button></div>
    <div className="rounded-3xl border border-primary/20 bg-primary/10 p-5"><Smartphone className="h-6 w-6 text-primary" /><p className="mt-3 text-sm leading-6 text-gray-300">Field tersimpan di <code>site_settings.mobile_hero_promos</code>. Frontend mobile home otomatis membaca data ini.</p></div>
    <div className="grid gap-5 xl:grid-cols-2">{isLoading ? <div className="h-56 animate-pulse rounded-3xl bg-white/5" /> : promos.map((promo, index) => <div key={index} className="rounded-3xl border border-white/10 bg-dark-card p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-black text-white">Promo #{index + 1}</h2><button onClick={() => remove(index)} className="rounded-xl bg-red-500/10 p-2 text-red-300"><Trash2 className="h-4 w-4" /></button></div><div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">{promo.image_url ? <img src={promo.image_url} alt={promo.title} className="h-36 w-full object-cover" /> : <div className="flex h-36 items-center justify-center text-sm text-gray-500">No image</div>}</div><div className="mt-4 grid gap-3"><label className="text-xs font-bold uppercase tracking-widest text-gray-500">Image</label><div className="flex gap-2"><input value={promo.image_url} onChange={(event) => update(index, 'image_url', event.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" /><MediaPickerButton onSelect={(url) => update(index, 'image_url', url)} className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-dark">Media</MediaPickerButton></div>{(['title', 'subtitle', 'badge', 'link'] as const).map((key) => <label key={key} className="block"><span className="text-xs font-bold uppercase tracking-widest text-gray-500">{key}</span><input value={promo[key]} onChange={(event) => update(index, key, event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" /></label>)}</div></div>)}</div>
    <button onClick={add} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Add Promo</button>
  </div>;
}
