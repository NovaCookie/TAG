import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Layout from "../layout/Layout";
import { formatDate } from "../../utils/helpers";
import { interventionsAPI } from "../../services/api";

const RepondreIntervention = () => {
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
      await interventionsAPI.repondre(id, {
        reponse: formData.reponse,
        notes: formData.notes,
      });

      // Redirection vers le détail avec message de succès
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
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
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
            className="text-primary hover:text-primary-light"
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
            className="text-primary hover:text-primary-light"
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

        <h1 className="text-2xl font-semibold text-primary mb-2">
          Répondre à l'intervention #
          {intervention.id.toString().padStart(4, "0")}
        </h1>
        <p className="text-tertiary">
          Répondre à la question de {intervention.commune?.nom}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Question originale */}
        <div className="card card-rounded p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">
            Question originale
          </h2>

          <div className="space-y-3">
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
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                Date
              </label>
              <p className="text-tertiary">
                {formatDate(intervention.date_question)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                Question
              </label>
              <div className="bg-light/50 p-3 rounded-lg mt-1">
                <p className="text-secondary whitespace-pre-wrap">
                  {intervention.question}
                </p>
              </div>
            </div>

            {intervention.urgent && (
              <div className="bg-danger/10 border border-danger/20 p-3 rounded-lg">
                <p className="text-danger font-semibold flex items-center gap-2">
                  ⚡ Demande urgente
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Formulaire de réponse */}
        <div className="card card-rounded p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Champ Réponse */}
            <div>
              <label
                htmlFor="reponse"
                className="block text-sm font-medium text-secondary mb-2"
              >
                Votre réponse *
              </label>
              <textarea
                id="reponse"
                name="reponse"
                rows={8}
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
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Notes pour l'équipe juridique..."
                className="w-full px-4 py-3 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light resize-none"
              />
              <p className="text-tertiary text-sm mt-1">
                Ces notes ne seront pas visibles par la commune.
              </p>
            </div>

            {/* Conseils */}
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
              <h4 className="font-medium text-primary mb-2">
                💡 Conseils de rédaction
              </h4>
              <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
                <li>Soyez clair et précis dans votre réponse</li>
                <li>Citez les articles de loi pertinents si nécessaire</li>
                <li>Proposez des solutions concrètes</li>
                <li>Vérifiez l'exactitude des informations fournies</li>
              </ul>
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
                className="flex-1 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Envoi en cours..." : "Envoyer la réponse"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default RepondreIntervention;
