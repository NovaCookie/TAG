// components/interventions/InterventionCard.jsx
import { Link } from "react-router-dom";
import StatusBadge from "../common/StatusBadge";
import { useAuth } from "../../context/AuthContext";

const InterventionCard = ({ intervention }) => {
  const { user } = useAuth();

  const formatDateFr = (dateInput) => {
    if (!dateInput) return "-";
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return "-";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const getInterventionStatus = (intervention) => {
    if (!intervention.reponse) {
      return "en_attente";
    } else if (intervention.reponse && !intervention.satisfaction) {
      return "repondu";
    } else {
      return "termine";
    }
  };

  const renderSatisfactionStars = (satisfaction) => {
    if (!satisfaction) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${
              star <= satisfaction ? "text-warning" : "text-tertiary"
            }`}
          >
            ★
          </span>
        ))}
        <span className="text-secondary text-xs ml-1">({satisfaction}/5)</span>
      </div>
    );
  };

  const status = getInterventionStatus(intervention);

  return (
    <div className="mb-4 last:mb-0">
      <Link
        to={`/interventions/${intervention.id}`}
        className="block hover:bg-light/30 transition-colors duration-200"
      >
        <div className="py-4 px-6 border border-light rounded-lg bg-white hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="bg-primary text-white px-3 py-1 rounded text-sm font-semibold whitespace-nowrap flex-shrink-0">
                #{intervention.id.toString().padStart(4, "0")}
              </span>
              <div className="font-medium text-secondary line-clamp-2 break-words min-w-0">
                {intervention.titre || "Sans titre"}
              </div>
            </div>
            <div className="flex-shrink-0 ml-4">
              <div className="w-8 h-8 rounded-full bg-light text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                <span className="text-sm">→</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-tertiary mb-2">
            <span className="font-medium text-secondary">
              Question posée le :
            </span>
            <span>{formatDateFr(intervention.date_question)}</span>
            <span className="font-medium text-secondary">
              Réponse donnée le :
            </span>
            <span>{formatDateFr(intervention.date_reponse)}</span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {(user?.role === "admin" || user?.role === "juriste") && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-secondary font-medium">
                    {intervention.commune?.nom}
                  </span>
                </div>
                <span className="text-light">•</span>
              </>
            )}

            <div className="flex items-center gap-2">
              <StatusBadge status={status} />
            </div>

            <span className="text-light">•</span>

            <div className="flex items-center gap-2">
              <span className="text-primary-light font-medium">
                {intervention.theme?.designation}
              </span>
            </div>

            {intervention.satisfaction && (
              <>
                <span className="text-light">•</span>
                <div className="flex items-center gap-2">
                  {renderSatisfactionStars(intervention.satisfaction)}
                </div>
              </>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default InterventionCard;
