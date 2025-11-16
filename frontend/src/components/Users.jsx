import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import Layout from "./layout/Layout";
import Pagination from "./common/Pagination";
import AlertMessage from "./common/feedback/AlertMessage";
import UserCard from "./users/UserCard"; 
import { usersAPI } from "../services/api";
import { useApi, usePagination, useFilters } from "../hooks";
import { useDebounce } from "../hooks/useDebounce";

const Users = () => {
  const { user } = useAuth();
  const { isMobile } = useTheme();
  const navigate = useNavigate();
  const { loading, error, callApi, resetError } = useApi();
  const { pagination, updatePagination, goToPage } = usePagination();
  const { filters, updateFilter } = useFilters({
    search: "",
    role: "all",
  });

  const [users, setUsers] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  const fetchUsers = useCallback(async () => {
    if (user?.role !== "admin") return;

    await callApi(
      () =>
        usersAPI.getAll({
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch !== "" ? debouncedSearch : undefined,
          role: filters.role !== "all" ? filters.role : undefined,
        }),
      {
        onSuccess: (data) => {
          setUsers(data.users);
          updatePagination({
            page: data.pagination.page,
            totalPages: data.pagination.pages,
            total: data.pagination.total,
            limit: data.pagination.limit,
          });
        },
      }
    );
  }, [
    pagination.page,
    pagination.limit,
    filters,
    debouncedSearch,
    user,
    callApi,
    updatePagination,
  ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchReset = () => {
    setSearchInput("");
  };

  const handleFilterChange = (key, value) => {
    updateFilter(key, value);
    goToPage(1);
  };

  // Squelette de chargement
  const UserCardSkeleton = () => (
    <div className="card card-rounded p-6 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (user?.role !== "admin") {
    return (
      <Layout activePage="users">
        <div className="card card-rounded p-6 text-center">
          <h2 className="text-xl font-semibold text-danger mb-4">
            Accès non autorisé
          </h2>
          <p className="text-tertiary">
            Seuls les administrateurs peuvent accéder à cette page.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activePage="users">
      {/* Messages d'alerte */}
      <AlertMessage
        type="success"
        message={successMessage}
        onClose={() => setSuccessMessage("")}
        autoClose
      />

      <AlertMessage type="error" message={error} onClose={resetError} />

      {/* En-tête de page */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-primary mb-2">
            Utilisateurs
          </h1>
          <p className="text-tertiary">
            {pagination.total} utilisateur{pagination.total !== 1 ? "s" : ""} au
            total
          </p>
        </div>
        <button
          onClick={() => navigate("/users/new")}
          className="bg-primary text-white rounded-lg px-4 sm:px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors shadow-md hover:shadow-lg whitespace-nowrap"
        >
          + Nouvel utilisateur
        </button>
      </div>

      {/* Filtres */}
      <div className="card card-rounded p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary mb-2">
              Recherche
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nom, prénom, email..."
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
              Rôle
            </label>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange("role", e.target.value)}
              className="w-full px-4 py-3 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light bg-white"
            >
              <option value="all">Tous les rôles</option>
              <option value="admin">Administrateur</option>
              <option value="juriste">Juriste</option>
              <option value="commune">Commune</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="card card-rounded p-4 sm:p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold text-primary">
            Liste des utilisateurs
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
              <UserCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {users.length > 0 ? (
              users.map((utilisateur) => (
                <UserCard key={utilisateur.id} user={utilisateur} />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-tertiary text-lg mb-2">
                  Aucun utilisateur trouvé
                </div>
                <p className="text-tertiary text-sm">
                  {searchInput || filters.role !== "all"
                    ? "Ajustez vos filtres pour voir plus de résultats"
                    : "Aucun utilisateur dans la base de données"}
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
          onPageChange={(page) => goToPage(page)}
        />
      )}
    </Layout>
  );
};

export default Users;
