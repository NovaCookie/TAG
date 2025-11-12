import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../common/StatusBadge";
import Pagination from "../common/Pagination";
import SelectField from "../common/dropdown/SelectField";
import {
  interventionsAPI,
  themesAPI,
  usersAPI,
  archivesAPI,
} from "../../services/api";

const InterventionArchives = () => {
  const [interventions, setInterventions] = useState([]);
  const [themes, setThemes] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    theme: "all",
    commune: "all",
    dateArchivageDebut: "",
    dateArchivageFin: "",
    dateQuestionDebut: "",
    dateQuestionFin: "",
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
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const getArchiveDates = useCallback(async (interventionIds) => {
    try {
      const archivePromises = interventionIds.map((id) =>
        archivesAPI.checkStatus("interventions", id)
      );

      const archiveResults = await Promise.all(archivePromises);

      const archiveDatesMap = {};
      archiveResults.forEach((result, index) => {
        if (result.data.archived && result.data.archive) {
          archiveDatesMap[interventionIds[index]] =
            result.data.archive.date_archivage;
        }
      });

      return archiveDatesMap;
    } catch (error) {
      console.error("Erreur récupération dates archivage:", error);
      return {};
    }
  }, []);

  const fetchArchives = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.status !== "all") params.status = filters.status;
      if (filters.theme !== "all") params.theme = filters.theme;
      if (filters.commune !== "all") params.commune = filters.commune;
      if (filters.dateArchivageDebut)
        params.dateArchivageDebut = filters.dateArchivageDebut;
      if (filters.dateArchivageFin)
        params.dateArchivageFin = filters.dateArchivageFin;
      if (filters.dateQuestionDebut)
        params.dateQuestionDebut = filters.dateQuestionDebut;
      if (filters.dateQuestionFin)
        params.dateQuestionFin = filters.dateQuestionFin;
      if (filters.search.trim() !== "") params.search = filters.search;

      const response = await interventionsAPI.getArchives(params);
      const data = response.data;

      const interventionIds = data.interventions.map((interv) => interv.id);
      const archiveDatesMap = await getArchiveDates(interventionIds);

      const interventionsWithArchiveDates = data.interventions.map(
        (intervention) => ({
          ...intervention,
          archive_date: archiveDatesMap[intervention.id] || null,
        })
      );

      setInterventions(interventionsWithArchiveDates);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.pages,
      }));
    } catch (error) {
      console.error("Erreur chargement archives:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, getArchiveDates]);

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
    fetchArchives();
    fetchThemes();
    fetchCommunes();
  }, [fetchArchives, fetchThemes, fetchCommunes]);

  const getInterventionStatus = (intervention) => {
    if (!intervention.reponse) {
      return "en_attente";
    } else if (intervention.reponse && !intervention.satisfaction) {
      return "repondu";
    } else {
      return "termine";
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
      dateArchivageDebut: "",
      dateArchivageFin: "",
      dateQuestionDebut: "",
      dateQuestionFin: "",
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

  const ArchiveRow = ({ intervention }) => {
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

          <div className="flex items-center gap-4 text-sm text-tertiary mb-2">
            <span className="font-medium text-secondary">
              Question posée le :
            </span>
            <span>{formatDateFr(intervention.date_question)}</span>

            {intervention.date_reponse && (
              <>
                <span className="font-medium text-secondary">
                  Réponse donnée le :
                </span>
                <span>{formatDateFr(intervention.date_reponse)}</span>
              </>
            )}

            <span className="font-medium text-secondary">Archivée le :</span>
            <span>{formatDateFr(intervention.archive_date)}</span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-secondary font-medium">
                {intervention.commune?.nom}
              </span>
            </div>

            <span className="text-light">•</span>

            <div className="flex items-center gap-2">
              <StatusBadge status={status} />
            </div>

            <span className="text-light">•</span>

            <div className="flex items-center gap-2">
              <span className="text-primary-light font-medium">
                {intervention.theme?.designation}
              </span>
            </div>

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
    { value: "en_attente", label: "En attente" },
    { value: "repondu", label: "Répondu" },
    { value: "termine", label: "Terminé" },
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
              fieldName="statut"
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
        </div>

        {/* Filtres dates */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4 pt-4 border-t border-light">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Date question (début)
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={filters.dateQuestionDebut}
              onChange={(e) =>
                handleFilterChange("dateQuestionDebut", e.target.value)
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Date question (fin)
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={filters.dateQuestionFin}
              onChange={(e) =>
                handleFilterChange("dateQuestionFin", e.target.value)
              }
            />
          </div>

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

          <div className="flex items-end">
            <button
              onClick={resetDateFilters}
              className="w-full bg-gray-200 text-gray-700 rounded-lg px-4 py-2 font-medium text-sm hover:bg-gray-300 transition-colors"
            >
              Effacer dates
            </button>
          </div>
        </div>
      </div>

      {/* Liste des archives */}
      <div className="card card-rounded p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-primary">
            Archives des interventions ({pagination.total})
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
                <ArchiveRow key={intervention.id} intervention={intervention} />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-tertiary text-lg mb-2">
                  Aucune intervention archivée trouvée
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

export default InterventionArchives;
