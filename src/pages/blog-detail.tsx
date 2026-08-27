import { useEffect, useMemo, type ReactNode, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Calendar, CheckCircle2, Clock, ExternalLink, Link2, MessageCircle, Quote, Share2, Sparkles, User } from 'lucide-react';
import { SEOHead } from '@/components/seo/seo-head';
import { supabase } from '@/lib/supabase';
import { getSiteUrl } from '@/lib/seo';
import { useContactSettings } from '@/lib/contact';
import type { Article, Service } from '@/lib/types';
import DynamicPage from '@/pages/dynamic-page';

interface RichNode {
  readonly type?: string;
  readonly text?: string;
  readonly content?: readonly RichNode[];
  readonly attrs?: Record<string, unknown>;
  readonly marks?: readonly { readonly type?: string; readonly attrs?: Record<string, unknown> }[];
}

interface RelatedArticle {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly excerpt: string;
  readonly cover_image: string | null;
  readonly category: string;
  readonly published_at: string | null;
  readonly created_at: string;
}

async function fetchArticle(slug: string): Promise<Article | null> {
  const { data, error } = await supabase.from('articles').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function fetchRelated(category: string, slug: string): Promise<readonly RelatedArticle[]> {
  const { data, error } = await supabase.from('articles').select('id,title,slug,excerpt,cover_image,category,published_at,created_at').eq('status', 'published').eq('category', category).neq('slug', slug).order('published_at', { ascending: false }).range(0, 2);
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function fetchRelatedServices(): Promise<readonly Service[]> {
  const { data, error } = await supabase.from('services').select('*').eq('is_active', true).order('sort_order').range(0, 3);
  if (error) throw new Error(error.message);
  return data ?? [];
}

function extractText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const item = node as RichNode;
  const own = item.text ?? '';
  const children = item.content?.map(extractText).join(' ') ?? '';
  return `${own} ${children}`.replace(/\s+/g, ' ').trim();
}

function collectHeadings(node: unknown, list: string[] = []): string[] {
  if (!node || typeof node !== 'object') return list;
  const item = node as RichNode;
  if (item.type === 'heading') list.push(extractText(item));
  item.content?.forEach((child) => collectHeadings(child, list));
  return list;
}

function readingMinutes(text: string): number {
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 220));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}

function renderInline(node: RichNode, key: string): ReactNode {
  if (node.type === 'text') {
    let element: ReactNode = node.text ?? '';
    node.marks?.forEach((mark) => {
      if (mark.type === 'bold') element = <strong key={`${key}-bold`} className="font-black text-white">{element}</strong>;
      if (mark.type === 'italic') element = <em key={`${key}-italic`} className="text-primary/90">{element}</em>;
      if (mark.type === 'strike') element = <s key={`${key}-strike`} className="line-through text-gray-400">{element}</s>;
      if (mark.type === 'link') element = <a key={`${key}-link`} href={String(mark.attrs?.href ?? '#')} target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline decoration-primary/40 underline-offset-4 hover:text-white transition-colors">{element}</a>;
    });
    return element;
  }
  return node.content?.map((child, index) => renderInline(child, `${key}-${index}`));
}

