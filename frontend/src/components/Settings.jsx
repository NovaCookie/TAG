import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Layout from "./layout/Layout";
import UserAvatar from "./common/UserAvatar";
import ToggleSwitch from "./common/ToggleSwitch";
// import StatusBadge from "./common/StatusBadge";

const Settings = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("profil");
  const [formData, setFormData] = useState({
    // Profil
    telephone: "",
    poste: "",
    commune: user?.commune?.nom || "",

    // Notifications
    notificationsEmail: true,
    notificationsPush: true,
    notificationsDossiers: true,
    notificationsImportantes: true,
    rappelsEcheances: true,
    frequenceNotifications: "Immédiatement",
    plageHoraire: "Toute la journée",

    // Sécurité
    ancienMotDePasse: "",
    nouveauMotDePasse: "",
    confirmerMotDePasse: "",
    auth2fa: false,

    // Préférences
    langue: "Français",
    fuseauHoraire: "UTC-3 (Nuuk)",
    formatDate: "JJ/MM/AAAA",
    formatHeure: "24 heures",
    elementsParPage: "25 éléments",
    triDefaut: "Date (plus récent)",

    // Apparence
    theme: theme,
    densiteAffichage: "Confortable",
    taillePolice: "Moyenne",
    couleurAccent: "#2C5E92",
  });

  const handleInputChange = (field, value) => {
    if (field === "theme") {
      setTheme(value);
    }
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = (field, event) => {
    const file = event.target.files[0];
    if (file) {
      console.log(`Fichier uploadé pour ${field}:`, file.name);
    }
  };

  const handleSave = () => {
    console.log("Données sauvegardées:", formData);
    alert("Paramètres sauvegardés avec succès !");
  };

  const sections = [
    { id: "profil", label: "Profil" },
    { id: "notifications", label: "Notifications" },
    { id: "securite", label: "Sécurité" },
    { id: "preferences", label: "Préférences" },
    { id: "apparence", label: "Apparence" },
  ];

  const themeOptions = [
    {
      id: "light",
      label: "Clair",
      preview: "bg-white border border-light-gray",
    },
    {
      id: "dark",
      label: "Sombre",
      preview: "bg-secondary border border-secondary",
    },
    // {
    //   id: "auto",
    //   label: "Automatique",
    //   preview:
    //     "bg-gradient-to-r from-white to-secondary border border-light-gray",
    // },
  ];

  const colorOptions = [
    { color: "#2C5E92" },
    { color: "#38A169" },
    { color: "#DD6B20" },
    { color: "#805AD5" },
    { color: "#D53F8C" },
  ];

  const notificationToggles = [
    {
      id: "notificationsEmail",
      title: "Notifications par email",
      description: "Recevoir des emails pour les nouvelles activités",
    },
    {
      id: "notificationsPush",
      title: "Notifications push",
      description: "Notifications dans votre navigateur",
    },
    {
      id: "notificationsDossiers",
      title: "Notifications de dossiers",
      description: "Alertes pour les mises à jour de dossiers",
    },
    {
      id: "notificationsImportantes",
      title: "Messages importants",
      description: "Notifications pour les messages urgents",
    },
    {
      id: "rappelsEcheances",
      title: "Rappels d'échéances",
      description: "Alertes pour les dates limites approchant",
    },
  ];

  const sessionsActives = [
    {
      device: "Chrome sur Windows",
      location: "Nuuk, Groenland",
      time: "Connecté maintenant",
    },
    {
      device: "Safari sur iPhone",
      location: "Ilulissat, Groenland",
      time: "Il y a 2 heures",
    },
  ];

  const SettingsSection = ({ title, description, children }) => (
    <div className="card card-rounded p-6 mb-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-primary mb-2">{title}</h2>
        <p className="text-tertiary text-sm">{description}</p>
      </div>
      {children}
    </div>
  );

  const FormInput = ({
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    ...props
  }) => (
    <div>
      <label className="block text-secondary text-sm font-medium mb-2">
        {label}
      </label>
      <input
        type={type}
        className="w-full px-4 py-3 border border-light rounded-lg focus:outline-none focus:border-primary bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-dark-primary"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
    </div>
  );

  const FormSelect = ({ label, value, onChange, options, ...props }) => (
    <div>
      <label className="block text-secondary text-sm font-medium mb-2">
        {label}
      </label>
      <select
        className="w-full px-4 py-3 border border-light rounded-lg bg-white focus:outline-none focus:border-primary dark:bg-gray-800 dark:border-gray-600 dark:text-dark-primary"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
    </div>
  );

  const ToggleItem = ({ id, title, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-4 border-b border-light last:border-b-0">
      <div className="flex flex-col gap-1">
        <span className="font-medium text-secondary">{title}</span>
        <span className="text-sm text-tertiary">{description}</span>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );

  const SessionItem = ({ session, onDisconnect }) => (
    <div className="flex justify-between items-center p-4 border border-light rounded-lg">
      <div className="flex flex-col gap-1">
        <span className="font-medium text-secondary">{session.device}</span>
        <span className="text-sm text-tertiary">{session.location}</span>
        <span className="text-sm text-tertiary">{session.time}</span>
      </div>
      <button
        className="bg-light text-primary border border-light rounded-lg px-4 py-2 text-sm font-medium hover:bg-light-gray transition-colors dark:bg-gray-700 dark:hover:bg-gray-600"
        onClick={onDisconnect}
      >
        Déconnecter
      </button>
    </div>
  );

  const ThemeOption = ({ theme, isSelected, onSelect }) => (
    <div
      onClick={() => onSelect(theme.id)}
      className={`flex flex-col items-center gap-2 cursor-pointer ${
        isSelected ? "text-primary" : "text-secondary"
      }`}
    >
      <div
        className={`w-20 h-14 rounded-lg ${theme.preview} ${
          isSelected ? "border-2 border-primary" : "border-2 border-transparent"
        }`}
      ></div>
      <span className="text-sm">{theme.label}</span>
    </div>
  );

  const ColorOption = ({ colorOption, isSelected, onSelect }) => (
    <div
      onClick={() => onSelect(colorOption.color)}
      className={`w-10 h-10 rounded-full cursor-pointer border-2 ${
        isSelected ? "border-primary" : "border-transparent"
      }`}
      style={{ backgroundColor: colorOption.color }}
    ></div>
  );

  return (
    <Layout activePage="settings">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-primary">Paramètres</h1>
      </div>

      <div className="flex gap-6 mb-8">
        {/* Settings Navigation */}
        <nav className="card card-rounded w-64 p-5 h-fit">
          {sections.map((section) => (
            <div
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center px-4 py-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                activeSection === section.id
                  ? "bg-light text-primary font-medium dark:bg-gray-700"
                  : "text-secondary hover:bg-light dark:hover:bg-gray-700"
              }`}
            >
              {section.label}
            </div>
          ))}
        </nav>

        {/* Settings Content */}
        <div className="flex-1">
          {/* Section Profil */}
          {activeSection === "profil" && (
            <SettingsSection
              title="Profil Utilisateur"
              description="Gérez vos informations personnelles et vos préférences de compte"
            >
              {/* Photo de profil */}
              <div className="mb-6">
                <label className="block text-secondary text-sm font-medium mb-3">
                  Photo de profil
                </label>
                <div className="flex items-center gap-5">
                  <UserAvatar name={`${user?.prenom} ${user?.nom}`} size="xl" />
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload("avatar", e)}
                  />
                  <button
                    type="button"
                    className="bg-light text-primary border border-light-gray rounded-lg px-4 py-2 text-sm font-medium hover:bg-light-gray transition-colors"
                    onClick={() =>
                      document.getElementById("avatar-upload").click()
                    }
                  >
                    Changer la photo
                  </button>
                </div>
              </div>

              {/* Informations personnelles */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-secondary text-sm font-medium mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-light-gray rounded-lg focus:outline-none focus:border-primary"
                    value={`${user?.prenom} ${user?.nom}`}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-secondary text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-light-gray rounded-lg focus:outline-none focus:border-primary"
                    value={user?.email}
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <FormInput
                  label="Téléphone"
                  type="tel"
                  value={formData.telephone}
                  onChange={(value) => handleInputChange("telephone", value)}
                  placeholder="Votre numéro de téléphone"
                />
                <FormSelect
                  label="Commune"
                  value={formData.commune}
                  onChange={(value) => handleInputChange("commune", value)}
                  options={["Nuuk", "Sisimiut", "Ilulissat", "Qaqortoq"]}
                />
              </div>

              <FormInput
                label="Poste/Position"
                value={formData.poste}
                onChange={(value) => handleInputChange("poste", value)}
                placeholder="Votre poste dans la commune"
              />

              {/* Signature électronique */}
              <div>
                <label className="block text-secondary text-sm font-medium mb-2">
                  Signature électronique
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="signature-upload"
                    accept=".png,.jpg,.jpeg,.svg"
                    className="hidden"
                    onChange={(e) => handleFileUpload("signature", e)}
                  />
                  <button
                    type="button"
                    className="bg-light text-primary border border-light-gray rounded-lg px-4 py-2 text-sm font-medium hover:bg-light-gray transition-colors"
                    onClick={() =>
                      document.getElementById("signature-upload").click()
                    }
                  >
                    Uploader une signature
                  </button>
                  <span className="text-secondary-light text-sm">
                    Aucun fichier sélectionné
                  </span>
                </div>
              </div>
            </SettingsSection>
          )}

          {/* Section Notifications */}
          {activeSection === "notifications" && (
            <SettingsSection
              title="Préférences de notification"
              description="Contrôlez comment et quand vous recevez des notifications"
            >
              {/* Toggles */}
              {notificationToggles.map((toggle) => (
                <ToggleItem
                  key={toggle.id}
                  id={toggle.id}
                  title={toggle.title}
                  description={toggle.description}
                  checked={formData[toggle.id]}
                  onChange={() =>
                    handleInputChange(toggle.id, !formData[toggle.id])
                  }
                />
              ))}

              {/* Sélecteurs */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <FormSelect
                  label="Fréquence des notifications"
                  value={formData.frequenceNotifications}
                  onChange={(value) =>
                    handleInputChange("frequenceNotifications", value)
                  }
                  options={[
                    "Immédiatement",
                    "Quotidiennement",
                    "Hebdomadairement",
                  ]}
                />
                <FormSelect
                  label="Plage horaire"
                  value={formData.plageHoraire}
                  onChange={(value) => handleInputChange("plageHoraire", value)}
                  options={[
                    "Toute la journée",
                    "Heures de bureau (9h-17h)",
                    "Personnalisée",
                  ]}
                />
              </div>
            </SettingsSection>
          )}

          {/* Section Sécurité */}
          {activeSection === "securite" && (
            <SettingsSection
              title="Sécurité du compte"
              description="Gérez la sécurité de votre compte et vos préférences de connexion"
            >
              {/* Changement mot de passe */}
              <div className="mb-6">
                <label className="block text-secondary text-sm font-medium mb-3">
                  Changer le mot de passe
                </label>
                <div className="grid grid-cols-1 gap-3">
                  <FormInput
                    type="password"
                    value={formData.ancienMotDePasse}
                    onChange={(value) =>
                      handleInputChange("ancienMotDePasse", value)
                    }
                    placeholder="Ancien mot de passe"
                  />
                  <FormInput
                    type="password"
                    value={formData.nouveauMotDePasse}
                    onChange={(value) =>
                      handleInputChange("nouveauMotDePasse", value)
                    }
                    placeholder="Nouveau mot de passe"
                  />
                  <FormInput
                    type="password"
                    value={formData.confirmerMotDePasse}
                    onChange={(value) =>
                      handleInputChange("confirmerMotDePasse", value)
                    }
                    placeholder="Confirmer le nouveau mot de passe"
                  />
                </div>
              </div>

              {/* 2FA */}
              <ToggleItem
                id="auth2fa"
                title="Authentification à deux facteurs"
                description="Ajoutez une couche de sécurité supplémentaire à votre compte"
                checked={formData.auth2fa}
                onChange={() => handleInputChange("auth2fa", !formData.auth2fa)}
              />

              {/* Sessions actives */}
              <div className="mt-6">
                <label className="block text-secondary text-sm font-medium mb-3">
                  Sessions actives
                </label>
                <div className="space-y-3">
                  {sessionsActives.map((session, index) => (
                    <SessionItem
                      key={index}
                      session={session}
                      onDisconnect={() =>
                        console.log(`Déconnexion session ${index}`)
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Actions supplémentaires */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button className="bg-light text-primary border border-light-gray rounded-lg px-4 py-3 text-sm font-medium hover:bg-light-gray transition-colors text-left">
                  Voir l'historique complet
                </button>
                <button className="bg-light text-primary border border-light-gray rounded-lg px-4 py-3 text-sm font-medium hover:bg-light-gray transition-colors text-left">
                  Exporter mes données
                </button>
              </div>
            </SettingsSection>
          )}

          {/* Section Préférences */}
          {activeSection === "preferences" && (
            <SettingsSection
              title="Préférences générales"
              description="Personnalisez votre expérience utilisateur"
            >
              <div className="grid grid-cols-2 gap-4 mb-4">
                <FormSelect
                  label="Langue"
                  value={formData.langue}
                  onChange={(value) => handleInputChange("langue", value)}
                  options={["Français", "English", "Dansk", "Kalaallisut"]}
                />
                <FormSelect
                  label="Fuseau horaire"
                  value={formData.fuseauHoraire}
                  onChange={(value) =>
                    handleInputChange("fuseauHoraire", value)
                  }
                  options={[
                    "UTC-3 (Nuuk)",
                    "UTC-2 (Danmarkshavn)",
                    "UTC-1 (Ittoqqortoormiit)",
                    "UTC+0 (London)",
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <FormSelect
                  label="Format de date"
                  value={formData.formatDate}
                  onChange={(value) => handleInputChange("formatDate", value)}
                  options={["JJ/MM/AAAA", "MM/JJ/AAAA", "AAAA-MM-JJ"]}
                />
                <FormSelect
                  label="Format d'heure"
                  value={formData.formatHeure}
                  onChange={(value) => handleInputChange("formatHeure", value)}
                  options={["24 heures", "12 heures"]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <FormSelect
                  label="Éléments par page"
                  value={formData.elementsParPage}
                  onChange={(value) =>
                    handleInputChange("elementsParPage", value)
                  }
                  options={[
                    "10 éléments",
                    "25 éléments",
                    "50 éléments",
                    "100 éléments",
                  ]}
                />
                <FormSelect
                  label="Tri par défaut"
                  value={formData.triDefaut}
                  onChange={(value) => handleInputChange("triDefaut", value)}
                  options={[
                    "Date (plus récent)",
                    "Date (plus ancien)",
                    "Nom (A-Z)",
                    "Nom (Z-A)",
                    "Statut",
                  ]}
                />
              </div>

              <div>
                <label className="block text-secondary text-sm font-medium mb-2">
                  Raccourcis clavier
                </label>
                <button className="bg-light text-primary border border-light-gray rounded-lg px-4 py-3 text-sm font-medium hover:bg-light-gray transition-colors">
                  Personnaliser les raccourcis
                </button>
              </div>
            </SettingsSection>
          )}

          {/* Section Apparence */}
          {activeSection === "apparence" && (
            <SettingsSection
              title="Apparence"
              description="Personnalisez l'apparence de l'application"
            >
              {/* Thème */}
              <div className="mb-6">
                <label className="block text-secondary text-sm font-medium mb-3">
                  Thème
                </label>
                <div className="flex gap-5">
                  {themeOptions.map((theme) => (
                    <ThemeOption
                      key={theme.id}
                      theme={theme}
                      isSelected={formData.theme === theme.id}
                      onSelect={(themeId) =>
                        handleInputChange("theme", themeId)
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <FormSelect
                  label="Densité d'affichage"
                  value={formData.densiteAffichage}
                  onChange={(value) =>
                    handleInputChange("densiteAffichage", value)
                  }
                  options={["Confortable", "Compact", "Spacieux"]}
                />
                <FormSelect
                  label="Taille de police"
                  value={formData.taillePolice}
                  onChange={(value) => handleInputChange("taillePolice", value)}
                  options={["Petite", "Moyenne", "Grande"]}
                />
              </div>

              {/* Couleur d'accent */}
              <div className="mb-6">
                <label className="block text-secondary text-sm font-medium mb-3">
                  Couleur d'accent
                </label>
                <div className="flex gap-3">
                  {colorOptions.map((colorOption, index) => (
                    <ColorOption
                      key={index}
                      colorOption={colorOption}
                      isSelected={formData.couleurAccent === colorOption.color}
                      onSelect={(color) =>
                        handleInputChange("couleurAccent", color)
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Aperçu */}
              {/* <div>
                <label className="block text-secondary text-sm font-medium mb-3">
                  Aperçu
                </label>
                <div className="border border-light-gray rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-center p-3 bg-light rounded-lg mb-3">
                    <div className="text-primary font-semibold">TAG</div>
                    <div className="w-7 h-7 rounded-full bg-primary-light text-white flex items-center justify-center text-xs font-semibold">
                      B
                    </div>
                  </div>
                  <div className="w-24 p-3 bg-light rounded-lg mb-3">
                    <div className="p-2 mb-1 rounded bg-primary-light text-white text-xs">
                      Tableau de bord
                    </div>
                    <div className="p-2 mb-1 rounded text-xs">Dossiers</div>
                    <div className="p-2 rounded text-xs">Messagerie</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-14 bg-light rounded-lg"></div>
                    <div className="h-14 bg-light rounded-lg"></div>
                  </div>
                </div>
              </div> */}
            </SettingsSection>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-3 justify-end">
            <button className="bg-light text-primary border border-light-gray rounded-lg px-6 py-3 font-medium hover:bg-light-gray transition-colors">
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="bg-primary text-white rounded-lg px-6 py-3 font-medium hover:bg-primary-light transition-colors"
            >
              Enregistrer les modifications
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
