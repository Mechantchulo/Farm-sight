/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 20px 60px rgba(34, 197, 94, 0.12)',
      },
    },
  },
  plugins: [],
};
