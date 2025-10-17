import React, { useState } from "react";
import { Link } from "react-router-dom";

const PasswordReset = () => {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear errors when user starts typing
    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.newPassword || !formData.confirmPassword) {
      setError("Veuillez remplir tous les champs");
      return false;
    }

    if (formData.newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Simulation d'appel API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // await api.resetPassword(formData.newPassword);

      setSuccess(true);
      setFormData({ newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError("Une erreur est survenue lors de la réinitialisation");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light font-sans p-6">
        <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center text-2xl mb-6 mx-auto">
            ✓
          </div>
          <h2 className="text-primary text-2xl font-semibold mb-4">
            Mot de passe réinitialisé !
          </h2>
          <p className="text-secondary-light mb-8 leading-relaxed">
            Votre mot de passe a été réinitialisé avec succès. Vous pouvez
            maintenant vous connecter avec votre nouveau mot de passe.
          </p>
          <Link
            to="/login"
            className="bg-primary text-white rounded-lg px-6 py-3 font-semibold text-base hover:bg-primary-light transition-colors inline-block w-full"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-light font-sans p-6">
      <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-primary text-2xl font-semibold mb-2">
            Réinitialisation
          </h2>
          <p className="text-secondary-light text-sm">
            Créez votre nouveau mot de passe
          </p>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="newPassword"
              className="block text-secondary text-sm font-medium mb-2"
            >
              Nouveau mot de passe
            </label>
            <input
              type="password"
              id="newPassword"
              value={formData.newPassword}
              onChange={(e) => handleInputChange("newPassword", e.target.value)}
              className="w-full px-4 py-3 border border-light-gray rounded-lg text-base transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              placeholder="Nouveau mot de passe"
              required
              minLength="8"
            />
            <div className="text-xs text-secondary-light mt-2">
              Minimum 8 caractères
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-secondary text-sm font-medium mb-2"
            >
              Confirmer votre nouveau mot de passe
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) =>
                handleInputChange("confirmPassword", e.target.value)
              }
              className="w-full px-4 py-3 border border-light-gray rounded-lg text-base transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              placeholder="Confirmer votre nouveau mot de passe"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white rounded-lg py-3 font-semibold text-base hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Réinitialisation..." : "Confirmer"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="text-primary hover:text-primary-light hover:underline transition-colors text-sm"
          >
            ← Retour à l'authentification
          </Link>
        </div>

        {/* Password Strength Indicator */}
        {formData.newPassword && (
          <div className="mt-4 p-4 bg-light rounded-lg">
            <div className="text-sm text-secondary mb-2">
              Force du mot de passe :
            </div>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`flex-1 h-2 rounded-full ${
                    formData.newPassword.length >= level * 2
                      ? level <= 2
                        ? "bg-danger"
                        : level === 3
                        ? "bg-warning"
                        : "bg-success"
                      : "bg-light-gray"
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-secondary-light">
              {formData.newPassword.length < 4 && "Très faible"}
              {formData.newPassword.length >= 4 &&
                formData.newPassword.length < 6 &&
                "Faible"}
              {formData.newPassword.length >= 6 &&
                formData.newPassword.length < 8 &&
                "Moyen"}
              {formData.newPassword.length >= 8 && "Fort"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordReset;
