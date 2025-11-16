import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useParams, useNavigate, Link } from "react-router-dom";
import Layout from "../layout/Layout";
import { themesAPI, retentionAPI } from "../../services/api";

const EditTheme = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    designation: "",
    duree_mois: 24,
    description_rgpd: "",
    actif: true,
  });

  const [policyId, setPolicyId] = useState(null);

  useEffect(() => {
    loadThemeData();
  }, [id]);

  const loadThemeData = async () => {
    try {
      setLoadingData(true);

      // Charger le thème
      const themeResponse = await themesAPI.getById(id);
      const theme = themeResponse.data;

      // Charger la politique de rétention
      const policyResponse = await retentionAPI.getByTheme(id);
      const policy = policyResponse.data?.[0] || null;

      setFormData({
        designation: theme.designation || "",
        duree_mois: policy?.duree_mois || 24,
        description_rgpd: policy?.description || "",
        actif: theme.actif,
      });

      if (policy) {
        setPolicyId(policy.id);
      }
    } catch (error) {
      console.error("Erreur chargement thème:", error);
      setError("Erreur lors du chargement du thème");
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (error) setError("");
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? "" : parseInt(value),
    }));
  };

  const validateForm = () => {
    if (!formData.designation.trim()) {
      setError("Le nom du thème est obligatoire");
      return false;
    }

    if (!formData.duree_mois || formData.duree_mois < 1) {
      setError("La durée de conservation doit être d'au moins 1 mois");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      // 1. Mettre à jour le thème
      await themesAPI.update(id, {
        designation: formData.designation.trim(),
        actif: formData.actif,
      });

      // 2. Mettre à jour ou créer la politique de rétention
      const policyData = {
        theme_id: parseInt(id),
        duree_mois: formData.duree_mois,
        description:
          formData.description_rgpd.trim() ||
          `Conservation ${formData.duree_mois} mois - Politique RGPD standard`,
      };

      if (policyId) {
        await retentionAPI.update(policyId, policyData);
      } else {
        await retentionAPI.create(policyData);
      }

      setSuccessMessage("Thème modifié avec succès !");

      setTimeout(() => {
        navigate("/themes", {
          state: {
            message: "Thème modifié avec succès",
            type: "success",
          },
        });
      }, 1500);
    } catch (error) {
      console.error("Erreur modification thème:", error);
      setError(
        error.response?.data?.error || "Erreur lors de la modification du thème"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    loadThemeData(); // Recharge les données originales
    setError("");
    setSuccessMessage("");
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Êtes-vous sûr de vouloir supprimer définitivement ce thème ? Cette action est irréversible."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      // Supprimer d'abord la politique de rétention si elle existe
      if (policyId) {
        await retentionAPI.delete(policyId);
      }

      // Ensuite supprimer le thème
      await themesAPI.delete(id);

      setSuccessMessage("Thème supprimé avec succès !");

      setTimeout(() => {
        navigate("/themes", {
          state: {
            message: "Thème supprimé avec succès",
            type: "success",
          },
        });
      }, 1500);
    } catch (error) {
      console.error("Erreur suppression thème:", error);
      setError(
        error.response?.data?.error || "Erreur lors de la suppression du thème"
      );
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === "commune") {
    return (
      <Layout activePage="themes">
        <div className="card card-rounded p-6 text-center">
          <h2 className="text-xl font-semibold text-danger mb-4">
            Accès non autorisé
          </h2>
          <p className="text-tertiary">
            Vous n'avez pas les permissions pour modifier un thème.
          </p>
        </div>
      </Layout>
    );
  }

  if (loadingData) {
    return (
      <Layout activePage="themes">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-tertiary">Chargement du thème...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activePage="themes">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-primary mb-2">
              Modifier le thème
            </h1>
            <p className="text-secondary-light">
              Modifier le thème et sa politique de conservation RGPD
            </p>
          </div>
          <Link
            to="/themes"
            className="text-primary hover:text-primary-light mb-4 inline-block"
          >
            ← Retour aux thèmes
          </Link>
        </div>

        {successMessage && (
          <div className="bg-success/10 border border-success/20 text-success p-4 rounded-lg mb-6">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="card card-rounded p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Nom du thème */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-secondary mb-3">
                  Nom du thème *
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light text-lg"
                  placeholder="Ex: Urbanisme, Environnement, Marchés publics..."
                  required
                />
              </div>

              {/* Durée de conservation */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-3">
                  Durée de conservation (mois) *
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    name="duree_mois"
                    value={formData.duree_mois}
                    onChange={handleNumberChange}
                    min="1"
                    max="120"
                    className="w-32 px-4 py-3 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light text-lg"
                    required
                  />
                  <span className="text-tertiary text-base">
                    ≈ {Math.floor(formData.duree_mois / 12)} an(s) et{" "}
                    {formData.duree_mois % 12} mois
                  </span>
                </div>
              </div>
            </div>

            {/* Description RGPD */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-3">
                Description de la politique RGPD
              </label>
              <textarea
                name="description_rgpd"
                value={formData.description_rgpd}
                onChange={handleChange}
                placeholder="Justification légale de la durée de conservation..."
                rows="6"
                className="w-full px-4 py-3 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light text-lg resize-vertical"
              />
            </div>

            {/* Statut actif */}
            <div className="flex items-center gap-3 p-6 bg-light rounded-lg">
              <input
                type="checkbox"
                name="actif"
                checked={formData.actif}
                onChange={handleChange}
                className="w-5 h-5 text-primary rounded focus:ring-primary-light"
              />
              <label className="text-base font-medium text-secondary">
                Thème actif (visible pour les nouvelles interventions)
              </label>
            </div>

            {/* Actions */}
            <div className="pt-8 border-t border-light-gray">
              <div
                className={
                  "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" +
                  (user?.role !== "admin" ? "lg:center lg:flex lg:gap-4" : "")
                }
              >
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full text-center px-6 py-4 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors text-base"
                >
                  Réinitialiser
                </button>

                <Link
                  to="/themes"
                  className="w-full text-center px-6 py-4 border border-light text-secondary rounded-lg hover:bg-light transition-colors text-base flex items-center justify-center"
                >
                  Annuler
                </Link>
                {/* Bouton Supprimer visible uniquement pour l'admin */}
                {user?.role === "admin" && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="w-full text-center px-6 py-4 bg-danger-600 text-white rounded-lg font-semibold hover:bg-danger-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
                  >
                    {loading ? "Suppression..." : "Supprimer"}
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed py-4 text-base"
                >
                  {loading ? "Modification en cours..." : "Modifier le thème"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditTheme;
