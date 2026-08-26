import { motion } from 'framer-motion';

// ============================================
// HERO VIDEO (Muted + Loop Forever)
// ============================================

interface HeroVideoProps {
  videoUrl: string;
  posterUrl?: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaLink?: string;
}

export function HeroVideo({
  videoUrl,
  posterUrl,
  headline,
  subheadline,
  ctaText,
  ctaLink,
}: HeroVideoProps) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Video Element — Wajib: muted, loop, playsInline, autoPlay */}
      <video
        autoPlay
        muted
        loop
        playsInline
        disablePictureInPicture
        controlsList="nodownload noremoteplayback"
        poster={posterUrl}
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoUrl} type="video/mp4" />
        {/* Fallback for browsers that don't support MP4 */}
        <source src={videoUrl.replace('.mp4', '.webm')} type="video/webm" />
      </video>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-overlay" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-24 lg:pb-32 px-6 lg:px-16">
        <div className="max-w-2xl">
          {subheadline && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
              className="text-primary font-medium text-sm tracking-widest uppercase mb-3"
            >
              {subheadline}
            </motion.p>
          )}

          {headline && (
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8, ease: 'easeOut' }}
              className="text-4xl lg:text-6xl font-heading font-bold text-white mb-6 leading-tight"
            >
              {headline}
            </motion.h1>
          )}

          {ctaText && ctaLink && (
            <motion.a
              href={ctaLink}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5, ease: 'easeOut' }}
              className="inline-flex items-center gap-2 bg-gradient-gold text-dark font-semibold px-8 py-4 rounded-xl transition-all duration-300 hover:shadow-gold-lg hover:scale-105"
            >
              {ctaText}
            </motion.a>
          )}
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center"
      >
        <span className="text-white/50 text-xs mb-2 tracking-wider">SCROLL</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2"
        >
          <div className="w-1 h-2 rounded-full bg-white/50" />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ============================================
// HERO VIDEO WITH CLOUDINARY OPTIMIZATION
// ============================================

interface HeroVideoOptimizedProps extends HeroVideoProps {
  cloudinaryUrl?: string;
}

export function HeroVideoOptimized({
  videoUrl,
  posterUrl,
  cloudinaryUrl,
  headline,
  subheadline,
  ctaText,
  ctaLink,
}: HeroVideoOptimizedProps) {
  // Cloudinary video transformation URL
  // f_auto: auto format, q_auto:best: best quality, vc_auto: video codec auto
  const optimizedVideoUrl = cloudinaryUrl
    ? `${cloudinaryUrl}/video/upload/f_auto,q_auto:best,vc_auto/${videoUrl}`
    : videoUrl;

  const optimizedPoster = posterUrl
    ? cloudinaryUrl
      ? `${cloudinaryUrl}/image/upload/f_auto,q_auto:best/${posterUrl}`
      : posterUrl
    : undefined;

  return (
    <HeroVideo
      videoUrl={optimizedVideoUrl}
      posterUrl={optimizedPoster}
      headline={headline}
      subheadline={subheadline}
      ctaText={ctaText}
      ctaLink={ctaLink}
    />
  );
}
