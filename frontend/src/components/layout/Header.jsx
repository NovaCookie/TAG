import { useAuth } from "../../context/AuthContext";
import UserAvatar from "../common/UserAvatar";
import { useTheme } from "../../context/ThemeContext";
import { useContext } from "react";
import { SidebarContext } from "../../context/SidebarContext";

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { setIsOpen } = useContext(SidebarContext);

  return (
    <header className="card-light px-6 md:px-10 py-5 flex justify-between items-center">
      <div className="flex items-center gap-4">
        {/* Petit bouton burger  */}
        <button
          className="md:hidden p-3 text-2xl text-primary"
          onClick={() => setIsOpen(true)}
          title="Ouvrir la navigation"
        >
          ☰
        </button>

        <h1 className="text-2xl font-bold text-primary">TAG</h1>
        <div className="text-sm text-tertiary hidden sm:block">
          Tekniske Agentur Grønland
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Toggle du thème */}
        {/* Implémentation non fini, l'enlever ? */}
        {/* <button
          onClick={toggleTheme}
          className="p-2 transition-all duration-300 bg-light text-secondary hover:bg-light-gray dark:bg-dark-card dark:text-dark-tertiary dark:hover:bg-gray-700"
          title={
            theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"
          }
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button> */}

        <div className="text-right hidden sm:block">
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

        <UserAvatar prenom={user?.prenom} nom={user?.nom} size="md" />

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
