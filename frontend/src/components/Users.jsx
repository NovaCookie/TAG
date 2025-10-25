import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import UserAvatar from "./common/UserAvatar";
import StatusBadge from "./common/StatusBadge";
import Pagination from "./common/Pagination";
import SearchFilter from "./common/SearchFilter";
import { getRoleColor } from "../utils/helpers";
import { usersAPI } from "../services/api";

// Composant Modal pour modifier les informations
const ModalModifierInfos = ({ utilisateur, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nom: utilisateur?.nom || "",
    prenom: utilisateur?.prenom || "",
  });
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur("");

    try {
      await usersAPI.updateInfos(utilisateur.id, formData);
      onSuccess("Informations mises à jour avec succès");
      onClose();
    } catch (error) {
      setErreur(
        error.response?.data?.error || "Erreur lors de la modification"
      );
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-primary mb-4">
          Modifier les informations
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Prénom *
            </label>
            <input
              type="text"
              value={formData.prenom}
              onChange={(e) =>
                setFormData({ ...formData, prenom: e.target.value })
              }
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
              value={formData.nom}
              onChange={(e) =>
                setFormData({ ...formData, nom: e.target.value })
              }
              className="w-full px-3 py-2 border border-light-gray rounded-lg focus:outline-none focus:border-primary"
              required
            />
          </div>

          {erreur && (
            <div className="bg-danger/10 text-danger p-3 rounded-lg text-sm">
              {erreur}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-light-gray text-secondary rounded-lg hover:bg-light-gray transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={chargement}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-50"
            >
              {chargement ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Composant Modal pour modifier l'email
const ModalModifierEmail = ({ utilisateur, onClose, onSuccess }) => {
  const [email, setEmail] = useState(utilisateur?.email || "");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur("");

    try {
      const response = await usersAPI.updateEmail(utilisateur.id, { email });

      if (response.data.requiresConfirmation) {
        onSuccess(
          "Email de confirmation envoyé. L'utilisateur doit confirmer sa nouvelle adresse."
        );
      } else {
        onSuccess("Email modifié avec succès");
      }
      onClose();
    } catch (error) {
      setErreur(
        error.response?.data?.error ||
          "Erreur lors de la modification de l'email"
      );
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-primary mb-4">
          Modifier l'email
        </h3>

        <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg mb-4">
          <p className="text-warning text-sm">
            ⚠️ Un email de confirmation sera envoyé à la nouvelle adresse. Le
            changement ne sera effectif qu'après confirmation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Nouvel email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-light-gray rounded-lg focus:outline-none focus:border-primary"
              required
            />
          </div>

          {erreur && (
            <div className="bg-danger/10 text-danger p-3 rounded-lg text-sm">
              {erreur}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-light-gray text-secondary rounded-lg hover:bg-light-gray transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={chargement}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-50"
            >
              {chargement ? "Envoi..." : "Envoyer la confirmation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Composant Modal pour modifier le mot de passe
const ModalModifierMotDePasse = ({ utilisateur, onClose, onSuccess }) => {
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [envoyerEmail, setEnvoyerEmail] = useState(true);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur("");

    if (motDePasse !== confirmation) {
      setErreur("Les mots de passe ne correspondent pas");
      setChargement(false);
      return;
    }

    try {
      await usersAPI.updatePassword(utilisateur.id, {
        nouveauMotDePasse: motDePasse,
        envoyerEmail: envoyerEmail,
      });

      const message = envoyerEmail
        ? "Mot de passe modifié et notification envoyée"
        : "Mot de passe modifié avec succès";

      onSuccess(message);
      onClose();
    } catch (error) {
      setErreur(
        error.response?.data?.error ||
          "Erreur lors de la modification du mot de passe"
      );
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-primary mb-4">
          Modifier le mot de passe
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Nouveau mot de passe *
            </label>
            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
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
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="w-full px-3 py-2 border border-light-gray rounded-lg focus:outline-none focus:border-primary"
              placeholder="Répétez le mot de passe"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="envoyerEmail"
              checked={envoyerEmail}
              onChange={(e) => setEnvoyerEmail(e.target.checked)}
              className="w-4 h-4 text-primary rounded focus:ring-primary"
            />
            <label
              htmlFor="envoyerEmail"
              className="ml-2 text-sm text-secondary"
            >
              Envoyer un email de notification à l'utilisateur
            </label>
          </div>

          {erreur && (
            <div className="bg-danger/10 text-danger p-3 rounded-lg text-sm">
              {erreur}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-light-gray text-secondary rounded-lg hover:bg-light-gray transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={chargement}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-50"
            >
              {chargement ? "Modification..." : "Modifier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    role: "all",
    status: "all",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  // États pour les modales
  const [modalOuvert, setModalOuvert] = useState(null);
  const [utilisateurSelectionne, setUtilisateurSelectionne] = useState(null);
  const [messageSucces, setMessageSucces] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchUsers = async () => {
    if (user?.role !== "admin") return;

    try {
      setChargement(true);

      const response = await usersAPI.getAll({
        page: pagination.page,
        limit: 10,
        search: filters.search !== "" ? filters.search : undefined,
        role: filters.role !== "all" ? filters.role : undefined,
        status:
          filters.status !== "all"
            ? filters.status === "online"
              ? "active"
              : "inactive"
            : undefined,
      });

      if (response.data) {
        setUsers(response.data.users);

        if (response.data.pagination) {
          setPagination((prev) => ({
            ...prev,
            page: response.data.pagination.page,
            totalPages: response.data.pagination.pages,
            total: response.data.pagination.total,
          }));
        }
      }
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
    } finally {
      setChargement(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleToggleStatus = async (userId) => {
    try {
      const response = await usersAPI.toggleStatus(userId);

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? {
                ...user,
                actif: !user.actif,
                status: !user.actif ? "online" : "offline",
              }
            : user
        )
      );

      setMessageSucces(response.data.message);
    } catch (error) {
      console.error("Erreur changement statut:", error);
    }
  };

  const ouvrirModal = (type, utilisateur) => {
    setUtilisateurSelectionne(utilisateur);
    setModalOuvert(type);
  };

  const fermerModal = () => {
    setModalOuvert(null);
    setUtilisateurSelectionne(null);
  };

  const handleSuccess = (message) => {
    setMessageSucces(message);
    fetchUsers(); // Recharger la liste
  };

  // Effacer le message de succès après 5 secondes
  useEffect(() => {
    if (messageSucces) {
      const timer = setTimeout(() => setMessageSucces(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [messageSucces]);

  const LigneUtilisateur = ({ utilisateur }) => (
    <div className="flex justify-between items-center py-5 border-b border-light-gray last:border-b-0 hover:bg-light/50 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <UserAvatar
          name={`${utilisateur.prenom} ${utilisateur.nom}`}
          avatar={utilisateur.avatar}
          online={utilisateur.status === "online"}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <div className="font-medium text-secondary truncate">
            {utilisateur.prenom} {utilisateur.nom}
          </div>
          <div className="text-sm text-secondary-light truncate">
            {utilisateur.email}
          </div>
          {utilisateur.commune && (
            <div className="text-xs text-primary-light truncate">
              {utilisateur.commune.nom}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mr-4">
        <StatusBadge
          status={utilisateur.role}
          className={getRoleColor(utilisateur.role)}
        />
        <StatusBadge status={utilisateur.status} />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleToggleStatus(utilisateur.id)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            utilisateur.actif
              ? "bg-warning/10 text-warning hover:bg-warning hover:text-white"
              : "bg-success/10 text-success hover:bg-success hover:text-white"
          }`}
          title={utilisateur.actif ? "Désactiver" : "Activer"}
        >
          {utilisateur.actif ? "⏸️" : "▶️"}
        </button>

        {/* Menu déroulant pour les modifications */}
        <div className="relative group">
          <button
            className="w-8 h-8 rounded-full bg-light text-primary flex items-center justify-center hover:bg-primary-light hover:text-white transition-colors"
            title="Modifier"
          >
            ✏️
          </button>

          {/* Menu déroulant */}
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-card border border-light-gray opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            <button
              onClick={() => ouvrirModal("infos", utilisateur)}
              className="w-full px-4 py-2 text-left text-sm text-secondary hover:bg-light-gray transition-colors rounded-t-lg"
            >
              📝 Modifier les informations
            </button>
            <button
              onClick={() => ouvrirModal("email", utilisateur)}
              className="w-full px-4 py-2 text-left text-sm text-secondary hover:bg-light-gray transition-colors"
            >
              📧 Modifier l'email
            </button>
            <button
              onClick={() => ouvrirModal("password", utilisateur)}
              className="w-full px-4 py-2 text-left text-sm text-secondary hover:bg-light-gray transition-colors rounded-b-lg"
            >
              🔒 Modifier le mot de passe
            </button>
          </div>
        </div>

        <button
          className="w-8 h-8 rounded-full bg-light text-primary flex items-center justify-center hover:bg-primary-light hover:text-white transition-colors"
          title="Voir détails"
        >
          👁️
        </button>
      </div>
    </div>
  );

  if (user?.role !== "admin") {
    return (
      <Layout activePage="users">
        <div className="card card-rounded p-6 text-center">
          <h2 className="text-xl font-semibold text-danger mb-4">
            Accès non autorisé
          </h2>
          <p className="text-tertiary">
            Seuls les administrateurs peuvent accéder à cette page.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activePage="users">
      {/* Message de succès */}
      {messageSucces && (
        <div className="bg-success/10 border border-success/20 text-success p-4 rounded-lg mb-6">
          {messageSucces}
        </div>
      )}

      {/* En-tête de page */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-primary mb-2">
            Utilisateurs
          </h1>
          <p className="text-secondary-light">
            {pagination.total} utilisateur{pagination.total !== 1 ? "s" : ""} au
            total
          </p>
        </div>
        <button className="bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors">
          Nouvel utilisateur
        </button>
      </div>

      {/* Filtres */}
      <SearchFilter
        filters={filters}
        onFilterChange={handleFilterChange}
        searchPlaceholder="Rechercher un utilisateur..."
        filterConfig={[
          {
            key: "role",
            options: [
              { value: "all", label: "Tous les rôles" },
              { value: "admin", label: "Administrateur" },
              { value: "juriste", label: "Juriste" },
              { value: "commune", label: "Commune" },
            ],
          },
          {
            key: "status",
            options: [
              { value: "all", label: "Tous les statuts" },
              { value: "online", label: "Actif" },
              { value: "offline", label: "Inactif" },
            ],
          },
        ]}
      />

      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-xl shadow-card p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-primary">
            Liste des utilisateurs
          </h2>
          <span className="text-sm text-secondary-light">
            Page {pagination.page} sur {pagination.totalPages}
          </span>
        </div>

        {chargement ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-tertiary">Chargement des utilisateurs...</p>
          </div>
        ) : (
          <div className="space-y-0">
            {users.map((utilisateur) => (
              <LigneUtilisateur
                key={utilisateur.id}
                utilisateur={utilisateur}
              />
            ))}

            {users.length === 0 && !chargement && (
              <div className="text-center py-12 text-secondary-light">
                {filters.search ||
                filters.role !== "all" ||
                filters.status !== "all"
                  ? "Aucun utilisateur trouvé avec ces critères"
                  : "Aucun utilisateur dans la base de données"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
      />

      {/* Modales */}
      {modalOuvert === "infos" && (
        <ModalModifierInfos
          utilisateur={utilisateurSelectionne}
          onClose={fermerModal}
          onSuccess={handleSuccess}
        />
      )}

      {modalOuvert === "email" && (
        <ModalModifierEmail
          utilisateur={utilisateurSelectionne}
          onClose={fermerModal}
          onSuccess={handleSuccess}
        />
      )}

      {modalOuvert === "password" && (
        <ModalModifierMotDePasse
          utilisateur={utilisateurSelectionne}
          onClose={fermerModal}
          onSuccess={handleSuccess}
        />
      )}
    </Layout>
  );
};

export default Users;
