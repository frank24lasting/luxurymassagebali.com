// @ts-nocheck
/**
 * Admin Articles - Blog post CRUD with TipTap WYSIWYG
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, Search, Edit, Trash2, X, Upload,
  Image as ImageIcon, AlertCircle,
  Calendar, ArrowLeft
} from 'lucide-react';
import { PageTransition, InViewAnimate } from '@/components/ui/motion';
import { supabase } from '@/lib/supabase';
import { uploadToCloudinary, formatDate } from '@/lib/utils';
import { RichTextEditor } from '@/components/ui/editor';
import { MediaPickerButton } from '@/components/ui/media-picker';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

// Article Form
function ArticleForm({ article, onClose, onSave }) {
  const sanitizeContent = (content: any) => {
    if (!content) return '';
    if (typeof content === 'object' && !content.type && !Array.isArray(content)) return '';
    return content;
  };

  const getInitialFormState = (articleData: any) => {
    const defaultForm = {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      cover_image: '',
      category: 'General',
      status: 'draft',
      seo_title: '',
      seo_description: '',
      og_image: '',
      schema_markup: {
        focus_keyword: '',
        canonical_url: '',
        robots: 'index, follow',
        ai_summary: '',
        og_title: '',
        og_description: '',
        twitter_title: '',
        twitter_description: '',
        structured_data_type: 'BlogPosting',
      },
    };

    if (articleData) {
      return {
        ...defaultForm,
        ...articleData,
        content: sanitizeContent(articleData.content),
        schema_markup: {
          ...defaultForm.schema_markup,
          ...(articleData.schema_markup || {}),
        },
      };
    }

    const saved = localStorage.getItem('article-draft-new');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...defaultForm,
            ...parsed,
            content: sanitizeContent(parsed.content),
          };
        }
      } catch { }
    }

    return defaultForm;
  };

  const [form, setForm] = useState(() => getInitialFormState(article));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Sync state when editing a different article
  useEffect(() => {
    if (article) {
      setForm(getInitialFormState(article));
    }
  }, [article]);

  // Auto-save draft for new articles
  useEffect(() => {
    if (!article) {
      localStorage.setItem('article-draft-new', JSON.stringify(form));
    }
  }, [form, article]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const url = await uploadToCloudinary(file, 'luxury-massage-bali/articles');
      setForm(f => ({ ...f, cover_image: url }));
    } catch (err) {
      setError('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSlugify = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleSubmit = (statusOverride) => {
    const slug = form.slug || handleSlugify(form.title);

    // Auto-generate SEO fields if empty
    const seo_title = form.seo_title || form.title;
    const seo_description = form.seo_description || form.excerpt;
    const status = statusOverride || form.status || 'draft';

    onSave({ ...form, slug, status, seo_title, seo_description });
  };

  return (
    <PageTransition>
      <div className="bg-dark-card rounded-2xl border border-white/5 overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-dark-card/90 backdrop-blur-xl border-b border-white/5 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => {
              if (!article && form.title && !confirm('Draft akan tetap tersimpan. Kembali ke list?')) return;
              onClose();
            }} className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white">{article ? 'Edit Article' : 'Write New Article'}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm text-gray-500">Publish amazing content for SEO</p>
                {!article && form.title && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                    Draft Auto-Saved
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleSubmit('draft')}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('published')}
              className="rounded-xl bg-primary px-5 py-2 text-sm font-black text-dark transition-colors hover:bg-primary/90"
            >
              Publish Article
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Main Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Content */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: handleSlugify(e.target.value) }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-lg"
                  placeholder="Enter article title..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Excerpt (Summary)</label>
                <textarea
                  rows={3}
                  value={form.excerpt}
                  onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  placeholder="Brief summary for cards and SEO..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Content Editor *</label>
                <RichTextEditor
                  content={form.content}
                  onChange={(json) => setForm(f => ({ ...f, content: json }))}
                />
              </div>
            </div>

            {/* Right: Meta */}
            <div className="space-y-6">
              {/* Cover Image - WordPress Style */}
              <div className="bg-dark-lighter rounded-2xl border border-white/5 p-5">
                <label className="block text-sm font-semibold text-white mb-4">Cover Image</label>
                {form.cover_image ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 group mb-3">
                    <img src={form.cover_image} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, cover_image: '' }))}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-video rounded-xl border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center mb-3">
                    <ImageIcon className="w-8 h-8 text-gray-600" />
                  </div>
                )}
                <div className="flex gap-2">
                  <MediaPickerButton
                    onSelect={(url) => setForm(f => ({ ...f, cover_image: url }))}
                    className="flex-1 px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-xl text-sm text-white transition-all flex items-center justify-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4 text-gray-400" />
                    Browse Library
                  </MediaPickerButton>
                  <label className="flex-1 px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-xl text-sm text-white transition-all flex items-center justify-center gap-2 cursor-pointer">
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
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
                <p className="text-[10px] text-gray-600 mt-2">16:9 Aspect Ratio · Auto WebP · Max 20MB</p>
              </div>

              {/* Meta Data */}
              <div className="bg-dark-lighter rounded-2xl border border-white/5 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white">Post Settings</h3>

                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  >
                    <option value="General">General</option>
                    <option value="Wellness">Wellness Tips</option>
                    <option value="Beauty">Beauty</option>
                    <option value="News">News & Updates</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">URL Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              {/* SEO Data */}
              <div className="bg-dark-lighter rounded-2xl border border-white/5 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white">SEO 2026 + AI Search</h3>

                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">SEO Title</label>
                  <input type="text" value={form.seo_title} onChange={e => setForm(f => ({ ...f, seo_title: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white" placeholder="50-60 characters" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Meta Description</label>
                  <textarea rows={3} value={form.seo_description} onChange={e => setForm(f => ({ ...f, seo_description: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white resize-none" placeholder="150-160 characters" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">OG Image</label>
                  <div className="flex gap-2"><input type="text" value={form.og_image} onChange={e => setForm(f => ({ ...f, og_image: e.target.value }))} className="min-w-0 flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white" placeholder="Social share image URL" /><MediaPickerButton onSelect={(url) => setForm(f => ({ ...f, og_image: url }))} className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-dark">Media</MediaPickerButton></div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Focus Keyword</label>
                  <input type="text" value={form.schema_markup?.focus_keyword || ''} onChange={e => setForm(f => ({ ...f, schema_markup: { ...f.schema_markup, focus_keyword: e.target.value } }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white" placeholder="balinese massage bali" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Canonical URL</label>
                  <input type="text" value={form.schema_markup?.canonical_url || ''} onChange={e => setForm(f => ({ ...f, schema_markup: { ...f.schema_markup, canonical_url: e.target.value } }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white" placeholder="https://luxurymassagebali.com/blog/slug" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">AI Search Summary</label>
                  <textarea rows={3} value={form.schema_markup?.ai_summary || ''} onChange={e => setForm(f => ({ ...f, schema_markup: { ...f.schema_markup, ai_summary: e.target.value } }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white resize-none" placeholder="Ringkasan faktual agar AI search memahami artikel ini." />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Robots</label>
                  <select value={form.schema_markup?.robots || 'index, follow'} onChange={e => setForm(f => ({ ...f, schema_markup: { ...f.schema_markup, robots: e.target.value } }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"><option value="index, follow">index, follow</option><option value="noindex, follow">noindex, follow</option><option value="index, nofollow">index, nofollow</option></select>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

// Main Articles Page
export default function AdminArticles() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingArticle, setEditingArticle] = useState(null);

  // Restore isWriting state if a draft exists
  const [isWriting, setIsWriting] = useState(() => {
    return !!localStorage.getItem('article-draft-new');
  });

  const queryClient = useQueryClient();

  // Recovery: refresh data when tab becomes visible again
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [queryClient]);

  const { data: articles, isLoading } = useQuery({
    queryKey: ['admin-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newArticle) => {
      const { data, error } = await supabase.from('articles').insert({
        ...newArticle,
        published_at: newArticle.status === 'published' ? new Date().toISOString() : null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onMutate: () => {
      toast.loading('Menyimpan artikel...', {
        id: 'article-save',
        style: { background: 'linear-gradient(135deg, #102018, #1f3b2e)', color: '#fff', border: '1px solid rgba(168,200,186,0.4)', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['admin-articles']);
      setIsWriting(false);
      localStorage.removeItem('article-draft-new');
      toast.success(
        data.status === 'published' ? '\u2728 Artikel berhasil di-publish!' : '\uD83D\uDCDD Artikel disimpan sebagai draft.',
        {
          id: 'article-save',
          duration: 4000,
          icon: data.status === 'published' ? '\uD83C\uDF3F' : '\uD83D\uDCDD',
          style: { background: 'linear-gradient(135deg, #102018, #1f3b2e)', color: '#fff', border: '1px solid rgba(168,200,186,0.6)', borderRadius: '20px', boxShadow: '0 20px 60px rgba(16,185,129,0.2)' },
        }
      );
    },
    onError: (err) => {
      toast.error('Gagal menyimpan: ' + err.message, {
        id: 'article-save',
        style: { background: 'linear-gradient(135deg, #2a1212, #111827)', color: '#fff', border: '1px solid rgba(248,113,113,0.5)', borderRadius: '20px' },
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { error } = await supabase.from('articles').update({
        ...updates,
        published_at: updates.status === 'published' && !updates.published_at ? new Date().toISOString() : updates.published_at,
      }).eq('id', id);
      if (error) throw error;
    },
    onMutate: () => {
      toast.loading('Memperbarui artikel...', {
        id: 'article-save',
        style: { background: 'linear-gradient(135deg, #102018, #1f3b2e)', color: '#fff', border: '1px solid rgba(168,200,186,0.4)', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-articles']);
      setEditingArticle(null);
      setIsWriting(false);
      toast.success('\u2728 Artikel berhasil diperbarui!', {
        id: 'article-save',
        duration: 4000,
        icon: '\uD83C\uDF3F',
        style: { background: 'linear-gradient(135deg, #102018, #1f3b2e)', color: '#fff', border: '1px solid rgba(168,200,186,0.6)', borderRadius: '20px', boxShadow: '0 20px 60px rgba(16,185,129,0.2)' },
      });
    },
    onError: (err) => {
      toast.error('Gagal memperbarui: ' + err.message, {
        id: 'article-save',
        style: { background: 'linear-gradient(135deg, #2a1212, #111827)', color: '#fff', border: '1px solid rgba(248,113,113,0.5)', borderRadius: '20px' },
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('articles').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: () => {
      toast.loading('Menghapus artikel...', {
        id: 'article-delete',
        style: { background: 'linear-gradient(135deg, #2a1212, #111827)', color: '#fff', border: '1px solid rgba(248,113,113,0.4)', borderRadius: '20px' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-articles']);
      toast.success('Artikel telah dihapus.', {
        id: 'article-delete',
        duration: 3000,
        icon: '\uD83D\uDDD1\uFE0F',
        style: { background: 'linear-gradient(135deg, #2a1212, #111827)', color: '#fff', border: '1px solid rgba(248,113,113,0.5)', borderRadius: '20px' },
      });
    },
    onError: (err) => {
      toast.error('Gagal menghapus: ' + err.message, {
        id: 'article-delete',
        style: { background: 'linear-gradient(135deg, #2a1212, #111827)', color: '#fff', border: '1px solid rgba(248,113,113,0.5)', borderRadius: '20px' },
      });
    },
  });

  const filteredArticles = articles?.filter(art => {
    const matchesSearch = !search || art.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || art.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (isWriting) {
    return (
      <ArticleForm
        article={editingArticle}
        onClose={() => { setIsWriting(false); setEditingArticle(null); }}
        onSave={(data) => {
          if (editingArticle) {
            updateMutation.mutate({ id: editingArticle.id, ...data });
          } else {
            createMutation.mutate(data);
          }
        }}
      />
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Articles</h1>
            <p className="text-gray-400 text-sm mt-1">Manage blog posts and SEO content</p>
          </div>
          <button
            onClick={() => { setEditingArticle(null); setIsWriting(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-dark rounded-xl font-semibold text-sm transition-colors"
          >
            <Plus className="w-5 h-5" />
            Write Article
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'published', 'draft'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 text-sm font-medium rounded-xl capitalize transition-colors ${filter === f
                  ? 'bg-primary text-dark'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-dark-card rounded-2xl animate-pulse" />)}
          </div>
        ) : filteredArticles?.length === 0 ? (
          <div className="bg-dark-card rounded-2xl border border-white/5 p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No articles found.</p>
            <button
              onClick={() => { setEditingArticle(null); setIsWriting(true); }}
              className="mt-4 text-primary hover:underline text-sm font-semibold"
            >
              Write your first post
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredArticles?.map((art, i) => (
              <InViewAnimate key={art.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-dark-card rounded-2xl border border-white/5 overflow-hidden group hover:border-white/10 transition-colors flex flex-col h-full"
                >
                  <div className="relative aspect-[16/9] bg-dark-lighter">
                    {art.cover_image ? (
                      <img src={art.cover_image} alt={art.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-700" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
                        {art.category}
                      </span>
                      <span className={`px-2.5 py-1 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-wider ${art.status === 'published' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                        {art.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">{art.title}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-1">{art.excerpt}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(art.created_at)}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingArticle(art); setIsWriting(true); }}
                          className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this article?')) {
                              deleteMutation.mutate(art.id);
                            }
                          }}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </InViewAnimate>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
