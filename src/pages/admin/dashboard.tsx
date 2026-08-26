import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, FileText, Image, Star, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AppointmentRow { readonly id: string; readonly customer_name: string; readonly appointment_date: string; readonly appointment_time: string; readonly status: string }

async function countTable(table: string): Promise<number> {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function fetchRecentAppointments(): Promise<readonly AppointmentRow[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('id,customer_name,appointment_date,appointment_time,status')
    .order('created_at', { ascending: false })
    .range(0, 5);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export default function AdminDashboard() {
  const { data: serviceCount = 0 } = useQuery({ queryKey: ['metric-services'], queryFn: () => countTable('services') });
  const { data: articleCount = 0 } = useQuery({ queryKey: ['metric-articles'], queryFn: () => countTable('articles') });
  const { data: appointmentCount = 0 } = useQuery({ queryKey: ['metric-appointments'], queryFn: () => countTable('appointments') });
  const { data: mediaCount = 0 } = useQuery({ queryKey: ['metric-media'], queryFn: () => countTable('media') });
  const { data: recent = [] } = useQuery({ queryKey: ['recent-appointments'], queryFn: fetchRecentAppointments });

  const metrics = useMemo(() => [
    { label: 'Services', value: serviceCount, icon: Star, tone: 'text-primary' },
    { label: 'Articles', value: articleCount, icon: FileText, tone: 'text-blue-400' },
    { label: 'Appointments', value: appointmentCount, icon: Calendar, tone: 'text-green-400' },
    { label: 'Media Assets', value: mediaCount, icon: Image, tone: 'text-purple-400' },
  ], [appointmentCount, articleCount, mediaCount, serviceCount]);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-dark-card p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,200,186,0.25),transparent_35%)]" />
        <div className="relative z-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary">Luxury Massage Bali Command Center</p>
          <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl">Dashboard Operasional</h1>
          <p className="mt-4 max-w-2xl text-gray-400">Pantau layanan, artikel, booking, media, dan konfigurasi website dari satu panel cepat.</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-all hover:-translate-y-1 hover:border-primary/30">
            <metric.icon className={`h-7 w-7 ${metric.tone}`} />
            <p className="mt-5 text-3xl font-bold text-white">{metric.value}</p>
            <p className="text-sm text-gray-500">{metric.label}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-white/10 bg-dark-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Booking Terbaru</h2>
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-5 space-y-3">
            {recent.length === 0 ? <p className="text-sm text-gray-500">Belum ada appointment.</p> : recent.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                <div><p className="font-semibold text-white">{item.customer_name}</p><p className="text-xs text-gray-500">{item.appointment_date} · {item.appointment_time}</p></div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{item.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-dark-card p-6">
          <TrendingUp className="h-8 w-8 text-primary" />
          <h2 className="mt-4 text-xl font-bold text-white">Next Actions</h2>
          <div className="mt-5 space-y-3 text-sm text-gray-400">
            <p>• Update layanan unggulan dengan foto asli.</p>
            <p>• Publish artikel SEO minimal 3 kali per minggu.</p>
            <p>• Pantau conversion booking via WhatsApp.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
