import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Layout from "../layout/Layout";
import { usersAPI } from "../../services/api";
import SelectField from "../common/dropdown/SelectField";
import SelectFieldCommune from "../common/dropdown/SelectFieldCommune";

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [communes, setCommunes] = useState([]);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    role: "",
    commune_id: "",
    mot_de_passe: "",
    confirmer_mot_de_passe: "",
    actif: true,
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userResponse, communesResponse] = await Promise.all([
        usersAPI.getById(id),
        usersAPI.getCommunesList(),
      ]);

      const userData = userResponse.data;
      setUserData(userData);

      setFormData({
        nom: userData.nom || "",
        prenom: userData.prenom || "",
        email: userData.email || "",
        role: userData.role || "",
        commune_id: userData.commune?.id || "",
        mot_de_passe: "",
        confirmer_mot_de_passe: "",
        actif: userData.actif !== undefined ? userData.actif : true,
      });

      setCommunes(
        Array.isArray(communesResponse.data) ? communesResponse.data : []
      );
    } catch (error) {
      console.error("Erreur chargement données:", error);
      setMessage("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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

    if (!formData.nom.trim()) newErrors.nom = "Le nom est obligatoire";
    if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est obligatoire";
    if (!formData.email.trim()) newErrors.email = "L'email est obligatoire";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "L'email n'est pas valide";

    if (!formData.role) newErrors.role = "Le rôle est obligatoire";
    if (!formData.commune_id)
      newErrors.commune_id = "La commune est obligatoire";

    // Validation du mot de passe (seulement si rempli)
    if (formData.mot_de_passe || formData.confirmer_mot_de_passe) {
      if (formData.mot_de_passe.length < 6) {
        newErrors.mot_de_passe =
          "Le mot de passe doit contenir au moins 6 caractères";
      }
      if (formData.mot_de_passe !== formData.confirmer_mot_de_passe) {
        newErrors.confirmer_mot_de_passe =
          "Les mots de passe ne correspondent pas";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    if (!validateForm()) return;

    setSaving(true);
    setMessage("");

    try {
      const updateData = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        role: formData.role,
        actif: formData.actif,
        commune_id: parseInt(formData.commune_id),
      };

      // Ajouter le mot de passe seulement s'il est modifié
      if (formData.mot_de_passe) {
        updateData.nouveauMotDePasse = formData.mot_de_passe;
        updateData.envoyerEmail = false;
      }

      await usersAPI.update(id, updateData);

      setMessage("Utilisateur modifié avec succès");
      setTimeout(() => {
        navigate("/users", {
          state: {
            message: "Utilisateur modifié avec succès",
            type: "success",
          },
        });
      }, 1500);
    } catch (error) {
      console.error("Erreur modification utilisateur:", error);
      setMessage(
        error.response?.data?.error ||
          "Erreur lors de la modification de l'utilisateur"
      );
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <Layout activePage="users">
        <div className="card card-rounded p-6 text-center">
          <h2 className="text-xl font-semibold text-danger mb-4">
            Accès non autorisé
          </h2>
          <p className="text-tertiary">
            Seuls les administrateurs peuvent modifier les utilisateurs.
          </p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout activePage="users">
        <div className="card card-rounded p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-tertiary">Chargement des données...</p>
        </div>
      </Layout>
    );
  }

  if (!userData) {
    return (
      <Layout activePage="users">
        <div className="card card-rounded p-6 text-center">
          <h2 className="text-xl font-semibold text-danger mb-4">
            Utilisateur non trouvé
          </h2>
          <Link
            to="/users"
            className="inline-block bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors"
          >
            ← Retour aux utilisateurs
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activePage="users">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-primary mb-2">
              Modifier l'utilisateur
            </h1>
            <p className="text-secondary-light">
              Modifiez les informations de {userData.prenom} {userData.nom}
            </p>
          </div>

          <Link
            to="/users"
            className="text-primary hover:text-primary-light mb-4 inline-block"
          >
            ← Retour aux utilisateurs
          </Link>
        </div>
      </div>
      {message && (
        <div
          className={`p-4 rounded-lg mb-6 ${
            message.includes("succès")
              ? "bg-success/10 border border-success/20 text-success"
              : "bg-danger/10 border border-danger/20 text-danger"
          }`}
        >
          {message}
        </div>
      )}

      <div className="card card-rounded p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="prenom"
                className="block text-sm font-medium text-secondary mb-2"
              >
                Prénom *
              </label>
              <input
                type="text"
                id="prenom"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light ${
                  errors.prenom ? "border-danger" : "border-light"
                }`}
              />
              {errors.prenom && (
                <p className="text-danger text-sm mt-1">{errors.prenom}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="nom"
                className="block text-sm font-medium text-secondary mb-2"
              >
                Nom *
              </label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light ${
                  errors.nom ? "border-danger" : "border-light"
                }`}
              />
              {errors.nom && (
                <p className="text-danger text-sm mt-1">{errors.nom}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-secondary mb-2"
            >
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light ${
                errors.email ? "border-danger" : "border-light"
              }`}
            />
            {errors.email && (
              <p className="text-danger text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Rôle et Commune */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SelectField
              value={formData.role}
              onChange={handleChange}
              options={[
                { value: "commune", label: "Commune" },
                { value: "juriste", label: "Juriste" },
                { value: "admin", label: "Administrateur" },
              ]}
              label="Rôle *"
              error={!formData.role ? "Le rôle est requis" : ""}
              fieldName="role"
            />

            <SelectFieldCommune
              value={formData.commune_id}
              onChange={handleChange}
              communes={communes}
              error={!formData.commune_id ? "La commune est obligatoire" : ""}
            />
          </div>

          {/* SECTION MOT DE PASSE */}
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

            <div className="text-sm text-secondary-light mb-4">
              Laissez vide pour ne pas modifier le mot de passe actuel
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="mot_de_passe"
                  className="block text-sm font-medium text-secondary mb-2"
                >
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  id="mot_de_passe"
                  name="mot_de_passe"
                  value={formData.mot_de_passe}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light ${
                    errors.mot_de_passe ? "border-danger" : "border-light"
                  }`}
                  placeholder="Ecrivez un nouveau mot de passe"
                />
                {errors.mot_de_passe && (
                  <p className="text-danger text-sm mt-1">
                    {errors.mot_de_passe}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmer_mot_de_passe"
                  className="block text-sm font-medium text-secondary mb-2"
                >
                  Confirmation
                </label>
                <input
                  type="password"
                  id="confirmer_mot_de_passe"
                  name="confirmer_mot_de_passe"
                  value={formData.confirmer_mot_de_passe}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light ${
                    errors.confirmer_mot_de_passe
                      ? "border-danger"
                      : "border-light"
                  }`}
                  placeholder="Confirmez le nouveau mot de passe"
                />
                {errors.confirmer_mot_de_passe && (
                  <p className="text-danger text-sm mt-1">
                    {errors.confirmer_mot_de_passe}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center p-4 bg-light rounded-lg">
            <input
              type="checkbox"
              id="actif"
              name="actif"
              checked={formData.actif}
              onChange={handleChange}
              className="w-4 h-4 text-primary bg-white border-light rounded focus:ring-primary-light focus:ring-2"
            />
            <label
              htmlFor="actif"
              className="ml-3 text-sm font-medium text-secondary cursor-pointer"
            >
              Utilisateur actif
            </label>
          </div>

          <div className="flex gap-4 pt-6 border-t border-light-gray">
            <Link
              to="/users"
              className="flex-1 text-center px-6 py-3 border border-light text-secondary rounded-lg hover:bg-light transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed py-3"
            >
              {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditUser;
