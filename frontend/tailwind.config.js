/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#edfcf7',
          100: '#d2f7ea',
          200: '#a8edd7',
          300: '#70debb',
          400: '#36c89a',
          500: '#15a87e',
          600: '#0d8a67',
          700: '#0d6f54',
          800: '#0e5844',
          900: '#0d4939',
        },
        surface: {
          DEFAULT: '#0c0f0e',
          card:    '#131816',
          raised:  '#1a2020',
          border:  '#263030',
          hover:   '#1f2a2a',
        }
      },
      animation: {
        'fade-up':   'fadeUp 0.6s ease forwards',
        'fade-in':   'fadeIn 0.4s ease forwards',
        'pulse-slow':'pulse 3s ease-in-out infinite',
        'scan':      'scan 2s linear infinite',
        'float':     'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scan: {
          '0%':   { transform: 'translateY(0%)' },
          '100%': { transform: 'translateY(400%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        }
      }
    },
  },
  plugins: [],
}
