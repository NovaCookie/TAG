import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import ToggleSwitch from "../common/ToggleSwitch";

const ThemeCard = ({ theme, onStatusChange }) => {
  const { user: currentUser } = useAuth();
  const { isMobile } = useTheme();
  const navigate = useNavigate();

  const handleClick = () => {
    if (currentUser?.role === "admin" || currentUser?.role === "juriste") {
      navigate(`/themes/edit/${theme.id}`);
    }
  };

  const handleStatusToggle = (checked) => {
    if (onStatusChange) {
      onStatusChange(theme.id, checked);
    }
  };

  // Extraction sécurisée des données
  const getThemeData = () => {
    return {
      id: theme.id,
      designation: theme.designation || "Thème sans nom",
      actif: theme.actif !== undefined ? theme.actif : true,
      date_creation: theme.date_creation || new Date().toISOString(),
      interventions_count: theme._count?.interventions || 0,
      rgpd_policy: theme.rgpd_policy || null,
    };
  };

  const themeData = getThemeData();

  // Formatage de la date
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR");
    } catch (error) {
      return "Date inconnue";
    }
  };

  // Durée RGPD
  const getDurationDisplay = () => {
    if (themeData.rgpd_policy) {
      return `${themeData.rgpd_policy.duree_mois} mois`;
    }
    return "24 mois (défaut)";
  };

  // Description RGPD
  const getRgpdDescription = () => {
    if (themeData.rgpd_policy?.description) {
      return themeData.rgpd_policy.description;
    }
    return "Aucune politique RGPD spécifique";
  };

  return (
    <div
      className="card card-rounded p-4 sm:p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border border-light hover:border-primary/20"
      onClick={handleClick}
    >
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Avatar du thème */}
        <div className="flex-shrink-0 flex items-center">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-lg">
            #
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* En-tête avec nom du thème */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <h3 className="text-lg font-semibold text-primary truncate">
              {themeData.designation}
            </h3>

            {/* Toggle actif/inactif (seulement pour admin et juriste) */}
            {(currentUser?.role === "admin" ||
              currentUser?.role === "juriste") && (
              <div
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <ToggleSwitch
                  checked={themeData.actif}
                  onChange={handleStatusToggle}
                  size="sm"
                />
                <span
                  className={`text-sm font-medium ${
                    themeData.actif ? "text-success" : "text-tertiary"
                  }`}
                >
                  {themeData.actif ? "Actif" : "Inactif"}
                </span>
              </div>
            )}

            {/* Affichage statut seulement pour non-admin/juriste */}
            {!(
              currentUser?.role === "admin" || currentUser?.role === "juriste"
            ) && (
              <span
                className={`text-sm font-medium ${
                  themeData.actif ? "text-success" : "text-tertiary"
                }`}
              >
                {themeData.actif ? "Actif" : "Inactif"}
              </span>
            )}
          </div>

          {/* Bloc infos (2 colonnes) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Colonne gauche - Informations générales */}
            <div className="space-y-2">
              {/* Date de création */}
              <div className="flex items-center gap-2 text-sm text-secondary">
                <span className="text-tertiary">📅</span>
                <span>Créé le {formatDate(themeData.date_creation)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-secondary">
                <span className="text-tertiary">📋</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {themeData.interventions_count || 0}
                  </span>
                  <span>
                    {/* Nombre d'interventions */}
                    intervention
                    {themeData.interventions_count !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Colonne droite - Statistiques */}
            <div className="space-y-2">
              {/* Durée RGPD */}
              <div className="flex items-center gap-2 text-sm text-secondary">
                <span className="text-tertiary">⏱️</span>
                <span className="font-medium">{getDurationDisplay()}</span>
              </div>

              {/* Description RGPD */}
              <div className="flex items-start gap-2 text-sm text-secondary">
                <span className="text-tertiary mt-0.5">📝</span>
                <span className="line-clamp-2">{getRgpdDescription()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* FLECHE – tout à droite (seulement pour admin et juriste) */}
        {(currentUser?.role === "admin" || currentUser?.role === "juriste") && (
          <div className="hidden sm:flex items-center text-primary text-xl transform rotate-45 flex-shrink-0">
            ↗
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeCard;
