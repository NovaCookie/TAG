import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import StatusBadge from "./common/StatusBadge";
import { formatDate } from "../utils/helpers";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    mesQuestions: 0,
    questionsEnAttente: 0,
    interventionsUrgentes: 0,
    messagesNonLus: 0,
  });

  const [dernieresInterventions, setLatestInterventions] = useState([]);
  const [activitesRecentes, setRecentActivities] = useState([]);

  // Fonctions de permission
  const canViewAll = () => {
    return ["admin", "juriste"].includes(user?.role);
  };

  const canManageUsers = () => {
    return user?.role === "admin";
  };

  const canViewStatistics = () => {
    return ["admin", "juriste"].includes(user?.role);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Données différentes selon le rôle
      let statsData = {};

      if (user?.role === "commune") {
        statsData = {
          mesQuestions: 8,
          questionsEnAttente: 3,
          interventionsUrgentes: 1,
          messagesNonLus: 2,
        };
      } else if (["admin", "juriste"].includes(user?.role)) {
        statsData = {
          mesQuestions: 45,
          questionsEnAttente: 12,
          interventionsUrgentes: 5,
          messagesNonLus: 7,
        };
      }

      setStats(statsData);
      await fetchInterventions();
      await fetchRecentActivities();
    } catch (error) {
      console.error("Erreur chargement dashboard:", error);
    }
  };

  const fetchInterventions = async () => {
    const interventions = [
      {
        id: 1,
        question: "Contrat de prestation 2025",
        date_question: "2024-01-15T10:30:00Z",
        reponse: null,
        theme: { designation: "Contrats" },
        commune: { nom: "Nuuk" },
        demandeur: { nom: "Bibi", prenom: "Jean" },
      },
      {
        id: 2,
        question: "Litige foncier",
        date_question: "2024-01-14T09:15:00Z",
        reponse: "Réponse en cours...",
        theme: { designation: "Urbanisme" },
        commune: { nom: "Ilulissat" },
        demandeur: { nom: "Smith", prenom: "Marie" },
      },
    ];

    if (user?.role === "commune") {
      setLatestInterventions(interventions.slice(0, 1));
    } else {
      setLatestInterventions(interventions);
    }
  };

  const fetchRecentActivities = async () => {
    const activites = [
      {
        id: 1,
        type: "nouvelle_question",
        description: "Nouvelle question de Nuuk",
        date_creation: "2024-01-15T10:30:00Z",
      },
      {
        id: 2,
        type: "reponse_juriste",
        description: "Réponse à Ilulissat",
        date_creation: "2024-01-15T09:15:00Z",
      },
    ];
    setRecentActivities(activites);
  };

  const getInterventionStatus = (intervention) => {
    if (!intervention.reponse) return "en_attente";
    if (intervention.reponse && !intervention.satisfaction) return "repondu";
    return "termine";
  };

  const StatCard = ({ title, value, color, subtitle, iconColor }) => (
    <div className="card p-6 transition-transform hover:translate-y-[-2px]">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-semibold text-secondary">{title}</h3>
        <div className={`w-3 h-3 rounded-full ${iconColor}`}></div>
      </div>
      <div className={`text-3xl font-bold ${color} mb-2`}>{value}</div>
      <div className="text-tertiary text-sm">{subtitle}</div>
    </div>
  );

  return (
    <Layout activePage="dashboard">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-primary mb-2">
            Tableau de bord
          </h1>
          <p className="text-secondary">
            {user?.role === "commune"
              ? `Bienvenue ${user?.prenom} ! Suivez vos questions juridiques.`
              : `Bienvenue ${user?.prenom} ! Gérez les interventions des communes.`}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-tertiary">
            {user?.role === "commune"
              ? "Espace Commune"
              : `Espace ${
                  user?.role === "admin" ? "Administrateur" : "Juriste"
                }`}
          </div>
          {user?.role === "commune" && user?.commune && (
            <div className="text-xs text-tertiary">
              Commune: {user.commune.nom}
            </div>
          )}
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {user?.role === "commune" ? (
          <>
            <StatCard
              title="Mes questions"
              value={stats.mesQuestions}
              color="text-primary"
              subtitle="Total posées"
              iconColor="bg-primary"
            />
            <StatCard
              title="En attente"
              value={stats.questionsEnAttente}
              color="text-warning"
              subtitle="En attente de réponse"
              iconColor="bg-warning"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Interventions"
              value={stats.mesQuestions}
              color="text-primary"
              subtitle="Total cette semaine"
              iconColor="bg-primary"
            />
            <StatCard
              title="En attente"
              value={stats.questionsEnAttente}
              color="text-warning"
              subtitle="Réponses à fournir"
              iconColor="bg-warning"
            />
          </>
        )}
        <StatCard
          title="Urgentes"
          value={stats.interventionsUrgentes}
          color="text-danger"
          subtitle="Action requise"
          iconColor="bg-danger"
        />
        <StatCard
          title="Messages"
          value={stats.messagesNonLus}
          color="text-secondary-light"
          subtitle="Non lus"
          iconColor="bg-secondary-light"
        />
      </div>

      {/* Section Statistiques pour Admin/Juriste seulement */}
      {canViewStatistics() && (
        <div className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-primary">
              Statistiques globales
            </h2>
            <span className="text-sm text-tertiary">Données en temps réel</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard
              title="Communes"
              value="64"
              color="text-primary"
              subtitle="Total actives"
              iconColor="bg-primary"
            />
            <StatCard
              title="Juristes"
              value="3"
              color="text-success"
              subtitle="Actifs cette semaine"
              iconColor="bg-success"
            />
            <StatCard
              title="Interventions"
              value="142"
              color="text-primary-light"
              subtitle="Ce mois"
              iconColor="bg-primary-light"
            />
            <StatCard
              title="Satisfaction"
              value="4.2/5"
              color="text-warning"
              subtitle="Moyenne générale"
              iconColor="bg-warning"
            />
          </div>
        </div>
      )}

      {/* Lists Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Dernières Interventions */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-primary">
              {user?.role === "commune"
                ? "Mes dernières questions"
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
                  className="flex justify-between items-center py-4 border-b border-light last:border-b-0 hover:bg-light/50 dark:hover:bg-gray-700/50 rounded-lg px-3 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-secondary mb-1 line-clamp-2">
                      {intervention.question}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-tertiary">
                      <span>
                        Posée {formatDate(intervention.date_question)}
                      </span>
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
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-light text-primary flex items-center justify-center hover:bg-light-gray dark:hover:bg-gray-700 transition-colors ml-4">
                    <span>⋯</span>
                  </button>
                </div>
              );
            })}

            {dernieresInterventions.length === 0 && (
              <div className="text-center py-8 text-tertiary">
                {user?.role === "commune"
                  ? "Aucune question pour le moment"
                  : "Aucune intervention récente"}
              </div>
            )}
          </div>
        </div>

        {/* Activités Récentes */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-primary">
              Activités récentes
            </h2>
            <Link
              to="/activites"
              className="text-primary-light text-sm font-medium hover:text-primary transition-colors"
            >
              Voir tout
            </Link>
          </div>

          <div className="space-y-4">
            {activitesRecentes.map((activite) => (
              <div
                key={activite.id}
                className="py-4 border-b border-light last:border-b-0 hover:bg-light/50 dark:hover:bg-gray-700/50 rounded-lg px-3 transition-colors"
              >
                <div className="font-medium text-secondary mb-1">
                  {activite.description}
                </div>
                <div className="flex items-center gap-4 text-sm text-tertiary">
                  <span>{formatDate(activite.date_creation)}</span>
                </div>
              </div>
            ))}

            {activitesRecentes.length === 0 && (
              <div className="text-center py-8 text-tertiary">
                Aucune activité récente
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
