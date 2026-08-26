/**
 * WordPress-style Media Library
 * Features:
 * - Image upload → auto WebP compression via Cloudinary
 * - Video upload (max 100MB)
 * - Media Picker (insert from library, not URL)
 * - Grid/List view toggle
 * - Copy URL, Delete, Alt text
 */

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image, Film, Upload, Grid3X3, List, Copy, Check,
  Search, X, Trash2, FileImage, ExternalLink, RefreshCw,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/motion';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

type MediaView = 'grid' | 'list';
type CopiedId = 'cdn' | 'orig' | null;

type MediaMetadata = {
  readonly width?: number;
  readonly height?: number;
  readonly format?: string;
  readonly public_id?: string;
  readonly resource_type?: 'image' | 'video';
};

interface MediaRecord {
  readonly id: string;
  readonly filename: string | null;
  readonly url: string;
  readonly cdn_url: string | null;
  readonly mime_type: string | null;
  readonly size_bytes: number | null;
  readonly alt_text: string | null;
  readonly metadata: MediaMetadata | null;
  readonly uploaded_at: string | null;
}

type MediaInsert = Omit<MediaRecord, 'id' | 'uploaded_at'>;

interface CloudinaryUploadResult {
  readonly url: string;
  readonly public_id: string;
  readonly format: string;
  readonly bytes: number;
  readonly width?: number;
  readonly height?: number;
  readonly resource_type: 'image' | 'video';
  readonly original_filename: string;
}

interface CloudinaryResponse {
  readonly secure_url?: string;
  readonly public_id?: string;
  readonly format?: string;
  readonly bytes?: number;
  readonly width?: number;
  readonly height?: number;
  readonly error?: { readonly message?: string };
}

const ACCEPTED_IMAGES = 'image/jpeg,image/png,image/webp,image/gif,image/avif';
const ACCEPTED_VIDEOS = 'video/mp4,.mp4,video/webm,video/quicktime';
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB

