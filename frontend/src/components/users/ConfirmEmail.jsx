import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { usersAPI } from "../../services/api";

const ConfirmEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Token de confirmation manquant");
      return;
    }

    const confirmEmail = async () => {
      try {
        const response = await usersAPI.confirmEmail(token);
        setStatus("success");
        setMessage(response.data.message || "Email confirmé avec succès");
      } catch (error) {
        setStatus("error");
        setMessage(
          error.response?.data?.error ||
            "Erreur lors de la confirmation de l'email"
        );
      }
    };

    confirmEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        {status === "loading" && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Confirmation de l'email en cours...</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="text-success-500 text-4xl mb-4">✓</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Email confirmé !
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate("/login")}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-light transition-colors"
            >
              Se connecter
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="text-danger-500 text-4xl mb-4">✗</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Erreur</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate("/")}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-light transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmEmail;
