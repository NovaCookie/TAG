import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Récupère le thème depuis le localStorage ou utilise 'light' par défaut
    const savedTheme = localStorage.getItem("tag-theme");
    return savedTheme || "light";
  });

  useEffect(() => {
    // Sauvegarde le thème dans le localStorage
    localStorage.setItem("tag-theme", theme);

    // Applique le thème au document
    document.documentElement.setAttribute("data-theme", theme);

    // Met à jour les classes Tailwind
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
