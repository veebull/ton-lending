/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        gold: 'rgb(var(--color-gold) / <alpha-value>)',
      },
      backgroundImage: {
        'marble': "url('https://images.unsplash.com/photo-1517857399767-a9dc28f5a734?q=80&w=2070')",
      },
    },
  },
  plugins: [],
};