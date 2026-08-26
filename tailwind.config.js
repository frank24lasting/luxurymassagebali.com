/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a4539',
          dark: '#102e26',
          light: '#286353',
        },
        secondary: {
          DEFAULT: '#c59b27',
          dark: '#9a7615',
          light: '#e0b848',
        },
        accent: {
          DEFAULT: '#c59b27',
          dark: '#9a7615',
        },
        dark: {
          DEFAULT: '#f5f9f6',
          lighter: '#edf5f0',
          card: '#ffffff',
        },
        text: {
          primary: '#102922',
          secondary: '#254b41',
          muted: '#53756c',
        },
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.85)',
          border: 'rgba(20, 50, 42, 0.1)',
          hover: 'rgba(255, 255, 255, 0.95)',
        },
      },
      fontFamily: {
        heading: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-gold': 'linear-gradient(135deg, #14382f 0%, #1f4e42 100%)',
        'gradient-brand': 'linear-gradient(135deg, #14382f 0%, #245548 100%)',
        'gradient-dark': 'linear-gradient(180deg, #f7faf8 0%, #edf5f0 100%)',
        'gradient-overlay': 'linear-gradient(180deg, rgba(245,249,246,0) 0%, rgba(237,245,240,0.95) 100%)',
      },
      animation: {
        'ken-burns': 'kenBurns 7s ease-out both',
        float: 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        shimmer: 'shimmer 1.8s linear infinite',
        'bounce-subtle': 'bounceSubtle 0.45s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
      },
      keyframes: {
        kenBurns: {
          '0%': { transform: 'scale(1.06)', opacity: '0.65' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceSubtle: {
          '0%': { transform: 'scale(0.98)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.97)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        glass: '0 10px 32px rgba(4, 18, 14, 0.14)',
        'glass-lg': '0 18px 48px rgba(4, 18, 14, 0.2)',
        gold: '0 10px 28px rgba(4, 18, 14, 0.24)',
        'gold-lg': '0 16px 36px rgba(4, 18, 14, 0.3)',
      },
      transitionTimingFunction: {
        'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
