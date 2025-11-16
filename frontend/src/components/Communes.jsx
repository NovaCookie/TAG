// components/Communes.jsx
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import Pagination from "./common/Pagination";
import AlertMessage from "./common/feedback/AlertMessage";
import CommuneCard from "./communes/CommuneCard";
import { communesAPI } from "../services/api";
import SelectField from "./common/dropdown/SelectField";
import { Link } from "react-router-dom";
import { useDebounce } from "../hooks/useDebounce";

const Communes = () => {
  const { user } = useAuth();
  const [communes, setCommunes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  const [filters, setFilters] = useState({
    users: "all",
    interventions: "all",
    status: "all",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });

  const userOptions = [
    { value: "all", label: "Tous les utilisateurs" },
    { value: "0", label: "Aucun utilisateur" },
    { value: "1-10", label: "1-10 utilisateurs" },
    { value: "11-100", label: "11-100 utilisateurs" },
    { value: "101+", label: "Plus de 100 utilisateurs" },
  ];

  const interventionOptions = [
    { value: "all", label: "Toutes les interventions" },
    { value: "0", label: "Aucune intervention" },
    { value: "1-10", label: "1-10 interventions" },
    { value: "11-50", label: "11-50 interventions" },
    { value: "51-100", label: "51-100 interventions" },
    { value: "100+", label: "Plus de 100 interventions" },
  ];

  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "active", label: "Actives seulement" },
    { value: "inactive", label: "Inactives seulement" },
  ];

  const loadCommunes = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await communesAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch !== "" ? debouncedSearch : undefined,
        utilisateurs: filters.users !== "all" ? filters.users : undefined,
        interventions:
          filters.interventions !== "all" ? filters.interventions : undefined,
      });

      if (response.data) {
        setCommunes(response.data.communes);
        setPagination((prev) => ({
          ...prev,
          page: response.data.pagination.page,
          totalPages: response.data.pagination.pages,
          total: response.data.pagination.total,
        }));
      }
    } catch (error) {
      console.error("Error loading communes:", error);
      setErrorMessage("Erreur lors du chargement des communes");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, debouncedSearch]);

  useEffect(() => {
    loadCommunes();
  }, [loadCommunes]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchReset = () => {
    setSearchInput("");
  };

  const handleCommuneStatusChange = async (communeId, newStatus) => {
    try {
      // Optimistic update
      setCommunes((prevCommunes) =>
        prevCommunes.map((commune) =>
          commune.id === communeId ? { ...commune, actif: newStatus } : commune
        )
      );

      await communesAPI.update(communeId, { actif: newStatus });
      setSuccessMessage(
        `Commune ${newStatus ? "activée" : "désactivée"} avec succès`
      );
    } catch (error) {
      console.error("Error updating commune status:", error);
      setErrorMessage("Erreur lors de la modification du statut de la commune");

      // Revert optimistic update on error
      loadCommunes();
    }
  };

  // Squelette de chargement
  const CommuneCardSkeleton = () => (
    <div className="card card-rounded p-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const filteredCommunes = communes.filter((commune) => {
    if (filters.status === "active") return commune.actif;
    if (filters.status === "inactive") return !commune.actif;
    return true;
  });

  return (
    <Layout activePage="communes">
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
      />

      {/* En-tête de page */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-primary mb-2">Communes</h1>
          <p className="text-tertiary">
            {pagination.total} commune{pagination.total !== 1 ? "s" : ""} au
            total
          </p>
        </div>
        {user?.role === "admin" && (
          <Link
            to="/communes/new"
            className="bg-primary text-white rounded-lg px-4 sm:px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors shadow-md hover:shadow-lg whitespace-nowrap"
          >
            Nouvelle commune
          </Link>
        )}
      </div>

      {/* Filtres */}
      <div className="card card-rounded p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary mb-2">
              Recherche
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nom de la commune, code postal..."
                className="w-full px-4 py-3 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light text-base"
                value={searchInput}
                onChange={handleSearchChange}
              />
              {searchInput && (
                <button
                  onClick={handleSearchReset}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Utilisateurs
            </label>
            <SelectField
              value={filters.users}
              onChange={(e) => handleFilterChange("users", e.target.value)}
              options={userOptions}
              placeholder="Utilisateurs"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Interventions
            </label>
            <SelectField
              value={filters.interventions}
              onChange={(e) =>
                handleFilterChange("interventions", e.target.value)
              }
              options={interventionOptions}
              placeholder="Interventions"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-light">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Statut
            </label>
            <SelectField
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              options={statusOptions}
              placeholder="Statut"
            />
          </div>
        </div>
      </div>

      {/* Liste des communes en cartes */}
      <div className="card card-rounded p-4 sm:p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold text-primary">
            Liste des communes
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

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <CommuneCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCommunes.length > 0 ? (
              filteredCommunes.map((commune) => (
                <CommuneCard
                  key={commune.id}
                  commune={commune}
                  onStatusChange={handleCommuneStatusChange}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-tertiary text-lg mb-2">
                  Aucune commune trouvée
                </div>
                <p className="text-tertiary text-sm">
                  {searchInput ||
                  filters.users !== "all" ||
                  filters.interventions !== "all" ||
                  filters.status !== "all"
                    ? "Ajustez vos filtres pour voir plus de résultats"
                    : "Aucune commune dans la base de données"}
                </p>
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

export default Communes;
