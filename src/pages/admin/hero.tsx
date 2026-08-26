// @ts-nocheck
/**
 * Admin Hero Slides — Drag-reorder hero banners with Media Picker
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image, Plus, Search, Edit, Trash2, X, Upload, GripVertical,
  Image as ImageIcon, Check, AlertCircle, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { PageTransition, InViewAnimate } from '@/components/ui/motion';
import { supabase } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/utils';
import { MediaPickerButton } from '@/components/ui/media-picker';
import toast from 'react-hot-toast';

function HeroFormModal({ slide, onClose, onSave }) {
  const [form, setForm] = useState({
    type: slide?.type || 'image',
    headline: slide?.headline || '',
    subheadline: slide?.subheadline || '',
    cta_text: slide?.cta_text || 'Book Now',
    cta_link: slide?.cta_link || '/appointment',
    media_url: slide?.media_url || '',
    thumbnail_url: slide?.thumbnail_url || '',
    alt_text: slide?.alt_text || '',
    sort_order: slide?.sort_order || 0,
    is_active: slide?.is_active ?? true,
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const loadingToast = toast.loading(`Uploading ${file.type.startsWith('video/') ? 'video' : 'image'}...`);
      const url = await uploadToCloudinary(file, 'luxury-massage-bali/hero');
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      setForm(f => ({ ...f, type: mediaType, media_url: url, alt_text: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') }));
      toast.success('Hero media uploaded successfully', { id: loadingToast });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown upload error';
      setError('Upload failed: ' + message);
      toast.error(`Upload failed: ${message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
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
        className="bg-dark-lighter rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-dark-lighter border-b border-white/5 p-5 flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg">{slide ? 'Edit Hero Slide' : 'Add Hero Slide'}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          {/* Hero Preview */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Hero Background</label>
            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-white/10 group">
              {form.media_url ? (
                form.type === 'video' ? (
                  <video src={form.media_url} poster={form.thumbnail_url || undefined} className="w-full h-full object-cover" muted playsInline />
                ) : (
                  <img src={form.media_url} alt={form.alt_text} className="w-full h-full object-cover" />
                )
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-dark-lighter flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-700" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-bold text-xl truncate">{form.headline || 'Headline Preview'}</p>
                <p className="text-gray-300 text-sm truncate">{form.subheadline || 'Subheadline preview text...'}</p>
                <button className="mt-2 px-4 py-1.5 bg-primary text-dark text-xs font-bold rounded-lg">
                  {form.cta_text || 'Book Now'}
                </button>
              </div>
            </div>
          </div>

          {/* Media Picker + Upload */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Hero Media Type</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {['image', 'video'].map(type => (
                <button key={type} type="button" onClick={() => setForm(f => ({ ...f, type }))} className={`rounded-xl border px-4 py-3 text-sm font-bold uppercase tracking-widest ${form.type === type ? 'border-primary bg-primary text-dark' : 'border-white/10 bg-white/5 text-gray-300'}`}>{type}</button>
              ))}
            </div>
            <label className="block text-sm text-gray-400 mb-2">Background Image / Video</label>
            <div className="flex gap-2">
              <MediaPickerButton
                onSelect={(url) => setForm(f => ({ ...f, media_url: url }))}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-xl text-sm text-white transition-all flex items-center justify-center gap-2"
              >
                <ImageIcon className="w-4 h-4 text-gray-400" />
                Browse Library
              </MediaPickerButton>
              <label className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-xl text-sm text-white transition-all flex items-center justify-center gap-2 cursor-pointer">
                {uploading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin text-primary" /><span className="text-gray-400">Uploading...</span></>
                ) : (
                  <><Upload className="w-4 h-4 text-gray-400" /><span className="text-gray-400">Upload New</span></>
                )}
                <input type="file" accept="image/*,video/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
            <p className="text-[10px] text-gray-600 mt-1.5">Image: 1920×1080px · Video: MP4/WebM landscape</p>
          </div>

          {/* Headline */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Headline *</label>
            <input
              type="text"
              required
              value={form.headline}
              onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-lg"
              placeholder="Experience Pure Relaxation"
            />
          </div>

          {/* Subheadline */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Subheadline</label>
            <input
              type="text"
              value={form.subheadline}
              onChange={e => setForm(f => ({ ...f, subheadline: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Professional spa treatments in the heart of Jimbaran"
            />
          </div>

          {/* CTA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Button Text</label>
              <input
                type="text"
                value={form.cta_text}
                onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Book Now"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Button Link</label>
              <input
                type="text"
                value={form.cta_link}
                onChange={e => setForm(f => ({ ...f, cta_link: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="/appointment"
              />
            </div>
          </div>

          {/* Alt Text */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Alt Text (SEO)</label>
            <input
              type="text"
              value={form.alt_text}
              onChange={e => setForm(f => ({ ...f, alt_text: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Luxury home massage experience in Bali"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <p className="text-white font-medium">Active Slide</p>
              <p className="text-xs text-gray-500">Show on homepage</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              className={`p-1 rounded-full transition-colors ${form.is_active ? 'text-green-400' : 'text-gray-600'}`}
            >
              {form.is_active ? <Eye className="w-8 h-8" /> : <EyeOff className="w-8 h-8" />}
            </button>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Display Order</label>
            <input
              type="number"
              min="0"
              value={form.sort_order}
              onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <p className="text-[10px] text-gray-600 mt-1">Lower number = displayed first</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold text-sm transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-dark rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              {slide ? 'Save Changes' : 'Create Slide'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function AdminHero() {
  const [editingSlide, setEditingSlide] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: slides, isLoading } = useQuery({
    queryKey: ['admin-hero'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const sanitizeHeroPayload = ({ alt_text, ...payload }) => payload;

  const createMutation = useMutation({
    mutationFn: async (newSlide) => {
      const { error } = await supabase.from('hero_slides').insert(sanitizeHeroPayload(newSlide));
      if (error) throw error;
    },
    onMutate: () => toast.loading('Saving hero slide...', { id: 'hero-save' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-hero'] }); toast.success('Hero slide created', { id: 'hero-save' }); setShowForm(false); },
    onError: (error) => toast.error(`Create failed: ${error.message}`, { id: 'hero-save' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { error } = await supabase.from('hero_slides').update(sanitizeHeroPayload(updates)).eq('id', id);
      if (error) throw error;
    },
    onMutate: () => toast.loading('Updating hero slide...', { id: 'hero-save' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-hero'] }); toast.success('Hero slide updated', { id: 'hero-save' }); setEditingSlide(null); setShowForm(false); },
    onError: (error) => toast.error(`Update failed: ${error.message}`, { id: 'hero-save' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('hero_slides').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: () => toast.loading('Deleting hero slide...', { id: 'hero-delete' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-hero'] }); toast.success('Hero slide deleted', { id: 'hero-delete' }); },
    onError: (error) => toast.error(`Delete failed: ${error.message}`, { id: 'hero-delete' }),
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Image className="w-7 h-7 text-primary" />
              Hero Slides
            </h1>
            <p className="text-gray-400 text-sm mt-1">{slides?.length || 0} slides · Homepage banner carousel</p>
          </div>
          <button
            onClick={() => { setEditingSlide(null); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-dark rounded-xl font-semibold text-sm transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Slide
          </button>
        </div>

        {/* Slides */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-2xl animate-pulse bg-dark-card" />)}
          </div>
        ) : slides?.length === 0 ? (
          <div className="bg-dark-card rounded-2xl border border-white/5 p-16 text-center">
            <ImageIcon className="w-16 h-16 mx-auto text-gray-700 mb-4" />
            <p className="text-gray-400 text-lg font-medium">No hero slides yet</p>
            <button onClick={() => { setEditingSlide(null); setShowForm(true); }}
              className="mt-6 px-6 py-3 bg-primary text-dark rounded-xl font-semibold inline-flex items-center gap-2">
              <Plus className="w-5 h-5" /> Create First Slide
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {slides?.map((slide, i) => (
              <InViewAnimate key={slide.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`relative h-56 rounded-2xl overflow-hidden border group transition-all
                    ${slide.is_active ? 'border-white/10' : 'border-white/5 opacity-60'}`}
                >
                  {/* Background */}
                  {slide.type === 'video' ? (
                    <video src={slide.media_url} poster={slide.thumbnail_url || undefined} className="w-full h-full object-cover" muted playsInline />
                  ) : (
                    <img src={slide.media_url} alt={slide.headline || 'Hero slide'} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

                  {/* Order Badge */}
                  <div className="absolute top-3 left-3 w-8 h-8 bg-black/60 backdrop-blur-md rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{slide.sort_order}</span>
                  </div>

                  {/* Active Badge */}
                  <div className="absolute top-3 right-3">
                    {slide.is_active ? (
                      <span className="px-2.5 py-1 bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] font-bold rounded-lg">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-gray-500/20 text-gray-400 border border-gray-500/30 text-[10px] font-bold rounded-lg">
                        HIDDEN
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
                    <div className="max-w-lg">
                      <h3 className="text-white font-bold text-xl mb-1">{slide.headline}</h3>
                      <p className="text-gray-300 text-sm line-clamp-1">{slide.subheadline}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="px-3 py-1.5 bg-primary text-dark text-xs font-bold rounded-lg">
                          {slide.cta_text}
                        </span>
                        <span className="text-gray-500 text-xs">{slide.cta_link}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingSlide(slide); setShowForm(true); }}
                        className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-xl transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this hero slide?')) deleteMutation.mutate(slide.id);
                        }}
                        className="p-2.5 bg-red-500/10 hover:bg-red-500/20 backdrop-blur-md text-red-400 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </InViewAnimate>
            ))}
          </div>
        )}

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <HeroFormModal
              slide={editingSlide}
              onClose={() => { setShowForm(false); setEditingSlide(null); }}
              onSave={(data) => {
                if (editingSlide) {
                  updateMutation.mutate({ id: editingSlide.id, ...data });
                } else {
                  createMutation.mutate(data);
                }
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
