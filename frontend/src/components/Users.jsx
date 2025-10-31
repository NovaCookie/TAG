import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import UserAvatar from "./common/UserAvatar";
import StatusBadge from "./common/StatusBadge";
import Pagination from "./common/Pagination";
import SearchFilter from "./common/SearchFilter";
import DataTable from "./common/data/DataTable";
import AlertMessage from "./common/feedback/AlertMessage";
import { usersAPI } from "../services/api";
import { Link } from "react-router-dom";
import { useApi, usePagination, useFilters } from "../hooks";

const Users = () => {
  const { user } = useAuth();
  const { loading, error, callApi } = useApi();
  const { pagination, updatePagination, goToPage } = usePagination();
  const { filters, updateFilter } = useFilters({
    search: "",
    role: "all",
    status: "all",
  });

  const [users, setUsers] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchUsers = async () => {
    if (user?.role !== "admin") return;

    await callApi(
      () =>
        usersAPI.getAll({
          page: pagination.page,
          limit: 10,
          search: filters.search !== "" ? filters.search : undefined,
          role: filters.role !== "all" ? filters.role : undefined,
          status: filters.status !== "all" ? filters.status : undefined,
        }),
      {
        onSuccess: (data) => {
          setUsers(data.users);
          goToPage(data.pagination.page);
          updatePagination({
            page: data.pagination.page,
            totalPages: data.pagination.pages,
            total: data.pagination.total,
            limit: data.pagination.limit || 10,
          });
        },
      }
    );
  };

  const handleToggleStatus = async (userId) => {
    await callApi(() => usersAPI.toggleStatus(userId), {
      onSuccess: (response) => {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, actif: !user.actif } : user
          )
        );
        setSuccessMessage(response.message || "Statut modifié avec succès");
      },
    });
  };

  // Rendu d'une ligne utilisateur dans le style des communes
  const renderUserRow = (utilisateur) => (
    <div className="flex items-center justify-between py-4 px-4 border-b border-light-gray last:border-b-0 hover:bg-light/30 transition-colors">
      {/* Informations principales sur une seule ligne */}
      <div className="flex items-center gap-6 flex-1">
        {/* Avatar + Nom */}
        <div className="flex items-center gap-3 min-w-60">
          <UserAvatar
            name={`${utilisateur.prenom} ${utilisateur.nom}`}
            size="sm"
          />
          <div>
            <div className="font-semibold text-secondary">
              {utilisateur.prenom} {utilisateur.nom}
            </div>
            <div className="text-sm text-secondary-light">
              {utilisateur.email}
            </div>
          </div>
        </div>

        {/* Commune */}
        <div className="flex items-center gap-2 min-w-40">
          <span className="w-3 h-3 rounded-full bg-primary"></span>
          <span className="font-medium text-primary">
            {utilisateur.commune?.nom || "Aucune commune"}
          </span>
        </div>

        {/* Rôle */}
        <div className="flex items-center gap-2 min-w-40">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          <span className="font-medium text-green-700 capitalize">
            {utilisateur.role}
          </span>
        </div>

        {/* Statut */}
        <div className="flex items-center gap-2 min-w-40">
          <span className="w-3 h-3 rounded-full bg-orange-500"></span>
          <span className="font-medium text-orange-700">
            {utilisateur.actif ? "Actif" : "Inactif"}
          </span>
        </div>
      </div>

      {/* Statut et actions */}
      <div className="flex items-center gap-4">
        <StatusBadge
          status={utilisateur.actif ? "active" : "inactive"}
          className={
            utilisateur.actif
              ? "bg-success/10 text-success border border-success/20"
              : "bg-danger/10 text-danger border border-danger/20"
          }
        />

        {user?.role === "admin" && (
          <div className="flex gap-2">
            <button
              onClick={() => handleToggleStatus(utilisateur.id)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                utilisateur.actif
                  ? "bg-warning/10 text-warning hover:bg-warning hover:text-white"
                  : "bg-success/10 text-success hover:bg-success hover:text-white"
              }`}
              title={utilisateur.actif ? "Désactiver" : "Activer"}
            >
              {utilisateur.actif ? "⏸️" : "▶️"}
            </button>
            <Link
              to={`/users/edit/${utilisateur.id}`}
              className="w-8 h-8 rounded-full bg-light text-primary flex items-center justify-center hover:bg-primary-light hover:text-white transition-colors"
              title="Modifier"
            >
              ✏️
            </Link>
          </div>
        )}
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

      <AlertMessage type="error" message={error} onClose={() => {}} />

      {/* En-tête de page */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-primary mb-2">
            Utilisateurs
          </h1>
          <p className="text-secondary-light">
            {pagination.total} utilisateur{pagination.total !== 1 ? "s" : ""} au
            total
          </p>
        </div>
        <Link
          to="/users/new"
          className="bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors"
        >
          Nouvel utilisateur
        </Link>
      </div>

      {/* Filtres */}
      <SearchFilter
        filters={filters}
        onFilterChange={updateFilter}
        searchPlaceholder="Rechercher un utilisateur..."
        filterConfig={[
          {
            key: "role",
            options: [
              { value: "all", label: "Tous les rôles" },
              { value: "admin", label: "Administrateur" },
              { value: "juriste", label: "Juriste" },
              { value: "commune", label: "Commune" },
            ],
          },
          {
            key: "status",
            options: [
              { value: "all", label: "Tous les statuts" },
              { value: "active", label: "Actif" },
              { value: "inactive", label: "Inactif" },
            ],
          },
        ]}
      />

      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-xl shadow-card p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-primary">
            Liste des utilisateurs
          </h2>
          <span className="text-sm text-secondary-light">
            Page {pagination.page} sur {pagination.totalPages}
          </span>
        </div>

        <DataTable
          data={users}
          loading={loading}
          emptyMessage={
            filters.search || filters.role !== "all" || filters.status !== "all"
              ? "Aucun utilisateur trouvé avec ces critères"
              : "Aucun utilisateur dans la base de données"
          }
          renderItem={renderUserRow}
        />
      </div>

      {/* Pagination */}
      <Pagination pagination={pagination} onPageChange={goToPage} />
    </Layout>
  );
};

export default Users;
