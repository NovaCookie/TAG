import { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi";
import { faqAPI, themesAPI } from "../../services/api";
import Layout from "../layout/Layout";
import AlertMessage from "../common/feedback/AlertMessage";
import { useNavigate } from "react-router-dom";

const NewFaqQuestion = () => {
  const { callApi, loading, error, setError } = useApi();
  const navigate = useNavigate();
  const [themes, setThemes] = useState([]);
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    reponse: "",
    theme_id: "",
  });

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      const data = await callApi(() => themesAPI.getAll());
      setThemes(data || []);
    } catch (err) {
      console.error("Erreur chargement thèmes:", err);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.titre ||
      !formData.description ||
      !formData.reponse ||
      !formData.theme_id
    ) {
      setError("Tous les champs sont obligatoires");
      return;
    }

    try {
      await callApi(() => faqAPI.createQuestion(formData));
      navigate("/faq");
    } catch (err) {
      // erreur gérée par useApi
    }
  };

  return (
    <Layout activePage="faq">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-primary">
            Nouvelle question Faq
          </h1>
          <p className="text-tertiary">
            Créez une nouvelle question pour la Faq
          </p>
        </div>

        <AlertMessage
          type="error"
          message={error}
          onClose={() => setError("")}
        />

        <form onSubmit={handleSubmit} className="card card-rounded p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Question
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
                placeholder="Indiquez votre question ici"
                value={formData.titre}
                onChange={(e) => handleChange("titre", e.target.value)}
                required
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Description
              </label>
              <textarea
                className="w-full px-4 py-3 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
                placeholder="Décrivez la question en détail"
                rows={4}
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                required
                maxLength={2000}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Réponse
              </label>
              <textarea
                className="w-full px-4 py-3 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
                placeholder="Répondez à la question"
                rows={6}
                value={formData.reponse}
                onChange={(e) => handleChange("reponse", e.target.value)}
                required
                maxLength={5000}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Thème
              </label>
              <select
                className="w-full px-4 py-3 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
                value={formData.theme_id}
                onChange={(e) => handleChange("theme_id", e.target.value)}
                required
              >
                <option value="">Sélectionnez un thème</option>
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.designation}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => navigate("/faq")}
                className="bg-light text-primary border border-light rounded-lg px-6 py-3 font-medium hover:bg-light-gray transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-white rounded-lg px-6 py-3 font-medium hover:bg-primary-light transition-colors"
              >
                {loading ? "Création..." : "Créer la question"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default NewFaqQuestion;
