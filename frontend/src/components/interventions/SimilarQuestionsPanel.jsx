import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { suggestionsAPI } from "../../services/api";

const SimilarQuestionsPanel = ({ interventionId }) => {
  const [similarInterventions, setSimilarInterventions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSimilarQuestions = async () => {
      try {
        setIsLoading(true);
        setError("");
        const response = await suggestionsAPI.getSimilar(interventionId, 8);
        setSimilarInterventions(response.data.similarInterventions);
      } catch (error) {
        console.error("Erreur chargement questions similaires:", error);
        setError("Erreur lors du chargement des questions similaires");
      } finally {
        setIsLoading(false);
      }
    };

    if (interventionId) {
      loadSimilarQuestions();
    }
  }, [interventionId]);

  if (isLoading) {
    return (
      <div className="card card-rounded p-6 mb-6">
        <h3 className="text-lg font-semibold text-primary mb-4">
          Recherche de questions similaires...
        </h3>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-3 border border-light rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card card-rounded p-6 mb-6 border border-warning">
        <h3 className="text-lg font-semibold text-warning mb-2">Attention</h3>
        <p className="text-warning">{error}</p>
      </div>
    );
  }

  if (similarInterventions.length === 0) {
    return (
      <div className="card card-rounded p-6 mb-6 border border-primary-200">
        <h3 className="text-lg font-semibold text-primary mb-2">
          Aucune question similaire
        </h3>
        <p className="text-tertiary text-sm">
          Aucune question similaire n'a été trouvée dans notre base de données.
        </p>
      </div>
    );
  }

  return (
    <div className="card card-rounded p-6 mb-6 border border-primary-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary">
          Questions similaires ({similarInterventions.length})
        </h3>
      </div>

      <div className="max-h-72 overflow-y-auto">
        {similarInterventions.map((intervention, index) => (
          <Link
            key={intervention.id}
            to={`/interventions/${intervention.id}`}
            target="_blank"
            className={`flex items-start gap-3 p-3 transition-colors group ${
              index < similarInterventions.length - 1
                ? "border-b border-light"
                : ""
            } hover:bg-primary-50`}
          >
            <div className="flex-shrink-0">
              <span className="bg-primary text-white px-2 py-1 rounded text-xs font-semibold">
                #{intervention.id}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-medium text-primary text-sm line-clamp-2 break-words group-hover:text-primary-600">
                {intervention.titre || "Sans titre"}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-light">
        <p className="text-xs text-tertiary">
          Cliquez sur une question pour ouvrir sa réponse complète dans un
          nouvel onglet.
        </p>
      </div>
    </div>
  );
};

export default SimilarQuestionsPanel;
