import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import SidebarLink from "./SidebarLink";
import SidebarSection from "./SidebarSection";

const Sidebar = ({ isOpen, onToggle }) => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const isAdmin = () => user?.role === "admin";
  const isJuriste = () => user?.role === "juriste";
  const isCommune = () => user?.role === "commune";

  const canViewManagement = () => isAdmin() || isJuriste();
  const canViewUsers = () => isAdmin(); // Seulement admin pour page utilisateurs

  const ICONS = {
    dashboard: "📊",
    interventions: "📝",
    archives: "📁",
    users: "👥",
    communes: "🏠",
    themes: "🏷️",
    settings: "⚙️",
    support: "❔",
  };

  return (
    <nav
      className={`card-light shadow-card ${
        isOpen ? "w-64" : "w-16"
      } overflow-hidden transition-all duration-1000`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          {isOpen && (
            <div className="font-medium uppercase text-lg text-tertiary">
              Navigation
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-2 hover:bg-light-gray transition-colors rounded flex-shrink-0"
            title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
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

        {/* === MAIN NAVIGATION === */}
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
            title={isCommune() ? "Mes Questions" : "Interventions"}
            isOpen={isOpen}
            isActive={isActive("/interventions")}
          />
        </SidebarSection>

        {/* === MANAGEMENT SECTION === */}
        {canViewManagement() && (
          <SidebarSection title="Gestion" isOpen={isOpen}>
            {canViewUsers() && (
              <SidebarLink
                to="/users"
                icon={ICONS.users}
                title="Utilisateurs"
                isOpen={isOpen}
                isActive={isActive("/users")}
              />
            )}
            <SidebarLink
              to="/communes"
              icon={ICONS.communes}
              title="Communes"
              isOpen={isOpen}
              isActive={isActive("/communes")}
            />

            <SidebarLink
              to="/themes"
              icon={ICONS.themes}
              title="Thèmes"
              isOpen={isOpen}
              isActive={isActive("/themes")}
            />

            <SidebarLink
              to="/archives"
              icon={ICONS.archives}
              title="Archives"
              isOpen={isOpen}
              isActive={isActive("/archives")}
            />
          </SidebarSection>
        )}

        {/* === ACCOUNT SECTION === */}
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
