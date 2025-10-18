import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import StatusBadge from "./common/StatusBadge";
import { formatDate } from "../utils/helpers";
import { interventionsAPI, usersAPI } from "../services/api";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalQuestions: 0,
    questionsEnAttente: 0,
    questionsUrgentes: 0,
  });

  const [dernieresInterventions, setLatestInterventions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchUserStats(), fetchInterventions()]);
    } catch (error) {
      console.error("Erreur chargement dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      let statsData = {};

      if (user?.role === "commune") {
        // COMMUNE: seulement ses interventions
        const response = await interventionsAPI.getAll({ limit: 1000 });
        const interventions = response.data.interventions;

        statsData = {
          totalQuestions: interventions.length,
          questionsEnAttente: interventions.filter(
            (i) => !i.reponse && !i.urgent
          ).length,
          questionsUrgentes: interventions.filter((i) => !i.reponse && i.urgent)
            .length,
        };
      } else if (user?.role === "juriste") {
        // JURISTE: toutes les interventions en attente
        const responseEnAttente = await interventionsAPI.getAll({
          statut: "en_attente",
          limit: 1000,
        });

        const interventions = responseEnAttente.data.interventions;

        statsData = {
          totalQuestions: responseEnAttente.data.pagination.total,
          questionsEnAttente: interventions.filter((i) => !i.urgent).length,
          questionsUrgentes: interventions.filter((i) => i.urgent).length,
        };
      } else if (user?.role === "admin") {
        // ADMIN: toutes les interventions
        try {
          const [responseStats, responseUsers] = await Promise.all([
            interventionsAPI.getStats(),
            usersAPI.getStats(),
          ]);

          const statsAvancees = responseStats.data;
          const usersStats = responseUsers.data;

          // Récupère les interventions pour compter les urgentes
          const responseEnAttente = await interventionsAPI.getAll({
            statut: "en_attente",
            limit: 1000,
          });

          const interventionsUrgentes =
            responseEnAttente.data.interventions.filter((i) => i.urgent).length;

          statsData = {
            totalQuestions: statsAvancees.totalInterventions,
            questionsEnAttente:
              statsAvancees.interventionsSansReponse - interventionsUrgentes,
            questionsUrgentes: interventionsUrgentes,
            totalCommunes: usersStats.totalCommunes,
            totalUtilisateurs: usersStats.totalUtilisateurs || 0,
            satisfactionMoyenne:
              statsAvancees.satisfactionParStrate?.[0]?.satisfaction_moyenne ||
              0,
            tauxReponse:
              statsAvancees.totalInterventions > 0
                ? Math.round(
                    (1 -
                      statsAvancees.interventionsSansReponse /
                        statsAvancees.totalInterventions) *
                      100
                  )
                : 0,
          };
        } catch (error) {
          console.error("Stats avancées non disponibles, utilisation basique");
          // Fallback aux stats basiques
          const [response, responseEnAttente, responseUsers] =
            await Promise.all([
              interventionsAPI.getAll({ limit: 1000 }),
              interventionsAPI.getAll({ statut: "en_attente", limit: 1000 }),
              usersAPI.getStats().catch(() => ({
                data: { totalCommunes: "N/A", usersByRole: {} },
              })), // Fallback si erreur
            ]);

          const interventionsUrgentes =
            responseEnAttente.data.interventions.filter((i) => i.urgent).length;
          const usersStats = responseUsers.data;

          statsData = {
            totalQuestions: response.data.pagination.total,
            questionsEnAttente:
              responseEnAttente.data.pagination.total - interventionsUrgentes,
            questionsUrgentes: interventionsUrgentes,
            totalCommunes: usersStats.totalCommunes,
            totalUtilisateurs: usersStats.usersByRole.juriste || 0,
            satisfactionMoyenne: 0,
            tauxReponse: 0,
          };
        }
      }

      console.log("Stats calculées:", statsData);
      setStats(statsData);
    } catch (error) {
      console.error("Erreur stats utilisateur:", error);
    }
  };

  const fetchInterventions = async () => {
    try {
      let params = { limit: 5 };

      if (user?.role === "commune") {
        // COMMUNE: seulement ses interventions
        params.order = "desc";
      } else if (user?.role === "juriste") {
        // JURISTE: toutes les interventions en attente
        params.statut = "en_attente";
        params.order = "asc";
      } else if (user?.role === "admin") {
        // ADMIN: toutes les interventions
        params.order = "desc";
      }

      const response = await interventionsAPI.getAll(params);
      setLatestInterventions(response.data.interventions);
    } catch (error) {
      console.error("Erreur interventions:", error);
    }
  };

  const getInterventionStatus = (intervention) => {
    if (!intervention.reponse) {
      return intervention.urgent ? "urgent" : "en_attente";
    }
    if (intervention.reponse && !intervention.satisfaction) return "repondu";
    return "termine";
  };

  const StatCard = ({ title, value, color, subtitle, iconColor, loading }) => (
    <div className="card card-rounded p-6 transition-transform hover:translate-y-[-2px]">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-semibold text-secondary">{title}</h3>
        <div className={`w-3 h-3 rounded-full ${iconColor}`}></div>
      </div>
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      ) : (
        <>
          <div className={`text-3xl font-bold ${color} mb-2`}>{value}</div>
          <div className="text-tertiary text-sm">{subtitle}</div>
        </>
      )}
    </div>
  );

  const getDashboardTitle = () => {
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

  const getDashboardDescription = () => {
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

  const getStatCardTitle = (index) => {
    const titles = {
      commune: ["Mes questions", "En attente", "Urgentes"],
      juriste: ["Questions à traiter", "Normales", "Urgentes"],
      admin: ["Total questions", "En attente", "Urgentes"],
    };
    return (
      titles[user?.role]?.[index] || ["Total", "En attente", "Urgentes"][index]
    );
  };

  const getStatCardSubtitle = (index) => {
    const subtitles = {
      commune: ["Total posées", "Réponse attendue", "Action requise"],
      juriste: ["À traiter", "Réponses à fournir", "Action immédiate"],
      admin: ["Toutes communes", "Sans réponse", "Priorité haute"],
    };
    return (
      subtitles[user?.role]?.[index] || ["Total", "En attente", "Urgent"][index]
    );
  };

  if (loading) {
    return (
      <Layout activePage="dashboard">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card card-rounded p-6">
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
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-primary mb-2">
            {getDashboardTitle()}
          </h1>
          <p className="text-secondary">{getDashboardDescription()}</p>
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

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard
          title={getStatCardTitle(0)}
          value={stats.totalQuestions}
          color="text-primary"
          subtitle={getStatCardSubtitle(0)}
          iconColor="bg-primary"
          loading={loading}
        />
        <StatCard
          title={getStatCardTitle(1)}
          value={stats.questionsEnAttente}
          color="text-warning"
          subtitle={getStatCardSubtitle(1)}
          iconColor="bg-warning"
          loading={loading}
        />
        <StatCard
          title={getStatCardTitle(2)}
          value={stats.questionsUrgentes}
          color="text-danger"
          subtitle={getStatCardSubtitle(2)}
          iconColor="bg-danger"
          loading={loading}
        />
      </div>

      {/* Section Statistiques avancées pour Admin */}
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
            <StatCard
              title="Communes"
              value={stats.totalCommunes || "N/A"}
              color="text-primary"
              subtitle="Total"
              iconColor="bg-primary"
            />
            <StatCard
              title="Utilisateurs"
              value={stats.totalUtilisateurs || "N/A"}
              color="text-info"
              subtitle="Total"
              iconColor="bg-info"
            />
            <StatCard
              title="Satisfaction"
              value={
                stats.satisfactionMoyenne
                  ? `${stats.satisfactionMoyenne.toFixed(1)}/5`
                  : "N/A"
              }
              color="text-warning"
              subtitle="Moyenne générale"
              iconColor="bg-warning"
            />
            <StatCard
              title="Taux de réponse"
              value={stats.tauxReponse ? `${stats.tauxReponse}%` : "N/A"}
              color="text-success"
              subtitle="Questions traitées"
              iconColor="bg-success"
            />
          </div>
        </div>
      )}

      {/* Dernières Interventions */}
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
          {dernieresInterventions.map((intervention) => {
            const statut = getInterventionStatus(intervention);
            return (
              <div
                key={intervention.id}
                className="flex justify-between items-center py-4 border-b border-light last:border-b-0 hover:bg-light/50 rounded-lg px-3 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-secondary mb-1 line-clamp-2">
                    {intervention.question}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-tertiary">
                    <span>Posée {formatDate(intervention.date_question)}</span>
                    <StatusBadge status={statut} />
                    {intervention.theme && (
                      <span className="text-primary-light">
                        {intervention.theme.designation}
                      </span>
                    )}
                    {user?.role !== "commune" && intervention.commune && (
                      <span className="text-tertiary">
                        {intervention.commune.nom}
                      </span>
                    )}
                    {intervention.urgent && (
                      <span className="text-danger text-xs font-semibold">
                        ⚠ URGENT
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  to={`/interventions/${intervention.id}`}
                  className="w-8 h-8 rounded-full bg-light text-primary flex items-center justify-center hover:bg-light-gray transition-colors ml-4"
                >
                  <span>→</span>
                </Link>
              </div>
            );
          })}

          {dernieresInterventions.length === 0 && (
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

      {/* Bouton d'action principal pour les communes */}
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

export default Dashboard;
