/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#5156be",
        "primary-hover": "#40449c",
        "background-light": "#f4f5f8",
        "background-dark": "#1a1a2e",
        "surface-light": "#ffffff",
        "surface-dark": "#2a2a3e",
        "text-light": "#495057",
        "text-dark": "#e9ecef",
        "text-muted-light": "#74788d",
        "text-muted-dark": "#adb5bd",
        "success-light": "#2ab57d",
        "success-hover": "#25a16d",
        "danger-light": "#fd625e",
        "success-bg-light": "rgba(42, 181, 125, 0.1)",
        "danger-bg-light": "rgba(253, 98, 94, 0.1)",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
