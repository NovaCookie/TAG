import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import Pagination from "./common/Pagination";
import DataTable from "./common/data/DataTable";
import AlertMessage from "./common/feedback/AlertMessage";
import { themesAPI, retentionAPI } from "../services/api";
import { Link } from "react-router-dom";
import ToggleSwitch from "./common/ToggleSwitch";

const Themes = () => {
  const { user } = useAuth();
  const [themes, setThemes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [filters, setFilters] = useState({
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const loadThemes = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await themesAPI.getAllIncludingInactive();

      if (response.data) {
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

        setThemes(themesWithPolicies);
        setPagination((prev) => ({
          ...prev,
          total: themesWithPolicies.length,
          totalPages: Math.ceil(themesWithPolicies.length / 10),
        }));
      }
    } catch (error) {
      console.error("Error loading themes:", error);
      setErrorMessage("Erreur lors du chargement des thèmes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "commune") {
      setErrorMessage("Accès non autorisé à cette page");
      return;
    }
    loadThemes();
  }, [loadThemes, user]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleThemeStatusChange = async (themeId, newStatus) => {
    try {
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
    }
  };

  const getDurationDisplay = (theme) => {
    if (theme.rgpd_policy) {
      return `${theme.rgpd_policy.duree_mois} mois`;
    }
    return "24 mois (défaut)";
  };

  const getRgpdDescription = (theme) => {
    if (theme.rgpd_policy?.description) {
      return theme.rgpd_policy.description;
    }
    return "Aucune politique RGPD spécifique";
  };

  const ThemeRow = ({ theme }) => (
    <div className="grid grid-cols-12 gap-6 py-4 px-6 border-b border-light last:border-b-0 hover:bg-light/30 transition-colors items-center">
      <div className="col-span-3 flex items-center gap-3">
        <span className="font-semibold text-secondary">
          {theme.designation}
        </span>
      </div>

      <div className="col-span-2 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-primary"></span>
        <span className="font-medium text-primary">
          {getDurationDisplay(theme)}
        </span>
      </div>

      <div className="col-span-4 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-warning flex-shrink-0"></span>
        <span className="font-medium text-warning text-sm">
          {getRgpdDescription(theme)}
        </span>
      </div>

      <div className="col-span-2 flex items-center gap-2">
        <span
          className={`w-3 h-3 rounded-full ${
            theme.actif ? "bg-success" : "bg-secondary"
          }`}
        ></span>
        <span
          className={`font-medium ${
            theme.actif ? "text-success" : "text-secondary"
          }`}
        >
          {theme.actif ? "Actif" : "Inactif"}
        </span>
      </div>

      {(user?.role === "admin" || user?.role === "juriste") && (
        <div className="col-span-1 flex justify-center items-center gap-2">
          {user?.role === "admin" && (
            <ToggleSwitch
              checked={theme.actif}
              onChange={(checked) => handleThemeStatusChange(theme.id, checked)}
            />
          )}
          <Link
            to={`/themes/edit/${theme.id}`}
            className="w-8 h-8 rounded-full bg-light text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
            title="Modifier le thème"
          >
            ✏️
          </Link>
        </div>
      )}
    </div>
  );

  const filteredThemes = themes.filter((theme) => {
    if (!filters.search) return true;

    const searchLower = filters.search.toLowerCase();
    return (
      theme.designation.toLowerCase().includes(searchLower) ||
      getRgpdDescription(theme).toLowerCase().includes(searchLower)
    );
  });

  const startIndex = (pagination.page - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedThemes = filteredThemes.slice(startIndex, endIndex);

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

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-primary mb-2">Thèmes</h1>
          <p className="text-tertiary">
            Gestion des thèmes et politiques de conservation automatique
          </p>
        </div>
        {user?.role != "commune" && (
          <Link
            to="/themes/new"
            className="bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors"
          >
            Nouveau thème
          </Link>
        )}
      </div>

      <div className="flex gap-4 mb-8 items-center flex-wrap">
        <div className="flex-1 min-w-80">
          <input
            type="text"
            placeholder="Rechercher un thème..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full px-4 py-3 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
          />
        </div>
      </div>

      <div className="card card-rounded p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-primary">
            Liste des thèmes
            {filteredThemes.length > 0 && (
              <span className="ml-2 text-sm font-normal text-tertiary">
                ({filteredThemes.length} thème
                {filteredThemes.length !== 1 ? "s" : ""})
              </span>
            )}
          </h2>
          <span className="text-sm text-tertiary">
            Page {pagination.page} sur {Math.ceil(filteredThemes.length / 10)}
          </span>
        </div>

        <div className="grid grid-cols-12 gap-6 py-3 px-6 border-b border-light font-semibold text-tertiary text-sm">
          <div className="col-span-3">Nom du thème</div>
          <div className="col-span-2">Durée RGPD</div>
          <div className="col-span-4">Description RGPD</div>
          <div className="col-span-2">Statut</div>
          <div className="col-span-1">Actions</div>
        </div>

        <DataTable
          data={paginatedThemes}
          loading={isLoading}
          emptyMessage={
            filters.search
              ? "Aucun thème trouvé avec ces critères"
              : "Aucun thème dans la base de données"
          }
          renderItem={(theme) => <ThemeRow key={theme.id} theme={theme} />}
        />
      </div>

      {filteredThemes.length > 0 && (
        <Pagination
          pagination={{
            page: pagination.page,
            totalPages: Math.ceil(filteredThemes.length / 10),
            total: filteredThemes.length,
          }}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        />
      )}
    </Layout>
  );
};

export default Themes;
