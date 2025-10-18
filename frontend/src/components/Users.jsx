import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import UserAvatar from "./common/UserAvatar";
import StatusBadge from "./common/StatusBadge";
import Pagination from "./common/Pagination";
import SearchFilter from "./common/SearchFilter";
import { getRoleColor } from "../utils/helpers";

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    role: "all",
    status: "all",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 5,
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page]);

  const fetchUsers = async () => {
    try {
      const usersData = [
        {
          id: 1,
          name: "Maître Julien",
          email: "maitre.julien@tag.gl",
          role: "juriste",
          status: "online",
          avatar: "MJ",
        },
        {
          id: 2,
          name: "Avocat Dupont",
          email: "avocat.dupont@tag.gl",
          role: "juriste",
          status: "offline",
          avatar: "AD",
        },
        {
          id: 3,
          name: "Commune de Nuuk",
          email: "contact@nuuk.gl",
          role: "commune",
          status: "online",
          avatar: "CN",
        },
        {
          id: 4,
          name: "Commune de Ilulissat",
          email: "admin@ilulissat.gl",
          role: "commune",
          status: "offline",
          avatar: "CI",
        },
        {
          id: 5,
          name: "Bibi",
          email: "bibi@tag.gl",
          role: "admin",
          status: "online",
          avatar: "B",
        },
      ];

      setUsers(usersData);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const UserRow = ({ userItem }) => (
    <div className="flex justify-between items-center py-5 border-b border-light-gray last:border-b-0 hover:bg-light/50 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <UserAvatar
          name={userItem.name}
          avatar={userItem.avatar}
          online={userItem.status === "online"}
          size="md"
        />
        <div className="min-w-0">
          <div className="font-medium text-secondary truncate">
            {userItem.name}
          </div>
          <div className="text-sm text-secondary-light truncate">
            {userItem.email}
          </div>
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
        <button className="w-8 h-8 rounded-full bg-light text-primary flex items-center justify-center hover:bg-primary-light hover:text-white transition-colors">
          ✏️
        </button>
        <button className="w-8 h-8 rounded-full bg-light text-primary flex items-center justify-center hover:bg-primary-light hover:text-white transition-colors">
          👁️
        </button>
      </div>
    </div>
  );

  return (
    <Layout activePage="users">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-primary">Utilisateurs</h1>
        {user?.role === "admin" && (
          <button className="bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors">
            Nouvel utilisateur
          </button>
        )}
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
              { value: "online", label: "En ligne" },
              { value: "offline", label: "Hors ligne" },
            ],
          },
        ]}
      />

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-card p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-primary">
            Tous les utilisateurs
          </h2>
          <a
            href="#"
            className="text-primary-light text-sm font-medium hover:text-primary transition-colors"
          >
            Voir tout
          </a>
        </div>

        <div className="space-y-0">
          {users.map((userItem) => (
            <UserRow key={userItem.id} userItem={userItem} />
          ))}

          {users.length === 0 && (
            <div className="text-center py-12 text-secondary-light">
              Aucun utilisateur trouvé
            </div>
          )}
        </div>
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
