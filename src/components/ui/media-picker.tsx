/**
 * Reusable Media Picker — WordPress-style insert from library.
 * Usage: <MediaPickerButton onSelect={(url) => setImage(url)} />
 */

import { type ReactNode, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Film, X, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface MediaItem {
  readonly id: string;
  readonly filename: string | null;
  readonly url: string;
  readonly cdn_url: string | null;
  readonly mime_type: string | null;
  readonly alt_text: string | null;
  readonly size_bytes: number | null;
}

interface MediaPickerButtonProps {
  readonly onSelect: (url: string) => void;
  readonly children?: ReactNode;
  readonly className?: string;
}

async function fetchMediaItems(): Promise<readonly MediaItem[]> {
  const { data, error } = await supabase
    .from('media')
    .select('id, filename, url, cdn_url, mime_type, alt_text, size_bytes')
    .order('uploaded_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as readonly MediaItem[];
}

function getMediaUrl(item: MediaItem): string {
  return item.cdn_url || item.url;
}

function matchesSearch(item: MediaItem, normalizedSearch: string): boolean {
  if (!normalizedSearch) return true;

  return [item.filename, item.alt_text]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(normalizedSearch));
}

export function MediaPickerButton({
  onSelect,
  children,
  className = '',
}: MediaPickerButtonProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: mediaItems = [] } = useQuery({
    queryKey: ['admin-media-picker'],
    queryFn: fetchMediaItems,
    enabled: open,
  });

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = useMemo(
    () => mediaItems.filter((item) => matchesSearch(item, normalizedSearch)),
    [mediaItems, normalizedSearch],
  );

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children || (
          <span className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white transition-all">
            <Image className="w-4 h-4" />
            Browse Media
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-dark-lighter rounded-2xl border border-white/10 w-full max-w-3xl max-h-[80vh] overflow-hidden"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg">Insert Media</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Select from media library</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="w-48 bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-primary transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    aria-label="Close media picker"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-5 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 overflow-y-auto max-h-[55vh]">
                {filtered.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-gray-500 text-sm">
                    <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No media found. Upload first.
                  </div>
                ) : (
                  filtered.map((item) => {
                    const mediaUrl = getMediaUrl(item);
                    const isVideo = item.mime_type?.startsWith('video/') ?? false;
                    const label = item.filename || item.alt_text || 'Media item';

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelect(mediaUrl);
                          setOpen(false);
                        }}
                        className="aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all group relative"
                        aria-label={`Select ${label}`}
                      >
                        {isVideo ? (
                          <div className="w-full h-full bg-dark-lighter flex items-center justify-center">
                            <video src={item.url} className="w-full h-full object-cover" muted />
                            <Film className="absolute w-5 h-5 text-white opacity-60" />
                          </div>
                        ) : (
                          <img
                            src={mediaUrl}
                            alt={item.alt_text || item.filename || 'Media library item'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/70 text-[10px] text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                          {label}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
