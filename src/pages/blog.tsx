import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, PenLine } from 'lucide-react';
import { SEOHead } from '@/components/seo/seo-head';
import { supabase } from '@/lib/supabase';
import type { Article } from '@/lib/types';

async function fetchArticles(): Promise<readonly Article[]> {
  const { data, error } = await supabase.from('articles').select('id,title,slug,excerpt,cover_image,author,category,tags,status,seo_title,seo_description,og_image,schema_markup,published_at,created_at,updated_at,content').eq('status', 'published').order('published_at', { ascending: false }).range(0, 24);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export default function Blog() {
  const { data: articles = [], isLoading } = useQuery({ queryKey: ['public-articles'], queryFn: fetchArticles });
  return (
    <>
      <SEOHead pageSEO={{ path: '/blog', title: 'Wellness Journal — Luxury Massage Bali', description: 'Panduan massage, body care, facial, dan wellness dari Luxury Massage Bali.', ogImage: '' }} />
      <main className="min-h-screen bg-dark pt-28 pb-24 text-white">
        <section className="section-container">
          <div className="max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"><PenLine className="h-4 w-4" /> Blog & Artikel</span><h1 className="mt-6 font-heading text-5xl font-bold md:text-7xl">Panduan Spa, Beauty & Wellness</h1><p className="mt-5 text-lg text-gray-300">Konten artikel dinamis dari database dan bisa dikelola lewat dashboard admin.</p></div>
          {isLoading ? <div className="mt-12 grid gap-6 md:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-80 animate-pulse rounded-3xl bg-white/5" />)}</div> : articles.length === 0 ? <div className="mt-12 rounded-3xl border border-white/10 bg-dark-card p-10 text-center text-gray-400">Belum ada artikel published. Tambahkan dari Admin → Articles.</div> : <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{articles.map((article) => <article key={article.id} className="overflow-hidden rounded-3xl border border-white/10 bg-dark-card transition-all hover:-translate-y-1 hover:border-primary/40"><div className="h-52 bg-primary/10">{article.cover_image ? <img src={article.cover_image} alt={article.title} className="h-full w-full object-cover" loading="lazy" /> : null}</div><div className="p-6"><p className="text-xs font-bold uppercase tracking-widest text-primary">{article.category}</p><h2 className="mt-3 line-clamp-2 text-xl font-bold text-white">{article.title}</h2><p className="mt-3 line-clamp-3 text-sm text-gray-400">{article.excerpt}</p><div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5"><span className="flex items-center gap-2 text-xs text-gray-500"><Calendar className="h-4 w-4" /> {article.published_at?.slice(0, 10) ?? article.created_at.slice(0, 10)}</span><Link to={`/${article.slug}`} className="text-primary"><ArrowRight className="h-5 w-5" /></Link></div></div></article>)}</div>}
        </section>
      </main>
    </>
  );
}
