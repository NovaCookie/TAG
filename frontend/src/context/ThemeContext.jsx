import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // ⚠️ DARK MODE DÉSACTIVÉ - Pour réactiver : remplacer "light" par la ligne commentée ci-dessous
  const [theme, setTheme] = useState("light");
  // Pour réactiver le dark mode :
  // const [theme, setTheme] = useState(() => localStorage.getItem("tag-theme") || "light");

  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
  });

  useEffect(() => {
    // ⚠️ DARK MODE DÉSACTIVÉ - Pour réactiver : décommenter la ligne ci-dessous
    // localStorage.setItem("tag-theme", theme);

    // Force le light mode dans le DOM
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.classList.remove("dark");
  }, []); // S'exécute une fois au démarrage

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
        isDesktop: window.innerWidth >= 1024,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ⚠️ DARK MODE DÉSACTIVÉ - Pour réactiver : décommenter la fonction ci-dessous
  const toggleTheme = () => {
    // Ne rien faire - dark mode désactivé
  };
  // Pour réactiver le toggle :
  // const toggleTheme = () => {
  //   setTheme(prev => {
  //     const newTheme = prev === "light" ? "dark" : "light";
  //     localStorage.setItem("tag-theme", newTheme);
  //     return newTheme;
  //   });
  // };

  const value = {
    theme: "light", // ⚠️ Toujours "light" - pour réactiver : remplacer par `theme`
    setTheme, // ⚠️ Fonction inactive - pour réactiver : laisser tel quel
    toggleTheme,
    ...screenSize,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
