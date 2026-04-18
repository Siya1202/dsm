/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0D0D0D',
        section: '#141414',
        card: '#1C1C1C',
        cardHover: '#222222',
        accent: '#C8521A',
        accentHover: '#E8622A',
        textPrimary: '#F0EDE6',
        textMuted: '#7A7A7A',
        borderDark: '#2A2A2A',
        success: '#1D9E75',
        highlight: '#7F77DD'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
