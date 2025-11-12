import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Pagination from "../common/Pagination";
import SelectField from "../common/dropdown/SelectField";
import { archivesAPI } from "../../services/api";

const UserArchives = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    role: "all",
    dateArchivageDebut: "",
    dateArchivageFin: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const formatDateFr = (dateInput) => {
    if (!dateInput) return "-";
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("fr-FR");
  };

  const fetchArchives = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        table_name: "utilisateurs",
      };

      if (filters.search) params.search = filters.search;
      if (filters.role !== "all") params.role = filters.role;
      if (filters.dateArchivageDebut)
        params.dateArchivageDebut = filters.dateArchivageDebut;
      if (filters.dateArchivageFin)
        params.dateArchivageFin = filters.dateArchivageFin;

      const response = await archivesAPI.getUserArchives(params);
      const data = response.data;

      const usersWithArchiveDates = data.archives.map((archive) => ({
        ...archive.entity_data,
        archive_date: archive.date_archivage,
        archive_id: archive.id,
        archived_by: archive.archived_by,
      }));

      setUsers(usersWithArchiveDates);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.pages,
      }));
    } catch (error) {
      console.error("Erreur chargement archives utilisateurs:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchArchives();
  }, [fetchArchives]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { color: "bg-danger", text: "Admin" },
      juriste: { color: "bg-warning", text: "Juriste" },
      commune: { color: "bg-success", text: "Commune" },
    };

    const config = roleConfig[role] || { color: "bg-gray-500", text: role };
    return (
      <span className={`${config.color} text-white px-2 py-1 rounded text-xs`}>
        {config.text}
      </span>
    );
  };

  const ArchiveRow = ({ user }) => {
    return (
      <Link
        to={`/users/edit/${user.id}`}
        className="block hover:bg-light/30 transition-colors duration-200"
      >
        <div className="py-4 px-6 border-b border-light last:border-b-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="bg-primary text-white px-3 py-1 rounded text-sm font-semibold whitespace-nowrap flex-shrink-0">
                #{user.id.toString().padStart(4, "0")}
              </span>
              <div className="font-medium text-secondary line-clamp-2 break-words min-w-0">
                {user.prenom} {user.nom}
              </div>
              {getRoleBadge(user.role)}
            </div>
            <div className="flex-shrink-0 ml-4">
              <div className="w-8 h-8 rounded-full bg-light text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                <span className="text-sm">→</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-tertiary mb-2">
            <span className="font-medium text-secondary">Email :</span>
            <span>{user.email}</span>

            <span className="font-medium text-secondary">Archivé le :</span>
            <span>{formatDateFr(user.archive_date)}</span>
          </div>

          {user.archived_by && (
            <div className="flex items-center gap-4 text-sm text-tertiary mb-2">
              <span className="font-medium text-secondary">Archivé par :</span>
              <span>
                {user.archived_by.prenom} {user.archived_by.nom}
              </span>
            </div>
          )}

          {user.commune && (
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium text-secondary">Commune :</span>
              <span className="text-primary-light">{user.commune.nom}</span>
            </div>
          )}
        </div>
      </Link>
    );
  };

  const roleOptions = [
    { value: "all", label: "Tous les rôles" },
    { value: "admin", label: "Administrateur" },
    { value: "juriste", label: "Juriste" },
    { value: "commune", label: "Commune" },
  ];

  return (
    <div>
      {/* Filtres */}
      <div className="card card-rounded p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Recherche
            </label>
            <input
              type="text"
              placeholder="Nom, prénom, email..."
              className="w-full px-4 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Rôle
            </label>
            <SelectField
              value={filters.role}
              onChange={(e) => handleFilterChange("role", e.target.value)}
              options={roleOptions}
              placeholder="Tous les rôles"
            />
          </div>
        </div>

        {/* Filtres dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-light">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Date archivage (début)
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={filters.dateArchivageDebut}
              onChange={(e) =>
                handleFilterChange("dateArchivageDebut", e.target.value)
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Date archivage (fin)
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={filters.dateArchivageFin}
              onChange={(e) =>
                handleFilterChange("dateArchivageFin", e.target.value)
              }
            />
          </div>
        </div>
      </div>

      {/* Liste des archives */}
      <div className="card card-rounded p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-primary">
            Archives des utilisateurs ({pagination.total})
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
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-0">
            {users.length > 0 ? (
              users.map((user) => <ArchiveRow key={user.id} user={user} />)
            ) : (
              <div className="text-center py-12">
                <div className="text-tertiary text-lg mb-2">
                  Aucun utilisateur archivé trouvé
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
    </div>
  );
};

export default UserArchives;
