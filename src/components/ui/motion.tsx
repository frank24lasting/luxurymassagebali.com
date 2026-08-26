import { motion } from 'framer-motion';

// ============================================
// ANIMATION VARIANTS — Defined outside component (2026 best practice)
// ============================================

// Page transition
export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const pageTransition = {
  duration: 0.4,
  ease: 'easeOut' as const,
};

// Stagger container
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Stagger item
export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

export const scrollReveal = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
};

// Scale pop-in
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: 'backOut' as const },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2, ease: 'easeIn' as const },
  },
};

// Slide from right
export const slideRight = {
  hidden: { opacity: 0, x: 50 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

// Slide from bottom
export const slideUp = {
  hidden: { opacity: 0, y: 30 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
};

// Fade in
export const fadeIn = {
  hidden: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
};

// Hero Ken Burns (used for hero image animation)
export const kenBurns = {
  initial: { scale: 1.15, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 8, ease: 'easeOut' },
};

// Hero Parallax
export const heroParallax = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1, ease: 'easeOut' },
};

// Hero Zoom Out
export const heroZoomOut = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.8, ease: 'backOut' },
};

// Hero Slide Reveal
export const heroSlideReveal = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: { duration: 0.6, ease: 'easeOut' },
};

// Hero Glitch
export const heroGlitch = {
  initial: { opacity: 0, filter: 'blur(10px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  transition: { duration: 0.4, ease: 'easeOut' },
};

// Toast/Badge pop
export const badgePop = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 500, damping: 25 } },
  exit: { scale: 0, opacity: 0, transition: { duration: 0.2 } },
};

// ============================================
// MOTION COMPONENTS — Reusable animated wrappers
// ============================================

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, duration = 0.4, className }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration, ease: 'easeOut' as const }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface SlideUpProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function SlideUp({ children, delay = 0, className }: SlideUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' as const }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function ScaleIn({ children, delay = 0, className }: ScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3, ease: 'backOut' as const }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// STAGGER WRAPPER — For animating lists/children
// ============================================

interface StaggerWrapperProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerWrapper({
  children,
  className,
  staggerDelay = 0.1,
}: StaggerWrapperProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1,
          },
        },
      }}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: 'easeOut' as const },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// PAGE TRANSITION WRAPPER
// ============================================

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// LAZY ANIMATION — Only animate when in view
// ============================================

interface InViewAnimateProps {
  children: React.ReactNode;
  className?: string;
  variants?: typeof scrollReveal;
  once?: boolean;
  threshold?: number;
}

export function InViewAnimate({
  children,
  className,
  variants = scrollReveal,
  once = true,
  threshold = 0.1,
}: InViewAnimateProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: threshold }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// HOVER EFFECTS
// ============================================

export const hoverScale = {
  scale: 1.05,
  transition: { type: 'spring', stiffness: 400, damping: 25 },
};

export const hoverLift = {
  y: -4,
  boxShadow: '0 10px 40px rgba(201, 169, 110, 0.2)',
  transition: { duration: 0.3 },
};

// ============================================
// REDUCED MOTION — Respect user preference
// ============================================

export function useReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getMotionProps(variant: object, reducedMotion: boolean) {
  if (reducedMotion) {
    return { initial: false, animate: false };
  }
  return { initial: 'hidden', animate: 'visible', ...variant };
}
