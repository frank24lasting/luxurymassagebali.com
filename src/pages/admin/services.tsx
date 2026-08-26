// @ts-nocheck
/**
 * Admin Services - Service CRUD with Cloudinary Upload
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Plus, Search, Edit, Trash2, X, Upload,
  Image as ImageIcon, Clock, DollarSign, ToggleLeft, ToggleRight,
  RefreshCw, Check, AlertCircle, GripVertical
} from 'lucide-react';
import { PageTransition, InViewAnimate } from '@/components/ui/motion';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { MediaPickerButton } from '@/components/ui/media-picker';

// Cloudinary upload function
async function uploadToCloudinary(file) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', preset);
  formData.append('folder', 'luxury-massage-bali/services');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Upload failed');
  return data.secure_url;
}

// Service Form Modal
function ServiceFormModal({ service, onClose, onSave }) {
  const [form, setForm] = useState({
    name: service?.name || '',
    slug: service?.slug || '',
    description: service?.description || '',
    category: service?.category || 'Massage',
    image_url: service?.image_url || '',
    is_active: service?.is_active ?? true,
    sort_order: service?.sort_order || 0,
  });

  // Multiple prices state
  const [prices, setPrices] = useState(() => {
    if (service?.prices && service.prices.length > 0) {
      return service.prices.map(p => ({ ...p }));
    }
    // Default one empty price row
    return [{ id: null, label: '', duration_minutes: null, price: 0, sort_order: 0 }];
  });

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const url = await uploadToCloudinary(file);
      setForm(f => ({ ...f, image_url: url }));
    } catch (err) {
      setError('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSlugify = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  // Add new price row
  const addPriceRow = () => {
    setPrices(prev => [...prev, { id: null, label: '', duration_minutes: null, price: 0, sort_order: prev.length }]);
  };

  // Remove price row
  const removePriceRow = (index) => {
    setPrices(prev => prev.filter((_, i) => i !== index));
  };

  // Update price row
  const updatePriceRow = (index, field, value) => {
    setPrices(prev => prev.map((p, i) => {
      if (i !== index) return p;
      const updated = { ...p, [field]: value };
      // Auto-generate label if duration_minutes changed and no custom label
      if (field === 'duration_minutes' && !p.label) {
        updated.label = value ? `${value} Minutes` : 'Flexible';
      }
      return updated;
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prices.length === 0 || prices.every(p => !p.price || p.price <= 0)) {
      setError('At least one valid price is required');
      return;
    }
    const slug = form.slug || handleSlugify(form.name);
    onSave({ ...form, slug }, prices);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-dark-lighter rounded-2xl border border-white/10 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-dark-lighter border-b border-white/5 p-5 flex items-center justify-between z-10">
          <h3 className="text-white font-semibold text-lg">
            {service ? 'Edit Service' : 'Add New Service'}
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Image Upload - WordPress Style */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Service Image</label>
            <div className="flex items-start gap-4">
              {/* Preview */}
              {form.image_url ? (
                <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 group">
                  <img src={form.image_url} alt={form.name} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-28 h-28 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center flex-shrink-0 bg-white/5">
                  <ImageIcon className="w-8 h-8 text-gray-600" />
                </div>
              )}

              {/* Actions */}
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex gap-2">
                  <MediaPickerButton
                    onSelect={(url) => setForm(f => ({ ...f, image_url: url }))}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-xl text-sm text-white transition-all flex items-center justify-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4 text-gray-400" />
                    Browse Library
                  </MediaPickerButton>

                  <label className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-xl text-sm text-white transition-all flex items-center justify-center gap-2 cursor-pointer">
                    {uploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-gray-400">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400">Upload New</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
                <p className="text-[10px] text-gray-600">
                  Auto WebP · Max 20MB · Recommended: 800×600px
                </p>
              </div>
            </div>
          </div>

          {/* Name & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Service Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: handleSlugify(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="e.g. Balinese Massage"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="auto-generated"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              placeholder="Describe the service benefits..."
            />
          </div>

          {/* Pricing Options - Multiple Prices */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm text-gray-400">
                <DollarSign className="w-3 h-3 inline mr-1" />
                Pricing Options
              </label>
              <button
                type="button"
                onClick={addPriceRow}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Option
              </button>
            </div>

            <div className="space-y-3">
              {prices.map((priceRow, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    {/* Label */}
                    <input
                      type="text"
                      value={priceRow.label}
                      onChange={e => updatePriceRow(index, 'label', e.target.value)}
                      className="bg-dark border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-primary"
                      placeholder="e.g. 60 Minutes"
                    />
                    {/* Duration */}
                    <div className="relative">
                      <input
                        type="number"
                        min="15"
                        value={priceRow.duration_minutes ?? ''}
                        onChange={e => updatePriceRow(index, 'duration_minutes', e.target.value ? Number(e.target.value) : null)}
                        className="w-full bg-dark border border-white/10 rounded-lg px-3 py-2 pr-8 text-white text-sm placeholder-gray-500 focus:border-primary"
                        placeholder="Min"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">min</span>
                    </div>
                    {/* Price */}
                    <input
                      type="number"
                      min="0"
                      value={priceRow.price || ''}
                      onChange={e => updatePriceRow(index, 'price', Number(e.target.value))}
                      className="bg-dark border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-primary"
                      placeholder="Price"
                    />
                  </div>
                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removePriceRow(index)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                    disabled={prices.length <= 1}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-600 mt-2">Leave duration empty for flexible time (e.g., manicure/pedicure)</p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="Massage">Massage</option>
              <option value="Facial">Facial</option>
              <option value="Body Treatment">Body Treatment</option>
              <option value="Couple Package">Couple Package</option>
              <option value="Nail Care">Nail Care</option>
              <option value="Wellness">Wellness</option>
            </select>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <p className="text-white font-medium">Active Service</p>
              <p className="text-xs text-gray-500">Show on public website</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              className={`p-1 rounded-full transition-colors ${form.is_active ? 'text-green-400' : 'text-gray-600'}`}
            >
              {form.is_active ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-dark rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {service ? 'Save Changes' : 'Create Service'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Main Services Page
export default function AdminServices() {
  const [search, setSearch] = useState('');
  const [editingService, setEditingService] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  // Fetch services with their prices
  const { data: services, isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*, prices:service_prices(*)')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ serviceData, prices }) => {
      // Create service
      const { data: newService, error } = await supabase
        .from('services')
        .insert({ ...serviceData, price: null, duration_minutes: null })
        .select('*, prices:service_prices(*)')
        .single();
      if (error) throw error;

      // Insert prices
      if (prices && prices.length > 0) {
        const priceInserts = prices.map(p => ({
          service_id: newService.id,
          label: p.label || `${p.duration_minutes ?? 'Flexible'} Minutes`,
          duration_minutes: p.duration_minutes,
          price: p.price,
          sort_order: p.sort_order,
        }));
        const { error: priceError } = await supabase
          .from('service_prices')
          .insert(priceInserts);
        if (priceError) throw priceError;
      }

      return newService;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, serviceData, prices }) => {
      // Update service
      const { error } = await supabase
        .from('services')
        .update({ ...serviceData, price: null, duration_minutes: null })
        .eq('id', id);
      if (error) throw error;

      // Delete existing prices, re-insert
      await supabase.from('service_prices').delete().eq('service_id', id);

      if (prices && prices.length > 0) {
        const priceInserts = prices.map(p => ({
          service_id: id,
          label: p.label || `${p.duration_minutes ?? 'Flexible'} Minutes`,
          duration_minutes: p.duration_minutes,
          price: p.price,
          sort_order: p.sort_order,
        }));
        const { error: priceError } = await supabase
          .from('service_prices')
          .insert(priceInserts);
        if (priceError) throw priceError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      setEditingService(null);
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      // Prices are cascade deleted automatically
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
    },
  });

  const filteredServices = services?.filter(svc => {
    if (!search) return true;
    const s = search.toLowerCase();
    return svc.name.toLowerCase().includes(s) || svc.category.toLowerCase().includes(s);
  });

  const categories = [...new Set(services?.map(s => s.category) || [])];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Services</h1>
            <p className="text-gray-400 text-sm mt-1">{services?.length || 0} spa treatments</p>
          </div>
          <button
            onClick={() => { setEditingService(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-dark rounded-xl font-semibold text-sm transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Service
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search services..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-dark-card rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredServices?.length === 0 ? (
          <div className="bg-dark-card rounded-2xl border border-white/5 p-12 text-center">
            <Star className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No services found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices?.map((svc, index) => {
              const prices = svc.prices || [];
              const lowestPrice = prices.length > 0
                ? Math.min(...prices.map(p => p.price))
                : svc.price;

              return (
                <InViewAnimate key={svc.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-dark-card rounded-2xl border overflow-hidden group transition-all ${svc.is_active ? 'border-white/5 hover:border-primary/30' : 'border-white/5 opacity-60'
                      }`}
                  >
                    {/* Image */}
                    <div className="relative h-40 bg-gradient-to-br from-primary/10 to-transparent">
                      {svc.image_url ? (
                        <img src={svc.image_url} alt={svc.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-gray-700" />
                        </div>
                      )}
                      {/* Category Badge */}
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white rounded-full">
                        {svc.category}
                      </span>
                      {/* Active Dot */}
                      <span className={`absolute top-3 right-3 w-2 h-2 rounded-full ${svc.is_active ? 'bg-green-400' : 'bg-gray-600'}`} />
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-white font-semibold">{svc.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{svc.description}</p>

                      <div className="mt-4 pt-4 border-t border-white/5">
                        {/* Multiple prices display */}
                        {prices.length > 0 ? (
                          <div className="space-y-1.5">
                            {prices.sort((a, b) => a.sort_order - b.sort_order).map((price, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <span className="text-[11px] text-gray-400">{price.label}</span>
                                <span className="text-primary font-bold text-sm">{formatPrice(price.price)}</span>
                              </div>
                            ))}
                          </div>
                        ) : lowestPrice ? (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-500">Standard</span>
                            <span className="text-primary font-bold">{formatPrice(lowestPrice)}</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-white/5">
                        <button
                          onClick={() => { setEditingService(svc); setShowForm(true); }}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this service?')) deleteMutation.mutate(svc.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </InViewAnimate>
              )
            })}
          </div>
        )}

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <ServiceFormModal
              service={editingService}
              onClose={() => { setShowForm(false); setEditingService(null); }}
              onSave={(data, prices) => {
                if (editingService) {
                  updateMutation.mutate({ id: editingService.id, serviceData: data, prices });
                } else {
                  createMutation.mutate({ serviceData: data, prices });
                }
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
