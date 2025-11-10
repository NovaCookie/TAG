import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import Layout from "../layout/Layout";
import { interventionsAPI } from "../../services/api";
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
  });
  const [chargement, setChargement] = useState(false);

  const chargerStatsAvancees = useCallback(async () => {
    try {
      setChargement(true);

      const params = new URLSearchParams();
      if (filtres.dateDebut) params.append("dateDebut", filtres.dateDebut);
      if (filtres.dateFin) params.append("dateFin", filtres.dateFin);
      if (filtres.strate) params.append("strate", filtres.strate);

      const response = await interventionsAPI.getAdvancedStats(
        params.toString()
      );
      setStatistiques(response.data);
    } catch (error) {
      console.error("Erreur chargement stats avancées:", error);
    } finally {
      setChargement(false);
    }
  }, [filtres]);

  useEffect(() => {
    if (user?.role === "admin") {
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

  const exporterPDF = () => {
    try {
      setChargement(true);
      const exporter = new PDFExporter();
      exporter.exportAdvancedStats(statistiques, filtres);
      setTimeout(() => setChargement(false), 500);
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      setChargement(false);
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
        <div className="bg-white rounded-xl shadow-card p-6 mb-6">
          <h3 className="text-lg font-semibold text-primary mb-4">{titre}</h3>
          <div className="text-center py-8 text-tertiary">{messageVide}</div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-card p-6 mb-6">
        <h3 className="text-lg font-semibold text-primary mb-4">{titre}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-light-gray">
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
                  className="border-b border-light-gray last:border-b-0 hover:bg-light/30 transition-colors"
                >
                  {Object.values(item).map((valeur, i) => (
                    <td key={i} className="py-3 px-4 text-sm text-tertiary">
                      {valeur}
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

  if (user?.role !== "admin") {
    return (
      <Layout activePage="stats">
        <div className="text-center py-8 text-tertiary">
          Accès réservé aux administrateurs
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

      <div className="bg-white rounded-xl shadow-card p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-primary">Filtres</h3>
          <button
            onClick={reinitialiserFiltres}
            className="text-sm text-primary hover:text-primary-light transition-colors"
          >
            Tout effacer
          </button>
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
              className="w-full px-3 py-2 border border-light-gray rounded-lg focus:outline-none focus:border-primary"
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
              className="w-full px-3 py-2 border border-light-gray rounded-lg focus:outline-none focus:border-primary"
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
              className="w-full px-3 py-2 border border-light-gray rounded-lg focus:outline-none focus:border-primary"
            >
              <option value="">Toutes les strates</option>
              <option value="petite">&lt; 100 habitants</option>
              <option value="moyenne">100-500 habitants</option>
              <option value="grande">&gt; 500 habitants</option>
            </select>
          </div>
        </div>

        {(filtres.dateDebut || filtres.dateFin || filtres.strate) && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>Filtres actifs :</strong>
              {filtres.dateDebut && ` À partir du ${filtres.dateDebut}`}
              {filtres.dateFin && ` jusqu'au ${filtres.dateFin}`}
              {filtres.strate &&
                ` • Strate: ${
                  filtres.strate === "petite"
                    ? "< 100 habitants"
                    : filtres.strate === "moyenne"
                    ? "100-500 habitants"
                    : "> 500 habitants"
                }`}
            </p>
          </div>
        )}
      </div>

      {chargement ? (
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-card p-6 animate-pulse"
            >
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
            donnees={statistiques.questionsParCommune.map((commune) => ({
              Commune: commune.commune,
              Questions: commune.nb_questions,
              Répondues: commune.questions_repondues || 0,
              "Taux réponse": commune.taux_reponse
                ? `${commune.taux_reponse}%`
                : "0%",
              Satisfaction: commune.satisfaction_moyenne
                ? `${commune.satisfaction_moyenne}/5`
                : "N/A",
            }))}
            colonnes={[
              "Commune",
              "Questions",
              "Répondues",
              "Taux réponse",
              "Satisfaction",
            ]}
          />

          <BlocStatistique
            titre="Questions par thème"
            donnees={statistiques.questionsParTheme.map((theme) => ({
              Thème: theme.theme,
              Questions: theme.nb_questions,
              Part: theme.pourcentage ? `${theme.pourcentage}%` : "0%",
              Satisfaction: theme.satisfaction_moyenne
                ? `${theme.satisfaction_moyenne}/5`
                : "N/A",
            }))}
            colonnes={["Thème", "Questions", "Part", "Satisfaction"]}
          />

          <BlocStatistique
            titre="Répartition par strate de commune"
            donnees={statistiques.questionsParStrate.map((strate) => ({
              Strate: strate.strate,
              Communes: strate.nb_communes,
              Questions: strate.nb_questions,
              Part: strate.pourcentage ? `${strate.pourcentage}%` : "0%",
              Satisfaction: strate.satisfaction_moyenne
                ? `${strate.satisfaction_moyenne}/5`
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
            donnees={statistiques.satisfactionParCommune.map((commune) => ({
              Commune: commune.commune,
              "Note moyenne": `${commune.satisfaction_moyenne}/5`,
              Évaluations: commune.nb_evaluations,
            }))}
            colonnes={["Commune", "Note moyenne", "Évaluations"]}
          />

          <BlocStatistique
            titre="Satisfaction par strate"
            donnees={statistiques.satisfactionParStrate.map((strate) => ({
              Strate: strate.strate,
              Satisfaction: `${strate.satisfaction_moyenne}/5`,
              Échantillon: strate.nb_evaluations,
            }))}
            colonnes={["Strate", "Satisfaction", "Échantillon"]}
          />
        </>
      )}

      {!chargement && statistiques.questionsParCommune.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-secondary mb-2">
            Aucune donnée statistique
          </h3>
          <p className="text-tertiary">
            Aucune intervention n'a été enregistrée pour le moment.
          </p>
        </div>
      )}
    </Layout>
  );
};

export default AdvancedStats;
