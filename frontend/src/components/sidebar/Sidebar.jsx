import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import SidebarLink from "./SidebarLink";
import SidebarSection from "./SidebarSection";
import { useContext } from "react";
import { SidebarContext } from "../../context/SidebarContext";

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { isOpen, setIsOpen } = useContext(SidebarContext);

  const isActive = (path) => location.pathname === path;

  const isAdmin = () => user?.role === "admin";
  const isJuriste = () => user?.role === "juriste";
  const isCommune = () => user?.role === "commune";

  const canViewManagement = () => isAdmin() || isJuriste();
  const canViewUsers = () => isAdmin();

  const ICONS = {
    dashboard: "📊",
    interventions: "📝",
    archives: "📁",
    users: "👥",
    communes: "🏠",
    themes: "🏷️",
    settings: "⚙️",
    Faq: "❔",
  };

  return (
    <>
      {/* === MOBILE OVERLAY === */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 md:hidden z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* === SIDEBAR === */}
      <nav
        className={`
          card-light shadow-card
          fixed md:static left-0 top-0 
          h-full z-50 flex flex-col

          transform transition-transform duration-500
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}

          ${isOpen ? "w-64" : "w-64 md:w-16"}
        `}
      >
        <div className="p-4 flex-1 overflow-y-auto">
          {/* === HEADER SIDEBAR === */}
          <div className="flex items-center justify-between mb-6">
            {isOpen && (
              <div className="font-medium uppercase text-lg text-tertiary">
                Navigation
              </div>
            )}

            {/* Toggle button */}
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              className="p-2 hover:bg-light-gray transition-colors rounded"
              title={isOpen ? "Réduire" : "Ouvrir"}
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

          {/* === MAIN NAV === */}
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

          {/* === MANAGEMENT === */}
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

          {/* === ACCOUNT === */}
          <SidebarSection title="Compte" isOpen={isOpen}>
            <SidebarLink
              to="/settings"
              icon={ICONS.settings}
              title="Paramètres"
              isOpen={isOpen}
              isActive={isActive("/settings")}
            />

            <SidebarLink
              to="/Faq"
              icon={ICONS.Faq}
              title="Faq"
              isOpen={isOpen}
              isActive={isActive("/Faq")}
            />
          </SidebarSection>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