function renderNode(node: RichNode, index: number): ReactNode {
  const children = node.content?.map((child, childIndex) => renderInline(child, `${index}-${childIndex}`));

  if (node.type === 'heading') {
    const level = Number(node.attrs?.level ?? 2);
    const text = extractText(node);
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (level === 1) return <h2 key={index} id={id} className="mt-10 font-heading text-3xl font-black tracking-[-0.03em] text-white md:text-4xl">{children}</h2>;
    if (level === 2) return <h2 key={index} id={id} className="mt-10 font-heading text-2xl font-bold tracking-[-0.02em] text-white md:text-3xl">{children}</h2>;
    if (level === 3) return <h3 key={index} id={id} className="mt-8 font-heading text-xl font-bold text-white md:text-2xl">{children}</h3>;
    if (level === 4) return <h4 key={index} id={id} className="mt-6 font-heading text-lg font-bold text-white">{children}</h4>;
    if (level === 5) return <h5 key={index} id={id} className="mt-5 font-heading text-base font-semibold text-white">{children}</h5>;
    if (level === 6) return <h6 key={index} id={id} className="mt-4 font-heading text-sm font-semibold uppercase tracking-wider text-primary">{children}</h6>;
    return <h2 key={index} id={id} className="mt-10 font-heading text-2xl font-bold tracking-[-0.02em] text-white md:text-3xl">{children}</h2>;
  }

  if (node.type === 'image') {
    const src = String(node.attrs?.src ?? '');
    const alt = String(node.attrs?.alt ?? 'Gambar artikel');
    const title = node.attrs?.title ? String(node.attrs.title) : '';
    if (!src) return null;

    return (
      <figure key={index} className="my-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] shadow-lg">
        <img
          src={src}
          alt={alt}
          className="w-full h-auto object-cover max-h-[550px] rounded-xl"
          loading="lazy"
        />
        {Boolean(title) && (
          <figcaption className="p-3 text-center text-xs text-gray-400">
            {title}
          </figcaption>
        )}
      </figure>
    );
  }

  if (node.type === 'horizontalRule') {
    return <hr key={index} className="my-8 border-white/10" />;
  }

  if (node.type === 'bulletList') return <ul key={index} className="my-6 space-y-3 pl-0">{node.content?.map((child, i) => renderNode(child, i))}</ul>;
  if (node.type === 'orderedList') return <ol key={index} className="my-6 list-decimal space-y-3 pl-6 marker:text-primary">{node.content?.map((child, i) => renderNode(child, i))}</ol>;
  if (node.type === 'listItem') return <li key={index} className="flex gap-3 text-gray-300"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" /><span>{node.content?.map((child, i) => renderInline(child, `${index}-li-${i}`))}</span></li>;
  if (node.type === 'blockquote') return <blockquote key={index} className="my-8 rounded-3xl border border-primary/20 bg-primary/10 p-6 text-xl font-semibold text-white"><Quote className="mb-3 h-7 w-7 text-primary" />{children}</blockquote>;
  if (node.type === 'paragraph') return <p key={index} className="my-5 text-base leading-8 text-gray-300 md:text-lg md:leading-9">{children}</p>;
  return <div key={index}>{children}</div>;
}

