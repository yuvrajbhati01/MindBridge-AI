/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f3f0ff',
          100: '#e9e0ff',
          200: '#d4c4ff',
          300: '#b89aff',
          400: '#9b6dff',
          500: '#8244ff',
          600: '#7424f5',
          700: '#6115d8',
          800: '#5112b0',
          900: '#43108e',
          950: '#2a0965',
        },
        surface: {
          50:  '#f8f7ff',
          100: '#f0eeff',
          200: '#e3dfff',
          300: '#cdc4ff',
          400: '#b3a1ff',
          500: '#9a7aff',
          600: '#8a54ff',
          700: '#7c3aed',
          800: '#6927c4',
          900: '#5622a0',
          950: '#340e6e',
        },
        dark: {
          50:  '#eaeaf5',
          100: '#c5c4e0',
          200: '#9f9ec9',
          300: '#7978b2',
          400: '#5d5ca1',
          500: '#414091',
          600: '#3a3a88',
          700: '#30307c',
          800: '#272770',
          900: '#1a1a5c',
          950: '#0d0d2b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.5s ease-out forwards',
        'slide-up':   'slideUp 0.5s ease-out forwards',
        'slide-right': 'slideRight 0.3s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float':      'float 6s ease-in-out infinite',
        'glow':       'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%':   { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%':   { boxShadow: '0 0 5px rgba(130, 68, 255, 0.2), 0 0 20px rgba(130, 68, 255, 0.1)' },
          '100%': { boxShadow: '0 0 10px rgba(130, 68, 255, 0.4), 0 0 40px rgba(130, 68, 255, 0.2)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
