import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(email, password);

    if (result.success) {
      // Redirection vers le dashboard après connexion réussie
      navigate("/dashboard");
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-light font-sans p-6">
      <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-md text-center">
        <h2 className="text-primary text-2xl font-semibold mb-8">
          Connexion à l'application TAG
        </h2>

        {error && (
          <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded mb-5 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div>
            <label
              htmlFor="email"
              className="block text-secondary text-sm font-medium mb-2"
            >
              Courriel
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-light-gray rounded-lg text-base transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              placeholder="votre@courriel.gl"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-secondary text-sm font-medium mb-2"
            >
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-light-gray rounded-lg text-base transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              placeholder="Votre mot de passe"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white rounded-lg py-3 font-semibold text-base hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Connexion"}
          </button>
        </form>

        <div className="mt-8 text-sm text-center">
          <Link
            to="/forgot-password"
            className="text-primary hover:text-primary-light hover:underline transition-colors"
          >
            Mot de passe oublié ?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
