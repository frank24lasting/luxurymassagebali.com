/**
 * Admin Popup Flyer Configuration
 * Setup A4-sized promotional popup that appears on public homepage
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Eye, EyeOff, FileImage, Sparkles, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { MediaPickerButton } from '@/components/ui/media-picker';

interface PopupConfig {
  image_url: string;
  is_active: boolean;
  link_url: string;
  title?: string;
}

const DEFAULT_CONFIG: PopupConfig = {
  image_url: '',
  is_active: false,
  link_url: '',
  title: 'Special Promo',
};

// Preview Popup Component (same animation as public)
function PreviewPopup({ config, onClose }: { config: PopupConfig; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      onClick={onClose}
    >
      {/* Sparkle particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              scale: 0,
              opacity: 0 
            }}
            animate={{ 
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{ 
              duration: 2,
              delay: i * 0.1,
              repeat: Infinity,
              repeatDelay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.3, opacity: 0, rotateY: -30 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        exit={{ scale: 0.3, opacity: 0, rotateY: 30 }}
        transition={{ 
          type: 'spring', 
          damping: 20, 
          stiffness: 200,
          mass: 0.8,
        }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md aspect-[1/1.4] rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(168,200,186,0.4)]"
      >
        {/* Glow effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 via-secondary/30 to-primary/30 blur-2xl opacity-60" />
        
        {/* Image */}
        {config.image_url ? (
          <img 
            src={config.image_url} 
            alt="Promo Flyer" 
            className="relative w-full h-full object-cover rounded-3xl"
          />
        ) : (
          <div className="relative w-full h-full bg-dark-card rounded-3xl flex items-center justify-center">
            <FileImage className="w-16 h-16 text-gray-600" />
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-primary hover:text-dark transition-colors shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
        />
      </motion.div>
    </motion.div>
  );
}

export default function AdminPopupFlyer() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<PopupConfig>(DEFAULT_CONFIG);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch current popup config
  const { data, isLoading } = useQuery({
    queryKey: ['promo-popup-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'promo_popup')
        .maybeSingle();
      if (error) throw error;
      return (data?.value as PopupConfig) ?? DEFAULT_CONFIG;
    },
  });

  // Update local state when data loads
  useEffect(() => {
    if (data) setConfig(data);
  }, [data]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'promo_popup', value: config }, { onConflict: 'key' });
      if (error) throw error;
    },
    onMutate: () => toast.loading('Saving popup config...', { id: 'popup-save' }),
    onSuccess: () => {
      toast.success('Popup flyer saved!', { id: 'popup-save' });
      queryClient.invalidateQueries({ queryKey: ['promo-popup-config'] });
      queryClient.invalidateQueries({ queryKey: ['promo-popup-public'] });
    },
    onError: (err) => toast.error(err.message, { id: 'popup-save' }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Popup Flyer</h1>
          <p className="mt-2 text-sm text-gray-400">
            Setup A4 promotional popup yang tampil di homepage public.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-dark"
          >
            <Eye className="h-4 w-4" /> Preview
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-dark transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {saveMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-3xl border border-primary/20 bg-primary/10 p-5">
        <Sparkles className="h-6 w-6 text-primary" />
        <p className="mt-3 text-sm leading-6 text-gray-300">
          Popup akan tampil <strong>sekali per sesi</strong> ketika user mengunjungi homepage.
          Gunakan gambar A4 (portrait) untuk hasil terbaik. Animasi 3D spring dengan shimmer dan sparkle particles.
        </p>
      </div>

      {isLoading ? (
        <div className="h-80 animate-pulse rounded-3xl bg-white/5" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Image Config */}
          <div className="rounded-3xl border border-white/10 bg-dark-card p-6 space-y-5">
            <h2 className="font-black text-white">Flyer Image</h2>
            
            {/* Preview */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 aspect-[1/1.4]">
              {config.image_url ? (
                <img src={config.image_url} alt="Flyer preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                  <FileImage className="w-12 h-12 mb-3" />
                  <p className="text-sm">No image selected</p>
                </div>
              )}
            </div>

            {/* Image URL Input */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">
                Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.image_url}
                  onChange={(e) => setConfig(c => ({ ...c, image_url: e.target.value }))}
                  placeholder="https://..."
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500"
                />
                <MediaPickerButton
                  onSelect={(url) => setConfig(c => ({ ...c, image_url: url }))}
                  className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-dark"
                >
                  Media
                </MediaPickerButton>
              </div>
              <p className="text-[10px] text-gray-600">
                Recommended: A4 portrait (210×297mm / 794×1123px @72dpi)
              </p>
            </div>
          </div>

          {/* Settings */}
          <div className="rounded-3xl border border-white/10 bg-dark-card p-6 space-y-5">
            <h2 className="font-black text-white">Settings</h2>

            {/* Title */}
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Popup Title (optional)
              </span>
              <input
                type="text"
                value={config.title || ''}
                onChange={(e) => setConfig(c => ({ ...c, title: e.target.value }))}
                placeholder="Special Promo"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500"
              />
            </label>

            {/* Link URL */}
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Link URL (optional)
              </span>
              <input
                type="text"
                value={config.link_url}
                onChange={(e) => setConfig(c => ({ ...c, link_url: e.target.value }))}
                placeholder="/services/promo"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500"
              />
              <p className="mt-2 text-[10px] text-gray-600">
                User akan diarahkan ke link ini saat klik gambar popup
              </p>
            </label>

            {/* Active Toggle */}
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5">
              <div>
                <p className="font-bold text-white">Aktifkan Popup</p>
                <p className="text-xs text-gray-500">Tampilkan di homepage public</p>
              </div>
              <button
                onClick={() => setConfig(c => ({ ...c, is_active: !c.is_active }))}
                className={`relative h-7 w-14 rounded-full transition-colors ${
                  config.is_active ? 'bg-primary' : 'bg-gray-700'
                }`}
              >
                <motion.div
                  className="absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-lg"
                  animate={{ x: config.is_active ? 28 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Status */}
            <div className={`rounded-2xl p-4 ${
              config.is_active 
                ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                : 'bg-gray-500/10 border border-gray-500/20 text-gray-400'
            }`}>
              <div className="flex items-center gap-2">
                {config.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span className="text-sm font-bold">
                  {config.is_active ? 'Popup AKTIF - Tampil di homepage' : 'Popup NONAKTIF - Tidak tampil'}
                </span>
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Tips</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Gunakan gambar portrait (vertikal) untuk A4</li>
                <li>• Kompres gambar untuk load cepat (&lt;500KB)</li>
                <li>• Teks penting di tengah gambar</li>
                <li>• Preview sebelum publish</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <PreviewPopup config={config} onClose={() => setShowPreview(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
