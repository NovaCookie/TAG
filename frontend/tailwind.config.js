/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs light mode (existantes)
        primary: "#2c5e92",
        "primary-light": "#4a7db0",
        secondary: "#4a5568",
        "secondary-light": "#718096",
        light: "#f8fafc",
        "light-gray": "#e2e8f0",
        success: "#38a169",
        warning: "#dd6b20",
        danger: "#e53e3e",
        white: "#ffffff",

        // Couleurs dark mode
        dark: {
          bg: "#1a202c", // Background principal
          card: "#2d3748", // Cartes (moins blanc)
          "card-light": "#374151", // Cartes plus claires
          text: {
            primary: "#f7fafc", // Texte principal (plus clair)
            secondary: "#e2e8f0", // Texte secondaire
            tertiary: "#a0aec0", // Texte tertiaire
          },
          border: "#4a5568", // Bordures
        },
      },
      backgroundColor: {
        "dark-card": "#2d3748", // Pour les cartes en dark
        "dark-card-light": "#374151", // Cartes plus claires
        "dark-bg": "#1a202c", // Background principal dark
      },
      textColor: {
        "dark-primary": "#f7fafc", // Texte principal dark
        "dark-secondary": "#e2e8f0", // Texte secondaire dark
        "dark-tertiary": "#a0aec0", // Texte tertiaire dark
      },
      borderColor: {
        dark: "#4a5568", // Bordures dark
        "dark-border": "#4a5568", // Alias pour bordures dark
      },
      boxShadow: {
        card: "0 4px 6px rgba(0, 0, 0, 0.05)",
        "card-dark": "0 4px 6px rgba(0, 0, 0, 0.2)",
      },
      transitionProperty: {
        width: "width",
        margin: "margin",
      },
    },
  },
  plugins: [],
};
