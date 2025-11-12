import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import Pagination from "./common/Pagination";
import DataTable from "./common/data/DataTable";
import AlertMessage from "./common/feedback/AlertMessage";
import { communesAPI } from "../services/api";
import SelectField from "./common/dropdown/SelectField";
import { Link } from "react-router-dom";

const Communes = () => {
  const { user } = useAuth();
  const [communes, setCommunes] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [filtres, setFiltres] = useState({
    search: "",
    utilisateurs: "all",
    interventions: "all",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  // Options pour les filtres
  const utilisateursOptions = [
    { value: "all", label: "Tous les utilisateurs" },
    { value: "0", label: "Aucun utilisateur" },
    { value: "1-10", label: "1-10 utilisateurs" },
    { value: "11-100", label: "11-100 utilisateurs" },
    { value: "101+", label: "Plus de 100 utilisateurs" },
  ];

  const interventionsOptions = [
    { value: "all", label: "Toutes les interventions" },
    { value: "0", label: "Aucune intervention" },
    { value: "1-10", label: "1-10 interventions" },
    { value: "11-50", label: "11-50 interventions" },
    { value: "51-100", label: "51-100 interventions" },
    { value: "100+", label: "Plus de 100 interventions" },
  ];

  const chargerCommunes = useCallback(async () => {
    try {
      setChargement(true);
      setErrorMessage("");

      const reponse = await communesAPI.getAll({
        page: pagination.page,
        limit: 10,
        search: filtres.search !== "" ? filtres.search : undefined,
        utilisateurs:
          filtres.utilisateurs !== "all" ? filtres.utilisateurs : undefined,
        interventions:
          filtres.interventions !== "all" ? filtres.interventions : undefined,
      });

      if (reponse.data) {
        setCommunes(reponse.data.communes);

        if (reponse.data.pagination) {
          setPagination((prev) => ({
            ...prev,
            page: reponse.data.pagination.page,
            totalPages: reponse.data.pagination.pages,
            total: reponse.data.pagination.total,
          }));
        }
      }
    } catch (erreur) {
      console.error("Erreur chargement communes:", erreur);
      setErrorMessage("Erreur lors du chargement des communes");
    } finally {
      setChargement(false);
    }
  }, [pagination.page, filtres]);

  useEffect(() => {
    chargerCommunes();
  }, [chargerCommunes]);

  const gererChangementFiltre = (cle, valeur) => {
    setFiltres((prev) => ({
      ...prev,
      [cle]: valeur,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const LigneCommune = ({ commune }) => (
    <div className="flex items-center justify-between py-4 px-4 border-b border-light last:border-b-0 hover:bg-light/30 transition-colors">
      {/* Informations principales sur une seule ligne */}
      <div className="flex items-center gap-6 flex-1">
        {/* Code postal + Nom */}
        <div className="flex items-center gap-3 min-w-60">
          {commune.code_postal && (
            <span className="bg-primary text-white px-3 py-1 rounded text-sm font-semibold">
              {commune.code_postal}
            </span>
          )}
          <span className="font-semibold text-secondary text-lg">
            {commune.nom}
          </span>
        </div>

        {/* Population */}
        <div className="flex items-center gap-2 min-w-32">
          <span className="w-3 h-3 rounded-full bg-primary"></span>
          <span className="font-medium text-primary">
            {commune.population?.toLocaleString() || 0} hab.
          </span>
        </div>

        {/* Utilisateurs */}
        <div className="flex items-center gap-2 min-w-40">
          <span className="w-3 h-3 rounded-full bg-success"></span>
          <span className="font-medium text-success">
            {commune.stats?.nb_utilisateurs || 0} utilisateur
            {commune.stats?.nb_utilisateurs !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Interventions */}
        <div className="flex items-center gap-2 min-w-40">
          <span className="w-3 h-3 rounded-full bg-warning"></span>
          <span className="font-medium text-warning">
            {commune.stats?.nb_interventions || 0} intervention
            {commune.stats?.nb_interventions !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Actions pour admin */}
      {user?.role === "admin" && (
        <div className="flex gap-2">
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

  return (
    <Layout activePage="communes">
      {/* Messages d'alerte */}
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

      {/* En-tête de page */}
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

      {/* Filtres */}
      <div className="flex gap-6 mb-8 items-center">
        {/* Recherche */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rechercher une commune..."
            value={filtres.search}
            onChange={(e) => gererChangementFiltre("search", e.target.value)}
            className="w-full px-4 py-3 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
          />
        </div>

        {/* Filtres utilisateurs et interventions avec SelectField */}
        <div className="flex gap-4">
          <SelectField
            value={filtres.utilisateurs}
            onChange={(e) =>
              gererChangementFiltre("utilisateurs", e.target.value)
            }
            options={utilisateursOptions}
            placeholder="Utilisateurs"
            name="utilisateurs"
          />

          <SelectField
            value={filtres.interventions}
            onChange={(e) =>
              gererChangementFiltre("interventions", e.target.value)
            }
            options={interventionsOptions}
            placeholder="Interventions"
            name="interventions"
          />
        </div>
      </div>

      {/* Liste des communes */}
      <div className="card card-rounded p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-primary">
            Liste des communes
          </h2>
          <span className="text-sm text-tertiary">
            Page {pagination.page} sur {pagination.totalPages}
          </span>
        </div>

        <DataTable
          data={communes.filter((commune) => commune !== undefined)}
          loading={chargement}
          emptyMessage={
            filtres.search ||
            filtres.utilisateurs !== "all" ||
            filtres.interventions !== "all"
              ? "Aucune commune trouvée avec ces critères"
              : "Aucune commune dans la base de données"
          }
          renderItem={(commune) => (
            <LigneCommune key={commune.id} commune={commune} />
          )}
        />
      </div>

      {/* Pagination */}
      <Pagination
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
      />
    </Layout>
  );
};

export default Communes;
