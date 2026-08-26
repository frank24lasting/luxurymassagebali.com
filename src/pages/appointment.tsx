import { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CalendarDays, Clock, MapPin, MessageCircle, Phone, Sparkles, Star, User, Mail, NotebookText } from 'lucide-react';
import { SEOHead } from '@/components/seo/seo-head';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { useContactSettings } from '@/lib/contact';
import type { ServicePrice } from '@/lib/types';

interface ServiceOption {
  readonly id: string;
  readonly name: string;
  readonly category: string | null;
  readonly image_url: string | null;
  readonly prices?: ServicePrice[];
}

interface AppointmentDraft {
  readonly customer_name: string;
  readonly customer_email: string;
  readonly customer_phone: string;
  readonly service_id: string;
  readonly price_id: string;
  readonly appointment_date: string;
  readonly appointment_time: string;
  readonly therapist_preference: string;
  readonly special_request: string;
}

const today = new Date().toISOString().slice(0, 10);
const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

async function fetchServices(): Promise<readonly ServiceOption[]> {
  const { data, error } = await supabase
    .from('services')
    .select('id,name,category,image_url, prices:service_prices(*)')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

function buildWhatsAppMessage(draft: AppointmentDraft, service?: ServiceOption, price?: ServicePrice): string {
  const serviceDetail = service ? `${service.name} (${price?.label || 'Standard'})` : 'Belum dipilih';
  return [
    'Halo Luxury Massage Bali, saya ingin booking HOME SERVICE / OUT CALL appointment.',
    'Saya paham layanan dilakukan di lokasi saya (hotel/villa/rumah/apartemen), bukan walk-in di tempat spa.',
    '',
    `Nama: ${draft.customer_name}`,
    `Email: ${draft.customer_email}`,
    `No HP/WA: ${draft.customer_phone}`,
    `Layanan: ${serviceDetail}`,
    `Tanggal: ${draft.appointment_date}`,
    `Jam: ${draft.appointment_time}`,
    `Terapis: ${draft.therapist_preference}`,
    `Catatan/Lokasi: ${draft.special_request || '-'}`,
    '',
    'Mohon konfirmasi jadwal tersedia. Terima kasih.',
  ].join('\n');
}

export default function Appointment() {
  const { getWhatsAppUrl } = useContactSettings();
  const { data: services = [] } = useQuery({ queryKey: ['booking-services'], queryFn: fetchServices });
  const [draft, setDraft] = useState<AppointmentDraft>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    service_id: '',
    price_id: '',
    appointment_date: today,
    appointment_time: '10:00',
    therapist_preference: 'no_preference',
    special_request: '',
  });

  const selectedService = useMemo(() => services.find((service) => service.id === draft.service_id), [draft.service_id, services]);
  const selectedPrice = useMemo(() => selectedService?.prices?.find((p) => p.id === draft.price_id), [draft.price_id, selectedService]);

  const createAppointment = useMutation({
    mutationFn: async () => {
      const appointmentId = crypto.randomUUID();
      const specialRequest = [
        selectedPrice ? `Price Option: ${selectedPrice.label}` : '',
        draft.special_request.trim(),
      ].filter(Boolean).join('\n');

      const { error } = await supabase.from('appointments').insert({
        id: appointmentId,
        customer_name: draft.customer_name.trim(),
        customer_email: draft.customer_email.trim(),
        customer_phone: draft.customer_phone.trim(),
        service_id: draft.service_id || null,
        appointment_date: draft.appointment_date,
        appointment_time: `${draft.appointment_time}:00`,
        therapist_preference: draft.therapist_preference,
        special_request: specialRequest,
        status: 'pending',
      });
      if (error) throw new Error(error.message);

      fetch('/api/send-admin-order-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      }).catch(() => undefined);
    },
    onSuccess: () => {
      const message = buildWhatsAppMessage(draft, selectedService, selectedPrice);
      window.location.href = getWhatsAppUrl(message);
    },
  });

  const canSubmit = draft.customer_name.trim().length >= 2 && draft.customer_email.includes('@') && draft.customer_phone.trim().length >= 8 && draft.service_id && draft.appointment_date && draft.appointment_time;

  return (
    <>
      <SEOHead pageSEO={{ path: '/appointment', title: 'Book Home Massage Luxury Massage Bali via WhatsApp', description: 'Booking Luxury Massage Bali untuk home service ke hotel, villa, apartemen, atau rumah Anda di Bali.', ogImage: '' }} />
      <main className="relative min-h-screen overflow-hidden bg-[#080b10] pb-28 pt-20 text-white md:pt-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,200,186,0.24),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(45,74,62,0.52),transparent_44%)]" />
        <section className="section-container relative z-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-5 flex items-center justify-between md:mb-8">
              <div>
                <span className="app-chip"><Sparkles className="h-3.5 w-3.5 text-primary" /> Fast Booking</span>
                <h1 className="mt-3 font-heading text-4xl font-bold tracking-[-0.04em] md:text-7xl">Book Home Spa</h1>
                <p className="app-muted mt-2 max-w-xl">Layanan khusus HOME SERVICE / OUT CALL. Terapis Luxury Massage Bali datang ke hotel, villa, apartemen, atau rumah Anda. Tidak menerima walk-in di lokasi spa.</p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (canSubmit) createAppointment.mutate();
                }}
                className="app-surface overflow-hidden"
              >
                <div className="border-b border-white/10 p-4 md:p-6">
                  <h2 className="app-section-title">Detail Booking</h2>
                  <p className="app-muted mt-1">Pilih layanan, tanggal, jam, dan tulis alamat lengkap lokasi treatment. Semua booking adalah home service / out call.</p>
                </div>

                <div className="space-y-5 p-4 md:p-6">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-500"><Star className="h-3.5 w-3.5" /> Pilih Layanan</label>
                    <div className="app-horizontal md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0">
                      {services.map((service) => {
                        const prices = service.prices || [];
                        const lowestPrice = prices.length > 0 ? Math.min(...prices.map(p => p.price)) : 0;
                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => setDraft((item) => ({ ...item, service_id: service.id, price_id: prices.length > 0 ? prices[0].id : '' }))}
                            className={`min-w-[210px] snap-start rounded-[1.25rem] border p-3 text-left transition-all active:scale-[0.98] ${draft.service_id === service.id ? 'border-primary bg-primary/15 shadow-gold' : 'border-white/10 bg-white/[0.04]'}`}
                          >
                            <div className="flex gap-3">
                              <div className="h-14 w-14 overflow-hidden rounded-2xl bg-white/5 shrink-0">
                                {service.image_url ? <img src={service.image_url} alt={service.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-primary"><Star className="h-5 w-5" /></div>}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-extrabold text-white">{service.name}</p>
                                <p className="mt-1 text-[10.5px] text-gray-400">{prices.length} opsi durasi · {service.category}</p>
                                <p className="mt-1 text-[11px] font-bold text-primary">Mulai {formatPrice(lowestPrice)}</p>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Price Options (Duration) */}
                  {selectedService && selectedService.prices && selectedService.prices.length > 0 && (
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-500"><Clock className="h-3.5 w-3.5" /> Pilih Durasi & Harga</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedService.prices.sort((a, b) => a.sort_order - b.sort_order).map(price => (
                          <button
                            key={price.id}
                            type="button"
                            onClick={() => setDraft({ ...draft, price_id: price.id })}
                            className={`rounded-xl border p-3 text-left transition-all active:scale-[0.98] ${draft.price_id === price.id ? 'border-primary bg-primary/15' : 'border-white/10 bg-white/5'}`}
                          >
                            <p className="text-[12px] font-bold text-white">{price.label}</p>
                            <p className="mt-1 text-[11px] text-primary">{formatPrice(price.price)}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block"><span className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-500"><User className="h-3.5 w-3.5" /> Nama</span><input value={draft.customer_name} onChange={(event) => setDraft({ ...draft, customer_name: event.target.value })} placeholder="Nama lengkap" className="input-field" required /></label>
                    <label className="block"><span className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-500"><Phone className="h-3.5 w-3.5" /> WhatsApp</span><input value={draft.customer_phone} onChange={(event) => setDraft({ ...draft, customer_phone: event.target.value })} placeholder="08xx / +62" className="input-field" required /></label>
                  </div>

                  <label className="block"><span className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-500"><Mail className="h-3.5 w-3.5" /> Email</span><input type="email" value={draft.customer_email} onChange={(event) => setDraft({ ...draft, customer_email: event.target.value })} placeholder="email@domain.com" className="input-field" required /></label>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block"><span className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-500"><CalendarDays className="h-3.5 w-3.5" /> Tanggal</span><input type="date" min={today} value={draft.appointment_date} onChange={(event) => setDraft({ ...draft, appointment_date: event.target.value })} className="input-field" required /></label>
                    <div><span className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-500"><Clock className="h-3.5 w-3.5" /> Jam</span><div className="grid grid-cols-4 gap-2">{timeSlots.map((slot) => <button key={slot} type="button" onClick={() => setDraft({ ...draft, appointment_time: slot })} className={`rounded-xl px-2 py-2 text-[11px] font-bold ${draft.appointment_time === slot ? 'bg-primary text-dark' : 'bg-white/5 text-gray-300'}`}>{slot}</button>)}</div></div>
                  </div>

                  <label className="block"><span className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-500"><MapPin className="h-3.5 w-3.5" /> Lokasi / Catatan</span><textarea value={draft.special_request} onChange={(event) => setDraft({ ...draft, special_request: event.target.value })} rows={4} placeholder="Alamat hotel/villa/rumah, catatan khusus, jumlah orang..." className="input-field resize-none" /></label>

                  {createAppointment.error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[12px] text-red-300">{createAppointment.error.message}</p>}

                  <button disabled={!canSubmit || createAppointment.isPending} className="sticky bottom-24 z-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-[13px] font-extrabold text-dark shadow-gold transition-all active:scale-[0.98] disabled:opacity-50 md:static">
                    <MessageCircle className="h-5 w-5" /> {createAppointment.isPending ? 'Menyimpan...' : 'Simpan & Lanjut WhatsApp'}
                  </button>
                </div>
              </form>

              <aside className="space-y-4">
                <div className="app-card">
                  <h2 className="app-section-title">Ringkasan</h2>
                  <div className="mt-4 space-y-3 text-[12px] text-gray-300">
                    <p><span className="text-gray-500">Layanan:</span> {selectedService?.name ?? 'Pilih layanan'}</p>
                    {selectedPrice && <p><span className="text-gray-500">Opsi:</span> {selectedPrice.label} - {formatPrice(selectedPrice.price)}</p>}
                    <p><span className="text-gray-500">Jadwal:</span> {draft.appointment_date} · {draft.appointment_time}</p>
                    <p><span className="text-gray-500">WA:</span> {draft.customer_phone || '-'}</p>
                  </div>
                </div>
                <div className="app-card">
                  <NotebookText className="h-6 w-6 text-primary" />
                  <h3 className="mt-3 font-bold text-white">Home Service / Out Call Only</h3>
                  <p className="app-muted mt-2">Luxury Massage Bali datang ke lokasi Anda. Mohon isi alamat hotel/villa/rumah/apartemen dengan jelas agar tim kami bisa konfirmasi jadwal dan area layanan.</p>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
