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
