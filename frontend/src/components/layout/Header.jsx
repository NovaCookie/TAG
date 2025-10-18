import React from "react";
import { useAuth } from "../../context/AuthContext";
// import { useTheme } from "../../context/ThemeContext";

const Header = () => {
  const { user, logout } = useAuth();
  // const { theme, toggleTheme } = useTheme();

  return (
    <header className="card-light px-10 py-5 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-primary">TAG</h1>
        <div className="text-sm text-tertiary">Tekniske Agentur Grønland</div>
      </div>

      <div className="flex items-center gap-4">
        {/* Toggle du thème */}
        {/* <button
          onClick={toggleTheme}
          className="p-2  transition-all duration-300 bg-light text-secondary hover:bg-light-gray dark:bg-dark-card dark:text-dark-tertiary dark:hover:bg-gray-700"
          title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button> */}

        <div className="text-right">
          <div className="font-medium text-secondary">
            {user?.prenom} {user?.nom}
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="px-3 py-1 rounded-full text-xs font-medium capitalize bg-light text-primary dark:bg-dark-card dark:text-dark-secondary">
              {user?.role}
            </div>
            {user?.role === "commune" && user?.commune && (
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">
                {user.commune.nom}
              </div>
            )}
          </div>
        </div>

        <div className="w-10 h-10 rounded-full bg-primary-light text-white flex items-center justify-center font-semibold">
          {user?.prenom?.[0]}
          {user?.nom?.[0]}
        </div>

        <button
          onClick={logout}
          className="text-sm text-tertiary hover:text-secondary transition-colors"
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
};

export default Header;
