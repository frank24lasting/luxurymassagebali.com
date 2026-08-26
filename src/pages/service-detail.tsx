import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, MessageCircle } from 'lucide-react';
import { SEOHead } from '@/components/seo/seo-head';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { useContactSettings } from '@/lib/contact';
import type { Service, ServicePrice } from '@/lib/types';

async function fetchService(slug: string): Promise<Service | null> {
  const { data, error } = await supabase
    .from('services')
    .select('*, prices:service_prices(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export default function ServiceDetail() {
  const { slug = '' } = useParams();
  const { getWhatsAppUrl } = useContactSettings();
  const { data: service, isLoading } = useQuery({
    queryKey: ['service', slug],
    queryFn: () => fetchService(slug),
    enabled: slug.length > 0,
  });
  const [selectedPriceId, setSelectedPriceId] = useState('');

  const sortedPrices = useMemo(
    () => [...(service?.prices || [])].sort((a, b) => a.sort_order - b.sort_order),
    [service?.prices],
  );
  const selectedPrice = sortedPrices.find((price) => price.id === selectedPriceId) ?? sortedPrices[0];
  const lowestPrice = sortedPrices.length > 0 ? Math.min(...sortedPrices.map((price) => price.price)) : (service?.price ?? 0);
  const durationLabel = selectedPrice?.label ?? (service?.duration_minutes ? `${service.duration_minutes} Minutes` : 'Flexible');

  function buildWhatsAppUrl(name: string, priceItem?: ServicePrice): string {
    const selectedText = priceItem
      ? `${priceItem.label} - ${formatPrice(priceItem.price)}`
      : 'Standard';
    const text = [
      `Halo Luxury Massage Bali, saya ingin booking ${name}.`,
      '',
      `Pilihan treatment: ${selectedText}`,
      priceItem?.duration_minutes ? `Durasi: ${priceItem.duration_minutes} menit` : '',
    ].filter(Boolean).join('\n');

    return getWhatsAppUrl(text);
  }

  useEffect(() => {
    if (sortedPrices.length > 0 && !selectedPriceId) setSelectedPriceId(sortedPrices[0].id);
  }, [selectedPriceId, sortedPrices]);

  if (isLoading) return <main className="min-h-screen bg-dark pt-28 text-white"><div className="section-container"><div className="h-96 animate-pulse rounded-3xl bg-white/5" /></div></main>;
  if (!service) return <main className="min-h-screen bg-dark pt-28 text-white"><div className="section-container text-center text-gray-400">Layanan tidak ditemukan.</div></main>;

  return (
    <>
      <SEOHead pageSEO={{ path: `/services/${service.slug}`, title: `${service.name} — Luxury Massage Bali`, description: service.description, ogImage: service.image_url }} schemaType="service" serviceData={{ name: service.name, slug: service.slug, description: service.description, price: lowestPrice, imageUrl: service.image_url, duration: durationLabel }} />
      <main className="min-h-screen bg-dark pb-24 pt-24 text-white md:pt-28">
        <section className="section-container">
          <Link to="/services" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary md:text-sm"><ArrowLeft className="h-4 w-4" /> Layanan</Link>
          <div className="mt-6 grid gap-7 lg:mt-8 lg:grid-cols-2 lg:gap-10">
            <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-dark-card lg:rounded-[2rem]">
              {service.image_url ? <img src={service.image_url} alt={service.name} className="aspect-[4/3] w-full object-cover" /> : <div className="aspect-[4/3] bg-primary/10" />}
            </div>

            <div className="flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary md:text-sm">{service.category}</p>
              <h1 className="mt-3 font-heading text-3xl font-black leading-tight tracking-[-0.04em] md:mt-4 md:text-6xl lg:text-7xl">{service.name}</h1>
              <p className="mt-4 text-[13px] leading-7 text-gray-300 md:mt-6 md:text-lg md:leading-9">{service.description}</p>

              <div className="mt-6 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-3 shadow-[0_16px_60px_rgba(0,0,0,0.25)] md:mt-8 md:rounded-3xl md:p-5">
                <div className="mb-3 flex items-center justify-between gap-3 md:mb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 md:text-xs">Pilih Durasi & Harga</p>
                    <p className="mt-1 text-[11px] text-gray-400 md:text-sm">Pilih satu opsi sebelum booking via WhatsApp.</p>
                  </div>
                  <div className="hidden rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary md:block">Mulai {formatPrice(lowestPrice)}</div>
                </div>

                {sortedPrices.length > 0 ? (
                  <div className="grid gap-2 md:gap-3">
                    {sortedPrices.map((price) => {
                      const active = selectedPrice?.id === price.id;
                      return (
                        <label
                          key={price.id}
                          className={`group flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all active:scale-[0.99] md:p-4 ${active ? 'border-primary bg-primary/10 shadow-gold' : 'border-white/10 bg-white/[0.03] hover:border-primary/40 hover:bg-white/[0.06]'}`}
                        >
                          <input
                            type="radio"
                            name="service-price"
                            value={price.id}
                            checked={active}
                            onChange={() => setSelectedPriceId(price.id)}
                            className="sr-only"
                          />
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors md:h-6 md:w-6 ${active ? 'border-primary bg-primary text-dark' : 'border-white/20 bg-dark-card'}`}>
                            {active && <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-extrabold text-white md:text-base">{price.label}</span>
                            <span className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-gray-500 md:text-xs"><Clock className="h-3 w-3 text-primary" /> {price.duration_minutes ? `${price.duration_minutes} menit` : 'Tanpa durasi'}</span>
                          </span>
                          <span className="shrink-0 text-right text-[14px] font-black text-primary md:text-2xl">{formatPrice(price.price)}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Harga</p>
                    <p className="mt-1 text-2xl font-black text-primary">{formatPrice(service.price ?? 0)}</p>
                    <p className="mt-2 flex items-center gap-2 text-xs text-gray-400"><Clock className="h-4 w-4 text-primary" /> {durationLabel}</p>
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 p-3 text-[11px] text-gray-300 md:mt-6 md:p-4 md:text-sm">
                <span className="font-bold text-primary">Terpilih:</span> {selectedPrice ? `${selectedPrice.label} - ${formatPrice(selectedPrice.price)}` : `${durationLabel} - ${formatPrice(service.price ?? 0)}`}
              </div>

              <a href={buildWhatsAppUrl(service.name, selectedPrice)} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-4 text-sm font-black text-dark transition-all hover:shadow-gold active:scale-[0.98] md:mt-8 md:px-8 md:py-5 md:text-lg"><MessageCircle className="h-5 w-5 md:h-6 md:w-6" /> Book via WhatsApp</a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
