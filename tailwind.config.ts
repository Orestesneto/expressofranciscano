import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // A escala "slate" existente passa a representar os marrons da marca.
        // Isso mantém os componentes consistentes sem perder contraste e legibilidade.
        slate: {
          50: '#fff8ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#c96b28',
          600: '#9a4d1f',
          700: '#733717',
          800: '#552812',
          900: '#3b1d0e',
          950: '#241006',
        },
        violet: colors.orange,
      },
      boxShadow: {
        soft: '0 10px 30px rgba(85, 40, 18, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
