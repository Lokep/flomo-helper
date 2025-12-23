/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx,html}',
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        flomo: "#30cf79",
       'flomo-dark': "#2bbb6d"
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    // https://github.com/tailwindlabs/tailwindcss-typography
    require('@tailwindcss/typography'),
  ],
}
