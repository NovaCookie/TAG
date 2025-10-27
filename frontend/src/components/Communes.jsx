import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import StatusBadge from "./common/StatusBadge";
import Pagination from "./common/Pagination";
import SearchFilter from "./common/SearchFilter";
import { communesAPI } from "../services/api";

const Communes = () => {
  const { user } = useAuth();
  const [communes, setCommunes] = useState([]);
  const [chargement, setChargement] = useState(false);
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

  useEffect(() => {
    chargerCommunes();
  }, [pagination.page, filtres]);

  const chargerCommunes = async () => {
    try {
      setChargement(true);

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
    } finally {
      setChargement(false);
    }
  };

  const gererChangementFiltre = (cle, valeur) => {
    setFiltres((prev) => ({
      ...prev,
      [cle]: valeur,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const basculerStatutCommune = async (communeId) => {
    try {
      const reponse = await communesAPI.basculerStatut(communeId);

      setCommunes((prev) =>
        prev.map((commune) =>
          commune.id === communeId
            ? { ...commune, actif: !commune.actif }
            : commune
        )
      );

      console.log(reponse.data.message);
    } catch (erreur) {
      console.error("Erreur changement statut commune:", erreur);
    }
  };

  const obtenirPlageUtilisateurs = (nbUtilisateurs) => {
    if (nbUtilisateurs === 0) return "0";
    if (nbUtilisateurs <= 10) return "1-10";
    if (nbUtilisateurs <= 100) return "11-100";
    return "101+";
  };

  const obtenirPlageInterventions = (nbInterventions) => {
    if (nbInterventions === 0) return "0";
    if (nbInterventions <= 10) return "1-10";
    if (nbInterventions <= 50) return "11-50";
    if (nbInterventions <= 100) return "51-100";
    return "100+";
  };

  const LigneCommune = ({ commune }) => (
    <div className="flex justify-between items-center py-5 border-b border-light-gray last:border-b-0 hover:bg-light/50 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-10 h-10 rounded-full bg-primary-light text-white flex items-center justify-center font-semibold">
          {commune.nom.substring(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-secondary truncate">
            {commune.nom}
          </div>
          <div className="text-xs text-tertiary flex gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              {commune.stats.nb_utilisateurs} utilisateur
              {commune.stats.nb_utilisateurs !== 1 ? "s" : ""}
              <span className="text-primary-light ml-1">
                ({obtenirPlageUtilisateurs(commune.stats.nb_utilisateurs)})
              </span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-warning"></span>
              {commune.stats.nb_interventions} intervention
              {commune.stats.nb_interventions !== 1 ? "s" : ""}
              <span className="text-warning ml-1">
                ({obtenirPlageInterventions(commune.stats.nb_interventions)})
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mr-4">
        <StatusBadge
          status={commune.actif ? "active" : "inactive"}
          className={
            commune.actif
              ? "bg-success/10 text-success"
              : "bg-danger/10 text-danger"
          }
        />
      </div>

      <div className="flex gap-2">
        {user?.role === "admin" && (
          <>
            <button
              onClick={() => basculerStatutCommune(commune.id)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                commune.actif
                  ? "bg-warning/10 text-warning hover:bg-warning hover:text-white"
                  : "bg-success/10 text-success hover:bg-success hover:text-white"
              }`}
              title={commune.actif ? "Désactiver" : "Activer"}
            >
              {commune.actif ? "⏸️" : "▶️"}
            </button>
            <button
              className="w-8 h-8 rounded-full bg-light text-primary flex items-center justify-center hover:bg-primary-light hover:text-white transition-colors"
              title="Modifier"
            >
              ✏️
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <Layout activePage="communes">
      {/* En-tête de page */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-primary mb-2">Communes</h1>
          <p className="text-secondary-light">
            {pagination.total} commune{pagination.total !== 1 ? "s" : ""} au
            total
          </p>
        </div>
        {user?.role === "admin" && (
          <button className="bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors">
            Nouvelle commune
          </button>
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
            className="w-full px-4 py-3 border border-light-gray rounded-lg focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>

        {/* Filtres utilisateurs et interventions */}
        <div className="flex gap-4">
          {/* Filtre utilisateurs */}
          <select
            value={filtres.utilisateurs}
            onChange={(e) =>
              gererChangementFiltre("utilisateurs", e.target.value)
            }
            className="px-4 py-3 border border-light-gray rounded-lg bg-white focus:outline-none focus:border-primary min-w-40"
          >
            <option value="all">Tous les utilisateurs</option>
            <option value="0">Aucun utilisateur</option>
            <option value="1-10">1-10 utilisateurs</option>
            <option value="11-100">11-100 utilisateurs</option>
            <option value="101+">Plus de 100 utilisateurs</option>
          </select>

          {/* Filtre interventions */}
          <select
            value={filtres.interventions}
            onChange={(e) =>
              gererChangementFiltre("interventions", e.target.value)
            }
            className="px-4 py-3 border border-light-gray rounded-lg bg-white focus:outline-none focus:border-primary min-w-40"
          >
            <option value="all">Toutes les interventions</option>
            <option value="0">Aucune intervention</option>
            <option value="1-10">1-10 interventions</option>
            <option value="11-50">11-50 interventions</option>
            <option value="51-100">51-100 interventions</option>
            <option value="100+">Plus de 100 interventions</option>
          </select>
        </div>
      </div>

      {/* Liste des communes */}
      <div className="bg-white rounded-xl shadow-card p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-primary">
            Liste des communes
          </h2>
          <span className="text-sm text-secondary-light">
            Page {pagination.page} sur {pagination.totalPages}
          </span>
        </div>

        {chargement ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-tertiary">Chargement des communes...</p>
          </div>
        ) : (
          <div className="space-y-0">
            {communes.map((commune) => (
              <LigneCommune key={commune.id} commune={commune} />
            ))}

            {communes.length === 0 && !chargement && (
              <div className="text-center py-12 text-secondary-light">
                {filtres.search ||
                filtres.utilisateurs !== "all" ||
                filtres.interventions !== "all"
                  ? "Aucune commune trouvée avec ces critères"
                  : "Aucune commune dans la base de données"}
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

export default Communes;