function BacaJuga({ articles }: { readonly articles: readonly RelatedArticle[] }) {
  if (!articles.length) return null;
  return (
    <div className="my-8 rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-primary"><BookOpen className="h-4 w-4" /> Baca Juga</h3>
      <div className="mt-3 space-y-2">
        {articles.slice(0, 2).map((a) => (
          <Link key={a.id} to={`/${a.slug}`} className="group flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-white/5">
            <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-primary opacity-50 group-hover:opacity-100" />
            <div>
              <p className="text-sm font-bold text-white group-hover:text-primary">{a.title}</p>
              <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{a.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RelatedServicesBox({ services }: { readonly services: readonly Service[] }) {
  if (!services.length) return null;
  return (
    <div className="my-8 rounded-2xl border border-white/10 bg-dark-card p-5">
      <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-primary"><Sparkles className="h-4 w-4" /> Layanan Terkait</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {services.map((s) => (
          <Link key={s.id} to={`/services/${s.slug}`} className="group flex gap-3 rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10">
            {s.image_url && <img src={s.image_url} alt={s.name} className="h-14 w-14 shrink-0 rounded-lg object-cover" />}
            <div className="min-w-0">
              <p className="text-sm font-bold text-white group-hover:text-primary">{s.name}</p>
              <p className="mt-0.5 text-xs text-gray-500">{s.category}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function TukangWebsitePromo() {
  return (
    <div className="mt-10 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6 text-center">
      <p className="text-sm text-gray-400">Ingin membuat website seperti ini atau lebih canggih?</p>
      <p className="mt-2 text-base font-bold text-white">Hubungi <a href="https://wa.me/628990090802" target="_blank" rel="noreferrer" className="text-primary hover:underline">TUKANGBUATWEBSITEBALI</a></p>
      <a href="https://wa.me/628990090802" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-dark"><MessageCircle className="h-4 w-4" /> Chat via WhatsApp</a>
    </div>
  );
}

function RichArticleContent({ content, relatedArticles, services }: { readonly content: Record<string, unknown>; readonly relatedArticles: readonly RelatedArticle[]; readonly services: readonly Service[] }) {
  const doc = content as RichNode;
  const nodes = doc.content ?? [];
  if (!nodes.length) return <p className="text-gray-400">Konten belum tersedia.</p>;

  return (
    <>
      {nodes.map((node, index) => {
        const isParagraph = node.type === 'paragraph';
        const paragraphIndex = isParagraph ? nodes.slice(0, index).filter((n) => n.type === 'paragraph').length : -1;

        return (
          <Fragment key={index}>
            {renderNode(node, index)}
            {isParagraph && paragraphIndex === 1 && <BacaJuga articles={relatedArticles} />}
            {isParagraph && paragraphIndex === 3 && <RelatedServicesBox services={services} />}
          </Fragment>
        );
      })}
    </>
  );
}

export default function BlogDetail() {
  const { slug = '' } = useParams();
  const { getWhatsAppUrl } = useContactSettings();
  const { data: article, isLoading } = useQuery({ queryKey: ['article', slug], queryFn: () => fetchArticle(slug), enabled: slug.length > 0 });
  const { data: related = [] } = useQuery({ queryKey: ['related-articles', article?.category, slug], queryFn: () => fetchRelated(article?.category ?? '', slug), enabled: Boolean(article?.category) });
  const { data: services = [] } = useQuery({ queryKey: ['related-services'], queryFn: () => fetchRelatedServices() });
  const text = useMemo(() => extractText(article?.content), [article?.content]);
  const headings = useMemo(() => collectHeadings(article?.content).slice(0, 10), [article?.content]);
  const shareUrl = article ? `${getSiteUrl()}/${article.slug}` : '';
  const publishedDate = article?.published_at ?? article?.created_at ?? new Date().toISOString();

  useEffect(() => {
    if (!article) return;

    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;
      const copiedText = selection.toString();
      const sourceLink = `${getSiteUrl()}/${article.slug}`;
      const credit = `\n\n---\nSumber: ${article.title}\nBaca selengkapnya: ${sourceLink}\nDibuat oleh TUKANGBUATWEBSITEBALI (https://wa.me/628990090802)`;
      e.clipboardData?.setData('text/plain', copiedText + credit);
      e.preventDefault();
    };
    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, [article]);

  if (isLoading) return <main className="min-h-screen bg-dark pt-28 text-white"><div className="section-container"><div className="h-96 animate-pulse rounded-3xl bg-white/5" /></div></main>;

  // If no article found with this slug, fallback to DynamicPage
  if (!article) return <DynamicPage />;

  return (
    <>
      <SEOHead pageSEO={{ path: `/${article.slug}`, title: article.seo_title || article.title, description: article.seo_description || article.excerpt, ogImage: article.og_image || article.cover_image }} schemaType="article" articleData={{ title: article.title, slug: article.slug, excerpt: article.excerpt, coverImage: article.cover_image, author: article.author, publishedAt: publishedDate, updatedAt: article.updated_at }} />
      <main className="min-h-screen bg-dark pb-24 pt-24 text-white md:pt-28">
        <section className="section-container">
          <Link to="/blog" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary md:text-sm"><ArrowLeft className="h-4 w-4" /> Blog</Link>
          <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_330px]">
            <article className="min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-dark-card shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
              <header className="relative overflow-hidden p-5 md:p-10 lg:p-12">
                <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
                <span className="relative inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-primary"><Sparkles className="h-4 w-4" /> {article.category}</span>
                <h1 className="relative mt-5 max-w-4xl font-heading text-4xl font-black leading-[0.95] tracking-[-0.05em] text-white md:text-6xl lg:text-7xl">{article.title}</h1>
                <p className="relative mt-5 max-w-3xl text-base leading-8 text-gray-300 md:text-xl md:leading-9">{article.excerpt}</p>
                <div className="relative mt-7 flex flex-wrap gap-3 text-xs font-bold text-gray-400 md:text-sm">
                  <span className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2"><User className="h-4 w-4 text-primary" /> {article.author}</span>
                  <span className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2"><Calendar className="h-4 w-4 text-primary" /> {formatDate(publishedDate)}</span>
                  <span className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2"><Clock className="h-4 w-4 text-primary" /> {readingMinutes(text)} min read</span>
                  <span className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2"><BookOpen className="h-4 w-4 text-primary" /> {text.split(/\s+/).filter(Boolean).length} words</span>
                </div>
              </header>
              {article.cover_image && <img src={article.cover_image} alt={article.title} className="aspect-[16/9] w-full object-cover" />}
              <div className="px-5 py-8 md:px-10 md:py-12 lg:px-14">
                <RichArticleContent content={article.content} relatedArticles={related} services={services} />
              </div>
              <div className="mx-5 mb-8 rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/15 to-primary/5 p-6 md:mx-10 md:p-8">
                <h2 className="font-heading text-2xl font-black text-white md:text-3xl">Butuh treatment setelah baca ini?</h2>
                <p className="mt-3 text-sm leading-7 text-gray-300 md:text-base">Tim Luxury Massage Bali siap membantu memilih treatment terbaik sesuai kebutuhan Anda.</p>
                <a href={getWhatsAppUrl(`Halo Luxury Massage Bali, saya membaca artikel ${article.title} dan ingin konsultasi booking.`)} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-dark transition hover:shadow-gold"><MessageCircle className="h-5 w-5" /> Chat Admin via WhatsApp</a>
              </div>
              <TukangWebsitePromo />
            </article>

            <aside className="space-y-5 xl:sticky xl:top-28 xl:self-start">
              <div className="rounded-[1.6rem] border border-white/10 bg-dark-card p-5">
                <h2 className="font-black text-white">Table of Contents</h2>
                <div className="mt-4 space-y-2">{headings.length ? headings.map((heading) => <a key={heading} href={`#${heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="block rounded-xl px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-primary">{heading}</a>) : <p className="text-sm text-gray-500">Konten ringkas tanpa heading.</p>}</div>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-dark-card p-5">
                <h2 className="font-black text-white">Share</h2>
                <div className="mt-4 flex gap-2"><a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="rounded-xl bg-white/5 p-3 text-gray-300 hover:bg-primary hover:text-dark"><Share2 className="h-5 w-5" /></a><button onClick={() => navigator.clipboard.writeText(shareUrl)} className="rounded-xl bg-white/5 p-3 text-gray-300 hover:bg-primary hover:text-dark"><Link2 className="h-5 w-5" /></button></div>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-dark-card p-5">
                <h2 className="font-black text-white">Related Articles</h2>
                <div className="mt-4 space-y-4">{related.length ? related.map((item) => <Link key={item.id} to={`/${item.slug}`} className="block overflow-hidden rounded-2xl bg-white/5 transition-colors hover:bg-white/10">{item.cover_image && <img src={item.cover_image} alt={item.title} className="aspect-video w-full object-cover" />}<div className="p-3"><p className="line-clamp-2 text-sm font-bold text-white">{item.title}</p><p className="mt-1 line-clamp-2 text-xs text-gray-500">{item.excerpt}</p></div></Link>) : <p className="text-sm text-gray-500">Belum ada artikel terkait.</p>}</div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}
