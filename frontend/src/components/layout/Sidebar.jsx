import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import SidebarLink from "../sidebar/SidebarLink";
import SidebarSection from "../sidebar/SidebarSection";

const Sidebar = ({ isOpen, onToggle }) => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const canViewAll = () => ["admin", "juriste"].includes(user?.role);
  const canManageUsers = () => user?.role === "admin";

  const ICONS = {
    dashboard: "📊",
    interventions: "📝",
    messaging: "💬",
    users: "👥",
    communes: "🏠",
    settings: "⚙️",
    support: "❔",
  };

  return (
    <nav
      className={`card-light shadow-card ${
        isOpen ? "w-64" : "w-16"
      } overflow-hidden transition-all duration-1000`}
    >
      <div className="p-4 ">
        {/* Flèche et Navigation sur la même ligne */}
        <div className="flex items-center justify-between mb-6">
          {isOpen && (
            <div className="font-medium uppercase text-lg text-tertiary">
              Navigation
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-2 hover:bg-light-gray transition-colors rounded flex-shrink-0"
            title={isOpen ? "Réduire la sidebar" : "Étendre la sidebar"}
          >
            {isOpen ? (
              <svg
                className="w-5 h-5 text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Navigation Principale */}
        <SidebarSection isOpen={isOpen}>
          <SidebarLink
            to="/dashboard"
            icon={ICONS.dashboard}
            title="Tableau de bord"
            isOpen={isOpen}
            isActive={isActive("/dashboard")}
          />
          <SidebarLink
            to="/interventions"
            icon={ICONS.interventions}
            title={user?.role === "commune" ? "Mes questions" : "Interventions"}
            isOpen={isOpen}
            isActive={isActive("/interventions")}
          />
          <SidebarLink
            to="/messaging"
            icon={ICONS.messaging}
            title="Messagerie"
            isOpen={isOpen}
            isActive={isActive("/messaging")}
          />
        </SidebarSection>

        {/* Menu Gestion - Admin/Juriste seulement */}
        {(canViewAll() || canManageUsers()) && (
          <SidebarSection title="Gestion" isOpen={isOpen}>
            {canManageUsers() && (
              <SidebarLink
                to="/users"
                icon={ICONS.users}
                title="Utilisateurs"
                isOpen={isOpen}
                isActive={isActive("/users")}
              />
            )}
            {canManageUsers() && (
              <SidebarLink
                to="/communes"
                icon={ICONS.communes}
                title="Communes"
                isOpen={isOpen}
                isActive={isActive("/communes")}
              />
            )}
          </SidebarSection>
        )}

        {/* Menu Compte */}
        <SidebarSection title="Compte" isOpen={isOpen}>
          <SidebarLink
            to="/settings"
            icon={ICONS.settings}
            title="Paramètres"
            isOpen={isOpen}
            isActive={isActive("/settings")}
          />
          <SidebarLink
            to="/support"
            icon={ICONS.support}
            title="Support"
            isOpen={isOpen}
            isActive={isActive("/support")}
          />
        </SidebarSection>
      </div>
    </nav>
  );
};

export default Sidebar;
