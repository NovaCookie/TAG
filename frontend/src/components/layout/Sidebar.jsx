import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
// import { useTheme } from "../../context/ThemeContext";

const Sidebar = ({ activePage }) => {
  const { user } = useAuth();
  // const { theme } = useTheme();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const canViewAll = () => ["admin", "juriste"].includes(user?.role);
  const canManageUsers = () => user?.role === "admin";

  const getLinkClasses = (path) => {
    const baseClasses =
      "flex items-center px-4 py-3 rounded-lg mb-2 transition-colors duration-300";

    if (isActive(path)) {
      return `${baseClasses} bg-light text-primary font-medium dark:bg-gray-700 dark:text-white`;
    }

    return `${baseClasses} text-tertiary hover:bg-light-gray dark:hover:bg-gray-700 dark:hover:text-white`;
  };

  const getSectionTitleClasses = () =>
    "text-sm font-medium uppercase px-3 mb-4 transition-colors duration-300 text-tertiary";

  return (
    <nav className="card-light w-64 p-6">
      {/* Navigation Principale */}
      <div className={getSectionTitleClasses()}>Navigation</div>

      <Link to="/dashboard" className={getLinkClasses("/dashboard")}>
        Tableau de bord
      </Link>

      <Link to="/interventions" className={getLinkClasses("/interventions")}>
        {user?.role === "commune" ? "Mes questions" : "Interventions"}
      </Link>

      <Link to="/messaging" className={getLinkClasses("/messaging")}>
        Messagerie
      </Link>

      {/* Menu Gestion - Admin/Juriste seulement */}
      {(canViewAll() || canManageUsers()) && (
        <>
          <div className={`${getSectionTitleClasses()} mt-6`}>Gestion</div>

          {canManageUsers() && (
            <Link to="/users" className={getLinkClasses("/users")}>
              Utilisateurs
            </Link>
          )}

          {canManageUsers() && (
            <Link to="/communes" className={getLinkClasses("/communes")}>
              Communes
            </Link>
          )}
        </>
      )}

      {/* Menu Compte */}
      <div className={`${getSectionTitleClasses()} mt-6`}>Compte</div>

      <Link to="/settings" className={getLinkClasses("/settings")}>
        Paramètres
      </Link>

      <Link to="/support" className={getLinkClasses("/support")}>
        Support
      </Link>
    </nav>
  );
};

export default Sidebar;
