import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Pagination from "../common/Pagination";
import { archivesAPI } from "../../services/api";

const CommuneArchives = () => {
  const [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    populationMin: "",
    populationMax: "",
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
        table_name: "communes",
      };

      if (filters.search) params.search = filters.search;
      if (filters.populationMin) params.populationMin = filters.populationMin;
      if (filters.populationMax) params.populationMax = filters.populationMax;
      if (filters.dateArchivageDebut)
        params.dateArchivageDebut = filters.dateArchivageDebut;
      if (filters.dateArchivageFin)
        params.dateArchivageFin = filters.dateArchivageFin;

      const response = await archivesAPI.getCommuneArchives(params);
      const data = response.data;

      const communesWithArchiveDates = data.archives.map((archive) => ({
        ...archive.entity_data,
        archive_date: archive.date_archivage,
        archive_id: archive.id,
        archived_by: archive.archived_by,
      }));

      setCommunes(communesWithArchiveDates);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.pages,
      }));
    } catch (error) {
      console.error("Erreur chargement archives communes:", error);
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

  const ArchiveRow = ({ commune }) => {
    return (
      <Link
        to={`/communes/${commune.id}`}
        className="block hover:bg-light/30 transition-colors duration-200"
      >
        <div className="py-4 px-6 border-b border-light last:border-b-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="bg-primary text-white px-3 py-1 rounded text-sm font-semibold whitespace-nowrap flex-shrink-0">
                #{commune.id.toString().padStart(4, "0")}
              </span>
              <div className="font-medium text-secondary line-clamp-2 break-words min-w-0">
                {commune.nom}
              </div>
            </div>
            <div className="flex-shrink-0 ml-4">
              <div className="w-8 h-8 rounded-full bg-light text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                <span className="text-sm">→</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-tertiary mb-2">
            <span className="font-medium text-secondary">Population :</span>
            <span>{commune.population?.toLocaleString() || 0} habitants</span>

            <span className="font-medium text-secondary">Code postal :</span>
            <span>{commune.code_postal || "Non renseigné"}</span>

            <span className="font-medium text-secondary">Archivée le :</span>
            <span>{formatDateFr(commune.archive_date)}</span>
          </div>

          {commune.archived_by && (
            <div className="flex items-center gap-4 text-sm text-tertiary mb-2">
              <span className="font-medium text-secondary">Archivée par :</span>
              <span>
                {commune.archived_by.prenom} {commune.archived_by.nom}
              </span>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-secondary font-medium">
                {commune._count?.utilisateurs || 0} utilisateur(s)
              </span>
            </div>

            <span className="text-light">•</span>

            <div className="flex items-center gap-2">
              <span className="text-secondary font-medium">
                {commune._count?.interventions || 0} intervention(s)
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div>
      {/* Filtres */}
      <div className="card card-rounded p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Recherche
            </label>
            <input
              type="text"
              placeholder="Nom de la commune..."
              className="w-full px-4 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Population min
            </label>
            <input
              type="number"
              placeholder="0"
              className="w-full px-4 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={filters.populationMin}
              onChange={(e) =>
                handleFilterChange("populationMin", e.target.value)
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Population max
            </label>
            <input
              type="number"
              placeholder="100000"
              className="w-full px-4 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={filters.populationMax}
              onChange={(e) =>
                handleFilterChange("populationMax", e.target.value)
              }
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
            Archives des communes ({pagination.total})
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
            {communes.length > 0 ? (
              communes.map((commune) => (
                <ArchiveRow key={commune.id} commune={commune} />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-tertiary text-lg mb-2">
                  Aucune commune archivée trouvée
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

export default CommuneArchives;
