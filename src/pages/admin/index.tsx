// @ts-nocheck
/**
 * Admin Dashboard - Bento Grid Overview
 */

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Calendar, Users, FileText, Eye, TrendingUp, 
  Clock, DollarSign, CheckCircle, XCircle
} from 'lucide-react';
import { PageTransition, InViewAnimate } from '@/components/ui/motion';
import { supabase } from '@/lib/supabase';

// Stats cards data
const statCards = [
  { label: 'Total Appointments', value: '248', change: '+12%', trend: 'up', icon: Calendar, color: 'primary' },
  { label: 'Pending Confirmation', value: '23', change: 'Needs review', trend: 'neutral', icon: Clock, color: 'amber' },
  { label: 'Published Articles', value: '18', change: '+3 this month', trend: 'up', icon: FileText, color: 'blue' },
  { label: 'Total Revenue', value: 'IDR 45.2M', change: '+18%', trend: 'up', icon: DollarSign, color: 'green' },
];

// Recent appointments
function RecentAppointments() {
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['admin-appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, services(name)')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const statusColors = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  if (isLoading) return <div className="h-48 bg-dark-card rounded-2xl animate-pulse" />;

  return (
    <div className="bg-dark-card rounded-2xl border border-white/5 overflow-hidden">
      <div className="p-5 border-b border-white/5">
        <h3 className="text-white font-semibold">Recent Appointments</h3>
        <p className="text-xs text-gray-500 mt-0.5">Latest booking submissions</p>
      </div>
      <div className="divide-y divide-white/5">
        {appointments?.map((apt) => (
          <div key={apt.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{apt.customer_name}</p>
              <p className="text-xs text-gray-500 truncate">{apt.services?.name || 'Service'} • {apt.appointment_date}</p>
            </div>
            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${statusColors[apt.status] || statusColors.pending}`}>
              {apt.status?.toUpperCase() || 'PENDING'}
            </span>
          </div>
        ))}
        {(!appointments || appointments.length === 0) && (
          <div className="p-8 text-center text-gray-500 text-sm">No appointments yet</div>
        )}
      </div>
    </div>
  );
}

// Quick Actions
function QuickActions() {
  const actions = [
    { label: 'New Appointment', icon: Calendar, href: '/langitdewata/appointments', color: 'primary' },
    { label: 'Write Article', icon: FileText, href: '/langitdewata/articles', color: 'blue' },
    { label: 'Add Service', icon: CheckCircle, href: '/langitdewata/services', color: 'green' },
    { label: 'View Site', icon: Eye, href: '/', color: 'gray' },
  ];

  return (
    <div className="bg-dark-card rounded-2xl border border-white/5 p-5">
      <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <a
            key={action.label}
            href={action.href}
            className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl transition-all group"
          >
            <action.icon className={`w-6 h-6 ${action.color === 'primary' ? 'text-primary' : action.color === 'blue' ? 'text-blue-400' : action.color === 'green' ? 'text-green-400' : 'text-gray-400'}`} />
            <span className="text-xs text-gray-400 group-hover:text-white text-center">{action.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// Services Overview
function ServicesOverview() {
  const { data: services, isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, price, category')
        .order('sort_order')
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="h-64 bg-dark-card rounded-2xl animate-pulse" />;

  return (
    <div className="bg-dark-card rounded-2xl border border-white/5 overflow-hidden">
      <div className="p-5 border-b border-white/5">
        <h3 className="text-white font-semibold">Services</h3>
        <p className="text-xs text-gray-500 mt-0.5">Active spa treatments</p>
      </div>
      <div className="divide-y divide-white/5">
        {services?.map((svc) => (
          <div key={svc.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary text-xs font-bold">{svc.name[0]}</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">{svc.name}</p>
                <p className="text-[10px] text-gray-500">{svc.category}</p>
              </div>
            </div>
            <span className="text-primary text-sm font-semibold">
              IDR {svc.price?.toLocaleString('id-ID')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, change, trend, icon: Icon, color }) {
  const colorClasses = {
    primary: 'from-primary/20 to-primary/5 border-primary/20 text-primary',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400',
    green: 'from-green-500/20 to-green-500/5 border-green-500/20 text-green-400',
  };

  return (
    <InViewAnimate>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl border p-5`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center`}>
            <Icon className={`w-5 h-5`} />
          </div>
          {trend === 'up' && (
            <div className="flex items-center gap-1 text-green-400 text-[10px] font-bold">
              <TrendingUp className="w-3 h-3" />
              {change}
            </div>
          )}
        </div>
        <p className="text-white text-2xl font-bold">{value}</p>
        <p className="text-gray-400 text-xs mt-1">{label}</p>
      </motion.div>
    </InViewAnimate>
  );
}

export default function AdminDashboard() {
  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            All systems operational
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Appointments - spans 2 */}
          <div className="lg:col-span-2">
            <RecentAppointments />
          </div>

          {/* Quick Actions */}
          <QuickActions />
        </div>

        {/* Services Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ServicesOverview />
          
          {/* Chart Placeholder */}
          <div className="bg-dark-card rounded-2xl border border-white/5 p-5">
            <h3 className="text-white font-semibold mb-4">Revenue Trend</h3>
            <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Revenue chart coming soon</p>
                <p className="text-xs mt-1 opacity-70">Connect to analytics service</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
