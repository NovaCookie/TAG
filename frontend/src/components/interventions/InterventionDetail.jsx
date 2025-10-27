import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Layout from "../layout/Layout";
import StatusBadge from "../common/StatusBadge";
import { formatDate } from "../../utils/helpers";
import { interventionsAPI } from "../../services/api";

const InterventionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // États principaux
  const [intervention, setIntervention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Satisfaction
  const [satisfactionNote, setSatisfactionNote] = useState(0);
  const [submittingSatisfaction, setSubmittingSatisfaction] = useState(false);
  const [satisfactionMessage, setSatisfactionMessage] = useState("");

  // Modal suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // -------------------------
  // Fetch: récupérer l'intervention
  // -------------------------
  const fetchIntervention = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await interventionsAPI.getById(id);

      if (res?.data) {
        setIntervention(res.data);
        setSatisfactionNote(res.data.satisfaction || 0);
      } else {
        setError("Aucune donnée reçue de l'API");
      }
    } catch (err) {
      if (err.response?.status === 404) setError("Intervention non trouvée");
      else if (err.response?.status === 403)
        setError("Vous n'avez pas accès à cette intervention");
      else if (err.response?.data?.error) setError(err.response.data.error);
      else setError("Erreur lors du chargement de l'intervention");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchIntervention();
    else {
      setError("ID d'intervention manquant");
      setLoading(false);
    }
  }, [id, fetchIntervention]);

  // -------------------------
  // Handlers - suppression
  // -------------------------
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

      // Redirection vers la liste des interventions avec message de succès
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
      }

      setDeleteError(errorMessage);
    } finally {
      setDeleting(false);
      // garder la modal ouverte pour montrer l'erreur si elle existe
      if (!deleteError) setShowDeleteModal(false);
    }
  };

  // -------------------------
  // Handlers - satisfaction
  // -------------------------
  const handleSatisfactionSubmit = async (note) => {
    if (!intervention || submittingSatisfaction) return;

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
      }

      setSatisfactionMessage(errorMessage);
      setTimeout(() => setSatisfactionMessage(""), 5000);
    } finally {
      setSubmittingSatisfaction(false);
    }
  };

  // -------------------------
  // Handlers - téléchargement / preview pièces jointes
  // -------------------------
  const handleDownload = async (piece) => {
    try {
      const res = await interventionsAPI.downloadPieceJointe(piece.id);

      if (res.headers["content-type"]?.includes("application/json")) {
        const text = await res.data.text?.();
        console.error(
          "Erreur serveur lors du téléchargement:",
          text || res.data
        );
        throw new Error("Erreur serveur");
      }

      const blob = new Blob([res.data], {
        type: res.headers["content-type"] || "application/octet-stream",
      });

      if (blob.size === 0) {
        throw new Error("Fichier vide");
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = piece.nom_original;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      let msg = "Erreur lors du téléchargement du fichier";
      if (err.response?.status === 404)
        msg = "Fichier non trouvé sur le serveur";
      else if (err.response?.status === 403)
        msg = "Vous n'avez pas accès à ce fichier";
      else if (err.message === "Fichier vide")
        msg = "Le fichier est vide ou corrompu";
      alert(msg);
    }
  };

  const handlePreview = async (piece) => {
    try {
      const res = await interventionsAPI.downloadPieceJointe(piece.id);

      if (res.headers["content-type"]?.includes("application/json")) {
        const text = await res.data.text?.();
        console.error("Erreur serveur lors du preview:", text || res.data);
        throw new Error("Erreur serveur");
      }

      const blob = new Blob([res.data], {
        type: res.headers["content-type"] || "application/octet-stream",
      });

      if (blob.size === 0) {
        throw new Error("Fichier vide");
      }

      const url = window.URL.createObjectURL(blob);
      const newWindow = window.open(url, "_blank");

      if (!newWindow) {
        throw new Error("Popup bloquée. Autorisez les popups pour ce site.");
      }
    } catch (err) {
      let msg = "Impossible d'ouvrir le fichier";
      if (err.response?.status === 404)
        msg = "Fichier non trouvé sur le serveur";
      else if (err.response?.status === 403)
        msg = "Vous n'avez pas accès à ce fichier";
      else if (err.message.includes("Popup")) msg = err.message;
      alert(msg);
    }
  };

  // -------------------------
  // Helpers / UI helpers
  // -------------------------
  const canReply = useCallback(() => {
    return (
      (user?.role === "admin" || user?.role === "juriste") &&
      !intervention?.reponse
    );
  }, [user, intervention]);

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
              disabled={submittingSatisfaction || intervention?.satisfaction}
              onClick={() => handleSatisfactionSubmit(star)}
              className={`text-3xl transition-all duration-200 ${
                star <= currentSatisfaction
                  ? "text-warning transform scale-110"
                  : "text-tertiary hover:text-warning/70 hover:scale-105"
              } ${
                submittingSatisfaction
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

        <div className="flex justify-between text-xs text-tertiary">
          <span>Pas satisfait</span>
          <span>Très satisfait</span>
        </div>
      </div>
    );
  };

  // -------------------------
  // Modal component (interne)
  // -------------------------
  const DeleteConfirmationModal = () => {
    if (!showDeleteModal) return null;
    if (!intervention) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
          <div className="text-center">
            {/* Icône d'alerte */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
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
                className="px-6 py-2 bg-danger text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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

  // -------------------------
  // Rendu
  // -------------------------
  if (loading) {
    return (
      <Layout activePage="interventions">
        <div className="card card-rounded p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-tertiary">Chargement de l'intervention...</p>
            <p className="text-sm text-tertiary mt-2">ID: {id}</p>
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
              ID de l'intervention: <strong>{id}</strong>
            </p>
            <p>
              Rôle utilisateur: <strong>{user?.role}</strong>
            </p>
          </div>
          <Link
            to="/interventions"
            className="inline-block bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors"
          >
            ← Retour aux interventions
          </Link>
        </div>
      </Layout>
    );
  }

  const status = getInterventionStatus(intervention);

  return (
    <Layout activePage="interventions">
      <div className="mb-6">
        <Link
          to="/interventions"
          className="text-primary hover:text-primary-light mb-4 inline-block"
        >
          ← Retour aux interventions
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-primary mb-2">
              Intervention n°{intervention.id.toString().padStart(4, "0")}
            </h1>
          </div>

          {canReply() && (
            <Link
              to={`/interventions/${intervention.id}/repondre`}
              className="bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors"
            >
              Répondre
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne de gauche - Question et Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bloc Question */}
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

          {/* Description */}
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

          {/* Réponse du juriste */}
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

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Date de réponse
                    </label>
                    <p className="text-tertiary">
                      {formatDate(intervention.date_reponse)}
                    </p>
                  </div>
                </>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary mb-2">
                  Réponse
                </label>
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
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

          {/* Satisfaction (communes) */}
          {user?.role === "commune" && intervention.reponse && (
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

        {/* Colonne de droite - Détails et informations */}
        <div className="space-y-6">
          {/* Détails */}
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
            </div>
          </div>

          {/* Statut */}
          <div className="card card-rounded p-6">
            <h3 className="text-lg font-semibold text-primary mb-4 border-b border-light-gray pb-3">
              Statut
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-tertiary">Statut:</span>
                <StatusBadge status={status} />
              </div>

              <div className="flex justify-between">
                <span className="text-tertiary">Date de création:</span>
                <span className="text-tertiary">
                  {formatDate(intervention.date_question)}
                </span>
              </div>

              {intervention.date_reponse && (
                <div className="flex justify-between">
                  <span className="text-tertiary">Date de réponse:</span>
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
            </div>
          </div>

          {/* Pièces jointes */}
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
                        {(isImage || isPDF) && (
                          <button
                            onClick={() => handlePreview(piece)}
                            className="bg-primary text-white rounded-lg px-3 py-1 text-xs hover:bg-primary-light transition-colors"
                          >
                            Voir
                          </button>
                        )}

                        <button
                          onClick={() => handleDownload(piece)}
                          className="bg-primary text-white rounded-lg px-3 py-1 text-xs hover:bg-primary-light transition-colors"
                        >
                          Télé.
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-tertiary text-sm text-center py-4">
                Aucune pièce jointe
              </p>
            )}
          </div>

          {/* En attente pour les communes */}
          {user?.role === "commune" && !intervention.reponse && (
            <div className="card card-rounded p-6 bg-primary/5 border border-primary/20">
              <h3 className="text-lg font-semibold text-primary mb-2">
                ⏳ En attente
              </h3>
              <p className="text-sm text-secondary">
                Votre question est en cours de traitement par nos juristes. Vous
                recevrez une notification dès qu'une réponse sera disponible.
              </p>
            </div>
          )}

          {/* Actions pour admin/juriste */}
          {(user?.role === "admin" || user?.role === "juriste") && (
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
                {user.role === "admin" && (
                  <button
                    onClick={handleOpenDeleteModal}
                    className="block w-full text-center bg-danger text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-400 transition-colors"
                  >
                    supprimer
                  </button>
                )}
              </div>
            </div>
          )}

          <DeleteConfirmationModal />
        </div>
      </div>
    </Layout>
  );
};

export default InterventionDetail;
