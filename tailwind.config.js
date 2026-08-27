export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      animation: {
        bounce: 'bounce 1s infinite',
      },
      transitionDelay: {
        100: '100ms',
        200: '200ms',
      }
    },
  },
  plugins: [],
}
