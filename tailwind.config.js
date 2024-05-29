/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-7px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(7px)' },
        },
        flip: {
          '0%': { transform: 'rotateX(0deg)' },
          '100%': { transform: 'rotateX(360deg)' },
        },
      },
      animation: {
        shake: 'shake 0.3s ease-in-out',
        flip: 'flip 0.6s forwards',
      },
    },
  },
  plugins: [],
}
