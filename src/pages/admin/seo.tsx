// @ts-nocheck
/**
 * Admin SEO Settings - Global SEO Configuration
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Globe, Check, Save, AlertCircle, RefreshCw, Eye, Image as ImageIcon } from 'lucide-react';
import { PageTransition } from '@/components/ui/motion';
import { supabase } from '@/lib/supabase';

export default function AdminSEO() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    keywords: '',
    og_image: '',
  });

  const { data: seoData, isLoading } = useQuery({
    queryKey: ['admin-seo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'seo_global')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.value || {};
    },
  });

  useEffect(() => {
    if (seoData) {
      setFormData({
        title: seoData.title || '',
        description: seoData.description || '',
        keywords: seoData.keywords || '',
        og_image: seoData.og_image || '',
      });
    }
  }, [seoData]);

  const updateMutation = useMutation({
    mutationFn: async (newValue) => {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'seo_global', value: newValue }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-seo']);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const remainingTitle = 70 - formData.title.length;
  const remainingDesc = 160 - formData.description.length;

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Globe className="w-8 h-8 text-primary" />
            Global SEO Settings
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Configure the default search engine optimization tags for your website.
            These will be used if a specific page doesn't have its own SEO tags.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-dark-card rounded-2xl border border-white/5 p-6 space-y-6">

              {/* Title */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white">Default Meta Title</label>
                  <span className={`text-xs ${remainingTitle < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                    {remainingTitle} chars left
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Luxury Massage Bali — Premium Home Massage"
                />
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white">Default Meta Description</label>
                  <span className={`text-xs ${remainingDesc < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                    {remainingDesc} chars left
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  placeholder="Experience ultimate relaxation in Jimbaran, Bali..."
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Target Keywords</label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={e => setFormData(f => ({ ...f, keywords: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="luxury massage bali, home massage bali, balinese massage"
                />
                <p className="text-xs text-gray-500 mt-2">Comma separated values</p>
              </div>

              {/* Default OG Image URL */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Default Social Share Image (OG Image)</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={formData.og_image}
                    onChange={e => setFormData(f => ({ ...f, og_image: e.target.value }))}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="https://..."
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Use an image from your Media Library. Recommended 1200x630px.</p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                {updateMutation.isError && (
                  <span className="text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> Save failed
                  </span>
                )}
                {updateMutation.isSuccess && (
                  <span className="text-sm text-green-400 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Saved successfully
                  </span>
                )}
                <div className="flex-1" />
                <button
                  type="submit"
                  disabled={updateMutation.isPending || isLoading}
                  className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-dark font-semibold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {updateMutation.isPending ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </form>

          {/* Live Preview */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-gray-400" />
              Live Preview
            </h3>

            {/* Google Search Preview */}
            <div className="bg-white rounded-xl p-5 shadow-lg max-w-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <div>
                  <p className="text-[#202124] text-sm truncate">Luxury Massage Bali</p>
                  <p className="text-[#4d5156] text-xs truncate">https://luxurymassagebali.com</p>
                </div>
              </div>
              <h4 className="text-[#1a0dab] text-xl mb-1 hover:underline cursor-pointer truncate">
                {formData.title || 'Page Title'}
              </h4>
              <p className="text-[#4d5156] text-sm line-clamp-2">
                {formData.description || 'Page description will appear here in search results...'}
              </p>
            </div>

            {/* Twitter/X Card Preview */}
            <div className="bg-dark-lighter rounded-xl border border-white/10 overflow-hidden max-w-sm">
              <div className="aspect-[1.91/1] bg-dark-card border-b border-white/10 relative">
                {formData.og_image ? (
                  <img src={formData.og_image} alt="OG" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
              </div>
              <div className="p-4 bg-[#15202B]">
                <p className="text-gray-500 text-xs mb-1">luxurymassagebali.com</p>
                <h4 className="text-white font-bold mb-1 truncate">{formData.title || 'Page Title'}</h4>
                <p className="text-gray-500 text-sm line-clamp-2">
                  {formData.description || 'Page description...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
