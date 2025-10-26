import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import { formatDate } from "../utils/helpers";
import { interventionsAPI, usersAPI } from "../services/api";

const TableauDeBord = () => {
  const { user } = useAuth();

  // États pour les statistiques
  const [statistiques, setStatistiques] = useState({
    totalQuestions: 0,
    questionsEnAttente: 0,
    questionsRepondues: 0,
    questionsUrgentes: 0,
  });

  // Dernières questions
  const [dernieresQuestions, setDernieresQuestions] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    chargerDonneesTableauDeBord();
  }, [user]);

  /** Charger toutes les données du tableau de bord */
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

  /** Charger les statistiques selon le rôle de l'utilisateur */
  const chargerStatistiquesUtilisateur = async () => {
    try {
      let donnees = {};

      if (user?.role === "commune") {
        const reponse = await interventionsAPI.getAll({ limit: 1000 });
        const interventions = reponse.data.interventions;

        donnees = {
          totalQuestions: interventions.length,
          questionsEnAttente: interventions.filter(
            (i) => !i.reponse && !i.urgent
          ).length,
          questionsRepondues: interventions.filter(
            (i) => i.reponse && !i.satisfaction
          ).length,
          questionsUrgentes: interventions.filter((i) => !i.reponse && i.urgent)
            .length,
        };
      } else if (user?.role === "juriste") {
        const reponse = await interventionsAPI.getAll({ limit: 1000 });
        const interventions = reponse.data.interventions;

        donnees = {
          totalQuestions: interventions.filter((i) => !i.reponse).length,
          questionsEnAttente: interventions.filter(
            (i) => !i.reponse && !i.urgent
          ).length,
          questionsRepondues: interventions.filter(
            (i) => i.reponse && !i.satisfaction
          ).length,
          questionsUrgentes: interventions.filter((i) => !i.reponse && i.urgent)
            .length,
        };
      } else if (user?.role === "admin") {
        try {
          const [statsInterventions, statsUtilisateurs] = await Promise.all([
            interventionsAPI.getStats(),
            usersAPI.getStats(),
          ]);

          const reponseToutes = await interventionsAPI.getAll({ limit: 1000 });
          const toutesInterventions = reponseToutes.data.interventions;

          const enAttente = toutesInterventions.filter(
            (i) => !i.reponse && !i.urgent
          );
          const repondues = toutesInterventions.filter(
            (i) => i.reponse && !i.satisfaction
          );
          const urgentes = toutesInterventions.filter(
            (i) => !i.reponse && i.urgent
          );
          const terminees = toutesInterventions.filter(
            (i) => i.reponse && i.satisfaction
          );

          donnees = {
            totalQuestions: toutesInterventions.length,
            questionsEnAttente: enAttente.length,
            questionsRepondues: repondues.length,
            questionsUrgentes: urgentes.length,
            totalCommunes: statsUtilisateurs.data.totalCommunes,
            totalUtilisateurs: statsUtilisateurs.data.totalUtilisateurs || 0,
            satisfactionMoyenne:
              statsInterventions.data.satisfactionParStrate?.[0]
                ?.satisfaction_moyenne || 0,
            tauxReponse:
              toutesInterventions.length > 0
                ? Math.round(
                    ((repondues.length + terminees.length) /
                      toutesInterventions.length) *
                      100
                  )
                : 0,
          };
        } catch (erreur) {
          console.error(
            "Stats avancées non disponibles, fallback aux stats basiques"
          );

          const reponseToutes = await interventionsAPI.getAll({ limit: 1000 });
          const toutesInterventions = reponseToutes.data.interventions;

          const enAttente = toutesInterventions.filter(
            (i) => !i.reponse && !i.urgent
          );
          const repondues = toutesInterventions.filter(
            (i) => i.reponse && !i.satisfaction
          );
          const urgentes = toutesInterventions.filter(
            (i) => !i.reponse && i.urgent
          );

          const statsUtilisateurs = await usersAPI.getStats().catch(() => ({
            data: { totalCommunes: "N/A", totalUtilisateurs: 0 },
          }));

          donnees = {
            totalQuestions: toutesInterventions.length,
            questionsEnAttente: enAttente.length,
            questionsRepondues: repondues.length,
            questionsUrgentes: urgentes.length,
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

  /** Charger les dernières interventions */
  const chargerDernieresQuestions = async () => {
    try {
      let parametres = { limit: 5 };

      if (user?.role === "commune") {
        parametres.order = "desc";
      } else if (user?.role === "juriste") {
        parametres.statut = "en_attente";
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

  /** Composant carte statistique */
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

  /** Titres et descriptions dynamiques selon rôle */
  const obtenirTitreTableauDeBord = () => {
    switch (user?.role) {
      case "commune":
        return "Mes interventions";
      case "juriste":
        return "Interventions en attente";
      case "admin":
        return "Tableau de bord général";
      default:
        return "Tableau de bord";
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
      commune: ["Mes questions", "En attente", "Répondues", "Urgentes"],
      juriste: ["Questions à traiter", "Normales", "Répondues", "Urgentes"],
      admin: ["Total questions", "En attente", "Répondues", "Urgentes"],
    };
    return (
      titres[user?.role]?.[index] ||
      ["Total", "En attente", "Répondues", "Urgentes"][index]
    );
  };

  const obtenirSousTitreCarte = (index) => {
    const sousTitres = {
      commune: [
        "Total posées",
        "Réponse attendue",
        "À noter",
        "Action requise",
      ],
      juriste: [
        "À traiter",
        "Réponses à fournir",
        "En attente de notation",
        "Action immédiate",
      ],
      admin: [
        "Toutes communes",
        "Sans réponse",
        "En attente de notation",
        "Priorité haute",
      ],
    };
    return (
      sousTitres[user?.role]?.[index] ||
      ["Total", "En attente", "Répondu", "Urgent"][index]
    );
  };

  if (chargement) {
    return (
      <Layout activePage="dashboard">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            {[...Array(4)].map((_, index) => (
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
      {/* En-tête */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-primary mb-2">
            {obtenirTitreTableauDeBord()}
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

      {/* Grille statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[0, 1, 2, 3].map((i) => (
          <CarteStatistique
            key={i}
            titre={obtenirTitreCarte(i)}
            valeur={
              i === 0
                ? statistiques.totalQuestions
                : i === 1
                ? statistiques.questionsEnAttente
                : i === 2
                ? statistiques.questionsRepondues
                : statistiques.questionsUrgentes
            }
            couleur={
              i === 0
                ? "text-primary"
                : i === 1
                ? "text-warning"
                : i === 2
                ? "text-success"
                : "text-danger"
            }
            sousTitre={obtenirSousTitreCarte(i)}
            couleurIcone={
              i === 0
                ? "bg-primary"
                : i === 1
                ? "bg-warning"
                : i === 2
                ? "bg-success"
                : "bg-danger"
            }
            chargement={chargement}
          />
        ))}
      </div>

      {/* Section Admin */}
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
              couleur=""
              sousTitre="Total"
              couleurIcone=""
            />
            <CarteStatistique
              titre="Utilisateurs"
              valeur={statistiques.totalUtilisateurs || "N/A"}
              couleur=""
              sousTitre="Total"
              couleurIcone=""
            />
            <CarteStatistique
              titre="Satisfaction"
              valeur={
                statistiques.satisfactionMoyenne
                  ? `${statistiques.satisfactionMoyenne.toFixed(1)}/5`
                  : "N/A"
              }
              couleur=""
              sousTitre="Moyenne générale"
              couleurIcone=""
            />
            <CarteStatistique
              titre="Taux de réponse"
              valeur={
                statistiques.tauxReponse
                  ? `${statistiques.tauxReponse}%`
                  : "N/A"
              }
              couleur=""
              sousTitre="Questions traitées"
              couleurIcone=""
            />
          </div>
        </div>
      )}

      {/* Dernières questions */}
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
            <div
              key={question.id}
              className="flex justify-between items-center py-4 border-b border-light last:border-b-0 hover:bg-light/50 rounded-lg px-3 transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium text-secondary mb-1 line-clamp-2">
                  {question.titre}
                </div>
                <div className="flex items-center gap-4 text-sm text-tertiary">
                  <span>Posée {formatDate(question.date_question)}</span>
                </div>
              </div>
              <Link
                to={`/interventions/${question.id}`}
                className="w-8 h-8 rounded-full bg-light text-primary flex items-center justify-center hover:bg-light-gray transition-colors ml-4"
              >
                <span>→</span>
              </Link>
            </div>
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

      {/* Bouton action principale pour commune */}
      {user?.role === "commune" && (
        <div className="mt-6 text-center">
          <Link
            to="/nouvelle-intervention"
            className="btn btn-primary text-lg px-8 py-3"
          >
            Poser une nouvelle question
          </Link>
        </div>
      )}
    </Layout>
  );
};

export default TableauDeBord;
