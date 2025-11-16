import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import Pagination from "./common/Pagination";
import AlertMessage from "./common/feedback/AlertMessage";
import ThemeCard from "./themes/ThemeCard";
import { themesAPI, retentionAPI } from "../services/api";
import { Link } from "react-router-dom";
import { useDebounce } from "../hooks/useDebounce";

const Themes = () => {
  const { user } = useAuth();
  const [themes, setThemes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });

  const loadThemes = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await themesAPI.getAllIncludingInactive();

      if (response.data) {
        // Charger les politiques RGPD pour chaque thème
        const themesWithPolicies = await Promise.all(
          response.data.map(async (theme) => {
            try {
              const policyResponse = await retentionAPI.getByTheme(theme.id);
              return {
                ...theme,
                rgpd_policy: policyResponse.data?.[0] || null,
              };
            } catch (error) {
              console.error(
                `Error loading policy for theme ${theme.id}:`,
                error
              );
              return {
                ...theme,
                rgpd_policy: null,
              };
            }
          })
        );

        // Appliquer la recherche côté client
        let filteredThemes = themesWithPolicies;

        if (debouncedSearch) {
          filteredThemes = filteredThemes.filter(
            (theme) =>
              theme.designation
                .toLowerCase()
                .includes(debouncedSearch.toLowerCase()) ||
              theme.rgpd_policy?.description
                ?.toLowerCase()
                .includes(debouncedSearch.toLowerCase())
          );
        }

        // Pagination côté client
        const startIndex = (pagination.page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        const paginatedThemes = filteredThemes.slice(startIndex, endIndex);

        setThemes(paginatedThemes);
        setPagination((prev) => ({
          ...prev,
          total: filteredThemes.length,
          totalPages: Math.ceil(filteredThemes.length / pagination.limit),
        }));
      }
    } catch (error) {
      console.error("Error loading themes:", error);
      setErrorMessage("Erreur lors du chargement des thèmes");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch]);

  useEffect(() => {
    if (user?.role === "commune") {
      setErrorMessage("Accès non autorisé à cette page");
      return;
    }
    loadThemes();
  }, [loadThemes, user]);

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchReset = () => {
    setSearchInput("");
  };

  const handleThemeStatusChange = async (themeId, newStatus) => {
    try {
      // Optimistic update
      setThemes((prevThemes) =>
        prevThemes.map((theme) =>
          theme.id === themeId ? { ...theme, actif: newStatus } : theme
        )
      );

      await themesAPI.update(themeId, { actif: newStatus });
      setSuccessMessage(
        `Thème ${newStatus ? "activé" : "désactivé"} avec succès`
      );
    } catch (error) {
      console.error("Error updating theme status:", error);
      setErrorMessage("Erreur lors de la modification du statut du thème");

      // Revert optimistic update on error
      loadThemes();
    }
  };

  // Squelette de chargement
  const ThemeCardSkeleton = () => (
    <div className="card card-rounded p-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (user?.role === "commune") {
    return (
      <Layout activePage="themes">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-xl font-semibold text-error mb-2">
              Accès non autorisé
            </h2>
            <p className="text-tertiary">
              Vous n'avez pas les permissions pour accéder à cette page.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activePage="themes">
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
          <h1 className="text-2xl font-semibold text-primary mb-2">Thèmes</h1>
          <p className="text-tertiary">
            {pagination.total} thème{pagination.total !== 1 ? "s" : ""} au total
          </p>
        </div>
        {(user?.role === "admin" || user?.role === "juriste") && (
          <Link
            to="/themes/new"
            className="bg-primary text-white rounded-lg px-4 sm:px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors shadow-md hover:shadow-lg whitespace-nowrap"
          >
            + Nouveau thème
          </Link>
        )}
      </div>

      {/* Filtres */}
      <div className="card card-rounded p-6 mb-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Recherche
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nom du thème ou description RGPD..."
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
        </div>
      </div>

      {/* Liste des thèmes en cartes */}
      <div className="card card-rounded p-4 sm:p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold text-primary">
            Liste des thèmes
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
              <ThemeCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {themes.length > 0 ? (
              themes.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  onStatusChange={handleThemeStatusChange}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-tertiary text-lg mb-2">
                  Aucun thème trouvé
                </div>
                <p className="text-tertiary text-sm">
                  {searchInput
                    ? "Ajustez votre recherche pour voir plus de résultats"
                    : "Aucun thème dans la base de données"}
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

export default Themes;
