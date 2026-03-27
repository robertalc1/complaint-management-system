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
          50: '#eef0f7',
          100: '#d5d9ea',
          200: '#a8b0d4',
          300: '#7b89be',
          400: '#4e62a8',
          500: '#1c3183',
          600: '#1c3183',
          700: '#162868',
          800: '#101e4e',
          900: '#0a1433',
        },
        secondary: {
          50: '#f8f7f6',
          100: '#f0efed',
          200: '#e4e3e0',
          300: '#c5c3c0',
          400: '#918f8c',
          500: '#635f5e',
          600: '#443f42',
          700: '#332e31',
          800: '#241824',
          900: '#1a1119',
        }
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}