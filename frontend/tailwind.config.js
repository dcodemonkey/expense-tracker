/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: 'var(--bg-ink)',
          950: 'var(--bg-ink)',
        },
        surface: {
          DEFAULT: 'var(--bg-surface)',
          2: 'var(--bg-surface-2)',
          3: 'var(--bg-surface-3)',
        },
        hairline: 'var(--hairline)',
        mint: {
          DEFAULT: '#3DE1B0',
          soft: 'rgba(61,225,176,0.12)',
          600: '#2BC79A',
        },
        violet: {
          DEFAULT: '#8B7CFF',
          soft: 'rgba(139,124,255,0.12)',
          600: '#6F5DF0',
        },
        flame: {
          DEFAULT: '#FF6455',
          soft: 'rgba(255,100,85,0.12)',
          600: '#E5493A',
        },
        amber: {
          DEFAULT: '#F5B85C',
          soft: 'rgba(245,184,92,0.12)',
        },
        'text-hi': 'var(--text-hi)',
        'text-lo': 'var(--text-lo)',
        primary: {
          DEFAULT: '#3DE1B0',
          50: 'rgba(61,225,176,0.08)',
          100: 'rgba(61,225,176,0.12)',
          400: '#5FE9C2',
          500: '#3DE1B0',
          600: '#2BC79A',
          700: '#1FA37E',
        },
        expense: {
          400: '#FF8577',
          500: '#FF6455',
          600: '#E5493A',
        },
        income: {
          400: '#5FE9C2',
          500: '#3DE1B0',
          600: '#2BC79A',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
        glow: '0 0 0 1px rgba(61,225,176,0.2), 0 8px 40px -8px rgba(61,225,176,0.25)',
      },
      backgroundImage: {
        'hero-glow':
          'radial-gradient(120% 140% at 15% 0%, rgba(61,225,176,0.18) 0%, rgba(139,124,255,0.12) 38%, rgba(20,26,34,0) 72%)',
        'mint-violet': 'linear-gradient(135deg, #3DE1B0 0%, #8B7CFF 100%)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out both',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
}
