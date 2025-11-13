import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import Layout from "../layout/Layout";
import { statsAPI } from "../../services/api";
import PDFExporter from "../../services/pdfExport";

const AdvancedStats = () => {
  const { user } = useAuth();
  const [filtres, setFiltres] = useState({
    dateDebut: "",
    dateFin: "",
    strate: "",
  });
  const [statistiques, setStatistiques] = useState({
    questionsParCommune: [],
    questionsParTheme: [],
    questionsParStrate: [],
    satisfactionParCommune: [],
    satisfactionParStrate: [],
    resume: {},
  });
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);

  const chargerStatsAvancees = useCallback(async () => {
    try {
      setChargement(true);
      setErreur(null);

      const response = await statsAPI.getAdvanced(filtres);

      setStatistiques(response.data);
    } catch (error) {
      console.error("Erreur chargement stats avancées:", error);
      setErreur("Erreur lors du chargement des statistiques");
    } finally {
      setChargement(false);
    }
  }, [filtres]);

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "juriste") {
      chargerStatsAvancees();
    }
  }, [chargerStatsAvancees, user]);

  const reinitialiserFiltres = () => {
    setFiltres({
      dateDebut: "",
      dateFin: "",
      strate: "",
    });
  };

  const appliquerFiltres = () => {
    chargerStatsAvancees();
  };

  const exporterPDF = () => {
    try {
      const exporter = new PDFExporter();
      exporter.exportAdvancedStats(statistiques, filtres);
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      setErreur("Erreur lors de l'export PDF");
    }
  };

  const BlocStatistique = ({
    titre,
    donnees,
    colonnes,
    messageVide = "Aucune donnée disponible",
  }) => {
    if (!donnees || donnees.length === 0) {
      return (
        <div className="card card-rounded p-6 mb-6">
          <h3 className="text-lg font-semibold text-primary mb-4">{titre}</h3>
          <div className="text-center py-8 text-tertiary">{messageVide}</div>
        </div>
      );
    }

    return (
      <div className="card card-rounded p-6 mb-6">
        <h3 className="text-lg font-semibold text-primary mb-4">{titre}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-light">
                {colonnes.map((col, index) => (
                  <th
                    key={index}
                    className="text-left py-3 px-4 text-sm font-semibold text-secondary bg-light"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {donnees.map((item, index) => (
                <tr
                  key={index}
                  className="border-b border-light last:border-b-0 hover:bg-light/30 transition-colors"
                >
                  {Object.values(item).map((valeur, i) => (
                    <td key={i} className="py-3 px-4 text-sm text-tertiary">
                      {typeof valeur === "number" && valeur % 1 !== 0
                        ? valeur.toFixed(2)
                        : valeur}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Vérification des permissions
  if (user?.role !== "admin" && user?.role !== "juriste") {
    return (
      <Layout activePage="stats">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-xl font-semibold text-secondary mb-2">
              Accès non autorisé
            </h2>
            <p className="text-tertiary">
              Cette page est réservée aux administrateurs et juristes.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activePage="stats">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-primary mb-2">
            Statistiques Avancées
          </h1>
          <p className="text-secondary">
            Tableaux de bord quantitatifs de l'activité TAG
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={reinitialiserFiltres}
            className="bg-gray-500 text-white rounded-lg px-4 py-2 font-semibold hover:bg-gray-600 transition-colors"
          >
            Réinitialiser
          </button>
          <button
            onClick={exporterPDF}
            disabled={chargement}
            className={`bg-primary text-white rounded-lg px-4 py-2 font-semibold transition-colors flex items-center gap-2 ${
              chargement
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-primary-light"
            }`}
          >
            {chargement ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Génération...
              </>
            ) : (
              <>📄 Exporter PDF</>
            )}
          </button>
        </div>
      </div>

      {/* Section Filtres */}
      <div className="card card-rounded p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-primary">Filtres</h3>
          <div className="flex gap-2">
            <button
              onClick={reinitialiserFiltres}
              className="text-sm text-tertiary hover:text-secondary transition-colors"
            >
              Tout effacer
            </button>
            <button
              onClick={appliquerFiltres}
              disabled={chargement}
              className="text-sm bg-primary text-white px-3 py-1 rounded hover:bg-primary-light transition-colors"
            >
              Appliquer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Date début
            </label>
            <input
              type="date"
              value={filtres.dateDebut}
              onChange={(e) =>
                setFiltres({ ...filtres, dateDebut: e.target.value })
              }
              className="w-full px-3 py-2 border border-light rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Date fin
            </label>
            <input
              type="date"
              value={filtres.dateFin}
              onChange={(e) =>
                setFiltres({ ...filtres, dateFin: e.target.value })
              }
              className="w-full px-3 py-2 border border-light rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Strate de population
            </label>
            <select
              value={filtres.strate}
              onChange={(e) =>
                setFiltres({ ...filtres, strate: e.target.value })
              }
              className="w-full px-3 py-2 border border-light rounded-lg focus:outline-none focus:border-primary"
            >
              <option value="">Toutes les strates</option>
              <option value="petite">&lt; 100 habitants</option>
              <option value="moyenne">100-500 habitants</option>
              <option value="grande">&gt; 500 habitants</option>
            </select>
          </div>
        </div>
      </div>

      {/* Message d'erreur */}
      {erreur && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <p className="text-danger-700">{erreur}</p>
          </div>
        </div>
      )}

      {chargement ? (
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card card-rounded p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-2">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <BlocStatistique
            titre="Questions par commune"
            donnees={statistiques.questionsParCommune?.map((commune) => ({
              Commune: commune.commune,
              Population: commune.population || 0,
              Questions: commune.nb_questions || 0,
              Répondues: commune.questions_repondues || 0,
              "Taux réponse": commune.taux_reponse
                ? `${commune.taux_reponse}%`
                : "0%",
              Satisfaction: commune.satisfaction_moyenne
                ? `${commune.satisfaction_moyenne.toFixed(1)}/5`
                : "N/A",
            }))}
            colonnes={[
              "Commune",
              "Population",
              "Questions",
              "Répondues",
              "Taux réponse",
              "Satisfaction",
            ]}
          />

          <BlocStatistique
            titre="Questions par thème"
            donnees={statistiques.questionsParTheme?.map((theme) => ({
              Thème: theme.theme,
              Questions: theme.nb_questions || 0,
              Part: theme.pourcentage ? `${theme.pourcentage}%` : "0%",
              Satisfaction: theme.satisfaction_moyenne
                ? `${theme.satisfaction_moyenne.toFixed(1)}/5`
                : "N/A",
            }))}
            colonnes={["Thème", "Questions", "Part", "Satisfaction"]}
          />

          <BlocStatistique
            titre="Répartition par strate de commune"
            donnees={statistiques.questionsParStrate?.map((strate) => ({
              Strate: strate.strate,
              Communes: strate.nb_communes || 0,
              Questions: strate.nb_questions || 0,
              Part: strate.pourcentage ? `${strate.pourcentage}%` : "0%",
              Satisfaction: strate.satisfaction_moyenne
                ? `${strate.satisfaction_moyenne.toFixed(1)}/5`
                : "N/A",
            }))}
            colonnes={[
              "Strate",
              "Communes",
              "Questions",
              "Part",
              "Satisfaction",
            ]}
          />

          <BlocStatistique
            titre="Satisfaction par commune"
            donnees={statistiques.satisfactionParCommune?.map((commune) => ({
              Commune: commune.commune,
              "Note moyenne": `${
                commune.satisfaction_moyenne?.toFixed(1) || 0
              }/5`,
              Évaluations: commune.nb_evaluations || 0,
              "Taux évaluation": commune.taux_evaluation
                ? `${commune.taux_evaluation}%`
                : "0%",
            }))}
            colonnes={[
              "Commune",
              "Note moyenne",
              "Évaluations",
              "Taux évaluation",
            ]}
          />

          <BlocStatistique
            titre="Satisfaction par strate"
            donnees={statistiques.satisfactionParStrate?.map((strate) => ({
              Strate: strate.strate,
              Satisfaction: `${strate.satisfaction_moyenne?.toFixed(1) || 0}/5`,
              Échantillon: strate.nb_evaluations || 0,
              Minimum: strate.note_min || "N/A",
              Maximum: strate.note_max || "N/A",
            }))}
            colonnes={[
              "Strate",
              "Satisfaction",
              "Échantillon",
              "Minimum",
              "Maximum",
            ]}
          />
        </>
      )}

      {!chargement &&
        (!statistiques.questionsParCommune ||
          statistiques.questionsParCommune.length === 0) &&
        (!statistiques.questionsParTheme ||
          statistiques.questionsParTheme.length === 0) && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-secondary mb-2">
              Aucune donnée statistique
            </h3>
            <p className="text-tertiary">
              Aucune intervention n'a été enregistrée pour le moment ou avec les
              filtres actuels.
            </p>
          </div>
        )}
    </Layout>
  );
};

export default AdvancedStats;
