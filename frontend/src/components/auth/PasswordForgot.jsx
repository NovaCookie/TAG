import { useState } from "react";
import { Link } from "react-router-dom";
import { authAPI } from "../../services/api";

const PasswordForgot = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Veuillez entrer votre adresse email");
      return;
    }

    setLoading(true);

    try {
      await authAPI.forgotPassword({ email });

      setSuccess(true);
    } catch (err) {
      setError("Une erreur est survenue lors de l'envoi de l'email");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light font-sans p-6">
        <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl mb-6 mx-auto">
            ✉️
          </div>
          <h2 className="text-primary text-2xl font-semibold mb-4">
            Email envoyé !
          </h2>
          <p className="text-secondary-light mb-6 leading-relaxed">
            Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.
            Vérifiez votre boîte de réception et suivez les instructions.
          </p>
          <div className="space-y-3">
            <Link
              to="/login"
              className="bg-primary text-white rounded-lg px-6 py-3 font-semibold text-base hover:bg-primary-light transition-colors inline-block w-full"
            >
              Retour à la connexion
            </Link>
            <button
              onClick={() => {
                setSuccess(false);
                setEmail("");
              }}
              className="bg-light text-primary border border-light-gray rounded-lg px-6 py-3 font-semibold text-base hover:bg-light-gray transition-colors w-full"
            >
              Renvoyer l'email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-light font-sans p-6">
      <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-primary text-2xl font-semibold mb-2">
            Mot de passe oublié ?
          </h2>
          <p className="text-secondary-light text-sm">
            Entrez votre email pour recevoir un lien de réinitialisation
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
              htmlFor="email"
              className="block text-secondary text-sm font-medium mb-2"
            >
              Adresse email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-light-gray rounded-lg text-base transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              placeholder="votre@email.gl"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white rounded-lg py-3 font-semibold text-base hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Envoi en cours..." : "Envoyer le lien"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="text-primary hover:text-primary-light hover:underline transition-colors text-sm"
          >
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PasswordForgot;
