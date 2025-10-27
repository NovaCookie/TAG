import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Layout from "../layout/Layout";
import { interventionsAPI, themesAPI } from "../../services/api";

const NouvelleIntervention = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    theme_id: "",
    pieces_jointes: [],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      const response = await themesAPI.getAll();
      setThemes(response.data);
    } catch (error) {
      console.error("Erreur chargement thèmes:", error);
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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Vérifier la taille des fichiers (5Mo max)
    const fichiersValides = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Le fichier "${file.name}" dépasse la taille limite de 5Mo`);
        return false;
      }
      return true;
    });

    setFormData((prev) => ({
      ...prev,
      pieces_jointes: fichiersValides,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.titre.trim()) {
      newErrors.titre = "Le titre de la question est obligatoire";
    } else if (formData.titre.length > 100) {
      newErrors.titre = "Le titre ne peut pas dépasser 100 caractères";
    }

    if (!formData.description.trim()) {
      newErrors.description = "La description est obligatoire";
    } else if (formData.description.length > 2000) {
      newErrors.description =
        "La description ne peut pas dépasser 2000 caractères";
    }

    if (!formData.theme_id) {
      newErrors.theme_id = "Veuillez sélectionner un thème";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const interventionData = {
        titre: formData.titre.substring(0, 100),
        description: formData.description.substring(0, 2000),
        theme_id: parseInt(formData.theme_id),
      };

      const response = await interventionsAPI.create(interventionData);
      const interventionId = response.data.intervention.id;

      if (formData.pieces_jointes.length > 0) {
        const uploadFormData = new FormData();
        formData.pieces_jointes.forEach((file) => {
          uploadFormData.append("pieces_jointes", file);
        });

        await interventionsAPI.uploadPiecesJointes(
          interventionId,
          uploadFormData
        );
      }

      navigate("/interventions", {
        state: {
          message: "Votre question a été envoyée avec succès !",
          type: "success",
        },
      });
    } catch (error) {
      console.error("Erreur création intervention:", error);
      setErrors({
        submit:
          error.response?.data?.error ||
          "Erreur lors de l'envoi de la question",
      });
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "commune") {
    return (
      <Layout activePage="interventions">
        <div className="card card-rounded p-6 text-center">
          <h2 className="text-xl font-semibold text-danger mb-4">
            Accès non autorisé
          </h2>
          <p className="text-tertiary">
            Seules les communes peuvent poser des questions.
          </p>
          <Link
            to="/interventions"
            className="inline-block bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors mt-4"
          >
            ← Retour aux interventions
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activePage="interventions">
      {/* En-tête avec retour */}
      <div className="mb-6">
        <Link
          to="/interventions"
          className="text-primary hover:text-primary-light mb-4 inline-block"
        >
          ← Retour aux interventions
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-primary mb-2">
            Poser une nouvelle question
          </h1>
          <p className="text-secondary">
            Remplissez le formulaire ci-dessous pour soumettre votre question
            juridique.
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="card card-rounded p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titre de la question */}
          <div>
            <label
              htmlFor="titre"
              className="block text-sm font-medium text-secondary mb-2"
            >
              Titre de la question *
            </label>
            <input
              type="text"
              id="titre"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              placeholder="Ex: Problème de contrat avec un fournisseur"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light ${
                errors.titre ? "border-danger" : "border-light"
              }`}
              maxLength={100}
            />
            {errors.titre && (
              <p className="text-danger text-sm mt-1">{errors.titre}</p>
            )}
            <div className="text-tertiary text-sm mt-1 flex justify-end">
              <span>{formData.titre.length}/100 caractères</span>
            </div>
          </div>

          {/* Description détaillée */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-secondary mb-2"
            >
              Description détaillée *
            </label>
            <textarea
              id="description"
              name="description"
              rows={8}
              value={formData.description}
              onChange={handleChange}
              placeholder="Décrivez votre problème juridique en détail..."
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light resize-none ${
                errors.description ? "border-danger" : "border-light"
              }`}
              maxLength={2000}
            />
            {errors.description && (
              <p className="text-danger text-sm mt-1">{errors.description}</p>
            )}
            <div className="text-tertiary text-sm mt-1 flex justify-end">
              <span>{formData.description.length}/2000 caractères</span>
            </div>
          </div>

          {/* Métadonnées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sélection du Thème */}
            <div>
              <label
                htmlFor="theme_id"
                className="block text-sm font-medium text-secondary mb-2"
              >
                Thème de la question *
              </label>
              <select
                id="theme_id"
                name="theme_id"
                value={formData.theme_id}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light ${
                  errors.theme_id ? "border-danger" : "border-light"
                }`}
              >
                <option value="">Sélectionnez un thème...</option>
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.designation}
                  </option>
                ))}
              </select>
              {errors.theme_id && (
                <p className="text-danger text-sm mt-1">{errors.theme_id}</p>
              )}
            </div>

            {/* Pièces jointes */}
            <div>
              <label
                htmlFor="pieces_jointes"
                className="block text-sm font-medium text-secondary mb-2"
              >
                Pièces jointes
              </label>
              <input
                type="file"
                id="pieces_jointes"
                multiple
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <p className="text-tertiary text-sm mt-1">
                PDF, JPG, PNG, DOC, DOCX (max 5Mo par fichier)
              </p>
              {formData.pieces_jointes.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-secondary mb-1">
                    Fichiers sélectionnés :
                  </p>
                  <ul className="text-sm text-tertiary space-y-1">
                    {formData.pieces_jointes.map((file, index) => (
                      <li key={index} className="flex justify-between">
                        <span className="truncate flex-1">{file.name}</span>
                        <span className="text-xs text-primary ml-2">
                          ({(file.size / 1024 / 1024).toFixed(2)} Mo)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Erreur générale */}
          {errors.submit && (
            <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-4 pt-4 justify-end">
            <Link
              to="/interventions"
              className="px-6 py-3 border border-light text-secondary rounded-lg hover:bg-light transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Envoi en cours..." : "Envoyer la question"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default NouvelleIntervention;
