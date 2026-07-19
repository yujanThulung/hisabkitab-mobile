/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#ff6b35',
        authBg: '#f1f5f9',
        success: '#52c41a',
        danger: '#ff4d4f',
        warning: '#faad14',
        textPrimary: '#1d2329',
        textSecondary: '#8c9196',
        border: '#e5e7eb',
      },
    },
  },
  plugins: [],
};