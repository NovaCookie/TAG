import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import Pagination from "./common/Pagination";
import DataTable from "./common/data/DataTable";
import AlertMessage from "./common/feedback/AlertMessage";
import { communesAPI } from "../services/api";
import SelectField from "./common/dropdown/SelectField";
import { Link } from "react-router-dom";
import ToggleSwitch from "./common/ToggleSwitch";

const Communes = () => {
  const { user } = useAuth();
  const [communes, setCommunes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    users: "all",
    interventions: "all",
    status: "all",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const userOptions = [
    { value: "all", label: "Tous les utilisateurs" },
    { value: "0", label: "Aucun utilisateur" },
    { value: "1-10", label: "1-10 utilisateurs" },
    { value: "11-100", label: "11-100 utilisateurs" },
    { value: "101+", label: "Plus de 100 utilisateurs" },
  ];

  const interventionOptions = [
    { value: "all", label: "Toutes les interventions" },
    { value: "0", label: "Aucune intervention" },
    { value: "1-10", label: "1-10 interventions" },
    { value: "11-50", label: "11-50 interventions" },
    { value: "51-100", label: "51-100 interventions" },
    { value: "100+", label: "Plus de 100 interventions" },
  ];

  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "active", label: "Actives seulement" },
    { value: "inactive", label: "Inactives seulement" },
  ];

  const loadCommunes = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await communesAPI.getAll({
        page: pagination.page,
        limit: 10,
        search: filters.search !== "" ? filters.search : undefined,
        utilisateurs: filters.users !== "all" ? filters.users : undefined,
        interventions:
          filters.interventions !== "all" ? filters.interventions : undefined,
      });

      if (response.data) {
        const communesWithDefaultActive = response.data.communes.map(
          (commune) => ({
            ...commune,
            actif: commune.actif !== undefined ? commune.actif : true,
          })
        );

        setCommunes(response.data.communes);

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
      console.error("Error loading communes:", error);
      setErrorMessage("Erreur lors du chargement des communes");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, filters]);

  useEffect(() => {
    loadCommunes();
  }, [loadCommunes]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCommuneStatusChange = async (communeId, newStatus) => {
    try {
      setCommunes((prevCommunes) =>
        prevCommunes.map((commune) =>
          commune.id === communeId ? { ...commune, actif: newStatus } : commune
        )
      );
      await communesAPI.update(communeId, { actif: newStatus });
      setSuccessMessage(
        `Commune ${newStatus ? "activée" : "désactivée"} avec succès`
      );
    } catch (error) {
      console.error("Error updating commune status:", error.message);
      setErrorMessage("Erreur lors de la modification du statut de la commune");
    }
  };

  const CommuneRow = ({ commune }) => (
    <div className="grid grid-cols-12 gap-6 py-4 px-6 border-b border-light last:border-b-0 hover:bg-light/30 transition-colors items-center">
      <div className="col-span-1 flex items-center gap-2">
        {commune.code_postal && (
          <span className="bg-primary text-white px-2 py-1 rounded text-xs font-semibold">
            {commune.code_postal}
          </span>
        )}
      </div>

      <div className="col-span-2 flex items-center gap-2">
        <span className="font-semibold text-secondary">{commune.nom}</span>
      </div>

      <div className="col-span-2 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-primary"></span>
        <span className="font-medium text-primary">
          {commune.population?.toLocaleString() || 0} hab.
        </span>
      </div>

      <div className="col-span-2 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-success"></span>
        <span className="font-medium text-success">
          {commune.stats?.nb_utilisateurs || 0} utilisateur
          {commune.stats?.nb_utilisateurs !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="col-span-2 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-warning"></span>
        <span className="font-medium text-warning">
          {commune.stats?.nb_interventions || 0} intervention
          {commune.stats?.nb_interventions !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="col-span-2 flex items-center gap-2">
        <span
          className={`w-3 h-3 rounded-full ${
            commune.actif ? "bg-success" : "bg-secondary"
          }`}
        ></span>
        <span
          className={`font-medium ${
            commune.actif ? "text-success" : "text-secondary"
          }`}
        >
          {commune.actif ? "Actif" : "Inactif"}
        </span>
      </div>

      {user?.role === "admin" && (
        <div className="col-span-1 flex justify-center items-center gap-2">
          <ToggleSwitch
            checked={commune.actif}
            onChange={(checked) =>
              handleCommuneStatusChange(commune.id, checked)
            }
          />
          <Link
            to={`/communes/${commune.id}`}
            className="w-8 h-8 rounded-full bg-light text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
            title="Voir les détails"
          >
            👁️
          </Link>
        </div>
      )}
    </div>
  );

  const filteredCommunes = communes.filter((commune) => {
    if (filters.status === "active") return commune.actif;
    if (filters.status === "inactive") return !commune.actif;
    return true;
  });

  return (
    <Layout activePage="communes">
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
          <h1 className="text-2xl font-semibold text-primary mb-2">Communes</h1>
          <p className="text-tertiary">
            {pagination.total} commune{pagination.total !== 1 ? "s" : ""} au
            total
          </p>
        </div>
        {user?.role === "admin" && (
          <Link
            to="/communes/new"
            className="bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors"
          >
            Nouvelle commune
          </Link>
        )}
      </div>

      <div className="flex gap-4 mb-8 items-center flex-wrap">
        <div className="flex-1 min-w-80">
          <input
            type="text"
            placeholder="Rechercher une commune..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full px-4 py-3 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          <SelectField
            value={filters.users}
            onChange={(e) => handleFilterChange("users", e.target.value)}
            options={userOptions}
            placeholder="Utilisateurs"
            name="users"
          />

          <SelectField
            value={filters.interventions}
            onChange={(e) =>
              handleFilterChange("interventions", e.target.value)
            }
            options={interventionOptions}
            placeholder="Interventions"
            name="interventions"
          />

          <SelectField
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            options={statusOptions}
            placeholder="Statut"
            name="status"
          />
        </div>
      </div>

      <div className="card card-rounded p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-primary">
            Liste des communes
          </h2>
          <span className="text-sm text-tertiary">
            Page {pagination.page} sur {pagination.totalPages}
          </span>
        </div>

        <div className="grid grid-cols-12 gap-6 py-3 px-6 border-b border-light font-semibold text-tertiary text-sm">
          <div className="col-span-1">Code postal</div>
          <div className="col-span-2">Nom</div>
          <div className="col-span-2">Population</div>
          <div className="col-span-2">Utilisateurs</div>
          <div className="col-span-2">Interventions</div>
          <div className="col-span-2">Statut</div>
          <div className="col-span-1">Actions</div>
        </div>

        <DataTable
          data={filteredCommunes.filter((commune) => commune !== undefined)}
          loading={isLoading}
          emptyMessage={
            filters.search ||
            filters.users !== "all" ||
            filters.interventions !== "all" ||
            filters.status !== "all"
              ? "Aucune commune trouvée avec ces critères"
              : "Aucune commune dans la base de données"
          }
          renderItem={(commune) => (
            <CommuneRow key={commune.id} commune={commune} />
          )}
        />
      </div>

      <Pagination
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
      />
    </Layout>
  );
};

export default Communes;
