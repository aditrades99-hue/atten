/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0F172A',
        darkCard: '#1E293B',
        presentGreen: '#22C55E',
        lunchAmber: '#F59E0B',
        absentRed: '#EF4444',
        departedSlate: '#64748B',
        accentBlue: '#3B82F6',
      },
      fontFamily: {
        sans: ['"DM Mono"', 'monospace'],
        display: ['"Syne"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
