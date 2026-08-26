import { cn } from '@/lib/utils';

interface BrandLogoProps {
  scrolled?: boolean;
  variant?: 'auto' | 'gold' | 'white' | 'emerald';
  showText?: boolean;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  iconOnly?: boolean;
}

export function BrandLogo({
  scrolled = false,
  variant = 'auto',
  showText = true,
  orientation = 'horizontal',
  className,
  iconOnly = false,
}: BrandLogoProps) {
  // Determine gradient ID based on scroll/variant
  const gradientId = variant === 'gold' 
    ? 'gold-grad' 
    : variant === 'white'
    ? 'white-grad'
    : variant === 'emerald'
    ? 'emerald-grad'
    : scrolled 
    ? 'scrolled-grad' 
    : 'hero-gold-grad';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2.5 transition-all duration-300 select-none group',
        orientation === 'vertical' && 'flex-col text-center',
        className
      )}
    >
      {/* SVG Emblem: Lotus Woman */}
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          'transition-transform duration-500 group-hover:scale-105 shrink-0',
          orientation === 'vertical' ? 'h-20 w-20' : 'h-11 w-11 sm:h-12 sm:w-12'
        )}
      >
        <defs>
          {/* Hero Gold Gradient */}
          <linearGradient id="hero-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F9E8B6" />
            <stop offset="50%" stopColor="#DFC07E" />
            <stop offset="100%" stopColor="#A88434" />
          </linearGradient>

          {/* Scrolled Dynamic Gradient (Emerald & Platinum Mint) */}
          <linearGradient id="scrolled-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#DCEBE4" />
            <stop offset="100%" stopColor="#A8C8BA" />
          </linearGradient>

          {/* Pure Gold */}
          <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#996515" />
          </linearGradient>

          {/* Pure White */}
          <linearGradient id="white-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          {/* Emerald Gradient */}
          <linearGradient id="emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6EE7B7" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>

        {/* Outer Glow filter effect for logo aura */}
        <g stroke={`url(#${gradientId})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Hair Bun & Head Outline */}
          <path d="M100 48 C94 48 88 53 88 61 C88 71 95 78 100 78 C105 78 112 71 112 61 C112 53 106 48 100 48 Z" />
          <path d="M96 46 C93 42 90 38 95 34 C100 30 106 32 108 36 C110 40 107 45 104 46" />
          <path d="M101 32 C103 26 109 25 112 28 C115 31 114 36 110 39" />

          {/* Frangipani (Kamboja) Flower on Hair */}
          <path d="M86 52 C81 50 78 54 82 58 C86 60 88 56 86 52 Z" fill={`url(#${gradientId})`} fillOpacity="0.4" />
          <path d="M88 47 C85 43 80 45 82 50 C85 52 88 50 88 47 Z" fill={`url(#${gradientId})`} fillOpacity="0.4" />
          <path d="M92 48 C94 43 89 41 87 46 C87 49 91 50 92 48 Z" fill={`url(#${gradientId})`} fillOpacity="0.4" />

          {/* Female Back Silhouette & Shoulders */}
          <path d="M84 78 C76 86 73 98 72 110 C78 114 83 124 81 138 C79 146 84 153 90 156" />
          <path d="M116 78 C124 86 127 98 128 110 C122 114 117 124 119 138 C121 146 116 153 110 156" />
          
          {/* Waist & Spine Curves */}
          <path d="M94 92 C92 108 90 126 95 142 C97 148 100 155 100 156 C100 155 103 148 105 142 C110 126 108 108 106 92" />
          
          {/* Spine Dots (Chakras) */}
          <circle cx="100" cy="88" r="1.8" fill={`url(#${gradientId})`} />
          <circle cx="100" cy="98" r="1.8" fill={`url(#${gradientId})`} />
          <circle cx="100" cy="108" r="1.8" fill={`url(#${gradientId})`} />
          <circle cx="100" cy="118" r="1.8" fill={`url(#${gradientId})`} />
          <circle cx="100" cy="128" r="1.8" fill={`url(#${gradientId})`} />

          {/* Lotus Petals Base */}
          {/* Center Petal Left */}
          <path d="M100 158 C86 156 68 140 62 120 C72 118 88 128 96 148" />
          {/* Center Petal Right */}
          <path d="M100 158 C114 156 132 140 138 120 C128 118 112 128 104 148" />

          {/* Outer Left Petal */}
          <path d="M80 154 C60 150 42 138 36 122 C48 116 66 120 74 136" />
          <path d="M68 152 C48 155 24 146 16 130 C28 122 50 126 62 140" />

          {/* Outer Right Petal */}
          <path d="M120 154 C140 150 158 138 164 122 C152 116 134 120 126 136" />
          <path d="M132 152 C152 155 176 146 184 130 C172 122 150 126 138 140" />

          {/* Bottom Lotus Base Cradle */}
          <path d="M38 145 C65 170 135 170 162 145 C145 160 118 166 100 166 C82 166 55 160 38 145 Z" fill={`url(#${gradientId})`} fillOpacity="0.15" />
        </g>
      </svg>

      {/* Typography Unit */}
      {showText && !iconOnly && (
        <div
          className={cn(
            'flex flex-col',
            orientation === 'vertical' ? 'items-center mt-1' : 'items-start'
          )}
        >
          {/* Main Title: LUXURY BALI */}
          <span
            className={cn(
              'font-heading font-black tracking-[0.14em] uppercase transition-all duration-300 leading-none',
              orientation === 'vertical' ? 'text-lg sm:text-xl' : 'text-base sm:text-lg',
              scrolled
                ? 'bg-gradient-to-r from-white via-emerald-100 to-amber-200 bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-amber-100 via-amber-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(212,175,55,0.3)]'
            )}
          >
            Luxury Bali
          </span>

          {/* Divider with small flower */}
          <div className="flex items-center gap-1.5 w-full my-0.5 opacity-80">
            <span className={cn('h-[1px] flex-1 transition-colors duration-300', scrolled ? 'bg-emerald-400/40' : 'bg-amber-400/40')} />
            <svg viewBox="0 0 12 12" className={cn('h-2.5 w-2.5 shrink-0 transition-colors duration-300', scrolled ? 'text-emerald-300' : 'text-primary')} fill="currentColor">
              <path d="M6 1 C6.5 3 8 4 9.5 4 C8 5.5 8 7 6 9 C4 7 4 5.5 2.5 4 C4 4 5.5 3 6 1 Z" />
            </svg>
            <span className={cn('h-[1px] flex-1 transition-colors duration-300', scrolled ? 'bg-emerald-400/40' : 'bg-amber-400/40')} />
          </div>

          {/* Subtitle: MASSAGE */}
          <span
            className={cn(
              'font-sans text-[9px] font-extrabold uppercase tracking-[0.38em] transition-colors duration-300 leading-none pl-0.5',
              scrolled ? 'text-emerald-200/90' : 'text-amber-200/90'
            )}
          >
            Massage
          </span>
        </div>
      )}
    </div>
  );
}
