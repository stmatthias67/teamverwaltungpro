/** @type {import('tailwindcss').Config} */
// Farben kommen aus den CSS-Variablen in app/globals.css und wechseln mit dem Theme.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        main: token('bg'),
        deep: token('deep'),
        card: token('card'),
        raised: token('raised'),
        fg: token('fg'),
        fg2: token('fg2'),
        muted: token('muted'),
        accent: token('accent'),
        primary: token('accent'),
        'on-accent': token('on-accent'),
        inv: token('inv'),
        'inv-fg': token('inv-fg'),
        pos: token('pos'),
        neg: token('neg'),
        line: 'var(--line)',
        // Bestehende slate-Klassen bleiben nutzbar und wechseln mit dem Theme
        slate: {
          50: token('fg'),
          100: token('fg'),
          200: token('fg'),
          300: token('fg2'),
          400: token('fg2'),
          500: token('muted'),
          600: token('muted'),
          700: token('line-strong'),
          800: token('card'),
          900: token('deep'),
          950: token('bg'),
        },
      },
      fontFamily: {
        sans: ["'Instrument Sans'", 'system-ui', 'sans-serif'],
      },
      transitionTimingFunction: {
        ui: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
