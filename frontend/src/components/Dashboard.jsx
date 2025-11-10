import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import StatBlock from "./stats/StatBlock";
import { formatDate } from "../utils/helpers";
import { interventionsAPI, usersAPI } from "../services/api";

const Dashboard = () => {
  const { user } = useAuth();

  const [statistics, setStatistics] = useState({
    totalQuestions: 0,
    pendingQuestions: 0,
    answeredQuestions: 0,
    totalCommunes: 0,
    totalUsers: 0,
    averageSatisfaction: 0,
    responseRate: 0,
    questionsByTheme: [],
  });

  const [recentQuestions, setRecentQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUserStatistics = useCallback(async () => {
    try {
      let data = {
        totalQuestions: 0,
        pendingQuestions: 0,
        answeredQuestions: 0,
        totalCommunes: 0,
        totalUsers: 0,
        averageSatisfaction: 0,
        responseRate: 0,
        questionsByTheme: [],
      };

      if (user?.role === "commune") {
        const response = await interventionsAPI.getAll({ limit: 1000 });
        const interventions = response.data.interventions || [];

        data = {
          ...data,
          totalQuestions: interventions.length,
          pendingQuestions: interventions.filter((i) => !i.reponse).length,
          answeredQuestions: interventions.filter((i) => i.reponse).length,
        };
      } else if (user?.role === "juriste") {
        const response = await interventionsAPI.getAll({ limit: 1000 });
        const interventions = response.data.interventions || [];

        data = {
          ...data,
          totalQuestions: interventions.filter((i) => !i.reponse).length,
          pendingQuestions: interventions.filter((i) => !i.reponse).length,
          answeredQuestions: interventions.filter((i) => i.reponse).length,
        };
      } else if (user?.role === "admin") {
        try {
          const [usersStats, advancedStats] = await Promise.all([
            usersAPI.getStats().catch(() => ({ data: {} })),
            interventionsAPI.getAdvancedStats().catch(() => ({ data: {} })),
          ]);

          const allResponse = await interventionsAPI.getAll({ limit: 1000 });
          const allInterventions = allResponse.data.interventions || [];

          const pending = allInterventions.filter((i) => !i.reponse);
          const answered = allInterventions.filter((i) => i.reponse);

          const interventionsWithSatisfaction = allInterventions.filter(
            (i) => i.satisfaction
          );
          const satisfactionAverage =
            interventionsWithSatisfaction.length > 0
              ? interventionsWithSatisfaction.reduce(
                  (acc, i) => acc + i.satisfaction,
                  0
                ) / interventionsWithSatisfaction.length
              : 0;

          data = {
            totalQuestions: allInterventions.length,
            pendingQuestions: pending.length,
            answeredQuestions: answered.length,
            totalCommunes: usersStats.data?.totalCommunes || 0,
            totalUsers: usersStats.data?.totalUsers || 0,
            averageSatisfaction: parseFloat(satisfactionAverage.toFixed(1)),
            responseRate:
              allInterventions.length > 0
                ? Math.round((answered.length / allInterventions.length) * 100)
                : 0,
            questionsByTheme: advancedStats.data?.questionsByTheme || [],
          };
        } catch (error) {
          console.error("Erreur stats avancées:", error);
          const allResponse = await interventionsAPI.getAll({ limit: 1000 });
          const allInterventions = allResponse.data.interventions || [];

          const pending = allInterventions.filter((i) => !i.reponse);
          const answered = allInterventions.filter((i) => i.reponse);

          data = {
            totalQuestions: allInterventions.length,
            pendingQuestions: pending.length,
            answeredQuestions: answered.length,
            totalCommunes: 0,
            totalUsers: 0,
            averageSatisfaction: 0,
            responseRate: 0,
            questionsByTheme: [],
          };
        }
      }

      setStatistics(data);
    } catch (error) {
      console.error("Erreur chargement statistiques utilisateur :", error);
    }
  }, [user]);

  const loadRecentQuestions = useCallback(async () => {
    try {
      let parameters = { limit: 5, order: "desc" };

      if (user?.role === "juriste") {
        parameters.order = "asc";
        parameters.sansReponse = true;
      }

      const response = await interventionsAPI.getAll(parameters);
      setRecentQuestions(response.data.interventions || []);
    } catch (error) {
      console.error("Erreur chargement dernières interventions :", error);
      setRecentQuestions([]);
    }
  }, [user]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadUserStatistics(), loadRecentQuestions()]);
    } catch (error) {
      console.error("Erreur chargement tableau de bord :", error);
    } finally {
      setLoading(false);
    }
  }, [loadUserStatistics, loadRecentQuestions]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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

  const getCardTitle = (index) => {
    const titles = {
      commune: ["Mes questions", "En attente", "Répondues"],
      juriste: ["Questions à traiter", "En attente", "Traitées"],
      admin: ["Total interventions", "En attente", "Répondues"],
    };
    return (
      titles[user?.role]?.[index] || ["Total", "En attente", "Répondues"][index]
    );
  };

  const getCardSubtitle = (index) => {
    const subtitles = {
      commune: ["Total posées", "Réponse attendue", "Questions traitées"],
      juriste: ["À traiter", "Sans réponse", "Avec réponse"],
      admin: ["Au total", "Sans réponse", "Avec réponse"],
    };
    return (
      subtitles[user?.role]?.[index] ||
      ["Total", "En attente", "Répondu"][index]
    );
  };

  if (loading) {
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
                color="secondary"
                size="medium"
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

      {/* Cartes principales avec StatBlock */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatBlock
          title={getCardTitle(0)}
          value={statistics.totalQuestions}
          subtitle={getCardSubtitle(0)}
          color="primary"
          size="medium"
        />
        <StatBlock
          title={getCardTitle(1)}
          value={statistics.pendingQuestions}
          subtitle={getCardSubtitle(1)}
          color="warning"
          size="medium"
        />
        <StatBlock
          title={getCardTitle(2)}
          value={statistics.answeredQuestions}
          subtitle={getCardSubtitle(2)}
          color="success"
          size="medium"
        />
      </div>

      {user?.role === "admin" && (
        <div className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-primary">
              Vue d'ensemble
            </h2>
            <Link
              to="/dashboard/advanced"
              className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary-light transition-colors"
            >
              Statistiques détaillées
            </Link>
          </div>

          {/* Stats principales admin */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <StatBlock
              title="Communes"
              value={statistics.totalCommunes}
              subtitle="Nombre de communes"
              color="secondary"
              size="medium"
            />
            <StatBlock
              title="Utilisateurs"
              value={statistics.totalUsers}
              subtitle="Nombre d'utilisateurs"
              color="secondary"
              size="medium"
            />
            <StatBlock
              title="Satisfaction"
              value={
                statistics.averageSatisfaction > 0
                  ? `${statistics.averageSatisfaction.toFixed(1)}/5`
                  : "N/A"
              }
              subtitle="Moyenne générale"
              color="secondary"
              size="medium"
            />
            <StatBlock
              title="Taux de réponse"
              value={
                statistics.responseRate > 0
                  ? `${statistics.responseRate}%`
                  : "0%"
              }
              subtitle="Questions traitées"
              color="secondary"
              size="medium"
            />
            <StatBlock
              title="Thèmes"
              value={statistics.questionsByTheme?.length || 0}
              subtitle="Nombre de thèmes"
              color="secondary"
              size="medium"
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
          {recentQuestions.map((question) => (
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

          {recentQuestions.length === 0 && (
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
