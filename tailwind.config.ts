import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#03271a',
        primaryLight: '#164938',
        secondary: '#ff751f',
        secondaryLight: '#ff8933',
        surface: '#fdf5ec',
        surfaceLowest: '#fffcf8',
        surfaceLow: '#f0e0ca',
        surfaceContainer: '#ecddd0',
        surfaceHigh: '#e8d5c4',
        surfaceHighest: '#e0ccbc',
        onSurface: '#03271a',
        onSurfaceVariant: '#1e3028',
        onPrimary: '#ffffff',
        onSecondary: '#ffffff',
        secondaryFixed: '#ffe5d4',
        onSecondaryFixed: '#ff751f',
        outlineVariant: 'rgba(3, 39, 26, 0.15)',
        cardMuted: '#eae5de',
        cardMutedDark: '#d3cdc5',
        ratingHigh: '#2e7d32',
        ratedSurface: '#eaf4ee',
        // Starsze ekrany używają gray-*/black — tu przebarwione na ciepłe tony Spoot,
        // zamiast przepisywać klasy w każdym pliku. Szarości 400+ trzymają kontrast 4.5:1 na kremie.
        gray: {
          50: '#f7efe5',
          100: '#eae5de',
          200: '#d3cdc5',
          300: '#b9b2a8',
          400: '#5f6b65',
          500: '#4a5751',
          600: '#34433c',
          700: '#1e3028',
          800: '#10291f',
          900: '#03271a',
        },
        black: '#03271a',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
    },
  },
  plugins: [],
};
export default config;
