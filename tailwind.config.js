/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#050508',
          card: '#0f0f15',
          blue: '#00ccff',
          cyan: '#00f5ff',
          darkBlue: '#020205',
          neonText: '#bbf0ff',
        }
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'neon-blue': '0 0 10px rgba(0, 204, 255, 0.4), 0 0 20px rgba(0, 204, 255, 0.2)',
        'neon-cyan': '0 0 5px rgba(0, 245, 255, 0.5), 0 0 15px rgba(0, 245, 255, 0.3)',
      }
    },
  },
  plugins: [],
}
