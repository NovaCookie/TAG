// components/users/NewUser.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Layout from "../layout/Layout";
import { usersAPI } from "../../services/api";
import SelectFieldCommune from "../common/dropdown/SelectFieldCommune";
import SelectField from "../common/dropdown/SelectField";
import PasswordField from "../common/PasswordField";

const NewUser = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [messageSucces, setMessageSucces] = useState("");
  const [communes, setCommunes] = useState([]);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    role: "commune",
    commune_id: "",
    mot_de_passe: "",
    confirmer_mot_de_passe: "",
    envoyer_email_bienvenue: true,
  });

  // Charger les communes
  useEffect(() => {
    const chargerCommunes = async () => {
      try {
        const response = await usersAPI.getCommunesList();
        setCommunes(response.data);
      } catch (error) {
        console.error("Erreur chargement communes:", error);
      }
    };
    chargerCommunes();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "role" && value !== "commune") {
      setFormData((prev) => ({ ...prev, commune_id: "" }));
    }

    // Effacer les erreurs lors de la modification
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    if (erreur) setErreur("");
  };

  const genererMotDePasse = () => {
    const caracteres =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let motDePasse = "";
    for (let i = 0; i < 12; i++) {
      motDePasse += caracteres.charAt(
        Math.floor(Math.random() * caracteres.length)
      );
    }
    setFormData((prev) => ({
      ...prev,
      mot_de_passe: motDePasse,
      confirmer_mot_de_passe: motDePasse,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nom.trim()) newErrors.nom = "Le nom est obligatoire";
    if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est obligatoire";
    if (!formData.email.trim()) newErrors.email = "L'email est obligatoire";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "L'email n'est pas valide";

    if (!formData.role) newErrors.role = "Le rôle est obligatoire";

    // La commune est obligatoire UNIQUEMENT si le rôle est "commune"
    if (formData.role === "commune" && !formData.commune_id) {
      newErrors.commune_id =
        "La commune est obligatoire pour un utilisateur de type commune";
    }

    // Validation du mot de passe
    if (!formData.mot_de_passe) {
      newErrors.mot_de_passe = "Le mot de passe est obligatoire";
    } else if (formData.mot_de_passe.length < 6) {
      newErrors.mot_de_passe =
        "Le mot de passe doit contenir au moins 6 caractères";
    }

    if (!formData.confirmer_mot_de_passe) {
      newErrors.confirmer_mot_de_passe =
        "La confirmation du mot de passe est obligatoire";
    } else if (formData.mot_de_passe !== formData.confirmer_mot_de_passe) {
      newErrors.confirmer_mot_de_passe =
        "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitted(true);

    if (!validateForm()) return;

    setChargement(true);
    setErreur("");
    setMessageSucces("");

    const donneesUtilisateur = {
      nom: formData.nom.trim(),
      prenom: formData.prenom.trim(),
      email: formData.email.trim(),
      role: formData.role,
      mot_de_passe: formData.mot_de_passe,
      envoyer_email_bienvenue: formData.envoyer_email_bienvenue,
    };

    // Ajouter commune_id seulement si renseigné
    if (formData.commune_id) {
      donneesUtilisateur.commune_id = parseInt(formData.commune_id);
    }

    try {
      const response = await usersAPI.create(donneesUtilisateur);
      setMessageSucces(response.data.message || "Utilisateur créé avec succès");

      setTimeout(() => navigate("/users"), 2000);
    } catch (error) {
      setErreur(
        error.response?.data?.error ||
          "Erreur lors de la création de l'utilisateur"
      );
    } finally {
      setChargement(false);
    }
  };

  const reinitialiserFormulaire = () => {
    setFormData({
      nom: "",
      prenom: "",
      email: "",
      role: "commune",
      commune_id: "",
      mot_de_passe: "",
      confirmer_mot_de_passe: "",
      envoyer_email_bienvenue: true,
    });
    setErreur("");
    setMessageSucces("");
    setFormSubmitted(false);
    setErrors({});
  };

  if (user?.role !== "admin") {
    return (
      <Layout activePage="users">
        <div className="card card-rounded p-6 text-center">
          <h2 className="text-xl font-semibold text-danger mb-4">
            Accès non autorisé
          </h2>
          <p className="text-tertiary">
            Seuls les administrateurs peuvent créer des utilisateurs.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activePage="users">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-primary mb-2">
              Nouvel utilisateur
            </h1>
            <p className="text-secondary-light">
              Créer un nouveau compte utilisateur sur la plateforme
            </p>
          </div>

          <Link
            to="/users"
            className="text-primary hover:text-primary-light mb-4 inline-block"
          >
            ← Retour aux utilisateurs
          </Link>
        </div>

        {messageSucces && (
          <div className="bg-success/10 border border-success/20 text-success p-4 rounded-lg mb-6">
            {messageSucces}
          </div>
        )}

        {erreur && (
          <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-lg mb-6">
            {erreur}
          </div>
        )}

        <div className="card card-rounded p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Nom et prénom */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-secondary mb-3">
                  Prénom *
                </label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light text-lg ${
                    errors.prenom ? "border-danger" : "border-light"
                  }`}
                  required
                  placeholder="Entrez le prénom"
                />
                {errors.prenom && (
                  <p className="text-danger text-sm mt-1">{errors.prenom}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-3">
                  Nom *
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light text-lg ${
                    errors.nom ? "border-danger" : "border-light"
                  }`}
                  required
                  placeholder="Entrez le nom"
                />
                {errors.nom && (
                  <p className="text-danger text-sm mt-1">{errors.nom}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-3">
                Adresse email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light text-lg ${
                  errors.email ? "border-danger" : "border-light"
                }`}
                placeholder="exemple@domaine.com"
                required
              />
              {errors.email && (
                <p className="text-danger text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Rôle et Commune */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SelectField
                value={formData.role}
                onChange={handleChange}
                options={[
                  { value: "commune", label: "Commune" },
                  { value: "juriste", label: "Juriste" },
                  { value: "admin", label: "Administrateur" },
                ]}
                label="Rôle *"
                error={errors.role}
                fieldName="role"
              />

              <SelectFieldCommune
                value={formData.commune_id}
                onChange={handleChange}
                communes={communes}
                error={errors.commune_id}
                required={formData.role === "commune"}
                label="Commune"
              />
            </div>

            {/* Mot de passe */}
            <div className="border-t border-light-gray pt-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-primary">
                  Mot de passe
                </h3>
                <button
                  type="button"
                  onClick={genererMotDePasse}
                  className="px-4 py-2 bg-light text-primary rounded-lg text-base hover:bg-primary-light hover:text-white transition-colors"
                >
                  Générer automatiquement
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <PasswordField
                  value={formData.mot_de_passe}
                  onChange={handleChange}
                  error={errors.mot_de_passe}
                  placeholder="Minimum 6 caractères"
                  name="mot_de_passe"
                  label="Mot de passe"
                  required={true}
                />

                <PasswordField
                  value={formData.confirmer_mot_de_passe}
                  onChange={handleChange}
                  error={errors.confirmer_mot_de_passe}
                  placeholder="Répétez le mot de passe"
                  name="confirmer_mot_de_passe"
                  label="Confirmation"
                  required={true}
                />
              </div>
            </div>

            {/* Email bienvenue */}
            <div className="flex items-center gap-3 p-6 bg-light rounded-lg">
              <input
                type="checkbox"
                id="envoyer_email_bienvenue"
                name="envoyer_email_bienvenue"
                checked={formData.envoyer_email_bienvenue}
                onChange={handleChange}
                className="w-5 h-5 text-primary rounded focus:ring-primary-light"
              />
              <label
                htmlFor="envoyer_email_bienvenue"
                className="text-base font-medium text-secondary"
              >
                Envoyer un email de bienvenue avec les informations de connexion
              </label>
            </div>

            {/* Actions */}
            <div className="pt-8 border-t border-light-gray">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={reinitialiserFormulaire}
                  className="w-full text-center px-6 py-4 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors text-base"
                >
                  Réinitialiser
                </button>

                <Link
                  to="/users"
                  className="w-full text-center px-6 py-4 border border-light text-secondary rounded-lg hover:bg-light transition-colors text-base flex items-center justify-center"
                >
                  Annuler
                </Link>

                <button
                  type="submit"
                  disabled={chargement}
                  className="w-full bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed py-4 text-base"
                >
                  {chargement ? "Création en cours..." : "Créer l'utilisateur"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default NewUser;
