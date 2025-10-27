import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import StatusBadge from "./common/StatusBadge";
import Pagination from "./common/Pagination";
import { formatDate } from "../utils/helpers";
import { interventionsAPI, themesAPI, usersAPI } from "../services/api";

const Interventions = () => {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState([]);
  const [themes, setThemes] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    theme: "all",
    commune: "all",
    dateDebut: "",
    dateFin: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const canFilterByCommune = useCallback(() => {
    return ["admin", "juriste"].includes(user?.role);
  }, [user]);

  const fetchInterventions = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.status !== "all") params.status = filters.status;
      if (filters.theme !== "all") params.theme = filters.theme;
      if (filters.commune !== "all") params.commune = filters.commune;
      if (filters.dateDebut) params.dateDebut = filters.dateDebut;
      if (filters.dateFin) params.dateFin = filters.dateFin;
      if (filters.search.trim() !== "") params.search = filters.search;

      const response = await interventionsAPI.getAll(params);
      const data = response.data;

      setInterventions(data.interventions);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.pages,
      }));
    } catch (error) {
      console.error("Erreur chargement interventions:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  const fetchThemes = useCallback(async () => {
    try {
      const response = await themesAPI.getAll();
      setThemes(response.data);
    } catch (error) {
      console.error("Erreur chargement thèmes:", error);
    }
  }, []);

  const fetchCommunes = useCallback(async () => {
    try {
      const response = await usersAPI.getCommunesList();
      setCommunes(response.data);
    } catch (error) {
      console.error("Erreur chargement communes:", error);
    }
  }, []);

  useEffect(() => {
    fetchInterventions();
    fetchThemes();
    if (canFilterByCommune()) fetchCommunes();
  }, [fetchInterventions, fetchThemes, fetchCommunes, canFilterByCommune]);

  const getInterventionStatus = (intervention) => {
    if (!intervention.reponse) {
      return "en_attente";
    } else if (intervention.reponse && !intervention.satisfaction) {
      return "repondu";
    } else {
      return "termine";
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const resetDateFilters = () => {
    setFilters((prev) => ({
      ...prev,
      dateDebut: "",
      dateFin: "",
    }));
  };

  const InterventionRow = ({ intervention }) => {
    const status = getInterventionStatus(intervention);

    return (
      <Link to={`/interventions/${intervention.id}`} className="block">
        <div className="flex justify-between items-center py-5 border-b border-light last:border-b-0 hover:bg-light/50 transition-colors cursor-pointer">
          <div className="flex-1">
            <div className="flex flex-col gap-2 mb-2">
              <div className="font-medium text-secondary line-clamp-2">
                {intervention.titre}
              </div>
              <div className="text-sm text-tertiary">
                Réf: INT-{intervention.id.toString().padStart(4, "0")}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-tertiary">
              <span className="text-secondary">
                {intervention.commune?.nom}
              </span>
              <StatusBadge status={status} />
              <span>Posée {formatDate(intervention.date_question)}</span>
              {intervention.theme && (
                <span className="text-primary-light">
                  {intervention.theme.designation}
                </span>
              )}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-light text-primary flex items-center justify-center hover:bg-primary-light hover:text-white transition-colors ml-4">
            <span>→</span>
          </div>
        </div>
      </Link>
    );
  };

  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "en_attente", label: "En attente" },
    { value: "repondu", label: "Répondu" },
    { value: "termine", label: "Terminé" },
  ];

  const themeOptions = [
    { value: "all", label: "Tous les thèmes" },
    ...themes.map((theme) => ({
      value: theme.id.toString(),
      label: theme.designation,
    })),
  ];

  const communeOptions = [
    { value: "all", label: "Toutes les communes" },
    ...communes.map((commune) => ({
      value: commune.id.toString(),
      label: commune.nom,
    })),
  ];

  return (
    <Layout activePage="interventions">
      {/* En-tête de page */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-primary">
          {user?.role === "commune" ? "Mes Questions" : "Interventions"}
        </h1>
        {user?.role === "commune" && (
          <Link
            to="/intentions/new"
            className="bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors shadow-md hover:shadow-lg"
          >
            Poser une nouvelle question
          </Link>
        )}
      </div>

      {/* Filtres */}
      <div className="card card-rounded p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Recherche
            </label>
            <input
              type="text"
              placeholder="Rechercher dans le titre ou la description..."
              className="w-full px-4 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>

          {/* Filtre statut */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Statut
            </label>
            <select
              className="w-full px-4 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre thème */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Thème
            </label>
            <select
              className="w-full px-4 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={filters.theme}
              onChange={(e) => handleFilterChange("theme", e.target.value)}
            >
              {themeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre commune (seulement pour admin/juriste) */}
          {canFilterByCommune() && (
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Commune
              </label>
              <select
                className="w-full px-4 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
                value={filters.commune}
                onChange={(e) => handleFilterChange("commune", e.target.value)}
              >
                {communeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Filtres par date */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-light">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Date de début
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={filters.dateDebut}
              onChange={(e) => handleFilterChange("dateDebut", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Date de fin
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={filters.dateFin}
              onChange={(e) => handleFilterChange("dateFin", e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={resetDateFilters}
              className="w-full bg-gray-200 text-gray-700 rounded-lg px-4 py-2 font-medium text-sm hover:bg-gray-300 transition-colors"
            >
              Effacer les dates
            </button>
          </div>
        </div>
      </div>

      {/* Liste des interventions */}
      <div className="card card-rounded p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-primary">
            {user?.role === "commune"
              ? "Mes questions"
              : "Toutes les interventions"}
          </h2>
          <span className="text-tertiary text-sm">
            {pagination.total} intervention(s) au total
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse flex justify-between items-center py-5 border-b border-light"
              >
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-0">
            {interventions.map((intervention) => (
              <InterventionRow
                key={intervention.id}
                intervention={intervention}
              />
            ))}

            {interventions.length === 0 && (
              <div className="text-center py-12 text-tertiary">
                {user?.role === "commune"
                  ? "Aucune question pour le moment"
                  : "Aucune intervention trouvée"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          pagination={pagination}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        />
      )}
    </Layout>
  );
};

export default Interventions;
