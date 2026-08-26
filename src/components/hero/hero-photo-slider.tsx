import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HeroSlide, AnimationPreset } from '@/lib/types';
import { ANIMATION_VARIANTS } from '@/lib/types';

// ============================================
// HERO PHOTO SLIDER (5 Animation Presets)
// ============================================

interface HeroPhotoSliderProps {
  slides: HeroSlide[];
  autoPlayInterval?: number; // in ms
}

export function HeroPhotoSlider({ slides, autoPlayInterval = 6000 }: HeroPhotoSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const activeSlides = slides.filter((s) => s.is_active && s.type === 'image').sort((a, b) => a.sort_order - b.sort_order);
  const totalSlides = activeSlides.length;

  // Auto-play logic
  useEffect(() => {
    if (!isAutoPlay || isHovered || totalSlides <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [isAutoPlay, isHovered, totalSlides, autoPlayInterval]);

  // Pause on visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setIsAutoPlay(false);
      } else {
        setIsAutoPlay(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  if (totalSlides === 0) return null;

  const currentSlide = activeSlides[currentIndex];

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const getAnimationVariant = (preset: AnimationPreset) => {
    return ANIMATION_VARIANTS[preset] || ANIMATION_VARIANTS.fade;
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Images */}
      {activeSlides.map((slide, index) => (
        <motion.div
          key={slide.id}
          className="absolute inset-0"
          initial={false}
          animate={{
            opacity: index === currentIndex ? 1 : 0,
            scale: index === currentIndex ? 1 : 1.1,
          }}
          transition={{
            duration: 1.2,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <img
            src={slide.media_url}
            alt={slide.headline || 'Hero slide'}
            className="w-full h-full object-cover"
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        </motion.div>
      ))}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-overlay" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-24 lg:pb-32 px-6 lg:px-16">
        {/* Navigation Arrows */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-all z-20"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-all z-20"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Slide Content with Animation */}
        <motion.div
          key={currentIndex}
          {...getAnimationVariant(currentSlide.animation_preset as AnimationPreset)}
          className="max-w-2xl"
        >
          <p className="text-primary font-medium text-sm tracking-widest uppercase mb-3">
            {currentSlide.subheadline}
          </p>
          <h1 className="text-4xl lg:text-6xl font-heading font-bold text-white mb-6 leading-tight">
            {currentSlide.headline}
          </h1>
          <div className="flex flex-wrap gap-4">
            {currentSlide.cta_text && currentSlide.cta_link && (
              <a
                href={currentSlide.cta_link}
                className="inline-flex items-center gap-2 bg-gradient-gold text-dark font-semibold px-8 py-4 rounded-xl transition-all duration-300 hover:shadow-gold-lg hover:scale-105"
              >
                {currentSlide.cta_text}
              </a>
            )}
          </div>
        </motion.div>

        {/* Dots Indicator */}
        {totalSlides > 1 && (
          <div className="flex items-center gap-2 mt-8">
            {activeSlides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => goToSlide(index)}
                className={cn(
                  'h-1 rounded-full transition-all duration-500',
                  index === currentIndex
                    ? 'w-12 bg-primary'
                    : 'w-4 bg-white/30 hover:bg-white/50'
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Auto-play Toggle */}
        <button
          onClick={() => setIsAutoPlay(!isAutoPlay)}
          className="absolute bottom-24 lg:bottom-32 right-6 lg:right-16 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all z-20"
          aria-label={isAutoPlay ? 'Pause slideshow' : 'Play slideshow'}
        >
          {isAutoPlay ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>
      </div>
    </div>
  );
}
