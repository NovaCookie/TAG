import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import { authAPI, communesAPI } from "../../services/api";
import AlertMessage from "../common/feedback/AlertMessage";
import SelectFieldCommune from "../common/dropdown/SelectFieldCommune";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    mot_de_passe: "",
    confirmPassword: "",
    commune_id: "",
  });
  const [communes, setCommunes] = useState([]);
  const [localError, setLocalError] = useState("");
  const { callApi, loading, error, resetError } = useApi();
  const navigate = useNavigate();

  // Charger la liste des communes actives
  useEffect(() => {
    const loadCommunes = async () => {
      try {
        // Utiliser la route publique
        const response = await communesAPI.getPublicList();
        setCommunes(response.data.communes || []);
      } catch (err) {
        console.error("Erreur chargement communes:", err);
        setLocalError("Erreur lors du chargement des communes");
      }
    };
    loadCommunes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Réinitialiser l'erreur quand l'utilisateur modifie un champ
    if (localError) setLocalError("");
    if (error) resetError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    resetError();

    // Validation
    if (!formData.commune_id) {
      setLocalError("Veuillez sélectionner votre commune");
      return;
    }

    if (formData.mot_de_passe !== formData.confirmPassword) {
      setLocalError("Les mots de passe ne correspondent pas");
      return;
    }

    if (formData.mot_de_passe.length < 6) {
      setLocalError("Le mot de passe doit faire au moins 6 caractères");
      return;
    }

    try {
      await callApi(() =>
        authAPI.registerPublic({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          mot_de_passe: formData.mot_de_passe,
          commune_id: parseInt(formData.commune_id),
        })
      );

      // Redirection vers le dashboard
      navigate("/dashboard");
    } catch (err) {
      // Erreur gérée par useApi
    }
  };

  // Combiner les erreurs locales et API
  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-light font-sans p-6">
      <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-md text-center">
        <h2 className="text-primary text-2xl font-semibold mb-4">
          Créer un compte commune
        </h2>
        <p className="text-secondary text-sm mb-8">
          Pour les membres des communes adhérentes à TAG
        </p>

        <AlertMessage
          type="error"
          message={displayError}
          onClose={() => {
            setLocalError("");
            resetError();
          }}
          autoClose={true}
          duration={5000}
        />

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="nom"
                className="block text-secondary text-sm font-medium mb-2"
              >
                Nom *
              </label>
              <input
                id="nom"
                name="nom"
                type="text"
                required
                className="w-full px-4 py-3 border border-light-gray rounded-lg text-base transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="Votre nom"
                value={formData.nom}
                onChange={handleChange}
              />
            </div>

            <div>
              <label
                htmlFor="prenom"
                className="block text-secondary text-sm font-medium mb-2"
              >
                Prénom *
              </label>
              <input
                id="prenom"
                name="prenom"
                type="text"
                required
                className="w-full px-4 py-3 border border-light-gray rounded-lg text-base transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="Votre prénom"
                value={formData.prenom}
                onChange={handleChange}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-secondary text-sm font-medium mb-2"
              >
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 border border-light-gray rounded-lg text-base transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="votre@courriel.gl"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <SelectFieldCommune
              value={formData.commune_id}
              onChange={handleChange}
              communes={communes}
              error={
                localError && !formData.commune_id
                  ? "Veuillez sélectionner votre commune"
                  : ""
              }
              required={true}
              label="Votre commune"
            />

            <div>
              <label
                htmlFor="mot_de_passe"
                className="block text-secondary text-sm font-medium mb-2"
              >
                Mot de passe *
              </label>
              <input
                id="mot_de_passe"
                name="mot_de_passe"
                type="password"
                required
                className="w-full px-4 py-3 border border-light-gray rounded-lg text-base transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="Votre mot de passe"
                value={formData.mot_de_passe}
                onChange={handleChange}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-secondary text-sm font-medium mb-2"
              >
                Confirmer le mot de passe *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="w-full px-4 py-3 border border-light-gray rounded-lg text-base transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="Confirmez votre mot de passe"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white rounded-lg py-3 font-semibold text-base hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            {loading ? "Création du compte..." : "Créer mon compte"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-light-gray text-center">
          <Link
            to="/auth/login"
            className="text-primary hover:text-primary-light hover:underline transition-colors"
          >
            Déjà un compte ? Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
