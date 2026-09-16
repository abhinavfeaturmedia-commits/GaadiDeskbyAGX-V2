/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F8F6F0',
        'canvas-muted': '#F3EFE6',
        'canvas-subtle': '#ECE6DA',
        card: '#FFFFFF',
        'card-border': '#E5DFD3',
        'card-border-subtle': '#EFE9DF',
        'text-primary': '#111827',
        'text-secondary': '#374151',
        'text-muted': '#4B5563',
        accent: {
          honey: '#F39E36',
          'honey-light': '#FDF2E2',
          'honey-dark': '#C97514',
          lime: '#DDF262',
          'lime-light': '#F3FCD4',
          'lime-dark': '#7A9600',
          peach: '#EA580C',
          'peach-light': '#FFEDD5',
          'peach-dark': '#C2410C',
          amber: '#D97706',
          'amber-light': '#FEF3C7',
          'amber-dark': '#B45309',
          mint: '#DCFCE7',
          sky: '#85CFF3',
          'sky-light': '#E0F2FE',
          rose: '#FF9EAA',
          'rose-light': '#FEE2E2',
          purple: '#E9D5FF',
          coral: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
        hindi: ['"Noto Sans Devanagari"', 'sans-serif']
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(45, 35, 20, 0.04), 0 2px 6px -1px rgba(45, 35, 20, 0.02)',
        'soft-md': '0 8px 24px -4px rgba(45, 35, 20, 0.06), 0 3px 8px -2px rgba(45, 35, 20, 0.03)',
        'soft-lg': '0 16px 36px -4px rgba(45, 35, 20, 0.08), 0 6px 16px -2px rgba(45, 35, 20, 0.03)',
        'dock': '0 12px 36px -4px rgba(30, 35, 42, 0.14), 0 0 1px 1px rgba(239, 234, 225, 0.8)',
        'glow-lime': '0 0 20px rgba(212, 240, 91, 0.65)',
        'glow-peach': '0 0 20px rgba(248, 176, 82, 0.55)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.45)',
      },
      borderRadius: {
        '2.5xl': '1.35rem',
        '3xl': '1.75rem',
        '3.5xl': '2rem',
        '4xl': '2.25rem',
        '5xl': '2.75rem',
      }
    },
  },
  plugins: [],
}
