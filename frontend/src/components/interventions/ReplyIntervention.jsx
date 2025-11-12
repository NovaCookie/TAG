import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Layout from "../layout/Layout";
import { formatDate } from "../../utils/helpers";
import { interventionsAPI } from "../../services/api";

const ReplyIntervention = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [intervention, setIntervention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    reponse: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchIntervention();
  }, [id]);

  const fetchIntervention = async () => {
    try {
      setLoading(true);
      const response = await interventionsAPI.getById(id);
      setIntervention(response.data);
    } catch (error) {
      console.error("Erreur chargement intervention:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.reponse.trim()) {
      newErrors.reponse = "La réponse est obligatoire";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      await interventionsAPI.addResponse(id, {
        reponse: formData.reponse,
        notes: formData.notes,
      });

      navigate(`/interventions/${id}`, {
        state: {
          message: "Réponse envoyée avec succès !",
          type: "success",
        },
      });
    } catch (error) {
      console.error("Erreur envoi réponse:", error);
      setErrors({
        submit:
          error.response?.data?.error || "Erreur lors de l'envoi de la réponse",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role !== "admin" && user?.role !== "juriste") {
    return (
      <Layout activePage="interventions">
        <div className="card card-rounded p-6 text-center">
          <h2 className="text-xl font-semibold text-danger mb-4">
            Accès non autorisé
          </h2>
          <p className="text-tertiary">
            Seuls les administrateurs et juristes peuvent répondre aux
            questions.
          </p>
        </div>
      </Layout>
    );
  }

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

  if (!intervention) {
    return (
      <Layout activePage="interventions">
        <div className="card card-rounded p-6 text-center">
          <h2 className="text-xl font-semibold text-danger mb-4">
            Intervention non trouvée
          </h2>
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

  if (intervention.reponse) {
    return (
      <Layout activePage="interventions">
        <div className="card card-rounded p-6 text-center">
          <h2 className="text-xl font-semibold text-warning mb-4">
            Intervention déjà répondue
          </h2>
          <p className="text-tertiary mb-4">
            Cette intervention a déjà reçu une réponse.
          </p>
          <Link
            to={`/interventions/${id}`}
            className="inline-block bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors"
          >
            Voir la réponse
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activePage="interventions">
      {/* En-tête avec navigation */}
      <div className="mb-6">
        <Link
          to={`/interventions/${id}`}
          className="text-primary hover:text-primary-light mb-4 inline-block"
        >
          ← Retour au détail
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-primary mb-2">
              Répondre à l'intervention n°
              {intervention.id.toString().padStart(4, "0")}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne de gauche - Question et Formulaire */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bloc Question */}
          <div className="card card-rounded p-6">
            <h2 className="text-lg font-semibold text-primary mb-4 border-b border-light-gray pb-3">
              Question
            </h2>
            <div className="space-y-4">
              <div className="bg-light/50 p-4 rounded-lg">
                <h3 className="font-semibold text-primary mb-2">
                  {intervention.titre}
                </h3>
                <p className="text-secondary whitespace-pre-wrap">
                  {intervention.description}
                </p>
              </div>
            </div>
          </div>

          {/* Formulaire de réponse */}
          <div className="card card-rounded p-6">
            <h2 className="text-lg font-semibold text-primary mb-4 border-b border-light-gray pb-3">
              Votre réponse
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Champ Réponse */}
              <div>
                <label
                  htmlFor="reponse"
                  className="block text-sm font-medium text-secondary mb-2"
                >
                  Réponse juridique *
                </label>
                <textarea
                  id="reponse"
                  name="reponse"
                  rows={10}
                  value={formData.reponse}
                  onChange={handleChange}
                  placeholder="Rédigez votre réponse juridique détaillée..."
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light resize-none ${
                    errors.reponse ? "border-danger" : "border-light"
                  }`}
                />
                {errors.reponse && (
                  <p className="text-danger text-sm mt-1">{errors.reponse}</p>
                )}
              </div>

              {/* Notes internes */}
              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-secondary mb-2"
                >
                  Notes internes (optionnel)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Notes pour l'équipe juridique..."
                  className="w-full px-4 py-3 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light resize-none"
                />
              </div>

              {/* Erreur générale */}
              {errors.submit && (
                <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg">
                  {errors.submit}
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-4 pt-4">
                <Link
                  to={`/interventions/${id}`}
                  className="flex-1 text-center px-6 py-3 border border-light text-secondary rounded-lg hover:bg-light transition-colors"
                >
                  Annuler
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed py-3"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Envoi en cours...
                    </div>
                  ) : (
                    "Envoyer la réponse"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Colonne de droite - Informations */}
        <div className="space-y-6">
          {/* Bloc Détails */}
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

          {/* Bloc Statut */}
          <div className="card card-rounded p-6">
            <h3 className="text-lg font-semibold text-primary mb-4 border-b border-light-gray pb-3">
              Statut
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-tertiary">Statut:</span>
                <span className="bg-warning/10 text-warning px-3 py-1 rounded-full text-xs font-medium">
                  En attente
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-tertiary">Date de création:</span>
                <span className="text-tertiary">
                  {formatDate(intervention.date_question)}
                </span>
              </div>
            </div>
          </div>

          {/* Bloc Pièces jointes */}
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
        </div>
      </div>
    </Layout>
  );
};

export default ReplyIntervention;
