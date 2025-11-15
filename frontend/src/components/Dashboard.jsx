import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import StatBlock from "./stats/StatBlock";
import InterventionCard from "./interventions/InterventionCard";
import { interventionsAPI, statsAPI } from "../services/api";

const Dashboard = () => {
  const { user } = useAuth();

  const [statistics, setStatistics] = useState({
    totalInterventions: 0,
    pendingInterventions: 0,
    answeredInterventions: 0,
    responseRate: 0,
    averageSatisfaction: 0,
    recentInterventions: [],
    totalCommunes: 0,
    totalUsers: 0,
    totalThemes: 0,
  });

  const [loading, setLoading] = useState(true);

  const loadUserStatistics = useCallback(async () => {
    try {
      let data = {
        totalInterventions: 0,
        pendingInterventions: 0,
        answeredInterventions: 0,
        responseRate: 0,
        averageSatisfaction: 0,
        recentInterventions: [],
      };

      const response = await interventionsAPI.getAll({ limit: 1000 });
      const interventions = response.data.interventions || [];

      if (user?.role === "commune") {
        data = {
          ...data,
          totalInterventions: interventions.length,
          pendingInterventions: interventions.filter((i) => !i.reponse).length,
          answeredInterventions: interventions.filter((i) => i.reponse).length,
          recentInterventions: interventions.slice(0, 5),
        };
      } else if (user?.role === "juriste") {
        data = {
          ...data,
          totalInterventions: interventions.filter((i) => !i.reponse).length,
          pendingInterventions: interventions.filter((i) => !i.reponse).length,
          answeredInterventions: interventions.filter((i) => i.reponse).length,
          recentInterventions: interventions.slice(0, 5),
        };
      }

      setStatistics(data);
    } catch (error) {
      console.error("Erreur fallback statistics:", error);
    }
  }, [user]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const dashboardResponse = await statsAPI.getDashboard();
      const dashboardData = dashboardResponse.data;

      const stats = {
        totalInterventions: dashboardData.totalInterventions || 0,
        pendingInterventions: dashboardData.pendingInterventions || 0,
        answeredInterventions: dashboardData.answeredInterventions || 0,
        responseRate: dashboardData.responseRate || 0,
        averageSatisfaction: dashboardData.averageSatisfaction || 0,
        recentInterventions: dashboardData.recentInterventions || [],
      };

      if (user?.role === "admin") {
        const globalResponse = await statsAPI.getGlobal();
        const globalData = globalResponse.data;

        stats.totalCommunes = globalData.communes?.total || 0;
        stats.totalUsers = globalData.users?.total || 0;
        stats.totalThemes = globalData.themes?.total || 0;
      }

      setStatistics(stats);
    } catch (error) {
      console.error("Erreur chargement dashboard :", error);
      await loadUserStatistics();
    } finally {
      setLoading(false);
    }
  }, [user, loadUserStatistics]);

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
      juriste: ["Total interventions", "En attente", "Traitées"],
      admin: ["Total interventions", "En attente", "Répondues"],
    };
    return (
      titles[user?.role]?.[index] || ["Total", "En attente", "Répondues"][index]
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatBlock
          title={getCardTitle(0)}
          value={statistics.totalInterventions}
          color="primary"
          size="medium"
        />
        <StatBlock
          title={getCardTitle(1)}
          value={statistics.pendingInterventions}
          color="warning"
          size="medium"
        />
        <StatBlock
          title={getCardTitle(2)}
          value={statistics.answeredInterventions}
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <StatBlock
              title="Utilisateurs"
              value={statistics.totalUsers}
              subtitle="Nombre d'utilisateurs"
              color="secondary"
              size="medium"
            />
            <StatBlock
              title="Communes"
              value={statistics.totalCommunes}
              subtitle="Nombre de communes"
              color="secondary"
              size="medium"
            />
            <StatBlock
              title="Thèmes"
              value={statistics.totalThemes}
              subtitle="Nombre de thèmes"
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
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-card p-6 mb-8">
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
          {statistics.recentInterventions.map((intervention) => (
            <InterventionCard
              key={intervention.id}
              intervention={intervention}
            />
          ))}

          {statistics.recentInterventions.length === 0 && (
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
        <div className="text-center">
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
