import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Layout from "../layout/Layout";
import StatusBadge from "../common/StatusBadge";
import { formatDate } from "../../utils/helpers";
import ToggleSwitch from "../common/ToggleSwitch";
import {
  archivesAPI,
  interventionsAPI,
  suggestionsAPI,
  faqAPI,
} from "../../services/api";
import { useNavigation } from "../../hooks/useNavigation";

const InterventionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getBackLink, getBackText } = useNavigation();

  const [intervention, setIntervention] = useState(null);
  const [archiveInfo, setArchiveInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isArchived = archiveInfo?.archived;

  const [satisfactionNote, setSatisfactionNote] = useState(0);
  const [submittingSatisfaction, setSubmittingSatisfaction] = useState(false);
  const [satisfactionMessage, setSatisfactionMessage] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [archiving, setArchiving] = useState(false);
  const [archiveMessage, setArchiveMessage] = useState("");
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState("");
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const [similarCount, setSimilarCount] = useState(0);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

  const [isFAQ, setIsFAQ] = useState(false);
  const [faqLoading, setFaqLoading] = useState(false);

  useEffect(() => {
    const loadSimilarCount = async () => {
      try {
        setIsLoadingSimilar(true);
        const response = await suggestionsAPI.getSimilarCount(intervention.id);
        setSimilarCount(response.data.count);
      } catch (error) {
        console.error("Erreur chargement compteur similaire:", error);
      } finally {
        setIsLoadingSimilar(false);
      }
    };

    if (intervention) {
      loadSimilarCount();
    }
  }, [intervention]);

  const checkArchiveStatus = useCallback(async (interventionId) => {
    try {
      const response = await archivesAPI.checkStatus(
        "interventions",
        interventionId
      );
      return response.data;
    } catch (error) {
      console.error("Erreur vérification archivage:", error);
      return { archived: false };
    }
  }, []);

  const fetchIntervention = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await interventionsAPI.getById(id);

      if (res?.data) {
        setIntervention(res.data);
        setSatisfactionNote(res.data.satisfaction || 0);
        setIsFAQ(res.data.est_faq || false); // Correction: utiliser est_faq au lieu de is_faq

        const archiveStatus = await checkArchiveStatus(id);
        setArchiveInfo(archiveStatus);
      } else {
        setError("Aucune donnée reçue de l'API");
      }
    } catch (err) {
      if (err.response?.status === 404) setError("Intervention non trouvée");
      else if (err.response?.status === 403)
        setError("Vous n'avez pas accès à cette intervention");
      else if (err.response?.status === 410) {
        try {
          const archiveResponse = await archivesAPI.getAll({
            table_name: "interventions",
            search: id,
          });
          const archivedIntervention = archiveResponse.data.archives.find(
            (archive) => archive.entity_id === parseInt(id)
          );
          if (archivedIntervention) {
            setIntervention(archivedIntervention.entity_data);
            setArchiveInfo({
              archived: true,
              archive: archivedIntervention,
            });
          } else {
            setError("Intervention archivée non trouvée");
          }
        } catch (archiveError) {
          setError("Intervention archivée - erreur de chargement");
        }
      } else if (err.response?.data?.error) setError(err.response.data.error);
      else setError("Erreur lors du chargement de l'intervention");
    } finally {
      setLoading(false);
    }
  }, [id, checkArchiveStatus]);

  useEffect(() => {
    if (id) fetchIntervention();
    else {
      setError("ID d'intervention manquant");
      setLoading(false);
    }
  }, [id, fetchIntervention]);

  // Fonction pour ajouter à la Faq
  const handleFAQToggle = async (checked) => {
    if (!intervention) return;

    setFaqLoading(true);
    try {
      if (checked) {
        await faqAPI.addToFAQ(intervention.id);
      } else {
        await faqAPI.removeFromFAQ(intervention.id);
      }
      setIsFAQ(checked);

      // Recharger les données pour avoir les dernières informations
      await fetchIntervention();

      // Message de succès
      setSatisfactionMessage(
        checked
          ? "Question ajoutée à la FAQ avec succès"
          : "Question retirée de la FAQ avec succès"
      );
      setTimeout(() => setSatisfactionMessage(""), 3000);
    } catch (error) {
      console.error("Erreur modification Faq:", error);

      // Annuler le toggle en cas d'erreur
      setIsFAQ(!checked);

      // Afficher un message d'erreur à l'utilisateur
      const errorMessage =
        error.response?.data?.error ||
        "Erreur lors de la modification de la FAQ";
      setSatisfactionMessage(errorMessage);
      setTimeout(() => setSatisfactionMessage(""), 5000);
    } finally {
      setFaqLoading(false);
    }
  };

  const handleOpenDeleteModal = () => {
    setShowDeleteModal(true);
    setDeleteError("");
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    if (!intervention) return;
    setDeleting(true);
    setDeleteError("");

    try {
      await interventionsAPI.delete(intervention.id);

      navigate("/interventions", {
        state: {
          message: "L'intervention a été supprimée avec succès",
          type: "success",
        },
      });
    } catch (error) {
      console.error("Erreur suppression intervention:", error);

      let errorMessage = "Erreur lors de la suppression de l'intervention";

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 403) {
        errorMessage =
          "Vous n'avez pas l'autorisation de supprimer cette intervention";
      } else if (error.response?.status === 404) {
        errorMessage = "Intervention non trouvée";
      } else if (error.response?.status === 410) {
        errorMessage = "Impossible de supprimer une intervention archivée";
      }

      setDeleteError(errorMessage);
    } finally {
      setDeleting(false);
      if (!deleteError) setShowDeleteModal(false);
    }
  };

  const handleSatisfactionSubmit = async (note) => {
    if (!intervention || submittingSatisfaction || isArchived) return;

    setSubmittingSatisfaction(true);
    setSatisfactionMessage("");

    try {
      await interventionsAPI.rateSatisfaction(intervention.id, note);

      setIntervention((prev) => ({
        ...prev,
        satisfaction: note,
      }));

      setSatisfactionNote(note);
      setSatisfactionMessage("Merci pour votre évaluation !");

      setTimeout(() => setSatisfactionMessage(""), 3000);
    } catch (error) {
      let errorMessage = "Erreur lors de l'enregistrement";

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 403) {
        errorMessage = "Vous ne pouvez noter que vos propres interventions";
      } else if (error.response?.status === 400) {
        errorMessage = "Impossible de noter une intervention sans réponse";
      } else if (error.response?.status === 410) {
        errorMessage = "Impossible de noter une intervention archivée";
      }

      setSatisfactionMessage(errorMessage);
      setTimeout(() => setSatisfactionMessage(""), 5000);
    } finally {
      setSubmittingSatisfaction(false);
    }
  };

  const handleDownload = async (piece) => {
    if (isArchived) {
      alert(
        "Impossible de télécharger les pièces jointes d'une intervention archivée"
      );
      return;
    }

    try {
      const response = await interventionsAPI.downloadPieceJointe(piece.id);

      // Créer un blob à partir de la réponse
      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
      });

      // Créer une URL temporaire
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = piece.nom_original; // Nom original du fichier
      document.body.appendChild(link);
      link.click();

      // Nettoyer
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Erreur téléchargement:", error);
      let errorMessage = "Erreur lors du téléchargement du fichier";

      if (error.response?.status === 404) {
        errorMessage = "Fichier non trouvé sur le serveur";
      } else if (error.response?.status === 403) {
        errorMessage = "Vous n'avez pas accès à ce fichier";
      } else if (error.response?.status === 410) {
        errorMessage = "Fichier inaccessible - intervention archivée";
      }

      alert(errorMessage);
    }
  };

  const handlePreview = async (piece) => {
    if (isArchived) {
      alert(
        "Impossible de prévisualiser les pièces jointes d'une intervention archivée"
      );
      return;
    }

    try {
      const response = await interventionsAPI.previewPieceJointe(piece.id);

      // Créer un blob à partir de la réponse
      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
      });

      // Créer une URL temporaire
      const url = window.URL.createObjectURL(blob);

      // Ouvrir dans un nouvel onglet
      const newWindow = window.open(url, "_blank");

      if (!newWindow) {
        alert("Popup bloquée. Veuillez autoriser les popups pour ce site.");
        window.URL.revokeObjectURL(url);
        return;
      }

      // Nettoyer l'URL après que la fenêtre soit fermée (estimation)
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 60000); // 60 secondes
    } catch (error) {
      console.error("Erreur prévisualisation:", error);
      let errorMessage = "Impossible d'ouvrir le fichier";

      if (error.response?.status === 404) {
        errorMessage = "Fichier non trouvé sur le serveur";
      } else if (error.response?.status === 403) {
        errorMessage = "Vous n'avez pas accès à ce fichier";
      } else if (error.response?.status === 410) {
        errorMessage = "Fichier inaccessible - intervention archivée";
      }

      alert(errorMessage);
    }
  };

  const handleOpenArchiveModal = () => {
    setShowArchiveModal(true);
    setArchiveMessage("");
  };

  const handleCloseArchiveModal = () => {
    setShowArchiveModal(false);
    setArchiveMessage("");
  };

  const handleConfirmArchive = async () => {
    const timeOut = 0;
    if (!intervention) return;

    setArchiving(true);
    setArchiveMessage("");

    try {
      await archivesAPI.archiveEntity(
        "interventions",
        intervention.id,
        "Archivage par l'utilisateur"
      );

      await fetchIntervention();

      setArchiveMessage("Intervention archivée avec succès");
      setTimeout(() => {
        navigate("/interventions", {
          state: {
            message: "Intervention archivée avec succès",
            type: "success",
          },
        });
      }, timeOut);
    } catch (error) {
      console.error("Erreur archivage:", error);

      let errorMessage = "Erreur lors de l'archivage";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 403) {
        errorMessage =
          "Vous n'avez pas l'autorisation d'archiver cette intervention";
      } else if (error.response?.status === 410) {
        errorMessage = "Cette intervention est déjà archivée";
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
    if (!intervention) return;

    setRestoring(true);
    setRestoreMessage("");

    try {
      await archivesAPI.restoreEntity("interventions", intervention.id);

      await fetchIntervention();
      const timeOut = 0;

      setRestoreMessage("Intervention restaurée avec succès");
      setTimeout(() => {
        navigate("/archives", {
          state: {
            message: "Intervention restaurée avec succès",
            type: "success",
          },
        });
      }, timeOut);
    } catch (error) {
      console.error("Erreur restauration:", error);

      let errorMessage = "Erreur lors de la restauration";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 403) {
        errorMessage =
          "Vous n'avez pas l'autorisation de restaurer cette intervention";
      } else if (error.response?.status === 404) {
        errorMessage = "Archive non trouvée";
      }

      setRestoreMessage(errorMessage);
    } finally {
      setRestoring(false);
    }
  };

  const getInterventionStatus = (interv) => {
    if (!interv?.reponse) {
      return "en_attente";
    }
    if (interv.reponse && !interv.satisfaction) return "repondu";
    return "termine";
  };

  const renderSatisfactionStars = () => {
    const currentSatisfaction = intervention?.satisfaction || satisfactionNote;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={
                submittingSatisfaction ||
                intervention?.satisfaction ||
                isArchived
              }
              onClick={() => handleSatisfactionSubmit(star)}
              className={`text-3xl transition-all duration-200 ${
                star <= currentSatisfaction
                  ? "text-warning transform scale-110"
                  : "text-tertiary hover:text-warning/70 hover:scale-105"
              } ${
                submittingSatisfaction || isArchived
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
            >
              ★
            </button>
          ))}
        </div>

        {submittingSatisfaction && (
          <div className="flex items-center gap-2 text-tertiary">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-warning"></div>
            <span>Enregistrement en cours...</span>
          </div>
        )}

        {satisfactionMessage && (
          <div
            className={`p-3 rounded-lg text-sm font-medium ${
              satisfactionMessage.includes("Erreur")
                ? "bg-danger/10 text-danger border border-danger/20"
                : "bg-success/10 text-success border border-success/20"
            }`}
          >
            {satisfactionMessage}
          </div>
        )}

        {isArchived && (
          <div className="bg-gray-100 border border-gray-300 p-3 rounded-lg text-sm text-gray-600">
            L'évaluation n'est pas disponible pour les interventions archivées
          </div>
        )}

        <div className="flex justify-between text-xs text-tertiary">
          <span>Pas satisfait</span>
          <span>Très satisfait</span>
        </div>
      </div>
    );
  };

  const DeleteConfirmationModal = () => {
    if (!showDeleteModal) return null;
    if (!intervention) return null;

    return (
      <div className="fixed inset-0 bg-primary bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-danger-100 mb-4">
              <svg
                className="h-6 w-6 text-danger-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-secondary mb-2">
              Confirmer la suppression
            </h3>

            <p className="text-tertiary mb-6">
              Êtes-vous sûr de vouloir supprimer l'intervention{" "}
              <strong>n°{intervention.id.toString().padStart(4, "0")}</strong> ?
              <br />
              <span className="text-danger font-medium">
                Cette action est irréversible.
              </span>
            </p>

            {deleteError && (
              <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg mb-4 text-sm">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleCloseDeleteModal}
                disabled={deleting}
                className="px-6 py-2 border border-light text-secondary rounded-lg font-semibold hover:bg-light transition-colors disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-6 py-2 bg-danger text-white rounded-lg font-semibold hover:bg-danger-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Suppression...
                  </>
                ) : (
                  "Confirmer la suppression"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ArchiveConfirmationModal = () => {
    if (!showArchiveModal) return null;
    if (!intervention) return null;

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
              Êtes-vous sûr de vouloir archiver l'intervention{" "}
              <strong>n°{intervention.id.toString().padStart(4, "0")}</strong> ?
              <br />
              <span className="text-secondary font-medium">
                L'intervention sera conservée mais ne sera plus visible dans les
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
    if (!intervention) return null;

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
              Êtes-vous sûr de vouloir restaurer l'intervention{" "}
              <strong>n°{intervention.id.toString().padStart(4, "0")}</strong> ?
              <br />
              <span className="text-secondary font-medium">
                L'intervention sera à nouveau visible dans les listes
                principales.
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
      <Layout activePage="interventions">
        <div className="card card-rounded p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-tertiary">Chargement de l'intervention...</p>
            <p className="text-sm text-tertiary mt-2">ID : {id}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !intervention) {
    return (
      <Layout activePage="interventions">
        <div className="card card-rounded p-6 text-center">
          <h2 className="text-xl font-semibold text-danger mb-4">
            {error || "Intervention non trouvée"}
          </h2>
          <div className="text-tertiary mb-4 space-y-2">
            <p>
              ID de l'intervention : <strong>{id}</strong>
            </p>
            <p>
              Rôle utilisateur : <strong>{user?.role}</strong>
            </p>
          </div>
          <Link
            to={getBackLink("intervention", isArchived)}
            className="text-primary hover:text-primary-light mb-4 inline-block"
          >
            {getBackText("intervention", isArchived)}
          </Link>
        </div>
      </Layout>
    );
  }

  const status = getInterventionStatus(intervention);

  return (
    <Layout activePage={isArchived ? "archives" : "interventions"}>
      <div className="mb-6">
        <Link
          to={getBackLink("intervention", isArchived)}
          className="text-primary hover:text-primary-light mb-4 inline-block"
        >
          {getBackText("intervention", isArchived)}
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-primary">
              Intervention n°{intervention.id.toString().padStart(4, "0")}
            </h1>
          </div>

          <div className="flex gap-2">
            {!isArchived ? (
              <>
                {(user?.role === "admin" || user?.role === "juriste") && (
                  <button
                    onClick={handleOpenArchiveModal}
                    className="bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors"
                  >
                    Archiver
                  </button>
                )}
              </>
            ) : (
              <>
                {(user?.role === "admin" || user?.role === "juriste") && (
                  <button
                    onClick={handleOpenRestoreModal}
                    className="bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors"
                  >
                    Restaurer
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card card-rounded p-6">
            <h2 className="text-lg font-semibold text-primary mb-4 border-b border-light-gray pb-3">
              Question
            </h2>
            <div className="bg-light/50 p-4 rounded-lg">
              <p className="text-secondary whitespace-pre-wrap">
                {intervention.titre}
              </p>
            </div>
          </div>

          {intervention.titre && intervention.description && (
            <div className="card card-rounded p-6">
              <h2 className="text-lg font-semibold text-primary mb-4 border-b border-light-gray pb-3">
                Description
              </h2>
              <div className="bg-light/50 p-4 rounded-lg">
                <p className="text-secondary whitespace-pre-wrap">
                  {intervention.description}
                </p>
              </div>
            </div>
          )}

          {intervention.reponse && (
            <div className="card card-rounded p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold text-primary">
                  Réponse du juriste
                </h2>
                {user?.role === "commune" && (
                  <div className="text-sm text-tertiary">
                    Répondu le {formatDate(intervention.date_reponse)}
                  </div>
                )}
              </div>

              {user?.role !== "commune" && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Juriste
                    </label>
                    <p className="text-tertiary">
                      {intervention.juriste?.prenom} {intervention.juriste?.nom}
                      {intervention.juriste?.actif === false && (
                        <span className="text-danger text-xs ml-2">
                          (Archivé)
                        </span>
                      )}
                    </p>
                  </div>
                </>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary mb-2">
                  Réponse
                </label>
                <div className="bg-light/50 p-4 rounded-lg">
                  <p className="text-secondary whitespace-pre-wrap">
                    {intervention.reponse}
                  </p>
                </div>
              </div>

              {intervention.notes &&
                (user?.role === "admin" || user?.role === "juriste") && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Notes internes
                    </label>
                    <div className="bg-warning/5 p-4 rounded-lg border border-warning/20">
                      <p className="text-secondary text-sm whitespace-pre-wrap">
                        {intervention.notes}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          )}

          {user?.role === "commune" && intervention.reponse && !isArchived && (
            <div className="card card-rounded p-6">
              <h2 className="text-lg font-semibold text-primary mb-4">
                Évaluation de la réponse
              </h2>

              {!intervention.satisfaction ? (
                <div>
                  <p className="text-secondary mb-4">
                    Comment évaluez-vous la réponse reçue ?
                  </p>
                  {renderSatisfactionStars()}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-secondary mb-2">
                    Vous avez évalué cette réponse :
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-3xl ${
                            star <= intervention.satisfaction
                              ? "text-warning"
                              : "text-tertiary"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-secondary font-semibold text-lg ml-2">
                      ({intervention.satisfaction}/5)
                    </span>
                  </div>
                  <p className="text-tertiary text-sm">
                    Merci pour votre évaluation !
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card card-rounded p-6">
            <h3 className="text-lg font-semibold text-primary mb-4 border-b border-light-gray pb-3">
              Détails
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Commune
                </label>
                <p className="text-tertiary">{intervention.commune?.nom}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Demandeur
                </label>
                <p className="text-tertiary">
                  {intervention.demandeur?.prenom} {intervention.demandeur?.nom}
                  {intervention.demandeur?.actif === false && (
                    <span className="text-danger text-xs ml-2">(Archivé)</span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Thème
                </label>
                <p className="text-tertiary">
                  {intervention.theme?.designation}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Questions similaires
                </label>
                <p className="text-tertiary">
                  {isLoadingSimilar
                    ? "Chargement..."
                    : `${similarCount} question${
                        similarCount !== 1 ? "s" : ""
                      }`}
                </p>
              </div>
            </div>
          </div>

          <div className="card card-rounded p-6">
            <h3 className="text-lg font-semibold text-primary mb-4 border-b border-light-gray pb-3">
              Statut
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-tertiary">Statut :</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={status} />
                  {isArchived && (
                    <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                      Archivée
                    </span>
                  )}
                </div>
              </div>

              {isArchived && archiveInfo.archive_date && (
                <div className="flex justify-between">
                  <span className="text-tertiary">Date d'archivage:</span>
                  <span className="text-tertiary">
                    {formatDate(archiveInfo.archive_date)}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-tertiary">Date de création :</span>
                <span className="text-tertiary">
                  {formatDate(intervention.date_question)}
                </span>
              </div>

              {intervention.date_reponse && (
                <div className="flex justify-between">
                  <span className="text-tertiary">Date de réponse :</span>
                  <span className="text-tertiary">
                    {formatDate(intervention.date_reponse)}
                  </span>
                </div>
              )}

              {intervention.satisfaction && (
                <div className="flex justify-between items-center">
                  <span className="text-tertiary">Satisfaction:</span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={
                          i < intervention.satisfaction
                            ? "text-warning"
                            : "text-tertiary"
                        }
                      >
                        ★
                      </span>
                    ))}
                    <span className="text-sm text-tertiary ml-1">
                      ({intervention.satisfaction}/5)
                    </span>
                  </div>
                </div>
              )}

              {/* TOGGLE Faq DANS LA SECTION STATUT */}
              {(user?.role === "admin" || user?.role === "juriste") &&
                intervention.reponse &&
                !isArchived && (
                  <div className="flex justify-between items-center pt-2 border-t border-light-gray">
                    <div>
                      <span className="text-tertiary">Faq :</span>
                    </div>
                    <ToggleSwitch
                      checked={isFAQ}
                      onChange={handleFAQToggle}
                      disabled={faqLoading}
                      title={isFAQ ? "Retirer de la Faq" : "Ajouter à la Faq"}
                    />
                  </div>
                )}
            </div>
          </div>

          <div className="card card-rounded p-6">
            <h3 className="text-lg font-semibold text-primary mb-4 border-b border-light-gray pb-3">
              Pièces jointes
            </h3>

            {intervention.pieces_jointes &&
            intervention.pieces_jointes.length > 0 ? (
              <div className="space-y-3">
                {intervention.pieces_jointes.map((piece, index) => {
                  const isImage =
                    piece.nom_original.match(/\.(jpg|jpeg|png)$/i);
                  const isPDF = piece.nom_original.match(/\.pdf$/i);

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-light/50 rounded-lg border border-light-gray"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {isImage ? (
                            <span className="text-2xl">🖼️</span>
                          ) : isPDF ? (
                            <span className="text-2xl">📄</span>
                          ) : (
                            <span className="text-2xl">📎</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-secondary truncate">
                            {piece.nom_original}
                          </p>
                          <p className="text-xs text-tertiary">
                            {formatDate(piece.date_creation)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        {(isImage || isPDF) && !isArchived && (
                          <button
                            onClick={() => handlePreview(piece)}
                            className="bg-primary text-white rounded-lg px-3 py-1 text-xs hover:bg-primary-light transition-colors"
                          >
                            Voir
                          </button>
                        )}

                        {!isArchived && (
                          <button
                            onClick={() => handleDownload(piece)}
                            className="bg-primary text-white rounded-lg px-3 py-1 text-xs hover:bg-primary-light transition-colors"
                          >
                            Télé.
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {isArchived && (
                  <div className="text-center text-sm text-gray-500 py-2">
                    Pièces jointes non accessibles (archivée)
                  </div>
                )}
              </div>
            ) : (
              <p className="text-tertiary text-sm text-center py-4">
                Aucune pièce jointe
              </p>
            )}
          </div>

          {user?.role === "commune" && !intervention.reponse && !isArchived && (
            <div className="card card-rounded p-6 bg-primary/5 border border-primary/20">
              <h3 className="text-lg font-semibold text-primary mb-2">
                En attente
              </h3>
              <p className="text-sm text-secondary">
                Votre question est en cours de traitement par nos juristes. Vous
                recevrez une notification dès qu'une réponse sera disponible.
              </p>
            </div>
          )}

          {(user?.role === "admin" || user?.role === "juriste") &&
            !isArchived && (
              <div className="card card-rounded p-6">
                <h3 className="text-lg font-semibold text-primary mb-4">
                  Actions
                </h3>

                <div className="space-y-2">
                  {!intervention.reponse && (
                    <Link
                      to={`/interventions/${intervention.id}/reply`}
                      className="block w-full text-center bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary-light transition-colors"
                    >
                      Répondre
                    </Link>
                  )}

                  {intervention.reponse && !intervention.satisfaction && (
                    <Link
                      to={`/interventions/${intervention.id}/reply`}
                      className="block w-full text-center bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary/80 transition-colors"
                    >
                      Modifier la réponse
                    </Link>
                  )}

                  {user.role === "admin" && !intervention.reponse && (
                    <button
                      onClick={handleOpenDeleteModal}
                      className="block w-full text-center bg-danger text-white py-2 px-4 rounded-lg font-semibold hover:bg-danger-400 transition-colors"
                    >
                      Supprimer
                    </button>
                  )}

                  {intervention.reponse && intervention.satisfaction && (
                    <div className="text-center p-3 bg-success/10 text-success rounded-lg border border-success/20">
                      <p className="font-medium">Intervention terminée</p>
                      <p className="text-sm mt-1">
                        Cette intervention a été notée et ne peut plus être
                        modifiée
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          <DeleteConfirmationModal />
          <ArchiveConfirmationModal />
          <RestoreConfirmationModal />
        </div>
      </div>
    </Layout>
  );
};

export default InterventionDetail;
