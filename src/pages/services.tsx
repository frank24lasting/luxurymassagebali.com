import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Sparkles, Star } from 'lucide-react';
import { SEOHead } from '@/components/seo/seo-head';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import type { Service } from '@/lib/types';

const highlightedSlugs = new Set(['balinese-massage', 'manicure-pedicure', 'facial-acupressure', 'nail-polish-gel', 'lymphatic-massage']);

async function fetchServices(): Promise<readonly Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*, prices:service_prices(*)')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export default function Services() {
  const { data: services = [], isLoading } = useQuery({ queryKey: ['public-services'], queryFn: fetchServices });
  const categories = Array.from(new Set(services.map((service) => service.category)));

  return (
    <>
      <SEOHead
        pageSEO={{ path: '/services', title: 'Layanan Luxury Massage Bali — Massage, Facial & Body Care', description: 'Pilih treatment Luxury Massage Bali: Balinese Massage, facial, lymphatic massage, body treatment, dan spa package untuk home service di Bali.', ogImage: '' }}
        pageType="CollectionPage"
        itemList={{
          name: 'Luxury Massage Bali Service Menu',
          items: services.map((service) => ({ name: service.name, url: `/services/${service.slug}`, image: service.image_url })),
        }}
      />
      <section className="relative min-h-screen overflow-hidden bg-dark pt-28 pb-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,200,186,0.26),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(45,74,62,0.45),transparent_40%)]" />
        <div className="section-container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"><Sparkles className="h-4 w-4" /> Signature Service Menu</span>
            <h1 className="mt-6 font-heading text-5xl font-bold md:text-7xl">Luxury Massage & Wellness di Bali</h1>
            <p className="mt-5 text-lg leading-relaxed text-gray-300">Menu dinamis dari database. Admin bisa tambah, edit, hapus, dan urutkan layanan lewat dashboard.</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-5">
            {['Balinese Massage', 'Mani/Pedicure', 'Facial', 'Nail Polish/Gel', 'Lymphatic'].map((name) => <div key={name} className="glass-card-hover p-5 text-center"><Star className="mx-auto h-5 w-5 text-primary" /><p className="mt-3 text-sm font-semibold text-white">{name}</p></div>)}
          </div>
          {isLoading ? <div className="mt-14 grid gap-6 md:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-80 animate-pulse rounded-3xl bg-white/5" />)}</div> : (
            <div className="mt-16 space-y-14">
              {categories.map((category) => (
                <section key={category}>
                  <h2 className="font-heading text-3xl font-semibold text-primary">{category}</h2>
                  <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {services.filter((service) => service.category === category).map((service) => {
                      const highlighted = highlightedSlugs.has(service.slug);
                      const prices = service.prices || [];
                      const lowestPrice = prices.length > 0 ? Math.min(...prices.map(p => p.price)) : null;
                      return <article key={service.id} className={`group overflow-hidden rounded-3xl border bg-dark-card transition-all hover:-translate-y-1 ${highlighted ? 'border-primary/50 shadow-gold' : 'border-white/10 hover:border-primary/30'}`}>
                        <div className="relative h-56 bg-gradient-to-br from-primary/20 to-secondary/20">{service.image_url ? <img src={service.image_url} alt={service.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" /> : <div className="flex h-full items-center justify-center text-primary"><Sparkles className="h-12 w-12" /></div>}{highlighted && <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-bold text-dark">Paling Disoroti</span>}</div>
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-white">{service.name}</h3>
                          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-400">{service.description}</p>
                          {/* Prices */}
                          <div className="mt-5 space-y-2">
                            {prices.length > 0 ? (
                              prices.sort((a, b) => a.sort_order - b.sort_order).map((p, i) => (
                                <div key={i} className="flex items-center justify-between text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                  <span className="flex items-center gap-1.5 text-gray-400">
                                    <Clock className="h-3 w-3" />
                                    {p.label}
                                  </span>
                                  <span className="text-primary font-bold">{formatPrice(p.price)}</span>
                                </div>
                              ))
                            ) : lowestPrice ? (
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1.5 text-gray-400"><Clock className="h-3 w-3" /> Standard</span>
                                <span className="text-primary font-bold">{formatPrice(lowestPrice)}</span>
                              </div>
                            ) : null}
                          </div>
                          {/* Bottom action */}
                          <div className="mt-4 flex items-center justify-between pt-4 border-t border-white/10">
                            <span className="text-xs text-gray-500">Mulai dari {prices.length > 0 ? formatPrice(Math.min(...prices.map(p => p.price))) : '—'}</span>
                            <Link to={`/services/${service.slug}`} className="rounded-xl bg-white/5 p-3 text-primary transition-all hover:bg-primary hover:text-dark" aria-label={`Lihat ${service.name}`}><ArrowRight className="h-5 w-5" /></Link>
                          </div>
                        </div>
                      </article>;
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
