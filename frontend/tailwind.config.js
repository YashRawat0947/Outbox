/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], pixel: ['"Pixelify Sans"', 'monospace'] },
      colors: {
        ink: '#15191e',
        muted: '#8a9099',
        line: '#eceeed',
        surface: '#f4f6f5',
        brand: { DEFAULT: '#0aa944', dark: '#08903a', tint: '#e3f4e9', mint: '#d8f0e3' },
        warn: { text: '#e2520f', bg: '#fff1e6', line: '#ffd2b3' },
      },
    },
  },
  plugins: [],
};
