import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Globe2,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { JSONContent } from '@tiptap/react';
import toast from 'react-hot-toast';
import { RichTextEditor } from '@/components/ui/editor';
import { PageTransition, InViewAnimate } from '@/components/ui/motion';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { getSiteUrl } from '@/lib/seo';

interface PageRow {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly excerpt: string | null;
  readonly content: JSONContent | string | null;
  readonly seo_title: string | null;
  readonly seo_description: string | null;
  readonly is_published: boolean;
  readonly created_at?: string;
  readonly updated_at?: string;
}

type PageDraft = Omit<PageRow, 'id'> & { readonly id?: string };

const DRAFT_KEY = 'page-draft-new';
const emptyContent: JSONContent = { type: 'doc', content: [{ type: 'paragraph' }] };
const emptyPage: PageDraft = {
  title: '',
  slug: '',
  excerpt: '',
  content: emptyContent,
  seo_title: '',
  seo_description: '',
  is_published: false,
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const sanitizeContent = (content: JSONContent | string | null | undefined): JSONContent | string => {
  if (!content) return emptyContent;
  if (typeof content === 'object' && !content.type) return emptyContent;
  return content;
};

const getSeoScore = (page: PageDraft) => {
  const seoTitle = page.seo_title || page.title;
  const seoDescription = page.seo_description || page.excerpt || '';
  const checks = [
    page.title.trim().length >= 10,
    page.slug.trim().length >= 3,
    (page.excerpt || '').trim().length >= 50,
    seoTitle.length >= 35 && seoTitle.length <= 65,
    seoDescription.length >= 120 && seoDescription.length <= 165,
    page.is_published,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const copyToClipboard = async (value: string) => {
  await navigator.clipboard.writeText(value);
  toast.success('Disalin ke clipboard.', { id: 'page-copy' });
};

async function fetchPages(): Promise<readonly PageRow[]> {
  const { data, error } = await supabase.from('pages').select('*').order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

function SeoMeter({ label, value, min, max }: { label: string; value: string; min: number; max: number }) {
  const count = value.length;
  const good = count >= min && count <= max;
  const near = count > 0 && !good;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-gray-300">{label}</span>
        <span className={good ? 'text-emerald-300' : near ? 'text-amber-300' : 'text-gray-500'}>
          {count}/{max}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${good ? 'bg-emerald-400' : near ? 'bg-amber-400' : 'bg-gray-600'}`}
          style={{ width: `${Math.min(100, (count / max) * 100)}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] text-gray-500">Ideal {min}-{max} karakter.</p>
    </div>
  );
}

function PageForm({ page, onClose, onSave }: { page: PageDraft | null; onClose: () => void; onSave: (page: PageDraft) => void }) {
  const [form, setForm] = useState<PageDraft>(() => {
    if (page) return { ...emptyPage, ...page, content: sanitizeContent(page.content) };

    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as PageDraft;
        return { ...emptyPage, ...parsed, content: sanitizeContent(parsed.content) };
      } catch {
        return emptyPage;
      }
    }

    return emptyPage;
  });

  const seoTitle = form.seo_title || form.title;
  const seoDescription = form.seo_description || form.excerpt || '';
  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/${form.slug || slugify(form.title)}`;
  const seoScore = useMemo(() => getSeoScore(form), [form]);
  const schemaPreview = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      isPartOf: { '@type': 'WebSite', name: 'Luxury Massage Bali', url: siteUrl },
      publisher: { '@type': 'Organization', name: 'Luxury Massage Bali' },
    }),
    [canonicalUrl, seoDescription, seoTitle, siteUrl]
  );

  useEffect(() => {
    if (!page) localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form, page]);

  const handleSubmit = (publish: boolean) => {
    if (!form.title.trim()) {
      toast.error('Judul halaman wajib diisi.', { id: 'page-validation' });
      return;
    }

    const slug = form.slug || slugify(form.title);
    if (!slug) {
      toast.error('Slug belum valid.', { id: 'page-validation' });
      return;
    }

    onSave({
      ...form,
      slug,
      content: sanitizeContent(form.content),
      seo_title: form.seo_title || form.title,
      seo_description: form.seo_description || form.excerpt || '',
      is_published: publish,
    });
  };

  return (
    <PageTransition>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-dark-card shadow-2xl shadow-black/30">
        <div className="sticky top-0 z-10 flex flex-col gap-4 border-b border-white/10 bg-dark-card/90 p-4 backdrop-blur-xl sm:p-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <button
              id="page-editor-back"
              onClick={() => {
                if (!page && form.title && !confirm('Draft akan tetap tersimpan. Kembali ke list?')) return;
                onClose();
              }}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-300 transition hover:border-primary/40 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-white">{page?.id ? 'Edit Page' : 'Create Page'}</h1>
              <p className="mt-1 text-sm text-gray-500">Editor halaman lengkap: content, publish, SEO, canonical, schema preview.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!page && form.title ? (
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-bold text-primary">Draft Auto-Saved</span>
            ) : null}
            <button
              id="page-save-draft"
              type="button"
              onClick={() => handleSubmit(false)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Save Draft
            </button>
            <button
              id="page-publish"
              type="button"
              onClick={() => handleSubmit(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-dark transition hover:bg-primary/90"
            >
              <Save className="h-4 w-4" /> Publish Page
            </button>
          </div>
        </div>

        <div className="grid gap-8 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <main className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <label className="mb-2 block text-sm font-semibold text-gray-300">Page Title *</label>
              <input
                id="page-title"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value, slug: slugify(event.target.value) }))}
                placeholder="Contoh: Refund Policy Luxury Massage Bali"
                className="w-full rounded-2xl border border-white/10 bg-dark px-4 py-4 text-2xl font-black text-white outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
              />

              <label className="mb-2 mt-5 block text-sm font-semibold text-gray-300">Excerpt / Ringkasan</label>
              <textarea
                id="page-excerpt"
                value={form.excerpt ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))}
                placeholder="Ringkasan pendek untuk card, meta, dan hasil pencarian."
                rows={3}
                className="w-full resize-none rounded-2xl border border-white/10 bg-dark px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
              />
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-3 flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-300">Content Editor *</label>
                <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-bold text-gray-400">TipTap Rich Text</span>
              </div>
              <RichTextEditor content={form.content ?? emptyContent} onChange={(json) => setForm((current) => ({ ...current, content: json }))} />
            </section>
          </main>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-white">Publish Settings</h2>
                <span className={`rounded-full px-3 py-1 text-[11px] font-black ${form.is_published ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                  {form.is_published ? 'Published' : 'Draft'}
                </span>
              </div>

              <label className="mt-4 block text-xs font-semibold text-gray-500">URL Slug</label>
              <input
                id="page-slug"
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))}
                placeholder="refund-policy"
                className="mt-2 w-full rounded-xl border border-white/10 bg-dark px-3 py-3 text-sm text-white outline-none focus:border-primary/50"
              />
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-dark/70 p-3 text-xs text-gray-400">
                <Globe2 className="h-4 w-4 text-primary" />
                <span className="min-w-0 flex-1 truncate">{canonicalUrl}</span>
                <button type="button" onClick={() => copyToClipboard(canonicalUrl)} className="text-gray-300 hover:text-white">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-white">SEO 2026</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${seoScore >= 80 ? 'bg-emerald-500/15 text-emerald-300' : seoScore >= 50 ? 'bg-amber-500/15 text-amber-300' : 'bg-red-500/15 text-red-300'}`}>
                  {seoScore}%
                </span>
              </div>

              <label className="mt-4 block text-xs font-semibold text-gray-500">SEO Title</label>
              <input
                id="page-seo-title"
                value={form.seo_title ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, seo_title: event.target.value }))}
                placeholder="50-60 karakter"
                className="mt-2 w-full rounded-xl border border-white/10 bg-dark px-3 py-3 text-sm text-white outline-none focus:border-primary/50"
              />
              <div className="mt-3"><SeoMeter label="SEO Title" value={seoTitle} min={35} max={65} /></div>

              <label className="mt-4 block text-xs font-semibold text-gray-500">Meta Description</label>
              <textarea
                id="page-seo-description"
                value={form.seo_description ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, seo_description: event.target.value }))}
                placeholder="150-160 karakter"
                rows={4}
                className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-dark px-3 py-3 text-sm text-white outline-none focus:border-primary/50"
              />
              <div className="mt-3"><SeoMeter label="Description" value={seoDescription} min={120} max={165} /></div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-primary/10 to-emerald-500/5 p-5">
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-bold">SERP Preview</h2>
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-dark/80 p-4">
                <p className="truncate text-xs text-emerald-300">{canonicalUrl}</p>
                <p className="mt-1 line-clamp-1 text-base font-semibold text-blue-300">{seoTitle || 'SEO title preview'}</p>
                <p className="mt-1 line-clamp-3 text-sm text-gray-400">{seoDescription || 'Meta description preview akan tampil di sini.'}</p>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="font-bold text-white">Schema Preview</h2>
              <pre className="mt-3 max-h-56 overflow-auto rounded-2xl bg-black/30 p-4 text-[11px] leading-relaxed text-gray-400">{JSON.stringify(schemaPreview, null, 2)}</pre>
            </section>
          </aside>
        </div>
      </div>
    </PageTransition>
  );
}