async function uploadToCloudinary(
  file: File,
  folder = 'luxury-massage-bali/media',
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !preset) throw new Error('Cloudinary not configured');

  const isVideo = file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mp4');
  const resourceType = isVideo ? 'video' : 'image';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', preset);
  formData.append('folder', folder);
  formData.append('public_id', `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase()}`);

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText) as CloudinaryResponse;
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url && data.public_id && data.format && typeof data.bytes === 'number') {
          resolve({
            url: data.secure_url,
            public_id: data.public_id,
            format: data.format,
            bytes: data.bytes,
            width: data.width,
            height: data.height,
            resource_type: resourceType,
            original_filename: file.name,
          });
        } else {
          reject(new Error(data.error?.message || `Upload failed with status ${xhr.status}`));
        }
      } catch (err) {
        reject(new Error('Invalid response from upload server'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}

export default function AdminMedia() {
  const [view, setView] = useState<MediaView>('grid');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<MediaRecord | null>(null);
  const [copiedId, setCopiedId] = useState<CopiedId>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();

  const { data: mediaItems, isLoading } = useQuery({
    queryKey: ['admin-media'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as MediaRecord[];
    },
  });

  const uploadMutation = useMutation<MediaInsert, Error, MediaInsert>({
    mutationFn: async (uploaded) => {
      const { error } = await supabase.from('media').insert(uploaded);
      if (error) throw new Error(error.message);
      return uploaded;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      toast.success('Uploaded to media library');
    },
    onError: (error) => toast.error(`Upload failed: ${error.message}`),
  });

  const deleteMutation = useMutation<MediaRecord, Error, MediaRecord>({
    mutationFn: async (record) => {
      const { error } = await supabase.from('media').delete().eq('id', record.id);
      if (error) throw new Error(error.message);
      return record;
    },
    onSuccess: (record) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      toast.success('Deleted from library');
      if (selectedMedia?.id === record.id) setSelectedMedia(null);
    },
    onError: (error) => toast.error(`Delete failed: ${error.message}`),
  });

  const handleUpload = async (files: FileList | null): Promise<void> => {
    if (!files?.length) return;
    setUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const isVideo = file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mp4');
        const sizeLimit = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

        if (file.size > sizeLimit) {
          toast.error(`${file.name} exceeds ${isVideo ? '200MB' : '20MB'} limit`);
          continue;
        }

        const result = await uploadToCloudinary(file, 'luxury-massage-bali/media', (filePercent) => {
          const overall = Math.round(((i + (filePercent / 100)) / files.length) * 100);
          setUploadProgress(overall);
        });

        await uploadMutation.mutateAsync({
          filename: file.name,
          url: result.url,
          cdn_url: result.url,
          mime_type: isVideo && !file.type ? 'video/mp4' : file.type,
          size_bytes: result.bytes,
          alt_text: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          metadata: {
            width: result.width,
            height: result.height,
            format: result.format,
            public_id: result.public_id,
            resource_type: result.resource_type,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown upload error';
        toast.error(`${file.name}: ${message}`);
      }
    }

    setUploadProgress(100);
    setUploading(false);
    toast.success('All uploads complete!');
  };

  const copyToClipboard = async (text: string, type: Exclude<CopiedId, null>): Promise<void> => {
    await navigator.clipboard.writeText(text);
    setCopiedId(type);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  const formatBytes = (bytes: number | null): string => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredMedia = (mediaItems ?? []).filter((media) =>
    !normalizedSearch ||
    media.filename?.toLowerCase().includes(normalizedSearch) ||
    media.alt_text?.toLowerCase().includes(normalizedSearch)
  );

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Image className="w-7 h-7 text-primary" />
              Media Library
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {mediaItems?.length || 0} items · Images WebP auto-compressed · Video MP4 max 200MB
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Upload Images */}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_IMAGES}
                multiple
                className="hidden"
                onChange={e => { handleUpload(e.target.files); e.target.value = ''; }}
                disabled={uploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-dark rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
                Upload Image
              </button>
            </div>
            {/* Upload Videos */}
            <div className="relative">
              <input
                ref={videoInputRef}
                type="file"
                accept={ACCEPTED_VIDEOS}
                multiple
                className="hidden"
                onChange={e => { handleUpload(e.target.files); e.target.value = ''; }}
                disabled={uploading}
              />
              <button
                onClick={() => videoInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                title="Upload MP4 Video (Max 200MB)"
              >
                <Film className="w-5 h-5" />
                Upload Video (MP4 max 200MB)
              </button>
            </div>
            {/* View Toggle */}
            <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setView('grid')}
                className={`p-2.5 transition-colors ${view === 'grid' ? 'bg-primary/20 text-primary' : 'text-gray-500 hover:text-white'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2.5 transition-colors ${view === 'list' ? 'bg-primary/20 text-primary' : 'text-gray-500 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="bg-dark-card rounded-xl border border-white/5 p-4 flex items-center gap-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="flex-1">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-gold rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-500">Uploading... {uploadProgress}%</span>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search media files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Media Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square bg-dark-card rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredMedia?.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`group relative aspect-square rounded-xl overflow-hidden border cursor-pointer transition-all
                  ${selectedMedia?.id === item.id ? 'border-primary ring-2 ring-primary/30' : 'border-white/10 hover:border-white/30'}`}
                onClick={() => setSelectedMedia(item)}
              >
                {/* Thumbnail */}
                {item.mime_type?.startsWith('video/') ? (
                  <div className="w-full h-full bg-dark-lighter flex items-center justify-center">
                    <video src={item.url} className="w-full h-full object-cover" muted />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Film className="w-8 h-8 text-white opacity-70" />
                    </div>
                    {item.metadata?.width && (
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-[10px] text-white rounded">
                        {item.metadata.width}×{item.metadata.height}
                      </span>
                    )}
                  </div>
                ) : (
                  <img
                    src={item.cdn_url || item.url}
                    alt={item.alt_text || item.filename || 'Media item'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-white text-xs font-medium truncate">{item.filename}</p>
                  <p className="text-gray-400 text-[10px]">{formatBytes(item.size_bytes)}</p>
                </div>

                {/* Format badge */}
                <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/80 rounded text-[9px] text-white font-bold uppercase">
                  {item.metadata?.format || item.mime_type?.split('/')[1] || '?'}
                </span>
                {item.mime_type?.startsWith('video/') && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-blue-500/80 rounded text-[9px] text-white font-bold">
                    HD
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-dark-card rounded-2xl border border-white/5 overflow-hidden">
            <div className="divide-y divide-white/5">
              {filteredMedia?.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 p-4 hover:bg-white/5 transition-colors cursor-pointer
                    ${selectedMedia?.id === item.id ? 'bg-primary/5' : ''}`}
                  onClick={() => setSelectedMedia(item)}
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-dark-lighter flex-shrink-0 border border-white/5">
                    {item.mime_type?.startsWith('video/') ? (
                      <video src={item.url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={item.cdn_url || item.url} alt={item.alt_text || item.filename || 'Media item'} className="w-full h-full object-cover" />
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.filename}</p>
                    <p className="text-gray-500 text-xs truncate">{item.alt_text}</p>
                  </div>
                  {/* Meta */}
                  <div className="hidden sm:block text-right text-xs text-gray-500">
                    <p>{formatBytes(item.size_bytes)}</p>
                    <p className="mt-0.5">{item.metadata?.width}×{item.metadata?.height || '—'}</p>
                  </div>
                  {/* Format */}
                  <span className="hidden md:block px-2 py-1 bg-white/5 rounded text-[10px] text-gray-400 uppercase font-bold">
                    {item.metadata?.format || '?'}
                  </span>
                  {/* Date */}
                  <span className="hidden lg:block text-xs text-gray-500">
                    {new Date(item.uploaded_at || Date.now()).toLocaleDateString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredMedia?.length === 0 && !isLoading && (
          <div className="bg-dark-card rounded-2xl border border-white/5 p-16 text-center">
            <FileImage className="w-16 h-16 mx-auto text-gray-700 mb-4" />
            <p className="text-gray-400 text-lg font-medium">No media found</p>
            <p className="text-gray-600 text-sm mt-2">Upload images or videos to get started</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 px-6 py-3 bg-primary hover:bg-primary/90 text-dark rounded-xl font-semibold transition-colors inline-flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload Media
            </button>
          </div>
        )}

        {/* Detail Sidebar */}
        <AnimatePresence>
          {selectedMedia && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-dark-lighter border-l border-white/10 z-50 overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 bg-dark-lighter border-b border-white/5 p-5 flex items-center justify-between">
                <h3 className="text-white font-semibold">Media Details</h3>
                <button
                  onClick={() => setSelectedMedia(null)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-6">
                {/* Preview */}
                <div className="aspect-video rounded-xl overflow-hidden bg-dark border border-white/5">
                  {selectedMedia.mime_type?.startsWith('video/') ? (
                    <video src={selectedMedia.url} controls className="w-full h-full" />
                  ) : (
                    <img
                      src={selectedMedia.cdn_url || selectedMedia.url}
                      alt={selectedMedia.alt_text || selectedMedia.filename || 'Selected media'}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

                {/* Alt Text */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Alt Text</label>
                  <input
                    type="text"
                    defaultValue={selectedMedia.alt_text || ''}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>

                {/* Info */}
                <div className="bg-white/5 rounded-xl p-4 space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Filename</span><span className="text-white truncate ml-4">{selectedMedia.filename}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Format</span><span className="text-white uppercase font-bold">{selectedMedia.metadata?.format || '?'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Dimensions</span><span className="text-white">{selectedMedia.metadata?.width} × {selectedMedia.metadata?.height}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Size</span><span className="text-white">{formatBytes(selectedMedia.size_bytes)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="text-white">{selectedMedia.mime_type}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Uploaded</span><span className="text-white">{new Date(selectedMedia.uploaded_at || Date.now()).toLocaleString('id-ID')}</span></div>
                </div>

                {/* URLs */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">CDN URL (WebP)</label>
                    <div className="flex gap-2">
                      <input type="text" readOnly value={selectedMedia.cdn_url || selectedMedia.url}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono truncate" />
                      <button onClick={() => copyToClipboard(selectedMedia.cdn_url || selectedMedia.url, 'cdn')}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                        {copiedId === 'cdn' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Original URL</label>
                    <div className="flex gap-2">
                      <input type="text" readOnly value={selectedMedia.url}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono truncate" />
                      <button onClick={() => copyToClipboard(selectedMedia.url, 'orig')}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                        {copiedId === 'orig' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <a
                    href={selectedMedia.cdn_url || selectedMedia.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold text-sm transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open
                  </a>
                  <button
                    onClick={() => {
                      if (confirm('Delete this media permanently?')) deleteMutation.mutate(selectedMedia);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-semibold text-sm transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </PageTransition>
  );
}
