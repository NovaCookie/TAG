import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Layout from "../layout/Layout";
import { usersAPI, archivesAPI } from "../../services/api";
import SelectField from "../common/dropdown/SelectField";
import SelectFieldCommune from "../common/dropdown/SelectFieldCommune";
import { useNavigation } from "../../hooks/useNavigation";
import PasswordField from "../common/PasswordField";

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getBackLink, getBackText } = useNavigation();

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
    envoyerEmail: false,
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const [archiveInfo, setArchiveInfo] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const [archiveMessage, setArchiveMessage] = useState("");
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState("");
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const isArchived = archiveInfo?.archived;

  // Fonction pour vérifier le statut d'archivage
  const checkArchiveStatus = useCallback(async (userId) => {
    try {
      const response = await archivesAPI.checkStatus("utilisateurs", userId);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { archived: false };
      }
      console.error("Erreur vérification archivage:", error);
      return { archived: false };
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [userResponse, communesResponse] = await Promise.all([
        usersAPI.getById(id),
        usersAPI.getCommunesList(),
      ]);

      const userData = userResponse.data;

      // Si l'utilisateur est archivé, on récupère les données depuis l'archive
      if (userData.archived && userData.archive_info) {
        setUserData({
          ...userData,
          archived: true,
        });

        // Déterminer la commune_id de l'utilisateur
        let communeId = "";
        if (userData.commune_id) {
          communeId = userData.commune_id.toString();
        } else if (userData.commune && userData.commune.id) {
          communeId = userData.commune.id.toString();
        }

        setFormData({
          nom: userData.nom || "",
          prenom: userData.prenom || "",
          email: userData.email || "",
          role: userData.role || "",
          commune_id: communeId,
          mot_de_passe: "",
          confirmer_mot_de_passe: "",
          actif: userData.actif !== undefined ? userData.actif : true,
          envoyerEmail: false,
        });

        setArchiveInfo({ archived: true, archive: userData.archive_info });
      } else {
        setUserData(userData);

        // Déterminer la commune_id de l'utilisateur
        let communeId = "";
        if (userData.commune_id) {
          communeId = userData.commune_id.toString();
        } else if (userData.commune && userData.commune.id) {
          communeId = userData.commune.id.toString();
        }

        setFormData({
          nom: userData.nom || "",
          prenom: userData.prenom || "",
          email: userData.email || "",
          role: userData.role || "",
          commune_id: communeId,
          mot_de_passe: "",
          confirmer_mot_de_passe: "",
          actif: userData.actif !== undefined ? userData.actif : true,
          envoyerEmail: false,
        });

        // Vérifier le statut d'archivage
        const archiveStatus = await checkArchiveStatus(id);
        setArchiveInfo(archiveStatus);
      }

      setCommunes(
        Array.isArray(communesResponse.data) ? communesResponse.data : []
      );
    } catch (error) {
      if (error.response?.status === 410) {
        // Utilisateur archivé - récupérer depuis les archives
        try {
          const archiveResponse = await archivesAPI.getAll({
            table_name: "utilisateurs",
            search: id,
          });
          const archivedUser = archiveResponse.data.archives.find(
            (archive) => archive.entity_id === parseInt(id)
          );
          if (archivedUser) {
            const userData = archivedUser.entity_data;
            setUserData({
              ...userData,
              archived: true,
            });

            let communeId = "";
            if (userData.commune_id) {
              communeId = userData.commune_id.toString();
            } else if (userData.commune && userData.commune.id) {
              communeId = userData.commune.id.toString();
            }

            setFormData({
              nom: userData.nom || "",
              prenom: userData.prenom || "",
              email: userData.email || "",
              role: userData.role || "",
              commune_id: communeId,
              mot_de_passe: "",
              confirmer_mot_de_passe: "",
              actif: userData.actif !== undefined ? userData.actif : true,
              envoyerEmail: false,
            });

            setArchiveInfo({ archived: true, archive: archivedUser });
          } else {
            setMessage("Utilisateur archivé non trouvé");
          }
        } catch (archiveError) {
          setMessage("Utilisateur archivé - erreur de chargement");
        }
      } else {
        console.error("Erreur chargement données:", error);
        setMessage("Erreur lors du chargement des données");
      }
    } finally {
      setLoading(false);
    }
  }, [id, checkArchiveStatus]);

  useEffect(() => {
    if (id) loadData();
  }, [id, loadData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (isArchived) {
      setMessage("Impossible de modifier un utilisateur archivé");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Réinitialiser commune_id si le rôle change et n'est plus "commune"
    if (name === "role" && value !== "commune") {
      setFormData((prev) => ({
        ...prev,
        commune_id: "",
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    if (isArchived) {
      setMessage("Impossible de modifier un utilisateur archivé");
      return false;
    }

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
    if (isArchived) {
      setMessage(
        "Impossible de générer un mot de passe pour un utilisateur archivé"
      );
      return;
    }

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
    if (isArchived) {
      setMessage("Impossible de modifier un utilisateur archivé");
      return;
    }

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
      };

      // Ajouter commune_id seulement si renseigné
      if (formData.commune_id) {
        updateData.commune_id = parseInt(formData.commune_id);
      } else {
        updateData.commune_id = null;
      }

      // Ajouter le mot de passe seulement s'il est modifié
      if (formData.mot_de_passe && formData.mot_de_passe.trim() !== "") {
        updateData.mot_de_passe = formData.mot_de_passe;
        updateData.envoyerEmail = formData.envoyerEmail;
      }

      await usersAPI.update(id, updateData);

      setMessage(
        formData.mot_de_passe
          ? "Utilisateur et mot de passe modifiés avec succès"
          : "Utilisateur modifié avec succès"
      );

      setTimeout(() => {
        navigate("/users", {
          state: {
            message: formData.mot_de_passe
              ? "Utilisateur et mot de passe modifiés avec succès"
              : "Utilisateur modifié avec succès",
            type: "success",
          },
        });
      }, 1500);
    } catch (error) {
      console.error("Erreur modification utilisateur:", error);

      let errorMessage = "Erreur lors de la modification de l'utilisateur";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 410) {
        errorMessage = "Impossible de modifier un utilisateur archivé";
      }

      setMessage(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Fonctions d'archivage
  const handleOpenArchiveModal = () => {
    setShowArchiveModal(true);
    setArchiveMessage("");
  };

  const handleCloseArchiveModal = () => {
    setShowArchiveModal(false);
    setArchiveMessage("");
  };

  const handleConfirmArchive = async () => {
    if (!userData) return;

    setArchiving(true);
    setArchiveMessage("");

    try {
      await archivesAPI.archiveEntity(
        "utilisateurs",
        userData.id,
        "Archivage par l'administrateur"
      );

      // Recharge les données pour mettre à jour le statut d'archivage
      await loadData();

      setArchiveMessage("Utilisateur archivé avec succès");
      setTimeout(() => {
        setShowArchiveModal(false);
        setArchiveMessage("");
      }, 2000);
    } catch (error) {
      console.error("Erreur archivage:", error);
      let errorMessage = "Erreur lors de l'archivage";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 410) {
        errorMessage = "Cet utilisateur est déjà archivé";
      }
      setArchiveMessage(errorMessage);
    } finally {
      setArchiving(false);
    }
  };

  const handleOpenRestoreModal = () => {
    setShowRestoreModal(true);
    setRestoreMessage("");
  };

  const handleCloseRestoreModal = () => {
    setShowRestoreModal(false);
    setRestoreMessage("");
  };

  const handleConfirmRestore = async () => {
    if (!userData) return;

    setRestoring(true);
    setRestoreMessage("");

    try {
      await archivesAPI.restoreEntity("utilisateurs", userData.id);

      await loadData();

      setRestoreMessage("Utilisateur restauré avec succès");
      setTimeout(() => {
        setShowRestoreModal(false);
        setRestoreMessage("");
      }, 2000);
    } catch (error) {
      console.error("Erreur restauration:", error);
      let errorMessage = "Erreur lors de la restauration";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 404) {
        errorMessage = "Archive non trouvée";
      }
      setRestoreMessage(errorMessage);
    } finally {
      setRestoring(false);
    }
  };

  const ArchiveConfirmationModal = () => {
    if (!showArchiveModal) return null;
    if (!userData) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-secondary/10 mb-4">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-primary mb-2">
              Confirmer l'archivage
            </h3>

            <p className="text-tertiary mb-6">
              Êtes-vous sûr de vouloir archiver l'utilisateur{" "}
              <strong>
                {userData.prenom} {userData.nom}
              </strong>{" "}
              ?
              <br />
              <span className="text-secondary font-medium">
                L'utilisateur sera conservé mais ne sera plus visible dans les
                listes principales.
              </span>
            </p>

            {archiveMessage && (
              <div
                className={`px-4 py-3 rounded-lg mb-4 text-sm ${
                  archiveMessage.includes("Erreur")
                    ? "bg-danger/10 text-danger border border-danger/20"
                    : "bg-success/10 text-success border border-success/20"
                }`}
              >
                {archiveMessage}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleCloseArchiveModal}
                disabled={archiving}
                className="px-6 py-2 border border-light text-secondary rounded-lg font-semibold hover:bg-light transition-colors disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                onClick={handleConfirmArchive}
                disabled={archiving}
                className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {archiving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Archivage...
                  </>
                ) : (
                  "Confirmer l'archivage"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RestoreConfirmationModal = () => {
    if (!showRestoreModal) return null;
    if (!userData) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-primary mb-2">
              Confirmer la restauration
            </h3>

            <p className="text-tertiary mb-6">
              Êtes-vous sûr de vouloir restaurer l'utilisateur{" "}
              <strong>
                {userData.prenom} {userData.nom}
              </strong>{" "}
              ?
              <br />
              <span className="text-secondary font-medium">
                L'utilisateur sera à nouveau visible dans les listes
                principales.
              </span>
            </p>

            {restoreMessage && (
              <div
                className={`px-4 py-3 rounded-lg mb-4 text-sm ${
                  restoreMessage.includes("Erreur")
                    ? "bg-danger/10 text-danger border border-danger/20"
                    : "bg-success/10 text-success border border-success/20"
                }`}
              >
                {restoreMessage}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleCloseRestoreModal}
                disabled={restoring}
                className="px-6 py-2 border border-light text-secondary rounded-lg font-semibold hover:bg-light transition-colors disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                onClick={handleConfirmRestore}
                disabled={restoring}
                className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-secondary-light transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {restoring ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Restauration...
                  </>
                ) : (
                  "Confirmer la restauration"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
          <div className="text-tertiary mb-4 space-y-2">
            <p>
              ID de l'utilisateur: <strong>{id}</strong>
            </p>
            <p>
              Rôle utilisateur: <strong>{user?.role}</strong>
            </p>
          </div>
          <Link
            to={getBackLink("user", isArchived)}
            className="text-primary hover:text-primary-light mb-4 inline-block"
          >
            {getBackText("user", isArchived)}
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activePage={isArchived ? "archives" : "users"}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            to={getBackLink("user", isArchived)}
            className="text-primary hover:text-primary-light mb-4 inline-block"
          >
            {getBackText("user", isArchived)}
          </Link>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-semibold text-primary mb-2">
                Information de l'utilisateur :{" "}
                {userData?.nom + " " + userData?.prenom}
                {isArchived && (
                  <span className="ml-3 bg-gray-500 text-white text-sm px-3 py-1 rounded-full inline-flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    </svg>
                    Archivé
                  </span>
                )}
              </h1>
              <p className="text-secondary-light">
                Regardez et/ou modifiez les informations de cette utilisateur
              </p>
            </div>

            <div className="flex gap-2">
              {!isArchived ? (
                <button
                  onClick={handleOpenArchiveModal}
                  className="bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors"
                >
                  Archiver
                </button>
              ) : (
                <button
                  onClick={handleOpenRestoreModal}
                  className="bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors"
                >
                  Restaurer
                </button>
              )}
            </div>
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
                  disabled={isArchived}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light ${
                    errors.prenom ? "border-danger" : "border-light"
                  } ${isArchived ? "bg-gray-100 cursor-not-allowed" : ""}`}
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
                  disabled={isArchived}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light ${
                    errors.nom ? "border-danger" : "border-light"
                  } ${isArchived ? "bg-gray-100 cursor-not-allowed" : ""}`}
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
                disabled={isArchived}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light ${
                  errors.email ? "border-danger" : "border-light"
                } ${isArchived ? "bg-gray-100 cursor-not-allowed" : ""}`}
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
                error={errors.role}
                fieldName="role"
                disabled={isArchived}
              />

              <SelectFieldCommune
                value={formData.commune_id}
                onChange={handleChange}
                communes={communes}
                error={errors.commune_id}
                required={formData.role === "commune"}
                label="Commune"
                disabled={isArchived}
              />
            </div>

            {/* SECTION MOT DE PASSE */}
            {!isArchived && (
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
                  <PasswordField
                    value={formData.mot_de_passe}
                    onChange={handleChange}
                    error={errors.mot_de_passe}
                    placeholder="Ecrivez un nouveau mot de passe"
                    name="mot_de_passe"
                    label="Nouveau mot de passe"
                    required={false}
                    disabled={isArchived}
                  />

                  <PasswordField
                    value={formData.confirmer_mot_de_passe}
                    onChange={handleChange}
                    error={errors.confirmer_mot_de_passe}
                    placeholder="Confirmez le nouveau mot de passe"
                    name="confirmer_mot_de_passe"
                    label="Confirmation"
                    required={false}
                    disabled={isArchived}
                  />
                </div>

                {formData.mot_de_passe && (
                  <div className="flex items-center p-4 bg-light rounded-lg mt-4">
                    <input
                      type="checkbox"
                      id="envoyerEmail"
                      name="envoyerEmail"
                      checked={formData.envoyerEmail}
                      onChange={handleChange}
                      disabled={isArchived}
                      className="w-4 h-4 text-primary bg-white border-light rounded focus:ring-primary-light focus:ring-2"
                    />
                    <label
                      htmlFor="envoyerEmail"
                      className="ml-3 text-sm font-medium text-secondary cursor-pointer"
                    >
                      Envoyer un email de notification pour le changement de mot
                      de passe
                    </label>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center p-4 bg-light rounded-lg">
              <input
                type="checkbox"
                id="actif"
                name="actif"
                checked={formData.actif}
                onChange={handleChange}
                disabled={isArchived}
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
                to={getBackLink("user", isArchived)}
                className="flex-1 text-center px-6 py-3 border border-light text-secondary rounded-lg hover:bg-light transition-colors"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={saving || isArchived}
                className="flex-1 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed py-3"
              >
                {saving
                  ? "Enregistrement..."
                  : isArchived
                  ? "Modification désactivée"
                  : "Enregistrer les modifications"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ArchiveConfirmationModal />
      <RestoreConfirmationModal />
    </Layout>
  );
};

export default EditUser;
