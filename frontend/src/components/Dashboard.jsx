import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import { formatDate } from "../utils/helpers";
import { interventionsAPI, usersAPI } from "../services/api";

const TableauDeBord = () => {
  const { user } = useAuth();

  const [statistiques, setStatistiques] = useState({
    totalQuestions: 0,
    questionsEnAttente: 0,
    questionsRepondues: 0,
  });

  const [dernieresQuestions, setDernieresQuestions] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    chargerDonneesTableauDeBord();
  }, [user]);

  const chargerDonneesTableauDeBord = async () => {
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
  };

  const chargerStatistiquesUtilisateur = async () => {
    try {
      let donnees = {};

      if (user?.role === "commune") {
        const reponse = await interventionsAPI.getAll({ limit: 1000 });
        const interventions = reponse.data.interventions;

        donnees = {
          totalQuestions: interventions.length,
          questionsEnAttente: interventions.filter((i) => !i.reponse).length,
          questionsRepondues: interventions.filter((i) => i.reponse).length,
        };
      } else if (user?.role === "juriste") {
        const reponse = await interventionsAPI.getAll({ limit: 1000 });
        const interventions = reponse.data.interventions;

        donnees = {
          totalQuestions: interventions.filter((i) => !i.reponse).length,
          questionsEnAttente: interventions.filter((i) => !i.reponse).length,
          questionsRepondues: interventions.filter((i) => i.reponse).length,
        };
      } else if (user?.role === "admin") {
        try {
          const [statsInterventions, statsUtilisateurs] = await Promise.all([
            interventionsAPI.getStats(),
            usersAPI.getStats(),
          ]);

          const reponseToutes = await interventionsAPI.getAll({ limit: 1000 });
          const toutesInterventions = reponseToutes.data.interventions;

          const enAttente = toutesInterventions.filter((i) => !i.reponse);
          const repondues = toutesInterventions.filter((i) => i.reponse);

          donnees = {
            totalQuestions: toutesInterventions.length,
            questionsEnAttente: enAttente.length,
            questionsRepondues: repondues.length,
            totalCommunes: statsUtilisateurs.data.totalCommunes,
            totalUtilisateurs: statsUtilisateurs.data.totalUtilisateurs || 0,
            satisfactionMoyenne:
              statsInterventions.data.satisfactionParStrate?.[0]
                ?.satisfaction_moyenne || 0,
            tauxReponse:
              toutesInterventions.length > 0
                ? Math.round(
                    (repondues.length / toutesInterventions.length) * 100
                  )
                : 0,
          };
        } catch (erreur) {
          console.error(
            "Stats avancées non disponibles, fallback aux stats basiques"
          );

          const reponseToutes = await interventionsAPI.getAll({ limit: 1000 });
          const toutesInterventions = reponseToutes.data.interventions;

          const enAttente = toutesInterventions.filter((i) => !i.reponse);
          const repondues = toutesInterventions.filter((i) => i.reponse);

          const statsUtilisateurs = await usersAPI.getStats().catch(() => ({
            data: { totalCommunes: "N/A", totalUtilisateurs: 0 },
          }));

          donnees = {
            totalQuestions: toutesInterventions.length,
            questionsEnAttente: enAttente.length,
            questionsRepondues: repondues.length,
            totalCommunes: statsUtilisateurs.data.totalCommunes,
            totalUtilisateurs: statsUtilisateurs.data.totalUtilisateurs || 0,
            satisfactionMoyenne: 0,
            tauxReponse: 0,
          };
        }
      }

      console.log("Statistiques calculées :", donnees);
      setStatistiques(donnees);
    } catch (erreur) {
      console.error("Erreur chargement statistiques utilisateur :", erreur);
    }
  };

  const chargerDernieresQuestions = async () => {
    try {
      let parametres = { limit: 5 };

      if (user?.role === "commune") {
        parametres.order = "desc";
      } else if (user?.role === "juriste") {
        parametres.order = "asc";
      } else if (user?.role === "admin") {
        parametres.order = "desc";
      }

      const reponse = await interventionsAPI.getAll(parametres);
      setDernieresQuestions(reponse.data.interventions);
    } catch (erreur) {
      console.error("Erreur chargement dernières interventions :", erreur);
    }
  };

  const CarteStatistique = ({
    titre,
    valeur,
    couleur,
    sousTitre,
    couleurIcone,
    chargement,
  }) => (
    <div className="card card-rounded p-6 transition-transform hover:translate-y-[-2px]">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-semibold text-secondary">{titre}</h3>
        <div className={`w-3 h-3 rounded-full ${couleurIcone}`}></div>
      </div>
      {chargement ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      ) : (
        <>
          <div className={`text-3xl font-bold ${couleur} mb-2`}>{valeur}</div>
          <div className="text-tertiary text-sm">{sousTitre}</div>
        </>
      )}
    </div>
  );

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
      juriste: ["Total", "En attente", "Répondues"],
      admin: ["Total", "En attente", "Répondues"],
    };
    return (
      titres[user?.role]?.[index] || ["Total", "En attente", "Répondues"][index]
    );
  };

  const obtenirSousTitreCarte = (index) => {
    const sousTitres = {
      commune: ["Total posées", "Réponse attendue", "Questions traitées"],
      juriste: ["Intervention", "Réponses à fournir", "Sans note"],
      admin: ["Interventions", "Sans réponse", "Sans note"],
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
              <div key={index} className="card card-rounded p-6">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[0, 1, 2].map((i) => (
          <CarteStatistique
            key={i}
            titre={obtenirTitreCarte(i)}
            valeur={
              i === 0
                ? statistiques.totalQuestions
                : i === 1
                ? statistiques.questionsEnAttente
                : statistiques.questionsRepondues
            }
            couleur={
              i === 0
                ? "text-primary"
                : i === 1
                ? "text-warning"
                : "text-success"
            }
            sousTitre={obtenirSousTitreCarte(i)}
            couleurIcone={
              i === 0 ? "bg-primary" : i === 1 ? "bg-warning" : "bg-success"
            }
            chargement={chargement}
          />
        ))}
      </div>

      {user?.role === "admin" && (
        <div className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-primary">
              Statistiques avancées
            </h2>
            <Link
              to="/admin/statistiques"
              className="text-primary-light text-sm font-medium hover:text-primary transition-colors"
            >
              Voir le détail
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <CarteStatistique
              titre="Communes"
              valeur={statistiques.totalCommunes || "N/A"}
              sousTitre="Total"
            />
            <CarteStatistique
              titre="Utilisateurs"
              valeur={statistiques.totalUtilisateurs || "N/A"}
              sousTitre="Total"
            />
            <CarteStatistique
              titre="Satisfaction"
              valeur={
                statistiques.satisfactionMoyenne
                  ? `${statistiques.satisfactionMoyenne.toFixed(1)}/5`
                  : "N/A"
              }
              sousTitre="Moyenne générale"
            />
            <CarteStatistique
              titre="Taux de réponse"
              valeur={
                statistiques.tauxReponse
                  ? `${statistiques.tauxReponse}%`
                  : "N/A"
              }
              sousTitre="Questions traitées"
            />
          </div>
        </div>
      )}

      <div className="card card-rounded p-6">
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
              className="flex justify-between items-center py-4 border-b border-light last:border-b-0 hover:bg-light/50 rounded-lg px-3 transition-colors cursor-pointer"
            >
              <div className="flex-1">
                <div className="font-medium text-secondary mb-1 line-clamp-2">
                  {question.titre}
                </div>
                <div className="flex items-center gap-4 text-sm text-tertiary">
                  <span>Posée {formatDate(question.date_question)}</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-light text-primary flex items-center justify-center hover:bg-light-gray transition-colors ml-4">
                <span>→</span>
              </div>
            </Link>
          ))}

          {dernieresQuestions.length === 0 && (
            <div className="text-center py-8 text-tertiary">
              {user?.role === "commune"
                ? "Aucune question pour le moment"
                : user?.role === "juriste"
                ? "Aucune question en attente"
                : "Aucune intervention récente"}
            </div>
          )}
        </div>
      </div>

      {user?.role === "commune" && (
        <div className="mt-6 text-center">
          <Link
            to="/interventions/new"
            className="bg-primary text-white rounded-lg px-8 py-4 font-semibold hover:bg-primary-light transition-colors shadow-md hover:shadow-lg"
          >
            Poser une nouvelle question
          </Link>
        </div>
      )}
    </Layout>
  );
};

export default TableauDeBord;
