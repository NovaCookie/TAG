import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Layout from "../layout/Layout";
import { usersAPI } from "../../services/api";
import { Link } from "react-router-dom";

const NouvelUtilisateur = () => {
  const { user } = useAuth();
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [messageSucces, setMessageSucces] = useState("");
  const [communes, setCommunes] = useState([]);

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

  // Charger la liste des communes
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur("");
    setMessageSucces("");

    // Validation
    if (formData.mot_de_passe !== formData.confirmer_mot_de_passe) {
      setErreur("Les mots de passe ne correspondent pas");
      setChargement(false);
      return;
    }

    if (formData.mot_de_passe.length < 6) {
      setErreur("Le mot de passe doit contenir au moins 6 caractères");
      setChargement(false);
      return;
    }

    const donneesUtilisateur = {
      nom: formData.nom.trim(),
      prenom: formData.prenom.trim(),
      email: formData.email.trim(),
      role: formData.role,
      commune_id:
        formData.role === "commune" ? parseInt(formData.commune_id) : null,
      mot_de_passe: formData.mot_de_passe,
      envoyer_email_bienvenue: formData.envoyer_email_bienvenue,
    };

    try {
      const response = await usersAPI.create(donneesUtilisateur);
      setMessageSucces(response.data.message || "Utilisateur créé avec succès");

      // ✅ Redirection automatique après succès (garde navigate ici)
      setTimeout(() => {
        window.location.href = "/users"; // on remplace navigate par window.location.href
      }, 2000);
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
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-primary mb-2">
              Nouvel Utilisateur
            </h1>
            <p className="text-secondary-light">
              Créer un nouveau compte utilisateur sur la plateforme
            </p>
          </div>

          {/* ✅ Bouton retour avec Link */}
          <Link
            to="/users"
            className="px-4 py-2 border border-light-gray text-secondary rounded-lg hover:bg-light-gray transition-colors"
          >
            ← Retour
          </Link>
        </div>

        {/* Messages */}
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

        {/* Formulaire */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations personnelles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-light-gray rounded-lg focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-light-gray rounded-lg focus:outline-none focus:border-primary"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Adresse email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-light-gray rounded-lg focus:outline-none focus:border-primary"
                placeholder="exemple@domaine.com"
                required
              />
            </div>

            {/* Rôle et Commune */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Rôle *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-light-gray rounded-lg focus:outline-none focus:border-primary"
                  required
                >
                  <option value="commune">Commune</option>
                  <option value="juriste">Juriste</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  {formData.role === "commune"
                    ? "Commune *"
                    : "Commune (optionnel)"}
                </label>
                <select
                  name="commune_id"
                  value={formData.commune_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-light-gray rounded-lg focus:outline-none focus:border-primary"
                  required={formData.role === "commune"}
                >
                  <option value="">Sélectionnez une commune</option>
                  {communes.map((commune) => (
                    <option key={commune.id} value={commune.id}>
                      {commune.nom}{" "}
                      {commune.population && `(${commune.population} hab.)`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mot de passe */}
            <div className="border-t border-light-gray pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-primary">
                  Mot de passe
                </h3>
                <button
                  type="button"
                  onClick={genererMotDePasse}
                  className="px-3 py-1 bg-light text-primary rounded-lg text-sm hover:bg-primary-light hover:text-white transition-colors"
                >
                  Générer automatiquement
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    name="mot_de_passe"
                    value={formData.mot_de_passe}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-light-gray rounded-lg focus:outline-none focus:border-primary"
                    placeholder="Minimum 6 caractères"
                    minLength="6"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Confirmation *
                  </label>
                  <input
                    type="password"
                    name="confirmer_mot_de_passe"
                    value={formData.confirmer_mot_de_passe}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-light-gray rounded-lg focus:outline-none focus:border-primary"
                    placeholder="Répétez le mot de passe"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="border-t border-light-gray pt-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="envoyer_email_bienvenue"
                  name="envoyer_email_bienvenue"
                  checked={formData.envoyer_email_bienvenue}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <label
                  htmlFor="envoyer_email_bienvenue"
                  className="ml-2 text-sm text-secondary"
                >
                  Envoyer un email de bienvenue avec les informations de
                  connexion
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={reinitialiserFormulaire}
                className="px-6 py-3 bg-danger text-white rounded-lg hover:bg-red-600 border border-danger transition-colors"
              >
                Réinitialiser
              </button>
              <div className="flex gap-4">
                <Link
                  to="/users"
                  className="px-6 py-3 border border-light text-secondary rounded-lg hover:bg-light transition-colors"
                >
                  Annuler
                </Link>
                <button
                  type="submit"
                  disabled={chargement}
                  className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {chargement ? "Création en cours..." : "Créer l'utilisateur"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Informations */}
        <div className="mt-6 bg-light rounded-xl p-6">
          <h3 className="text-lg font-semibold text-primary mb-3">
            Informations importantes
          </h3>
          <ul className="text-sm text-secondary-light space-y-2">
            <li>• Tous les champs marqués d'un * sont obligatoires</li>
            <li>• Le mot de passe doit contenir au minimum 6 caractères</li>
            <li>• Un email de bienvenue sera envoyé si l'option est cochée</li>
            <li>
              • L'utilisateur pourra modifier son mot de passe après la première
              connexion
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default NouvelUtilisateur;