export default function AdminPages() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [selected, setSelected] = useState<PageDraft | null>(null);
  const [isEditing, setIsEditing] = useState(() => !!localStorage.getItem(DRAFT_KEY));
  const { data: pages = [], isLoading } = useQuery({ queryKey: ['admin-pages'], queryFn: fetchPages });

  const saveMutation = useMutation({
    mutationFn: async (page: PageDraft) => {
      const payload = {
        title: page.title,
        slug: page.slug || slugify(page.title),
        excerpt: page.excerpt,
        content: sanitizeContent(page.content),
        seo_title: page.seo_title || page.title,
        seo_description: page.seo_description || page.excerpt || '',
        is_published: page.is_published,
      };

      if (page.id) {
        const { error } = await supabase.from('pages').update(payload).eq('id', page.id);
        if (error) throw new Error(error.message);
        return { ...payload, id: page.id };
      }

      const { data, error } = await supabase.from('pages').insert(payload).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onMutate: () => {
      toast.loading('Menyimpan halaman...', { id: 'page-save' });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-pages'] });
      localStorage.removeItem(DRAFT_KEY);
      setSelected(null);
      setIsEditing(false);
      toast.success(data.is_published ? 'Halaman berhasil dipublish.' : 'Halaman disimpan sebagai draft.', { id: 'page-save' });
    },
    onError: (error) => {
      toast.error(`Gagal menyimpan: ${error.message}`, { id: 'page-save' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pages').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onMutate: () => toast.loading('Menghapus halaman...', { id: 'page-delete' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pages'] });
      toast.success('Halaman telah dihapus.', { id: 'page-delete' });
    },
    onError: (error) => toast.error(`Gagal menghapus: ${error.message}`, { id: 'page-delete' }),
  });

  const filteredPages = pages.filter((page) => {
    const matchesSearch = !search || page.title.toLowerCase().includes(search.toLowerCase()) || page.slug.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'published' ? page.is_published : !page.is_published);
    return matchesSearch && matchesFilter;
  });

  if (isEditing) {
    return (
      <PageForm
        page={selected}
        onClose={() => {
          setSelected(null);
          setIsEditing(false);
        }}
        onSave={(page) => saveMutation.mutate(page)}
      />
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">Pages</h1>
            <p className="mt-2 text-sm text-gray-400">CMS halaman statis dengan rich editor, SEO preview, canonical URL, dan schema preview.</p>
          </div>
          <button
            id="page-new"
            onClick={() => {
              setSelected(null);
              setIsEditing(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-dark transition hover:bg-primary/90"
          >
            <Plus className="h-5 w-5" /> New Page
          </button>
        </header>

        <section className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-dark-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              id="page-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search pages..."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-primary/50"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'published', 'draft'] as const).map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold capitalize transition ${filter === item ? 'bg-primary text-dark' : 'border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-56 animate-pulse rounded-3xl bg-dark-card" />)}
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-dark-card p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-600" />
            <p className="mt-4 text-gray-400">Belum ada halaman sesuai filter.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredPages.map((page, index) => {
              const score = getSeoScore({ ...page, content: page.content ?? emptyContent });
              return (
                <InViewAnimate key={page.id}>
                  <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-dark-card p-5 transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="rounded-2xl bg-primary/10 p-3 text-primary"><FileText className="h-6 w-6" /></div>
                      <div className="flex gap-2">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-black ${page.is_published ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                          {page.is_published ? 'Published' : 'Draft'}
                        </span>
                        <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-black text-gray-300">SEO {score}%</span>
                      </div>
                    </div>

                    <h2 className="mt-5 line-clamp-2 text-xl font-black text-white">{page.title}</h2>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-gray-400">{page.excerpt || 'Tidak ada excerpt.'}</p>
                    <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-xs text-gray-500">
                      <div className="flex items-center gap-2"><Globe2 className="h-3.5 w-3.5" />/{page.slug}</div>
                      {page.updated_at ? <div>Updated {formatDate(page.updated_at)}</div> : null}
                    </div>

                    <div className="mt-5 flex gap-2">
                      <a
                        href={`/${page.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-gray-300 transition hover:text-white"
                        title="Open page"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => {
                          setSelected({ ...page, content: sanitizeContent(page.content) });
                          setIsEditing(true);
                        }}
                        className="flex-1 rounded-xl bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus halaman "${page.title}"?`)) deleteMutation.mutate(page.id);
                        }}
                        className="rounded-xl bg-red-500/10 px-4 py-3 text-red-400 transition hover:bg-red-500/20"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.article>
                </InViewAnimate>
              );
            })}
          </div>
        )}

        <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-500/10 to-primary/10 p-5 text-sm text-gray-300">
          <div className="flex items-start gap-3">
            {filteredPages.every((page) => getSeoScore({ ...page, content: page.content ?? emptyContent }) >= 80) ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" /> : <AlertCircle className="mt-0.5 h-5 w-5 text-amber-300" />}
            <p>SEO score mengecek title, slug, excerpt, meta title, meta description, dan status publish. Canonical + schema preview otomatis dari URL halaman.</p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
