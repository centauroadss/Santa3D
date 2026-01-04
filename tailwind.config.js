/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#85439a',
          orange: '#f79131',
        },
      },
      fontFamily: {
        arquitecta: ['Arquitecta', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
