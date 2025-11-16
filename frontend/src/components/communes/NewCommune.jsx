import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Layout from "../layout/Layout";
import { communesAPI } from "../../services/api";
import AlertMessage from "../common/feedback/AlertMessage";

const NewCommune = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    nom: "",
    code_postal: "",
    population: "",
    actif: true,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.nom.trim()) {
      setError("Le nom de la commune est obligatoire");
      return false;
    }

    if (!formData.population || parseInt(formData.population) <= 0) {
      setError("La population doit être un nombre positif");
      return false;
    }
    if (formData.population > 100000000) {
      setError("La population ne peut pas dépasser 100 millions");
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
      const communeData = {
        nom: formData.nom.trim(),
        code_postal: formData.code_postal.trim() || null,
        population: parseInt(formData.population),
      };

      await communesAPI.create(communeData);

      setSuccessMessage("Commune créée avec succès");

      setTimeout(() => {
        navigate("/communes", {
          state: {
            message: "Commune créée avec succès",
            type: "success",
          },
        });
      }, 1500);
    } catch (err) {
      console.error("Erreur création commune:", err);
      setError(
        err.response?.data?.error || "Erreur lors de la création de la commune"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nom: "",
      code_postal: "",
      population: "",
    });
    setError("");
    setSuccessMessage("");
  };

  if (user?.role !== "admin") {
    return (
      <Layout activePage="communes">
        <div className="card card-rounded p-6 text-center">
          <h2 className="text-xl font-semibold text-danger mb-4">
            Accès non autorisé
          </h2>
          <p className="text-tertiary">
            Seuls les administrateurs peuvent créer des communes.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activePage="communes">
      <AlertMessage
        type="success"
        message={successMessage}
        onClose={() => setSuccessMessage("")}
        autoClose
      />

      <AlertMessage
        type="error"
        message={errorMessage}
        onClose={() => setErrorMessage("")}
      />

      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-primary mb-2">
              Nouvelle commune
            </h1>
            <p className="text-secondary-light">
              Ajouter une nouvelle commune à la plateforme
            </p>
          </div>

          <Link
            to="/communes"
            className="text-primary hover:text-primary-light mb-4 inline-block"
          >
            ← Retour aux communes
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

        <div className="card card-rounded p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Nom de la commune *
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
                placeholder="Ex: Nuuk"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Code postal
              </label>
              <input
                type="text"
                name="code_postal"
                value={formData.code_postal}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9-]/g, "");
                  if (value.length <= 10) {
                    setFormData((prev) => ({ ...prev, code_postal: value }));
                  }
                }}
                className="w-full px-4 py-3 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
                placeholder="Ex: 3900 ou 3900-100"
                maxLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                Format : 3900 (Groenland) ou 3900-100 (si applicable)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Population *
              </label>
              <input
                type="number"
                name="population"
                value={formData.population}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
                placeholder="Ex: 500"
                min="1"
                required
              />
            </div>

            <div className="flex gap-4 pt-6 border-t border-light-gray">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 text-center px-6 py-3 bg-danger text-white rounded-lg font-semibold hover:bg-danger-400 transition-colors"
              >
                Réinitialiser
              </button>

              <Link
                to="/communes"
                className="flex-1 text-center px-6 py-3 border border-light text-secondary rounded-lg hover:bg-light transition-colors"
              >
                Annuler
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed py-3"
              >
                {loading ? "Création en cours..." : "Créer la commune"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default NewCommune;