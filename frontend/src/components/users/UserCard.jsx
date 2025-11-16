import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import UserAvatar from "../common/UserAvatar";

const UserCard = ({ user }) => {
  const { user: currentUser } = useAuth();
  const { isMobile } = useTheme();
  const navigate = useNavigate();

  const handleClick = () => {
    if (currentUser?.role === "admin") {
      navigate(`/users/edit/${user.id}`);
    }
  };

  // Extraction sécurisée des données
  const getUserData = () => {
    return {
      id: user.id,
      prenom: user.prenom || "Prénom",
      nom: user.nom || "Nom",
      email: user.email || "Email non disponible",
      role: user.role || "utilisateur",
      date_creation: user.date_creation || new Date().toISOString(),
      commune: user.commune || null,
    };
  };

  const userData = getUserData();

  // Formatage de la date
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR");
    } catch (error) {
      return "Date inconnue";
    }
  };

  return (
    <div
      className="card card-rounded p-4 sm:p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border border-light hover:border-primary/20"
      onClick={handleClick}
    >
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex-shrink-0 flex items-center">
          <UserAvatar
            prenom={userData.prenom}
            nom={userData.nom}
            size={isMobile ? "md" : "lg"}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <h3 className="text-lg font-semibold text-primary truncate">
              {userData.prenom} {userData.nom}
            </h3>
          </div>

          {/* Bloc infos (2 colonnes) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Colonne gauche */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-secondary">
                <span className="text-tertiary">📧</span>
                <span className="truncate">{userData.email}</span>
              </div>

              {userData.commune && (
                <div className="flex items-center gap-2 text-sm text-secondary">
                  <span className="text-tertiary">🏠</span>
                  <span className="font-medium truncate">
                    {userData.commune.nom}
                    {userData.commune.population && (
                      <span className="text-xs text-tertiary ml-1">
                        ({userData.commune.population.toLocaleString()} hab.)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Colonne droite */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-secondary">
                <span className="text-tertiary">📅</span>
                <span>Inscrit le {formatDate(userData.date_creation)}</span>
              </div>

              {/* Rôle affiché pour les non-admin (en bas) */}
              <div className="flex items-center gap-2 text-sm text-secondary">
                <span className="text-tertiary">👤</span>
                <span>{userData.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* FLECHE – tout à droite (seulement pour admin) */}
        {currentUser?.role === "admin" && (
          <div className="hidden sm:flex items-center text-primary text-xl transform rotate-45 flex-shrink-0">
            ↗
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCard;
