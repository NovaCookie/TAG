// components/communes/CommuneCard.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import ToggleSwitch from "../common/ToggleSwitch";

const CommuneCard = ({ commune, onStatusChange }) => {
  const { user: currentUser } = useAuth();
  const { isMobile } = useTheme();
  const navigate = useNavigate();

  const handleClick = () => {
    if (currentUser?.role === "admin" || currentUser?.role === "juriste") {
      navigate(`/communes/${commune.id}`);
    }
  };

  const handleStatusToggle = (checked) => {
    if (onStatusChange) {
      onStatusChange(commune.id, checked);
    }
  };

  // Extraction sécurisée des données
  const getCommuneData = () => {
    return {
      id: commune.id,
      nom: commune.nom || "Commune sans nom",
      code_postal: commune.code_postal || null,
      population: commune.population || 0,
      actif: commune.actif !== undefined ? commune.actif : true,
      stats: commune.stats || { nb_utilisateurs: 0, nb_interventions: 0 },
    };
  };

  const communeData = getCommuneData();

  // Formatage de la population
  const formatPopulation = (population) => {
    return population?.toLocaleString() || "0";
  };

  return (
    <div
      className="card card-rounded p-4 sm:p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border border-light hover:border-primary/20"
      onClick={handleClick}
    >
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Avatar de la commune */}
        <div className="flex-shrink-0 flex items-center">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-lg">
            {communeData.nom[0]?.toUpperCase() || "C"}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* En-tête avec nom */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <h3 className="text-lg font-semibold text-primary truncate">
              {communeData.nom}
            </h3>

            {/* Toggle actif/inactif (seulement pour admin) */}
            {currentUser?.role === "admin" && (
              <div
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <ToggleSwitch
                  checked={communeData.actif}
                  onChange={handleStatusToggle}
                  size="sm"
                />
                <span
                  className={`text-sm font-medium ${
                    communeData.actif ? "text-success" : "text-tertiary"
                  }`}
                >
                  {communeData.actif ? "Actif" : "Inactif"}
                </span>
              </div>
            )}

            {/* Affichage statut seulement pour non-admin */}
            {currentUser?.role !== "admin" && (
              <span
                className={`text-sm font-medium ${
                  communeData.actif ? "text-success" : "text-tertiary"
                }`}
              >
                {communeData.actif ? "Actif" : "Inactif"}
              </span>
            )}
          </div>

          {/* Bloc infos (2 colonnes) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Colonne gauche - Informations générales */}
            <div className="space-y-2">
              {/* Population */}
              <div className="flex items-center gap-2 text-sm text-secondary">
                <span className="text-tertiary">👥</span>
                <span className="font-medium">
                  {formatPopulation(communeData.population)} habitants
                </span>
              </div>

              {/* Code postal */}
              {communeData.code_postal && (
                <div className="flex items-center gap-2 text-sm text-secondary">
                  <span className="text-tertiary">📮</span>
                  <span>{communeData.code_postal}</span>
                </div>
              )}
            </div>

            {/* Colonne droite - Statistiques */}
            <div className="space-y-2">
              {/* Nombre d'utilisateurs */}
              <div className="flex items-center gap-2 text-sm text-secondary">
                <span className="text-tertiary">👤</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {communeData.stats.nb_utilisateurs || 0}
                  </span>
                  <span>
                    utilisateur
                    {communeData.stats.nb_utilisateurs !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Nombre d'interventions */}
              <div className="flex items-center gap-2 text-sm text-secondary">
                <span className="text-tertiary">📋</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {communeData.stats.nb_interventions || 0}
                  </span>
                  <span>
                    intervention
                    {communeData.stats.nb_interventions !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FLECHE – tout à droite (seulement pour admin et juriste) */}
        {(currentUser?.role === "admin" || currentUser?.role === "juriste") && (
          <div className="w-8 h-8 rounded-full bg-light text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
            <span className="text-sm">→</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommuneCard;
