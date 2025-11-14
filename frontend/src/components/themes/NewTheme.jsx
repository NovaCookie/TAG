import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Layout from "../layout/Layout";
import { themesAPI, retentionAPI } from "../../services/api";

const NewTheme = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    designation: "",
    duree_mois: 24,
    description_rgpd: "",
    actif: true,
  });

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
      const themeResponse = await themesAPI.create({
        designation: formData.designation.trim(),
        actif: formData.actif,
      });

      await retentionAPI.create({
        theme_id: themeResponse.data.theme.id,
        duree_mois: formData.duree_mois,
        description:
          formData.description_rgpd.trim() ||
          `Conservation ${formData.duree_mois} mois - Politique RGPD standard`,
      });

      setSuccessMessage("Thème créé avec succès !");

      setTimeout(() => {
        navigate("/themes", {
          state: {
            message: "Thème créé avec succès",
            type: "success",
          },
        });
      }, 1500);
    } catch (error) {
      console.error("Erreur création thème:", error);
      setError(
        error.response?.data?.error || "Erreur lors de la création du thème"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      designation: "",
      duree_mois: 24,
      description_rgpd: "",
      actif: true,
    });
    setError("");
    setSuccessMessage("");
  };

  if (user?.role === "commune") {
    return (
      <Layout activePage="themes">
        <div className="card card-rounded p-6 text-center">
          <h2 className="text-xl font-semibold text-danger mb-4">
            Accès non autorisé
          </h2>
          <p className="text-tertiary">
            Vous n'avez pas les permissions pour créer un thème.
          </p>
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
              Nouveau thème
            </h1>
            <p className="text-secondary-light">
              Créer un nouveau thème avec sa politique de conservation RGPD
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
            {/* Nom du thème et Durée */}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed py-4 text-base"
                >
                  {loading ? "Création en cours..." : "Créer le thème"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default NewTheme;
