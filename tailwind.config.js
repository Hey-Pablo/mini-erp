import { join } from 'path';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbe8ff',
          200: '#bcf2ff',
          300: '#88e6ff',
          400: '#4dd6ff',
          500: '#00c3ff',
          600: '#0099cc',
          700: '#006d99',
          800: '#004766',
          900: '#002b33',
        },
      },
    },
  },
  plugins: [],
};