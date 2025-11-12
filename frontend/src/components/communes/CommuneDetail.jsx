import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Layout from "../layout/Layout";
import { communesAPI, archivesAPI } from "../../services/api";
import { useNavigation } from "../../hooks/useNavigation";

const CommuneDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { getBackLink, getBackText } = useNavigation();

  const [commune, setCommune] = useState(null);
  const [archiveInfo, setArchiveInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isArchived = archiveInfo?.archived;

  const [archiving, setArchiving] = useState(false);
  const [archiveMessage, setArchiveMessage] = useState("");
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState("");
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const checkArchiveStatus = useCallback(async (communeId) => {
    try {
      const response = await archivesAPI.checkStatus("communes", communeId);
      return response.data;
    } catch (error) {
      console.error("Erreur vérification archivage:", error);
      return { archived: false };
    }
  }, []);

  const fetchCommune = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await communesAPI.getById(id);

      if (res?.data) {
        setCommune(res.data);

        const archiveStatus = await checkArchiveStatus(parseInt(id));
        setArchiveInfo(archiveStatus);
      } else {
        setError("Aucune donnée reçue de l'API");
      }
    } catch (err) {
      if (err.response?.status === 404) setError("Commune non trouvée");
      else if (err.response?.status === 403)
        setError("Vous n'avez pas accès à cette commune");
      else if (err.response?.status === 410) {
        try {
          const archiveResponse = await archivesAPI.getAll({
            table_name: "communes",
            search: id,
          });
          const archivedCommune = archiveResponse.data.archives.find(
            (archive) => archive.entity_id === parseInt(id)
          );
          if (archivedCommune) {
            setCommune(archivedCommune.entity_data);
            setArchiveInfo({
              archived: true,
              archive: archivedCommune,
            });
          } else {
            setError("Commune archivée non trouvée");
          }
        } catch (archiveError) {
          setError("Commune archivée - erreur de chargement");
        }
      } else if (err.response?.data?.error) setError(err.response.data.error);
      else setError("Erreur lors du chargement de la commune");
    } finally {
      setLoading(false);
    }
  }, [id, checkArchiveStatus]);

  useEffect(() => {
    if (id) fetchCommune();
    else {
      setError("ID de commune manquant");
      setLoading(false);
    }
  }, [id, fetchCommune]);

  const handleOpenArchiveModal = () => {
    setShowArchiveModal(true);
    setArchiveMessage("");
  };

  const handleCloseArchiveModal = () => {
    setShowArchiveModal(false);
    setArchiveMessage("");
  };

  const handleConfirmArchive = async () => {
    if (!commune) return;

    setArchiving(true);
    setArchiveMessage("");

    try {
      await archivesAPI.archiveEntity(
        "communes",
        commune.id,
        "Archivage par l'administrateur"
      );

      // Recharger les données pour mettre à jour le statut d'archivage
      await fetchCommune();

      setArchiveMessage("Commune archivée avec succès");
      setTimeout(() => {
        setShowArchiveModal(false);
        setArchiveMessage("");
      }, 2000);
    } catch (error) {
      console.error("Erreur archivage:", error);

      let errorMessage = "Erreur lors de l'archivage";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 403) {
        errorMessage =
          "Vous n'avez pas l'autorisation d'archiver cette commune";
      } else if (error.response?.status === 410) {
        errorMessage = "Cette commune est déjà archivée";
      }

      setArchiveMessage(errorMessage);
    } finally {
      setArchiving(false);
    }
  };

  const handleOpenRestoreModal = () => {
    setShowRestoreModal(true);
    setRestoreMessage("");
  };

  const handleCloseRestoreModal = () => {
    setShowRestoreModal(false);
    setRestoreMessage("");
  };

  const handleConfirmRestore = async () => {
    if (!commune) return;

    setRestoring(true);
    setRestoreMessage("");

    try {
      await archivesAPI.restoreEntity("communes", commune.id);

      await fetchCommune();

      setRestoreMessage("Commune restaurée avec succès");
      setTimeout(() => {
        setShowRestoreModal(false);
        setRestoreMessage("");
      }, 2000);
    } catch (error) {
      console.error("Erreur restauration:", error);

      let errorMessage = "Erreur lors de la restauration";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 403) {
        errorMessage =
          "Vous n'avez pas l'autorisation de restaurer cette commune";
      } else if (error.response?.status === 404) {
        errorMessage = "Archive non trouvée";
      }

      setRestoreMessage(errorMessage);
    } finally {
      setRestoring(false);
    }
  };

  const ArchiveConfirmationModal = () => {
    if (!showArchiveModal) return null;
    if (!commune) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-secondary/10 mb-4">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-primary mb-2">
              Confirmer l'archivage
            </h3>

            <p className="text-tertiary mb-6">
              Êtes-vous sûr de vouloir archiver la commune{" "}
              <strong>{commune.nom}</strong> ?
              <br />
              <span className="text-secondary font-medium">
                La commune sera conservée mais ne sera plus visible dans les
                listes principales.
              </span>
            </p>

            {archiveMessage && (
              <div
                className={`px-4 py-3 rounded-lg mb-4 text-sm ${
                  archiveMessage.includes("Erreur")
                    ? "bg-danger/10 text-danger border border-danger/20"
                    : "bg-success/10 text-success border border-success/20"
                }`}
              >
                {archiveMessage}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleCloseArchiveModal}
                disabled={archiving}
                className="px-6 py-2 border border-light text-secondary rounded-lg font-semibold hover:bg-light transition-colors disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                onClick={handleConfirmArchive}
                disabled={archiving}
                className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {archiving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Archivage...
                  </>
                ) : (
                  "Confirmer l'archivage"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RestoreConfirmationModal = () => {
    if (!showRestoreModal) return null;
    if (!commune) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-primary mb-2">
              Confirmer la restauration
            </h3>

            <p className="text-tertiary mb-6">
              Êtes-vous sûr de vouloir restaurer la commune{" "}
              <strong>{commune.nom}</strong> ?
              <br />
              <span className="text-secondary font-medium">
                La commune sera à nouveau visible dans les listes principales.
              </span>
            </p>

            {restoreMessage && (
              <div
                className={`px-4 py-3 rounded-lg mb-4 text-sm ${
                  restoreMessage.includes("Erreur")
                    ? "bg-danger/10 text-danger border border-danger/20"
                    : "bg-success/10 text-success border border-success/20"
                }`}
              >
                {restoreMessage}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleCloseRestoreModal}
                disabled={restoring}
                className="px-6 py-2 border border-light text-secondary rounded-lg font-semibold hover:bg-light transition-colors disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                onClick={handleConfirmRestore}
                disabled={restoring}
                className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-secondary-light transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {restoring ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Restauration...
                  </>
                ) : (
                  "Confirmer la restauration"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout activePage="communes">
        <div className="card card-rounded p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-tertiary">Chargement de la commune...</p>
        </div>
      </Layout>
    );
  }

  if (error || !commune) {
    return (
      <Layout activePage="communes">
        <div className="card card-rounded p-6 text-center">
          <h2 className="text-xl font-semibold text-danger mb-4">
            {error || "Commune non trouvée"}
          </h2>
          <div className="text-tertiary mb-4 space-y-2">
            <p>
              ID de la commune: <strong>{id}</strong>
            </p>
            <p>
              Rôle utilisateur: <strong>{user?.role}</strong>
            </p>
          </div>
          <Link
            to={getBackLink("commune", isArchived)}
            className="text-primary hover:text-primary-light mb-4 inline-block"
          >
            {getBackText("commune", isArchived)}
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activePage={isArchived ? "archives" : "communes"}>
      <div className="mb-6">
        <Link
          to={getBackLink("commune", isArchived)}
          className="text-primary hover:text-primary-light mb-4 inline-block"
        >
          {getBackText("commune", isArchived)}
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-primary mb-2">
              Commune : {commune.nom}
              {isArchived && (
                <span className="ml-3 bg-gray-500 text-white text-sm px-3 py-1 rounded-full inline-flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                  Archivée
                </span>
              )}
            </h1>
          </div>

          {user?.role === "admin" && (
            <div className="flex gap-2">
              {!isArchived ? (
                <button
                  onClick={handleOpenArchiveModal}
                  className="bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors"
                >
                  Archiver
                </button>
              ) : (
                <button
                  onClick={handleOpenRestoreModal}
                  className="bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors"
                >
                  Restaurer
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="card card-rounded p-6 flex flex-col h-full">
            <div>
              <h2 className="text-lg font-semibold text-primary mb-4 border-b border-light-gray pb-3">
                Informations générales
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium text-secondary">
                    Nom de la commune :
                  </span>
                  <span className="text-tertiary">{commune.nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-secondary">
                    Code postal :
                  </span>
                  <span className="text-tertiary">
                    {commune.code_postal || "Non renseigné"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-secondary">
                    Population :
                  </span>
                  <span className="text-tertiary font-semibold">
                    {commune.population?.toLocaleString() || 0} habitants
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-secondary">
                    Date de création :
                  </span>
                  <span className="text-tertiary">
                    {commune.date_creation
                      ? new Date(commune.date_creation).toLocaleDateString(
                          "fr-FR"
                        )
                      : "Date inconnue"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-secondary">Statut :</span>
                  <span className="text-tertiary">
                    {commune.actif ? (
                      <span className="bg-success text-white px-2 py-1 rounded text-xs">
                        Active
                      </span>
                    ) : (
                      <span className="bg-danger text-white px-2 py-1 rounded text-xs">
                        Inactive
                      </span>
                    )}
                  </span>
                </div>
                {isArchived && archiveInfo.archive_date && (
                  <div className="flex justify-between">
                    <span className="font-medium text-secondary">
                      Date d'archivage :
                    </span>
                    <span className="text-tertiary">
                      {new Date(archiveInfo.archive_date).toLocaleDateString(
                        "fr-FR"
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card card-rounded p-6">
            <h2 className="text-lg font-semibold text-primary mb-4 border-b border-light-gray pb-3">
              Statistiques
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-light/50 rounded-lg">
                <span className="text-secondary">Utilisateurs associés</span>
                <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {commune._count?.utilisateurs || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-light/50 rounded-lg">
                <span className="text-secondary">Interventions</span>
                <span className="bg-warning text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {commune._count?.interventions || 0}
                </span>
              </div>
            </div>
          </div>

          {commune.utilisateurs && commune.utilisateurs.length > 0 && (
            <div className="card card-rounded p-6">
              <h2 className="text-lg font-semibold text-primary mb-4 border-b border-light-gray pb-3">
                Utilisateurs associés ({commune.utilisateurs.length})
              </h2>
              <div className="space-y-3">
                {commune.utilisateurs.map((utilisateur) => (
                  <div
                    key={utilisateur.id}
                    className="flex items-center justify-between p-3 bg-light/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-secondary">
                        {utilisateur.prenom} {utilisateur.nom}
                      </p>
                      <p className="text-sm text-tertiary">
                        {utilisateur.email}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        utilisateur.role === "admin"
                          ? "bg-danger text-white"
                          : utilisateur.role === "juriste"
                          ? "bg-warning text-white"
                          : "bg-success text-white"
                      }`}
                    >
                      {utilisateur.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ArchiveConfirmationModal />
      <RestoreConfirmationModal />
    </Layout>
  );
};

export default CommuneDetail;
