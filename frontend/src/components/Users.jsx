import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import UserAvatar from "./common/UserAvatar";
import StatusBadge from "./common/StatusBadge";
import Pagination from "./common/Pagination";
import SearchFilter from "./common/SearchFilter";
import { getRoleColor } from "../utils/helpers";
import { usersAPI } from "../services/api";

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    role: "all",
    status: "all",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchUsers = async () => {
    if (user?.role !== "admin") return;

    try {
      setLoading(true);

      const response = await usersAPI.getAll({
        page: pagination.page,
        limit: 10,
        search: filters.search !== "" ? filters.search : undefined,
        role: filters.role !== "all" ? filters.role : undefined,
        status:
          filters.status !== "all"
            ? filters.status === "online"
              ? "active"
              : "inactive"
            : undefined,
      });

      if (response.data) {
        setUsers(response.data.users);

        if (response.data.pagination) {
          setPagination((prev) => ({
            ...prev,
            page: response.data.pagination.page,
            totalPages: response.data.pagination.pages,
            total: response.data.pagination.total,
          }));
        }
      }
    } catch (error) {
      console.error("Error loading users:", error);
      // Vous pouvez ajouter un state pour gérer les erreurs
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    // Reset à la première page quand les filtres changent
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleToggleStatus = async (userId) => {
    try {
      const response = await usersAPI.toggleStatus(userId);

      // Mettre à jour l'utilisateur localement
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? {
                ...user,
                actif: !user.actif,
                status: !user.actif ? "online" : "offline",
              }
            : user
        )
      );

      // Optionnel: Afficher un message de succès
      console.log(response.data.message);
    } catch (error) {
      console.error("Error toggling user status:", error);
    }
  };

  const UserRow = ({ userItem }) => (
    <div className="flex justify-between items-center py-5 border-b border-light-gray last:border-b-0 hover:bg-light/50 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <UserAvatar
          name={`${userItem.prenom} ${userItem.nom}`}
          avatar={userItem.avatar}
          online={userItem.status === "online"}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <div className="font-medium text-secondary truncate">
            {userItem.prenom} {userItem.nom}
          </div>
          <div className="text-sm text-secondary-light truncate">
            {userItem.email}
          </div>
          {userItem.commune && (
            <div className="text-xs text-primary-light truncate">
              {userItem.commune.nom}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mr-4">
        <StatusBadge
          status={userItem.role}
          className={getRoleColor(userItem.role)}
        />
        <StatusBadge status={userItem.status} />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleToggleStatus(userItem.id)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            userItem.actif
              ? "bg-warning/10 text-warning hover:bg-warning hover:text-white"
              : "bg-success/10 text-success hover:bg-success hover:text-white"
          }`}
          title={userItem.actif ? "Désactiver" : "Activer"}
        >
          {userItem.actif ? "⏸️" : "▶️"}
        </button>
        <button
          className="w-8 h-8 rounded-full bg-light text-primary flex items-center justify-center hover:bg-primary-light hover:text-white transition-colors"
          title="Modifier"
        >
          ✏️
        </button>
        <button
          className="w-8 h-8 rounded-full bg-light text-primary flex items-center justify-center hover:bg-primary-light hover:text-white transition-colors"
          title="Voir détails"
        >
          👁️
        </button>
      </div>
    </div>
  );

  // Si l'utilisateur n'est pas admin
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
      {/* Page Header */}
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
        <button className="bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors">
          Nouvel utilisateur
        </button>
      </div>

      {/* Filters */}
      <SearchFilter
        filters={filters}
        onFilterChange={handleFilterChange}
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
              { value: "online", label: "Actif" },
              { value: "offline", label: "Inactif" },
            ],
          },
        ]}
      />

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-card p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-primary">
            Liste des utilisateurs
          </h2>
          <span className="text-sm text-secondary-light">
            Page {pagination.page} sur {pagination.totalPages}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-tertiary">Chargement des utilisateurs...</p>
          </div>
        ) : (
          <div className="space-y-0">
            {users.map((userItem) => (
              <UserRow key={userItem.id} userItem={userItem} />
            ))}

            {users.length === 0 && !loading && (
              <div className="text-center py-12 text-secondary-light">
                {filters.search ||
                filters.role !== "all" ||
                filters.status !== "all"
                  ? "Aucun utilisateur trouvé avec ces critères"
                  : "Aucun utilisateur dans la base de données"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
      />
    </Layout>
  );
};

export default Users;
