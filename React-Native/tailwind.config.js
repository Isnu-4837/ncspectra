/** @type {import('tailwindcss').Config} */
module.exports = {
  // Required by NativeWind: provides the RN-compatible Tailwind preset
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  content: [
    "./index.html",
    "./main.tsx",
    "./App.tsx",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}