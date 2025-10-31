import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import UserAvatar from "./common/UserAvatar";
import StatusBadge from "./common/StatusBadge";
import Pagination from "./common/Pagination";
import SearchFilter from "./common/SearchFilter";
import { getRoleColor } from "../utils/helpers";
import { usersAPI } from "../services/api";
import { Link } from "react-router-dom";

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [chargement, setChargement] = useState(false);
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

  const [messageSucces, setMessageSucces] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchUsers = async () => {
    if (user?.role !== "admin") return;

    try {
      setChargement(true);

      const response = await usersAPI.getAll({
        page: pagination.page,
        limit: 10,
        search: filters.search !== "" ? filters.search : undefined,
        role: filters.role !== "all" ? filters.role : undefined,
        status:
          filters.status !== "all"
            ? filters.status === "active"
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
      console.error("Erreur chargement utilisateurs:", error);
    } finally {
      setChargement(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleToggleStatus = async (userId) => {
    try {
      const response = await usersAPI.toggleStatus(userId);

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? {
                ...user,
                actif: !user.actif,
              }
            : user
        )
      );

      setMessageSucces(response.data.message || "Statut modifié avec succès");
    } catch (error) {
      console.error("Erreur changement statut:", error);
    }
  };

  // Effacer le message de succès après 5 secondes
  useEffect(() => {
    if (messageSucces) {
      const timer = setTimeout(() => setMessageSucces(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [messageSucces]);

  const LigneUtilisateur = ({ utilisateur }) => (
    <div className="flex items-center justify-between py-4 px-4 border-b border-light-gray last:border-b-0 hover:bg-light/30 transition-colors">
      {/* Informations principales sur une seule ligne */}
      <div className="flex items-center gap-6 flex-1">
        {/* Avatar + Nom + Email */}
        <div className="flex items-center gap-3 min-w-80">
          <UserAvatar
            name={`${utilisateur.prenom} ${utilisateur.nom}`}
            size="md"
          />
          <div className="min-w-0">
            <div className="font-semibold text-secondary text-lg truncate">
              {utilisateur.prenom} {utilisateur.nom}
            </div>
            <div className="text-sm text-secondary-light truncate">
              {utilisateur.email}
            </div>
            {utilisateur.commune && (
              <div className="text-xs text-primary-light truncate">
                {utilisateur.commune.nom}
              </div>
            )}
          </div>
        </div>

        {/* Rôle */}
        <div className="flex items-center gap-2 min-w-32">
          <span className="w-3 h-3 rounded-full bg-purple-500"></span>
          <StatusBadge
            status={utilisateur.role}
            className={getRoleColor(utilisateur.role)}
          />
        </div>

        {/* Statut */}
        <div className="flex items-center gap-2 min-w-32">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          <StatusBadge status={utilisateur.actif ? "active" : "inactive"} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {user?.role === "admin" && (
          <div className="flex gap-2">
            <button
              onClick={() => handleToggleStatus(utilisateur.id)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                utilisateur.actif
                  ? "bg-warning/10 text-warning hover:bg-warning hover:text-white"
                  : "bg-success/10 text-success hover:bg-success hover:text-white"
              }`}
              title={utilisateur.actif ? "Archiver" : "Activer"}
            >
              {utilisateur.actif ? "⏸️" : "▶️"}
            </button>
            <Link
              to={`/users/edit/${utilisateur.id}`}
              className="w-8 h-8 rounded-full bg-light text-primary flex items-center justify-center hover:bg-primary-light hover:text-white transition-colors"
              title="Modifier l'utilisateur"
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
      {/* Message de succès */}
      {messageSucces && (
        <div className="bg-success/10 border border-success/20 text-success p-4 rounded-lg mb-6">
          {messageSucces}
        </div>
      )}

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
              { value: "active", label: "Actif" },
              { value: "inactive", label: "Archivé" },
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

        {chargement ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-tertiary">Chargement des utilisateurs...</p>
          </div>
        ) : (
          <div className="space-y-0">
            {users.map((utilisateur) => (
              <LigneUtilisateur
                key={utilisateur.id}
                utilisateur={utilisateur}
              />
            ))}

            {users.length === 0 && !chargement && (
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
