import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import ToggleSwitch from "./common/ToggleSwitch";
import AlertMessage from "./common/feedback/AlertMessage";
import { usersAPI } from "../services/api";

const FormInput = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  pattern,
  ...props
}) => (
  <div>
    <label className="block text-secondary text-sm font-medium mb-2 dark:text-gray-300">
      {label}
    </label>
    <input
      type={type}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-colors"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      pattern={pattern}
      {...props}
    />
  </div>
);

const ToggleItem = ({
  id,
  title,
  description,
  checked,
  onChange,
  roles = [],
  userRole,
}) => {
  if (roles.length > 0 && !roles.includes(userRole)) {
    return null;
  }

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0">
      <div className="flex flex-col gap-1">
        <span className="font-medium text-secondary dark:text-gray-300">
          {title}
        </span>
        <span className="text-sm text-tertiary dark:text-gray-400">
          {description}
        </span>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
};

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState("profil");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    telephone: "",
    poste: "",
    notificationsNouvellesQuestions: true,
    notificationsReponses: true,
    notificationsUrgentes: true,
    rappelsDelais: true,
    nouveauMotDePasse: "",
    confirmerMotDePasse: "",
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await usersAPI.getById(user.id);

        setFormData((prev) => ({
          ...prev,
          telephone: userData.telephone || "",
          poste: userData.poste || "",
          ...(userData.preferences_notifications || {
            notificationsNouvellesQuestions: true,
            notificationsReponses: true,
            notificationsUrgentes: true,
            rappelsDelais: true,
          }),
        }));
      } catch (error) {
        console.error("Erreur chargement données utilisateur:", error);
        setMessage({
          type: "error",
          text: "Erreur lors du chargement des données",
        });
      }
    };

    if (user?.id) {
      loadUserData();
    }
  }, [user]);

  const handleInputChange = useCallback(
    (field) => (event) => {
      const value = event.target.value;

      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      if (message.text) {
        setMessage({ type: "", text: "" });
      }
    },
    [message.text]
  );

  const handleTelephoneChange = useCallback((event) => {
    const value = event.target.value;
    const cleanedValue = value.replace(/[^\d+ ]/g, "");

    setFormData((prev) => ({
      ...prev,
      telephone: cleanedValue,
    }));
  }, []);

  const handleToggleChange = useCallback(
    (field) => (newValue) => {
      setFormData((prev) => ({
        ...prev,
        [field]: newValue,
      }));
    },
    []
  );

  const validateForm = useCallback(() => {
    if (activeSection === "securite") {
      if (formData.nouveauMotDePasse && formData.nouveauMotDePasse.length < 6) {
        setMessage({
          type: "error",
          text: "Le mot de passe doit contenir au moins 6 caractères",
        });
        return false;
      }
      if (formData.nouveauMotDePasse !== formData.confirmerMotDePasse) {
        setMessage({
          type: "error",
          text: "Les mots de passe ne correspondent pas",
        });
        return false;
      }
    }
    return true;
  }, [activeSection, formData.nouveauMotDePasse, formData.confirmerMotDePasse]);

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      switch (activeSection) {
        case "profil":
          await handleSaveProfil();
          break;
        case "notifications":
          await handleSaveNotifications();
          break;
        case "securite":
          await handleSaveSecurite();
          break;
        default:
          break;
      }

      setMessage({
        type: "success",
        text: "Paramètres sauvegardés avec succès !",
      });

      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Erreur sauvegarde paramètres:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Erreur lors de la sauvegarde",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfil = async () => {
    const response = await usersAPI.updateInfos(user.id, {
      telephone: formData.telephone,
      poste: formData.poste,
    });

    const updatedUserData = await usersAPI.getById(user.id);

    updateUser({
      ...user,
      telephone: updatedUserData.telephone,
      poste: updatedUserData.poste,
    });

    setFormData((prev) => ({
      ...prev,
      telephone: updatedUserData.telephone || "",
      poste: updatedUserData.poste || "",
    }));

    return response;
  };

  const handleSaveNotifications = async () => {
    const preferences = {
      notificationsNouvellesQuestions: formData.notificationsNouvellesQuestions,
      notificationsReponses: formData.notificationsReponses,
      notificationsUrgentes: formData.notificationsUrgentes,
      rappelsDelais: formData.rappelsDelais,
    };

    const response = await usersAPI.update(user.id, {
      preferences_notifications: preferences,
    });

    const updatedUserData = await usersAPI.getById(user.id);

    setFormData((prev) => ({
      ...prev,
      ...(updatedUserData.preferences_notifications || {
        notificationsNouvellesQuestions: true,
        notificationsReponses: true,
        notificationsUrgentes: true,
        rappelsDelais: true,
      }),
    }));

    return response;
  };

  const handleSaveSecurite = async () => {
    if (!formData.nouveauMotDePasse) {
      setMessage({
        type: "warning",
        text: "Aucun changement de mot de passe détecté",
      });
      return;
    }

    const response = await usersAPI.updatePassword(user.id, {
      nouveauMotDePasse: formData.nouveauMotDePasse,
      envoyerEmail: false,
    });

    setFormData((prev) => ({
      ...prev,
      nouveauMotDePasse: "",
      confirmerMotDePasse: "",
    }));

    return response;
  };

  const handleCancel = () => {
    const loadOriginalData = async () => {
      try {
        const userData = await usersAPI.getById(user.id);
        setFormData((prev) => ({
          ...prev,
          telephone: userData.telephone || "",
          poste: userData.poste || "",
          ...(userData.preferences_notifications || {
            notificationsNouvellesQuestions: true,
            notificationsReponses: true,
            notificationsUrgentes: true,
            rappelsDelais: true,
          }),
          nouveauMotDePasse: "",
          confirmerMotDePasse: "",
        }));
        setMessage({ type: "info", text: "Modifications annulées" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } catch (error) {
        console.error("Erreur rechargement données:", error);
      }
    };
    loadOriginalData();
  };

  const sections = [
    { id: "profil", label: "Profil", icon: "👤" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "securite", label: "Sécurité", icon: "🔒" },
  ];

  const notificationToggles = [
    {
      id: "notificationsNouvellesQuestions",
      title: "Nouvelles questions",
      description:
        "Recevoir des notifications pour les nouvelles questions assignées",
      roles: ["juriste", "admin"],
    },
    {
      id: "notificationsReponses",
      title: "Réponses reçues",
      description: "Alertes lorsque vos questions reçoivent une réponse",
      roles: ["commune"],
    },
    {
      id: "notificationsUrgentes",
      title: "Questions urgentes",
      description: "Notifications pour les questions marquées comme urgentes",
      roles: ["juriste", "admin"],
    },
    {
      id: "rappelsDelais",
      title: "Rappels de délais",
      description: "Alertes pour les réponses approchant le délai limite",
      roles: ["juriste", "admin"],
    },
  ];

  return (
    <Layout activePage="settings">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-primary dark:text-white">
          Paramètres
        </h1>
      </div>

      {message.text && (
        <div className="mb-6">
          <AlertMessage
            type={message.type}
            message={message.text}
            onClose={() => setMessage({ type: "", text: "" })}
          />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="card card-rounded w-full lg:w-64 p-5 h-fit">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center w-full px-4 py-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                activeSection === section.id
                  ? "bg-primary-50 text-primary font-medium dark:bg-gray-700 dark:text-white"
                  : "text-secondary hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
              }`}
            >
              <span className="mr-3">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </nav>

        <div className="flex-1">
          {activeSection === "profil" && (
            <div className="space-y-6">
              <div className="card card-rounded p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-primary dark:text-white mb-2">
                    Profil Utilisateur
                  </h2>
                  <p className="text-tertiary text-sm dark:text-gray-400">
                    Informations de contact et de poste
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-secondary text-sm font-medium mb-2 dark:text-gray-300">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 cursor-not-allowed"
                      value={`${user?.prenom} ${user?.nom}`}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-secondary text-sm font-medium mb-2 dark:text-gray-300">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 cursor-not-allowed"
                      value={user?.email}
                      readOnly
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-secondary text-sm font-medium mb-2 dark:text-gray-300">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-colors"
                      placeholder="+299 XX XX XX"
                      value={formData.telephone}
                      onChange={handleTelephoneChange}
                      pattern="[\d+\s]*"
                      title="Seuls les chiffres, le signe + et les espaces sont autorisés"
                    />
                    <p className="text-xs text-tertiary mt-1">
                      Format: +299 12 34 56
                    </p>
                  </div>

                  <FormInput
                    label="Poste/Position"
                    value={formData.poste}
                    onChange={handleInputChange("poste")}
                    placeholder="Maire, Conseiller, Employé..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-secondary text-sm font-medium mb-2 dark:text-gray-300">
                      Rôle
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 cursor-not-allowed capitalize"
                      value={user?.role}
                      readOnly
                    />
                  </div>
                  {user?.commune && (
                    <div>
                      <label className="block text-secondary text-sm font-medium mb-2 dark:text-gray-300">
                        Commune
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 cursor-not-allowed"
                        value={user.commune.nom}
                        readOnly
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="card card-rounded p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-primary dark:text-white mb-2">
                  Préférences de notification
                </h2>
                <p className="text-tertiary text-sm dark:text-gray-400">
                  Contrôlez les alertes liées à votre activité
                </p>
              </div>

              <div className="space-y-2">
                {notificationToggles.map((toggle) => (
                  <ToggleItem
                    key={toggle.id}
                    id={toggle.id}
                    title={toggle.title}
                    description={toggle.description}
                    checked={formData[toggle.id]}
                    onChange={handleToggleChange(toggle.id)}
                    roles={toggle.roles}
                    userRole={user.role}
                  />
                ))}
              </div>

              {notificationToggles.filter(
                (toggle) =>
                  toggle.roles.length === 0 || toggle.roles.includes(user.role)
              ).length === 0 && (
                <div className="text-center py-8 text-tertiary dark:text-gray-400">
                  Aucune option de notification disponible pour votre rôle.
                </div>
              )}
            </div>
          )}

          {activeSection === "securite" && (
            <div className="card card-rounded p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-primary dark:text-white mb-2">
                  Sécurité du compte
                </h2>
                <p className="text-tertiary text-sm dark:text-gray-400">
                  Modifiez votre mot de passe
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 max-w-md">
                <FormInput
                  type="password"
                  label="Nouveau mot de passe"
                  value={formData.nouveauMotDePasse}
                  onChange={handleInputChange("nouveauMotDePasse")}
                  placeholder="Minimum 6 caractères"
                />
                <FormInput
                  type="password"
                  label="Confirmer le mot de passe"
                  value={formData.confirmerMotDePasse}
                  onChange={handleInputChange("confirmerMotDePasse")}
                  placeholder="Retapez votre nouveau mot de passe"
                />

                <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                  <p className="text-sm text-primary-700 dark:text-primary-300">
                    <strong>Conseil de sécurité :</strong> Utilisez un mot de
                    passe fort avec des chiffres, des lettres
                    majuscules/minuscules et des caractères spéciaux.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end mt-6 flex-wrap">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="bg-white text-gray-700 border border-gray-300 rounded-lg px-6 py-3 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-primary text-white rounded-lg px-6 py-3 font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sauvegarde...
                </>
              ) : (
                "Enregistrer les modifications"
              )}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
