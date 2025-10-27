import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Layout from "../layout/Layout";
import { usersAPI, communesAPI } from "../../services/api";

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
    actif: true,
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [userResponse, communesResponse] = await Promise.all([
        usersAPI.getById(id),
        communesAPI.getAll()
      ]);

      const userData = userResponse.data;
      setUserData(userData);
      
      setFormData({
        nom: userData.nom || "",
        prenom: userData.prenom || "",
        email: userData.email || "",
        role: userData.role || "",
        commune_id: userData.commune?.id || "",
        actif: userData.actif !== undefined ? userData.actif : true,
      });

      // CORRECTION ICI : S'assurer que communes est un tableau
      const communesData = communesResponse.data;
      setCommunes(Array.isArray(communesData) ? communesData : []);
      
    } catch (error) {
      console.error("Erreur chargement données:", error);
      setMessage("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom est obligatoire";
    }

    if (!formData.prenom.trim()) {
      newErrors.prenom = "Le prénom est obligatoire";
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est obligatoire";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "L'email n'est pas valide";
    }

    if (!formData.role) {
      newErrors.role = "Le rôle est obligatoire";
    }

    if (formData.role === "commune" && !formData.commune_id) {
      newErrors.commune_id = "La commune est obligatoire pour ce rôle";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const updateData = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        role: formData.role,
        actif: formData.actif,
      };

      if (formData.role === "commune") {
        updateData.commune_id = parseInt(formData.commune_id);
      } else {
        updateData.commune_id = null;
      }

      await usersAPI.update(id, updateData);

      setMessage("Utilisateur modifié avec succès");
      
      setTimeout(() => {
        navigate("/users", {
          state: {
            message: "Utilisateur modifié avec succès",
            type: "success"
          }
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
        <div className="card card-rounded p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-tertiary">Chargement des données...</p>
          </div>
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
      <div className="mb-6">
        <Link
          to="/users"
          className="text-primary hover:text-primary-light mb-4 inline-block"
        >
          ← Retour aux utilisateurs
        </Link>

        <h1 className="text-2xl font-semibold text-primary mb-2">
          Modifier l'utilisateur
        </h1>
        <p className="text-secondary">
          Modifiez les informations de {userData.prenom} {userData.nom}
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 ${
          message.includes("succès") 
            ? "bg-success/10 border border-success/20 text-success" 
            : "bg-danger/10 border border-danger/20 text-danger"
        }`}>
          {message}
        </div>
      )}

      <div className="card card-rounded p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="prenom" className="block text-sm font-medium text-secondary mb-2">
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
              <label htmlFor="nom" className="block text-sm font-medium text-secondary mb-2">
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
            <label htmlFor="email" className="block text-sm font-medium text-secondary mb-2">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-secondary mb-2">
                Rôle *
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light ${
                  errors.role ? "border-danger" : "border-light"
                }`}
              >
                <option value="">Sélectionnez un rôle</option>
                <option value="admin">Administrateur</option>
                <option value="juriste">Juriste</option>
                <option value="commune">Commune</option>
              </select>
              {errors.role && (
                <p className="text-danger text-sm mt-1">{errors.role}</p>
              )}
            </div>

            {formData.role === "commune" && (
              <div>
                <label htmlFor="commune_id" className="block text-sm font-medium text-secondary mb-2">
                  Commune *
                </label>
                <select
                  id="commune_id"
                  name="commune_id"
                  value={formData.commune_id}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light ${
                    errors.commune_id ? "border-danger" : "border-light"
                  }`}
                >
                  <option value="">Sélectionnez une commune</option>
                  {communes.map((commune) => (
                    <option key={commune.id} value={commune.id}>
                      {commune.nom}
                    </option>
                  ))}
                </select>
                {errors.commune_id && (
                  <p className="text-danger text-sm mt-1">{errors.commune_id}</p>
                )}
              </div>
            )}
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
            <label htmlFor="actif" className="ml-3 text-sm font-medium text-secondary cursor-pointer">
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
              {saving ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enregistrement...
                </div>
              ) : (
                "Enregistrer les modifications"
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditUser;