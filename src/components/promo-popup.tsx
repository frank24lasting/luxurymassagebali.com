/**
 * Promo Popup Flyer - A4 promotional popup with stunning Framer Motion animations
 * Shows once per session when user visits homepage
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface PopupConfig {
  image_url: string;
  is_active: boolean;
  link_url: string;
  title?: string;
}

const SESSION_KEY = 'spa_jimbaran_popup_shown';

export function PromoPopup() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const shownRef = useRef(false);

  // Fetch popup config
  const { data: rawData } = useQuery({
    queryKey: ['promo-popup-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'promo_popup')
        .maybeSingle();
      if (error) throw error;
      return (data?.value as PopupConfig) ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const config: PopupConfig | null = rawData ?? null;

  useEffect(() => {
    // Only show if active, has image, and not shown this session
    if (config?.is_active && config.image_url && !shownRef.current && !sessionStorage.getItem(SESSION_KEY)) {
      shownRef.current = true;
      // Delay popup appearance for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
        sessionStorage.setItem(SESSION_KEY, 'true');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [config]);

  const handleClose = () => setIsVisible(false);

  const handleClick = () => {
    if (config?.link_url) {
      if (config.link_url.startsWith('http')) {
        window.open(config.link_url, '_blank');
      } else {
        navigate(config.link_url);
      }
    }
    handleClose();
  };

  if (!config?.is_active || !config.image_url) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-lg p-4"
          onClick={handleClose}
        >
          {/* Sparkle particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(168,200,186,0.8)]"
                initial={{
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                  y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
                  scale: 0,
                  opacity: 0,
                }}
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2.5,
                  delay: i * 0.08,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 3,
                }}
              />
            ))}
          </div>

          {/* Radial glow behind popup */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,200,186,0.25)_0%,transparent_60%)]" />
          </motion.div>

          {/* Main popup container - A4 aspect ratio */}
          <motion.div
            initial={{ 
              scale: 0.2, 
              opacity: 0, 
              rotateX: 45,
              rotateY: -30,
              y: 100,
            }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              rotateX: 0,
              rotateY: 0,
              y: 0,
            }}
            exit={{ 
              scale: 0.5, 
              opacity: 0, 
              rotateX: -20,
              rotateY: 30,
              y: -50,
            }}
            transition={{
              type: 'spring',
              damping: 18,
              stiffness: 150,
              mass: 1.2,
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="relative w-full max-w-sm sm:max-w-md aspect-[1/1.4] cursor-pointer"
            style={{ perspective: '1500px' }}
          >
            {/* Outer glow ring */}
            <motion.div
              className="absolute -inset-2 rounded-[2rem]"
              animate={{
                boxShadow: [
                  '0 0 30px rgba(168,200,186,0.3), 0 0 60px rgba(168,200,186,0.2)',
                  '0 0 50px rgba(168,200,186,0.5), 0 0 100px rgba(168,200,186,0.3)',
                  '0 0 30px rgba(168,200,186,0.3), 0 0 60px rgba(168,200,186,0.2)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Inner container */}
            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-primary/30">
              {/* Image */}
              <img
                src={config.image_url}
                alt={config.title || 'Special Promo'}
                className="w-full h-full object-cover"
              />

              {/* Gradient overlay at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
              />

              {/* Title badge */}
              {config.title && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-dark"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">{config.title}</span>
                </motion.div>
              )}

              {/* Close button */}
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-primary hover:text-dark transition-all shadow-lg border border-white/20"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5" />
              </motion.button>

              {/* Tap hint */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/70 text-xs"
              >
                <span>Tap untuk lihat detail</span>
              </motion.div>
            </div>

            {/* Reflection effect */}
            <motion.div
              className="absolute -bottom-20 left-0 right-0 h-20 pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, rgba(168,200,186,0.1), transparent)',
                transform: 'scaleY(-1)',
                filter: 'blur(10px)',
                opacity: 0.5,
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
