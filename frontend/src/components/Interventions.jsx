import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import StatusBadge from "./common/StatusBadge";
import Pagination from "./common/Pagination";
import SelectField from "./common/dropdown/SelectField";
import { interventionsAPI, themesAPI, usersAPI } from "../services/api";
import AlertMessage from "./common/feedback/AlertMessage";

const Interventions = () => {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState([]);
  const [themes, setThemes] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    theme: "all",
    commune: "all",
    dateStart: "",
    dateEnd: "",
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

  const formatDateFr = (dateInput) => {
    if (!dateInput) return "-";
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return "-";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

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
      if (filters.dateStart) params.dateStart = filters.dateStart;
      if (filters.dateEnd) params.dateEnd = filters.dateEnd;
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
      setErrorMessage("Erreur lors du chargement des interventions");
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
      return "pending";
    } else if (intervention.reponse && !intervention.satisfaction) {
      return "answered";
    } else {
      return "completed";
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
      dateStart: "",
      dateEnd: "",
    }));
  };

  const renderSatisfactionStars = (satisfaction) => {
    if (!satisfaction) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${
              star <= satisfaction ? "text-warning" : "text-tertiary"
            }`}
          >
            ★
          </span>
        ))}
        <span className="text-secondary text-xs ml-1">({satisfaction}/5)</span>
      </div>
    );
  };

  const InterventionRow = ({ intervention }) => {
    const status = getInterventionStatus(intervention);

    return (
      <Link
        to={`/interventions/${intervention.id}`}
        className="block hover:bg-light/30 transition-colors duration-200"
      >
        <div className="py-4 px-6 border-b border-light last:border-b-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="bg-primary text-white px-3 py-1 rounded text-sm font-semibold whitespace-nowrap flex-shrink-0">
                #{intervention.id.toString().padStart(4, "0")}
              </span>
              <div className="font-medium text-secondary line-clamp-2 break-words min-w-0">
                {intervention.titre || "Sans titre"}
              </div>
            </div>
            <div className="flex-shrink-0 ml-4">
              <div className="w-8 h-8 rounded-full bg-light text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                <span className="text-sm">→</span>
              </div>
            </div>
          </div>

          {/* Dates formatées */}
          <div className="flex items-center gap-4 text-sm text-tertiary mb-2">
            <span className="font-medium text-secondary">
              Question posée le :
            </span>
            <span>{formatDateFr(intervention.date_question)}</span>
            <span className="font-medium text-secondary">
              Réponse donnée le :
            </span>
            <span>{formatDateFr(intervention.date_reponse)}</span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-secondary font-medium">
                {intervention.commune?.nom}
              </span>
            </div>

            <span className="text-light">•</span>

            {/* Statut */}
            <div className="flex items-center gap-2">
              <StatusBadge status={status} />
            </div>

            <span className="text-light">•</span>

            {/* Thème */}
            <div className="flex items-center gap-2">
              <span className="text-primary-light font-medium">
                {intervention.theme?.designation}
              </span>
            </div>

            {/* Note de satisfaction */}
            {intervention.satisfaction && (
              <>
                <span className="text-light">•</span>
                <div className="flex items-center gap-2">
                  {renderSatisfactionStars(intervention.satisfaction)}
                </div>
              </>
            )}
          </div>
        </div>
      </Link>
    );
  };

  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "pending", label: "En attente" },
    { value: "answered", label: "Répondu" },
    { value: "completed", label: "Terminé" },
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
      <AlertMessage
        type="success"
        message={successMessage}
        onClose={() => setSuccessMessage("")}
        autoClose
      />

      <AlertMessage
        type="error"
        message={errorMessage}
        onClose={() => setErrorMessage("")}
        autoClose
      />

      {/* En-tête de page */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-primary">
            {user?.role === "commune" ? "Mes Questions" : "Interventions"}
          </h1>
          <p className="text-tertiary">
            Consultation des interventions - {pagination.total} intervention(s)
            trouvée(s)
          </p>
        </div>
        {user?.role === "commune" && (
          <Link
            to="/interventions/new"
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
              placeholder="Titre, description, notes..."
              className="w-full px-4 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Statut
            </label>
            <SelectField
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              options={statusOptions}
              placeholder="Tous les statuts"
              fieldName="status"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Thème
            </label>
            <SelectField
              value={filters.theme}
              onChange={(e) => handleFilterChange("theme", e.target.value)}
              options={themeOptions}
              placeholder="Tous les thèmes"
            />
          </div>

          {canFilterByCommune() && (
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Commune
              </label>
              <SelectField
                value={filters.commune}
                onChange={(e) => handleFilterChange("commune", e.target.value)}
                options={communeOptions}
                placeholder="Toutes les communes"
              />
            </div>
          )}
        </div>

        {/* Filtres dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-light">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Date de début
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={filters.dateStart}
              onChange={(e) => handleFilterChange("dateStart", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Date de fin
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={filters.dateEnd}
              onChange={(e) => handleFilterChange("dateEnd", e.target.value)}
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
          <div className="text-sm">
            <span className="text-tertiary">Page </span>
            <span className="font-semibold text-primary">
              {pagination.page}
            </span>
            <span className="text-tertiary"> sur </span>
            <span className="font-semibold text-primary">
              {pagination.totalPages}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse py-4 px-6 border-b border-light"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-0">
            {interventions.length > 0 ? (
              interventions.map((intervention) => (
                <InterventionRow
                  key={intervention.id}
                  intervention={intervention}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-tertiary text-lg mb-2">
                  Aucune intervention trouvée
                </div>
                <p className="text-tertiary text-sm">
                  Ajustez vos filtres pour voir plus de résultats
                </p>
              </div>
            )}
          </div>
        )}
      </div>

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
