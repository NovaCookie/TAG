import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import StatBlock from "./stats/StatBlock";
import { formatDate } from "../utils/helpers";
import { interventionsAPI, usersAPI } from "../services/api";

const Dashboard = () => {
  const { user } = useAuth();

  const [statistiques, setStatistiques] = useState({
    totalQuestions: 0,
    questionsEnAttente: 0,
    questionsRepondues: 0,
    totalCommunes: 0,
    totalUtilisateurs: 0,
    satisfactionMoyenne: 0,
    tauxReponse: 0,
    questionsParCommune: [],
    questionsParTheme: [],
    questionsParStrate: [],
    satisfactionParCommune: [],
    satisfactionParStrate: [],
  });

  const [dernieresQuestions, setDernieresQuestions] = useState([]);
  const [chargement, setChargement] = useState(true);

  const chargerDonneesTableauDeBord = useCallback(async () => {
    try {
      setChargement(true);
      await Promise.all([
        chargerStatistiquesUtilisateur(),
        chargerDernieresQuestions(),
      ]);
    } catch (erreur) {
      console.error("Erreur chargement tableau de bord :", erreur);
    } finally {
      setChargement(false);
    }
  }, [user]);

  useEffect(() => {
    chargerDonneesTableauDeBord();
  }, [chargerDonneesTableauDeBord]);

  const chargerStatistiquesUtilisateur = async () => {
    try {
      let donnees = {
        totalQuestions: 0,
        questionsEnAttente: 0,
        questionsRepondues: 0,
        totalCommunes: 0,
        totalUtilisateurs: 0,
        satisfactionMoyenne: 0,
        tauxReponse: 0,
      };

      if (user?.role === "commune") {
        const reponse = await interventionsAPI.getAll({ limit: 1000 });
        const interventions = reponse.data.interventions || [];

        donnees = {
          ...donnees,
          totalQuestions: interventions.length,
          questionsEnAttente: interventions.filter((i) => !i.reponse).length,
          questionsRepondues: interventions.filter((i) => i.reponse).length,
        };
      } else if (user?.role === "juriste") {
        const reponse = await interventionsAPI.getAll({ limit: 1000 });
        const interventions = reponse.data.interventions || [];

        donnees = {
          ...donnees,
          totalQuestions: interventions.filter((i) => !i.reponse).length,
          questionsEnAttente: interventions.filter((i) => !i.reponse).length,
          questionsRepondues: interventions.filter((i) => i.reponse).length,
        };
      } else if (user?.role === "admin") {
        try {
          const [statsUtilisateurs, statsAvancees] = await Promise.all([
            usersAPI.getStats().catch(() => ({ data: {} })),
            interventionsAPI.getAdvancedStats().catch(() => ({ data: {} })),
          ]);

          const reponseToutes = await interventionsAPI.getAll({ limit: 1000 });
          const toutesInterventions = reponseToutes.data.interventions || [];

          const enAttente = toutesInterventions.filter((i) => !i.reponse);
          const repondues = toutesInterventions.filter((i) => i.reponse);

          const interventionsAvecSatisfaction = toutesInterventions.filter(
            (i) => i.satisfaction
          );
          const moyenneSatisfaction =
            interventionsAvecSatisfaction.length > 0
              ? interventionsAvecSatisfaction.reduce(
                  (acc, i) => acc + i.satisfaction,
                  0
                ) / interventionsAvecSatisfaction.length
              : 0;

          donnees = {
            totalQuestions: toutesInterventions.length,
            questionsEnAttente: enAttente.length,
            questionsRepondues: repondues.length,
            totalCommunes: statsUtilisateurs.data?.totalCommunes || 0,
            totalUtilisateurs: statsUtilisateurs.data?.totalUtilisateurs || 0,
            satisfactionMoyenne: parseFloat(moyenneSatisfaction.toFixed(1)),
            tauxReponse:
              toutesInterventions.length > 0
                ? Math.round(
                    (repondues.length / toutesInterventions.length) * 100
                  )
                : 0,
            questionsParCommune: statsAvancees.data?.questionsParCommune || [],
            questionsParTheme: statsAvancees.data?.questionsParTheme || [],
            questionsParStrate: statsAvancees.data?.questionsParStrate || [],
            satisfactionParCommune:
              statsAvancees.data?.satisfactionParCommune || [],
            satisfactionParStrate:
              statsAvancees.data?.satisfactionParStrate || [],
          };
        } catch (erreur) {
          console.error("Erreur stats avancées:", erreur);
          const reponseToutes = await interventionsAPI.getAll({ limit: 1000 });
          const toutesInterventions = reponseToutes.data.interventions || [];

          const enAttente = toutesInterventions.filter((i) => !i.reponse);
          const repondues = toutesInterventions.filter((i) => i.reponse);

          donnees = {
            totalQuestions: toutesInterventions.length,
            questionsEnAttente: enAttente.length,
            questionsRepondues: repondues.length,
            totalCommunes: 0,
            totalUtilisateurs: 0,
            satisfactionMoyenne: 0,
            tauxReponse: 0,
            questionsParCommune: [],
            questionsParTheme: [],
            questionsParStrate: [],
            satisfactionParCommune: [],
            satisfactionParStrate: [],
          };
        }
      }

      setStatistiques(donnees);
    } catch (erreur) {
      console.error("Erreur chargement statistiques utilisateur :", erreur);
    }
  };

  const chargerDernieresQuestions = async () => {
    try {
      let parametres = { limit: 5, order: "desc" };

      if (user?.role === "juriste") {
        parametres.order = "asc";
        parametres.sansReponse = true;
      }

      const reponse = await interventionsAPI.getAll(parametres);
      setDernieresQuestions(reponse.data.interventions || []);
    } catch (erreur) {
      console.error("Erreur chargement dernières interventions :", erreur);
      setDernieresQuestions([]);
    }
  };

  const obtenirDescriptionTableauDeBord = () => {
    switch (user?.role) {
      case "commune":
        return `Bienvenue ${user?.prenom} ! Suivez vos questions juridiques.`;
      case "juriste":
        return `Bienvenue ${user?.prenom} ! Traitez les questions des communes.`;
      case "admin":
        return `Bienvenue ${user?.prenom} ! Gérez l'ensemble de la plateforme.`;
      default:
        return "Bienvenue !";
    }
  };

  const obtenirTitreCarte = (index) => {
    const titres = {
      commune: ["Mes questions", "En attente", "Répondues"],
      juriste: ["Questions à traiter", "En attente", "Traitées"],
      admin: ["Total interventions", "En attente", "Répondues"],
    };
    return (
      titres[user?.role]?.[index] || ["Total", "En attente", "Répondues"][index]
    );
  };

  const obtenirSousTitreCarte = (index) => {
    const sousTitres = {
      commune: ["Total posées", "Réponse attendue", "Questions traitées"],
      juriste: ["À traiter", "Sans réponse", "Avec réponse"],
      admin: ["Au total", "Sans réponse", "Avec réponse"],
    };
    return (
      sousTitres[user?.role]?.[index] ||
      ["Total", "En attente", "Répondu"][index]
    );
  };

  if (chargement) {
    return (
      <Layout activePage="dashboard">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[...Array(3)].map((_, index) => (
              <StatBlock
                key={index}
                title="Chargement..."
                value="0"
                subtitle=""
                loading={true}
              />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activePage="dashboard">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-primary mb-2">
            Tableau de bord
          </h1>
          <p className="text-secondary">{obtenirDescriptionTableauDeBord()}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-tertiary">
            {user?.role === "commune"
              ? "Espace Commune"
              : user?.role === "juriste"
              ? "Espace Juriste"
              : "Espace Administrateur"}
          </div>
          {user?.role === "commune" && user?.commune && (
            <div className="text-xs text-tertiary">
              Commune: {user.commune.nom}
            </div>
          )}
        </div>
      </div>

      {/* Cartes principales avec StatBlock */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatBlock
          title={obtenirTitreCarte(0)}
          value={statistiques.totalQuestions}
          subtitle={obtenirSousTitreCarte(0)}
          color="primary"
          icon="📊"
          loading={chargement}
        />
        <StatBlock
          title={obtenirTitreCarte(1)}
          value={statistiques.questionsEnAttente}
          subtitle={obtenirSousTitreCarte(1)}
          color="warning"
          icon="⏳"
          loading={chargement}
        />
        <StatBlock
          title={obtenirTitreCarte(2)}
          value={statistiques.questionsRepondues}
          subtitle={obtenirSousTitreCarte(2)}
          color="success"
          icon="✅"
          loading={chargement}
        />
      </div>

      {user?.role === "admin" && (
        <div className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-primary">
              Statistiques avancées
            </h2>
            <Link
              to="/dashboard/advanced"
              className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary-light transition-colors"
            >
              Voir le détail complet
            </Link>
          </div>

          {/* Stats principales admin */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatBlock
              title="Communes actives"
              value={statistiques.totalCommunes}
              subtitle="Total"
              color="primary"
              icon="🏘️"
              size="small"
            />
            <StatBlock
              title="Utilisateurs"
              value={statistiques.totalUtilisateurs}
              subtitle="Total"
              color="secondary"
              icon="👥"
              size="small"
            />
            <StatBlock
              title="Satisfaction"
              value={
                statistiques.satisfactionMoyenne > 0
                  ? `${statistiques.satisfactionMoyenne.toFixed(1)}/5`
                  : "N/A"
              }
              subtitle="Moyenne générale"
              color="success"
              icon="⭐"
              size="small"
            />
            <StatBlock
              title="Taux de réponse"
              value={
                statistiques.tauxReponse > 0
                  ? `${statistiques.tauxReponse}%`
                  : "0%"
              }
              subtitle="Questions traitées"
              color="warning"
              icon="📈"
              size="small"
            />
          </div>
        </div>
      )}

      {/* Dernières interventions */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-primary">
            {user?.role === "commune"
              ? "Mes dernières questions"
              : user?.role === "juriste"
              ? "Questions à traiter"
              : "Dernières interventions"}
          </h2>
          <Link
            to="/interventions"
            className="text-primary-light text-sm font-medium hover:text-primary transition-colors"
          >
            Voir tout
          </Link>
        </div>

        <div className="space-y-4">
          {dernieresQuestions.map((question) => (
            <Link
              key={question.id}
              to={`/interventions/${question.id}`}
              className="flex justify-between items-center py-4 border-b border-light-gray last:border-b-0 hover:bg-light/50 rounded-lg px-3 transition-colors cursor-pointer"
            >
              <div className="flex-1">
                <div className="font-medium text-secondary mb-1 line-clamp-2">
                  {question.titre || "Sans titre"}
                </div>
                <div className="flex items-center gap-4 text-sm text-tertiary">
                  <span>
                    {question.date_question
                      ? `Posée ${formatDate(question.date_question)}`
                      : "Date non précisée"}
                  </span>
                  {question.theme && (
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                      {question.theme.designation}
                    </span>
                  )}
                  {!question.reponse && user?.role === "juriste" && (
                    <span className="bg-warning/10 text-warning px-2 py-1 rounded text-xs">
                      À traiter
                    </span>
                  )}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors ml-4">
                <span>→</span>
              </div>
            </Link>
          ))}

          {dernieresQuestions.length === 0 && (
            <div className="text-center py-8 text-tertiary">
              {user?.role === "commune"
                ? "Aucune question pour le moment"
                : user?.role === "juriste"
                ? "Aucune question en attente - Bravo !"
                : "Aucune intervention récente"}
            </div>
          )}
        </div>
      </div>

      {user?.role === "commune" && (
        <div className="mt-6 text-center">
          <Link
            to="/interventions/new"
            className="bg-primary text-white rounded-lg px-8 py-4 font-semibold hover:bg-primary-light transition-colors shadow-md hover:shadow-lg inline-block"
          >
            Poser une nouvelle question
          </Link>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;
