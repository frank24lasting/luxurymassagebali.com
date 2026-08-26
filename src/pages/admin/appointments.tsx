// @ts-nocheck
/**
 * Admin Appointments - Full Appointment Management System
 */

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, CheckCircle, XCircle,
  Search, ChevronDown, Trash2,
  Check, X, Star, RefreshCw, Square, CheckSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageTransition, InViewAnimate } from '@/components/ui/motion';
import { supabase } from '@/lib/supabase';
import { showOrderNotification } from '@/lib/admin-notifications';

const statusConfig = {
  pending: { 
    label: 'Pending', 
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: Clock 
  },
  confirmed: { 
    label: 'Confirmed', 
    color: 'bg-green-500/10 text-green-400 border-green-500/20',
    icon: CheckCircle 
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'bg-red-500/10 text-red-400 border-red-500/20',
    icon: XCircle 
  },
  completed: { 
    label: 'Completed', 
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: Check 
  },
};

const filters = ['all', 'pending', 'confirmed', 'cancelled', 'completed'];

function AppointmentModal({ appointment, onClose, onUpdate, onSave, onDelete }) {
  const [form, setForm] = useState(() => ({
    customer_name: appointment?.customer_name || '',
    customer_email: appointment?.customer_email || '',
    customer_phone: appointment?.customer_phone || '',
    appointment_date: appointment?.appointment_date || '',
    appointment_time: appointment?.appointment_time || '',
    therapist_preference: appointment?.therapist_preference || 'no_preference',
    special_request: appointment?.special_request || '',
    admin_notes: appointment?.admin_notes || '',
    status: appointment?.status || 'pending',
  }));

  if (!appointment) return null;

  const config = statusConfig[form.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  const updateField = (field, value) => setForm(current => ({ ...current, [field]: value }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-dark-lighter rounded-[1.75rem] border border-white/10 w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-dark-lighter/95 backdrop-blur-xl border-b border-white/5 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl ${config.color} flex items-center justify-center`}>
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold">Edit Appointment</h3>
              <p className="text-xs text-gray-500">Created {new Date(appointment.created_at).toLocaleDateString('id-ID')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Customer Name</label>
              <input value={form.customer_name} onChange={e => updateField('customer_name', e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Phone</label>
              <input value={form.customer_phone} onChange={e => updateField('customer_phone', e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Email</label>
              <input value={form.customer_email} onChange={e => updateField('customer_email', e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Status</label>
              <select value={form.status} onChange={e => updateField('status', e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-dark-card px-4 py-3 text-sm text-white focus:border-primary focus:ring-2 focus:ring-primary/20">
                {filters.filter(f => f !== 'all').map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Date</label>
              <input type="date" value={form.appointment_date} onChange={e => updateField('appointment_date', e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Time</label>
              <input type="time" value={form.appointment_time?.slice(0, 5)} onChange={e => updateField('appointment_time', e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 p-4">
            <h4 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Service</h4>
            <p className="text-white text-sm flex items-center gap-2"><Star className="w-4 h-4 text-primary" />{appointment.services?.name || 'Service'}</p>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Special Request</label>
            <textarea value={form.special_request} onChange={e => updateField('special_request', e.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none" />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Admin Notes</label>
            <textarea value={form.admin_notes} onChange={e => updateField('admin_notes', e.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none" />
          </div>

          <div className="grid gap-3 pt-2 sm:grid-cols-[1fr_1fr_auto]">
            <button onClick={() => onSave(appointment.id, form)} className="flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-dark rounded-xl font-bold text-sm transition-colors">
              <CheckCircle className="w-5 h-5" /> Save Changes
            </button>
            <button onClick={() => onUpdate(appointment.id, form.status === 'confirmed' ? 'completed' : 'confirmed')} className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500/15 hover:bg-green-500/25 text-green-300 border border-green-500/20 rounded-xl font-bold text-sm transition-colors">
              <Check className="w-5 h-5" /> Quick Confirm
            </button>
            <button onClick={() => onDelete(appointment.id)} className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold text-sm transition-colors">
              <Trash2 className="w-5 h-5" /> Delete
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Main Appointments Page
export default function AdminAppointments() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const seenRealtimeIds = useRef(new Set());
  const queryClient = useQueryClient();

  const { data: appointments, isLoading, refetch } = useQuery({
    queryKey: ['admin-appointments', filter],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select('*, services(name)')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status, 
          confirmed_at: status === 'confirmed' ? new Date().toISOString() : null 
        })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: () => toast.loading('Updating appointment...', { id: 'appointment-update' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      toast.success('Appointment updated', { id: 'appointment-update' });
      setSelectedAppointment(null);
    },
    onError: (error) => toast.error(`Update failed: ${error.message}`, { id: 'appointment-update' }),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const { error } = await supabase
        .from('appointments')
        .update({ ...updates, confirmed_at: updates.status === 'confirmed' ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: () => toast.loading('Saving appointment...', { id: 'appointment-save' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      toast.success('Appointment saved', { id: 'appointment-save' });
      setSelectedAppointment(null);
    },
    onError: (error) => toast.error(`Save failed: ${error.message}`, { id: 'appointment-save' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: () => toast.loading('Deleting appointment...', { id: 'appointment-delete' }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      toast.success('Appointment deleted', { id: 'appointment-delete' });
      setSelectedAppointment(null);
      setSelectedIds(current => current.filter(selectedId => selectedId !== id));
    },
    onError: (error) => toast.error(`Delete failed: ${error.message}`, { id: 'appointment-delete' }),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      const { error } = await supabase.from('appointments').delete().in('id', ids);
      if (error) throw error;
    },
    onMutate: (ids) => toast.loading(`Deleting ${ids.length} appointments...`, { id: 'appointments-bulk-delete' }),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      toast.success(`${ids.length} appointments deleted`, { id: 'appointments-bulk-delete' });
      setSelectedIds([]);
      setSelectedAppointment(null);
    },
    onError: (error) => toast.error(`Bulk delete failed: ${error.message}`, { id: 'appointments-bulk-delete' }),
  });

  useEffect(() => {
    const channel = supabase
      .channel('admin-appointments-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'appointments' }, (payload) => {
        const id = payload.new?.id;
        if (id && seenRealtimeIds.current.has(id)) return;
        if (id) seenRealtimeIds.current.add(id);
        showOrderNotification(payload.new?.customer_name || 'Customer baru');
        queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const filteredAppointments = appointments?.filter(apt => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      apt.customer_name?.toLowerCase().includes(s) ||
      apt.customer_email?.toLowerCase().includes(s) ||
      apt.customer_phone?.includes(s) ||
      apt.services?.name?.toLowerCase().includes(s)
    );
  });

  const statusCounts = {
    all: appointments?.length || 0,
    pending: appointments?.filter(a => a.status === 'pending').length || 0,
    confirmed: appointments?.filter(a => a.status === 'confirmed').length || 0,
    cancelled: appointments?.filter(a => a.status === 'cancelled').length || 0,
    completed: appointments?.filter(a => a.status === 'completed').length || 0,
  };

  const visibleIds = filteredAppointments?.map(apt => apt.id) || [];
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
  const toggleSelect = (id) => setSelectedIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const toggleSelectAllVisible = () => setSelectedIds(current => allVisibleSelected ? current.filter(id => !visibleIds.includes(id)) : [...new Set([...current, ...visibleIds])]);
  const selectedCount = selectedIds.length;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Appointments</h1>
            <p className="text-gray-400 text-sm mt-1">Manage customer bookings and confirmations</p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Status Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                  filter === f
                    ? 'bg-primary text-dark'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {statusCounts[f] > 0 && (
                  <span className={`ml-2 ${filter === f ? 'opacity-80' : 'opacity-50'}`}>
                    {statusCounts[f]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-dark-card/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={toggleSelectAllVisible}
            disabled={!visibleIds.length}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-gray-300 transition hover:border-primary/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {allVisibleSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
            {allVisibleSelected ? 'Unselect Visible' : 'Select Visible'}
          </button>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="text-sm font-semibold text-gray-400">{selectedCount} selected</span>
            <button
              type="button"
              disabled={!selectedCount || bulkDeleteMutation.isPending}
              onClick={() => {
                if (confirm(`Delete ${selectedCount} selected appointments permanently?`)) bulkDeleteMutation.mutate(selectedIds);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-black text-red-300 ring-1 ring-red-500/20 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" /> Delete Selected
            </button>
          </div>
        </div>

        {/* Appointments List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-dark-card rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredAppointments?.length === 0 ? (
          <div className="bg-dark-card rounded-2xl border border-white/5 p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No appointments found</p>
            <p className="text-gray-600 text-sm mt-1">Try adjusting your filters or search</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAppointments?.map((apt, index) => {
              const config = statusConfig[apt.status] || statusConfig.pending;
              const StatusIcon = config.icon;

              return (
                <InViewAnimate key={apt.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-dark-card rounded-2xl border p-4 transition-all cursor-pointer group ${selectedIds.includes(apt.id) ? 'border-primary/50 shadow-[0_0_0_1px_rgba(168,200,186,0.25)]' : 'border-white/5 hover:border-white/10'}`}
                    onClick={() => setSelectedAppointment(apt)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Left */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleSelect(apt.id);
                          }}
                          className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-400 transition hover:border-primary/40 hover:text-primary"
                          aria-label={`Select appointment ${apt.customer_name}`}
                        >
                          {selectedIds.includes(apt.id) ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5" />}
                        </button>
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-semibold truncate">{apt.customer_name}</h4>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${config.color}`}>
                              <StatusIcon className="w-3 h-3 inline mr-1" />
                              {config.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {apt.services?.name || 'Service'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {apt.appointment_date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {apt.appointment_time}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right */}
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-gray-500">{apt.customer_email}</p>
                          <p className="text-xs text-gray-500">{apt.customer_phone}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (confirm(`Delete appointment for ${apt.customer_name}?`)) deleteMutation.mutate(apt.id);
                          }}
                          className="rounded-xl bg-red-500/10 p-2 text-red-400 ring-1 ring-red-500/20 transition hover:bg-red-500/20"
                          aria-label={`Delete appointment ${apt.customer_name}`}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                        <ChevronDown className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                </InViewAnimate>
              );
            })}
          </div>
        )}

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedAppointment && (
            <AppointmentModal
              appointment={selectedAppointment}
              onClose={() => setSelectedAppointment(null)}
              onUpdate={(id, status) => updateMutation.mutate({ id, status })}
              onSave={(id, updates) => saveMutation.mutate({ id, updates })}
              onDelete={(id) => {
                if (confirm('Delete this appointment permanently?')) deleteMutation.mutate(id);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
