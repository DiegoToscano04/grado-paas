/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Aquí luego pondremos los colores exactos de tu Figma
      colors: {
        primary: "#4F46E5", // Un azul/índigo por defecto
      }
    },
  },
  plugins: [],
}

