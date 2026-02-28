import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#141414',
          hover: '#1c1c1c',
          light: '#1e1e1e',
        },
        border: {
          DEFAULT: '#262626',
          light: '#333333',
        },
        muted: {
          DEFAULT: '#737373',
          light: '#a3a3a3',
        },
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
    },
  },
  plugins: [],
};

export default config;
