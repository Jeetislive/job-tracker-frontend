/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        bg: '#0E1116',
        surface: {
          DEFAULT: '#171B22',
          sunken: '#1C212A',
        },
        border: {
          DEFAULT: '#262C36',
          strong: '#343B47',
        },
        text: {
          primary: '#F2F4F8',
          secondary: '#AEB6C1',
          tertiary: '#8C95A2',
        },
        accent: {
          DEFAULT: '#3FBF97',
          hover: '#34A883',
          active: '#2B8F70',
          tint: 'rgba(63, 191, 151, 0.14)',
          ring: 'rgba(63, 191, 151, 0.35)',
          fg: '#08120E',
        },
        danger: {
          DEFAULT: '#F0676C',
          tint: 'rgba(240, 103, 108, 0.14)',
        },
        stage: {
          saved: '#9AA3AE',
          applied: '#5B9BF8',
          interview: '#F5B23D',
          offer: '#3FBF97',
          rejected: '#F0676C',
        },
      },
      borderRadius: {
        sm: '5px',
        md: '8px',
        lg: '12px',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        display: ['30px', { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '700' }],
        h1: ['21px', { lineHeight: '1.25', letterSpacing: '-0.008em', fontWeight: '650' }],
        h2: ['16px', { lineHeight: '1.3', fontWeight: '600' }],
        h3: ['13.5px', { lineHeight: '1.4', fontWeight: '600' }],
        meta: ['11.5px', { lineHeight: '1.4', fontWeight: '500' }],
      },
      boxShadow: {
        'sm-dark': '0 1px 2px rgba(0, 0, 0, 0.35)',
        'md-dark': '0 6px 18px rgba(0, 0, 0, 0.45)',
        'lg-dark': '0 24px 48px rgba(0, 0, 0, 0.55)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '100% 0' },
          '100%': { backgroundPosition: '-100% 0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s ease infinite',
        'fade-in': 'fade-in 200ms ease',
        'slide-up': 'slide-up 200ms cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};