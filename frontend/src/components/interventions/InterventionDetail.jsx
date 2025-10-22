import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Layout from "../layout/Layout";
import StatusBadge from "../common/StatusBadge";
import { formatDate } from "../../utils/helpers";
import { interventionsAPI } from "../../services/api";

const InterventionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [intervention, setIntervention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [satisfactionNote, setSatisfactionNote] = useState(0);
  const [submittingSatisfaction, setSubmittingSatisfaction] = useState(false);
  const [satisfactionMessage, setSatisfactionMessage] = useState("");

  const fetchIntervention = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await interventionsAPI.getById(id);

      if (response.data) {
        setIntervention(response.data);

        if (response.data.satisfaction) {
          setSatisfactionNote(response.data.satisfaction);
        } else {
          setSatisfactionNote(0);
        }
      } else {
        setError("Aucune donnée reçue de l'API");
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setError("Intervention non trouvée");
      } else if (error.response?.status === 403) {
        setError("Vous n'avez pas accès à cette intervention");
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError("Erreur lors du chargement de l'intervention");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchIntervention();
    } else {
      setError("ID d'intervention manquant");
      setLoading(false);
    }
  }, [id]);

  const canReply = () => {
    return (
      (user?.role === "admin" || user?.role === "juriste") &&
      !intervention?.reponse
    );
  };

  const handleSatisfactionSubmit = async (note) => {
    if (!intervention || submittingSatisfaction) return;

    setSubmittingSatisfaction(true);
    setSatisfactionMessage("");

    try {
      const response = await interventionsAPI.rateSatisfaction(
        intervention.id,
        note
      );

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

  const handleDownload = async (piece) => {
    try {
      const response = await interventionsAPI.downloadPieceJointe(piece.id);

      // Vérifier si c'est une erreur JSON
      if (response.headers["content-type"]?.includes("application/json")) {
        const errorData = await response.data.text();
        throw new Error("Erreur serveur");
      }

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
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
    } catch (error) {
      let errorMessage = "Erreur lors du téléchargement du fichier";

      if (error.response?.status === 404) {
        errorMessage = "Fichier non trouvé sur le serveur";
      } else if (error.response?.status === 403) {
        errorMessage = "Vous n'avez pas accès à ce fichier";
      } else if (error.message === "Fichier vide") {
        errorMessage = "Le fichier est vide ou corrompu";
      }

      alert(errorMessage);
    }
  };

  const handlePreview = async (piece) => {
    try {
      const response = await interventionsAPI.downloadPieceJointe(piece.id);

      // Vérifier si c'est une erreur JSON
      if (response.headers["content-type"]?.includes("application/json")) {
        const errorData = await response.data.text();
        throw new Error("Erreur serveur");
      }

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
      });

      if (blob.size === 0) {
        throw new Error("Fichier vide");
      }

      const url = window.URL.createObjectURL(blob);
      const newWindow = window.open(url, "_blank");

      if (!newWindow) {
        throw new Error("Popup bloquée. Autorisez les popups pour ce site.");
      }
    } catch (error) {
      let errorMessage = "Impossible d'ouvrir le fichier";

      if (error.response?.status === 404) {
        errorMessage = "Fichier non trouvé sur le serveur";
      } else if (error.response?.status === 403) {
        errorMessage = "Vous n'avez pas accès à ce fichier";
      } else if (error.message.includes("Popup")) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    }
  };

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

  const status = intervention.reponse
    ? intervention.satisfaction
      ? "termine"
      : "repondu"
    : intervention.urgent
    ? "urgent"
    : "en_attente";

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
              {user?.role === "commune" ? "Question n°" : "Intervention"}
              {intervention.id.toString().padStart(4, "0")}
            </h1>
            <div className="flex items-center gap-4 text-sm text-tertiary">
              <StatusBadge status={status} />
              <span>Posée le {formatDate(intervention.date_question)}</span>
              {intervention.urgent && (
                <span className="text-danger font-semibold">⚡ URGENT</span>
              )}
            </div>
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
        {/* Contenu principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Détails question */}
          <div className="card card-rounded p-6">
            <h2 className="text-lg font-semibold text-primary mb-4">
              Description
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary mb-2">
                Commune
              </label>
              <p className="text-tertiary">{intervention.commune?.nom}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary mb-2">
                Demandeur
              </label>
              <p className="text-tertiary">
                {intervention.demandeur?.prenom} {intervention.demandeur?.nom}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary mb-2">
                Thème
              </label>
              <p className="text-tertiary">{intervention.theme?.designation}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Question
              </label>
              <div className="bg-light/50 p-4 rounded-lg">
                <p className="text-secondary whitespace-pre-wrap">
                  {intervention.question}
                </p>
              </div>
            </div>
          </div>

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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statut */}
          <div className="card card-rounded p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Statut</h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-tertiary">Statut:</span>
                <StatusBadge status={status} />
              </div>

              <div className="flex justify-between">
                <span className="text-tertiary">Urgent:</span>
                <span
                  className={
                    intervention.urgent
                      ? "text-danger font-semibold"
                      : "text-tertiary"
                  }
                >
                  {intervention.urgent ? "Oui" : "Non"}
                </span>
              </div>

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
            <h3 className="text-lg font-semibold text-primary mb-4">
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
                            className="bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors"
                          >
                            Voir
                          </button>
                        )}

                        <button
                          onClick={() => handleDownload(piece)}
                          className="bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors"
                        >
                          Télécharger
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-tertiary text-sm">Aucune pièce jointe</p>
            )}
          </div>

          {/* Actions rapides */}
          {(user?.role === "admin" || user?.role === "juriste") && (
            <div className="card card-rounded p-6">
              <h3 className="text-lg font-semibold text-primary mb-4">
                Actions
              </h3>

              <div className="space-y-2">
                {!intervention.reponse && (
                  <Link
                    to={`/interventions/${intervention.id}/repondre`}
                    className="block w-full text-center bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary-light transition-colors"
                  >
                    Répondre
                  </Link>
                )}

                <button className="block w-full text-center border border-light text-secondary py-2 px-4 rounded-lg font-semibold hover:bg-light transition-colors">
                  Modifier
                </button>
              </div>
            </div>
          )}

          {/* Info communes en attente */}
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
        </div>
      </div>
    </Layout>
  );
};

export default InterventionDetail;
