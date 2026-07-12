/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#030712',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
        },
        brand: {
          primary: '#6366f1', // Indigo
          secondary: '#06b6d4', // Cyan
          accent: '#ec4899', // Pink
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-hover': '0 8px 32px 0 rgba(99, 102, 241, 0.4)',
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(120% 120% at 50% 10%, var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
