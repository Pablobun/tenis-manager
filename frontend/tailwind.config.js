/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Rampas semánticas (se mantienen nombres usados por las páginas)
        primary: {
          50: '#FBF2ED',
          100: '#F7E3D9',
          200: '#EFC7B4',
          300: '#E3A68B',
          400: '#D27F60',
          500: '#B65434',
          600: '#A24A2E',
          700: '#873D26',
          800: '#6B301E',
          900: '#4E2317',
        },
        // Mundo Polvo de Ladrillo
        polvo: {
          DEFAULT: '#B65434',
          light: '#C96A48',
          dark: '#964226',
          deep: '#6B301E',
        },
        cal: '#F7F3EA',
        ficha: '#FFFFFF',
        feltro: {
          DEFAULT: '#D9E24F',
          dark: '#C3CC3F',
        },
        line: '#E4DBCB',
        ink: '#241C15',
        muted: '#6E6357',
        canvas: '#F7F3EA',
        // Semántica: rojo cupo / verde pagado (contraste ≥4.5:1 sobre blanco)
        red: {
          50: '#FBECEA',
          100: '#F5D8D4',
          200: '#ECBAB3',
          300: '#DF9087',
          400: '#D06A5E',
          500: '#C43A2A',
          600: '#B3261E',
          700: '#8F1E18',
          800: '#751812',
          900: '#5C130E',
        },
        green: {
          50: '#EAF4EC',
          100: '#D4E9DA',
          200: '#AAD5BC',
          300: '#7CBD95',
          400: '#4EA571',
          500: '#2E9150',
          600: '#1F7A3D',
          700: '#186130',
          800: '#124D26',
          900: '#0C391C',
        },
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: ['var(--font-display)', 'Arial Narrow', 'ui-sans-serif', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
