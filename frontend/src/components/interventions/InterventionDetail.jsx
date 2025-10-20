// components/interventions/InterventionDetail.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Layout from "../layout/Layout";
import StatusBadge from "../common/StatusBadge";
import { formatDate } from "../../utils/helpers";
import { interventionsAPI } from "../../services/api";

const InterventionDetail = () => {
  const { id } = useParams();
  //   const { user } = useAuth();
  const { user, logout } = useAuth();
  console.log("🔍 UTILISATEUR COMPLET:", user);
  console.log("🔍 Commune ID:", user?.commune_id);
  console.log("🔍 Commune object:", user?.commune);
  const [intervention, setIntervention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [satisfactionNote, setSatisfactionNote] = useState(0);
  const [submittingSatisfaction, setSubmittingSatisfaction] = useState(false);

  const fetchIntervention = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("🔄 Chargement de l'intervention ID:", id);

      const response = await interventionsAPI.getById(id);
      console.log("✅ Réponse API:", response);
      console.log("📦 Données reçues:", response.data);

      if (response.data) {
        setIntervention(response.data);
        // Pré-remplir la note de satisfaction si elle existe
        if (response.data.satisfaction) {
          setSatisfactionNote(response.data.satisfaction);
        }
      } else {
        setError("Aucune donnée reçue de l'API");
      }
    } catch (error) {
      console.error("❌ Erreur chargement intervention:", error);
      console.error("📋 Détails erreur:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const canViewIntervention = () => {
    if (!intervention) return false;
    if (user?.role === "admin" || user?.role === "juriste") return true;
    if (user?.role === "commune" && intervention.commune_id === user.commune_id)
      return true;
    return false;
  };

  const canReply = () => {
    return (
      (user?.role === "admin" || user?.role === "juriste") &&
      !intervention?.reponse
    );
  };

  const handleSatisfactionSubmit = async (note) => {
    if (!intervention || submittingSatisfaction) return;

    setSubmittingSatisfaction(true);
    try {
      await interventionsAPI.rateSatisfaction(intervention.id, {
        satisfaction: note,
      });

      // Mettre à jour l'intervention locale
      setIntervention((prev) => ({
        ...prev,
        satisfaction: note,
      }));

      console.log("✅ Note de satisfaction enregistrée !");
    } catch (error) {
      console.error("❌ Erreur enregistrement satisfaction:", error);
    } finally {
      setSubmittingSatisfaction(false);
    }
  };

  const renderSatisfactionStars = () => {
    const currentSatisfaction = intervention?.satisfaction || satisfactionNote;

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={submittingSatisfaction || intervention?.satisfaction}
            onClick={() => handleSatisfactionSubmit(star)}
            className={`text-2xl transition-transform hover:scale-110 ${
              star <= currentSatisfaction
                ? "text-warning"
                : "text-tertiary hover:text-warning/70"
            } ${
              submittingSatisfaction
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
          >
            ★
          </button>
        ))}
        {submittingSatisfaction && (
          <span className="text-sm text-tertiary ml-2">Enregistrement...</span>
        )}
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
            <p>
              Commune utilisateur ID: <strong>{user?.commune_id}</strong>
            </p>
            {user?.commune && (
              <p>
                Commune utilisateur: <strong>{user.commune.nom}</strong>
              </p>
            )}
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

  // Vérification des permissions avec plus de détails
  const hasPermission = canViewIntervention();
  console.log("🔐 Permission accordée:", hasPermission);
  console.log("🏘️ Commune intervention:", intervention.commune_id);
  console.log("👤 Commune utilisateur:", user?.commune_id);
  console.log("🎯 Rôle utilisateur:", user?.role);

  if (!hasPermission) {
    return (
      <Layout activePage="interventions">
        <div className="card card-rounded p-6 text-center">
          <h2 className="text-xl font-semibold text-danger mb-4">
            Accès non autorisé
          </h2>
          <div className="text-tertiary mb-4 space-y-2">
            <p>
              Cette intervention appartient à la commune ID:{" "}
              <strong>{intervention.commune_id}</strong>
            </p>
            <p>
              Votre commune ID: <strong>{user?.commune_id}</strong>
            </p>
            {intervention.commune && (
              <p>
                Commune de l'intervention:{" "}
                <strong>{intervention.commune.nom}</strong>
              </p>
            )}
            {user?.commune && (
              <p>
                Votre commune: <strong>{user.commune.nom}</strong>
              </p>
            )}
            <p>
              Votre rôle: <strong>{user?.role}</strong>
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
      {/* En-tête avec navigation */}
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
              {user?.role === "commune" ? "Ma Question" : "Intervention"} #
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
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Carte Question */}
          <div className="card card-rounded p-6">
            <h2 className="text-lg font-semibold text-primary mb-4">
              {user?.role === "commune" ? "Ma Question" : "Question"}
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
                Description
              </label>
              <div className="bg-light/50 p-4 rounded-lg">
                <p className="text-secondary whitespace-pre-wrap">
                  {intervention.question}
                </p>
              </div>
            </div>
          </div>

          {/* Carte Réponse (si existe) */}
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

          {/* Section Satisfaction pour les communes */}
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
                  <div className="flex items-center gap-4">
                    {renderSatisfactionStars()}
                    <div className="text-sm text-tertiary">
                      <div>1 = Pas satisfait</div>
                      <div>5 = Très satisfait</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-secondary mb-2">
                    Vous avez évalué cette réponse :
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-2xl ${
                            star <= intervention.satisfaction
                              ? "text-warning"
                              : "text-tertiary"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-secondary font-semibold ml-2">
                      ({intervention.satisfaction}/5)
                    </span>
                  </div>
                  <p className="text-tertiary text-sm mt-2">
                    Merci pour votre évaluation !
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar avec métadonnées */}
        <div className="space-y-6">
          {/* Statut et actions */}
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
              <div className="space-y-2">
                {intervention.pieces_jointes.map((piece, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-light/50 rounded"
                  >
                    <span className="text-sm text-secondary truncate">
                      {piece.nom_original}
                    </span>
                    <button
                      onClick={() => window.open(piece.chemin, "_blank")}
                      className="text-primary hover:text-primary-light text-sm"
                    >
                      Télécharger
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-tertiary text-sm">Aucune pièce jointe</p>
            )}
          </div>

          {/* Actions rapides pour juristes/admin */}
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

          {/* Information pour les communes */}
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
