/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        studio:   '#F4F6F8',
        surface:  '#FFFFFF',
        surface2: '#F8FAFC',
        border1:  '#E2E8F0',
        border2:  '#CBD5E1',
        ink:      '#0F172A',
        slate2:   '#64748B',
        slate3:   '#94A3B8',
        engblue:  '#2563EB',
        engteal:  '#0D9488',
        engamber: '#D97706',
        engred:   '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
