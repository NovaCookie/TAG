import { createContext, useState, useContext, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        const userObj = JSON.parse(userData);
        setUser(userObj);
      } catch (err) {
        console.error("Erreur vérification auth:", err);
        logout();
      }
    }
    setLoading(false);
  };

  const updateUser = (updatedData) => {
    setUser((prevUser) => {
      if (!prevUser) return prevUser;

      const newUser = {
        ...prevUser,
        ...updatedData,
      };

      localStorage.setItem("user", JSON.stringify(newUser));
      return newUser;
    });
  };

  const login = async (email, password) => {
    try {
      setError(null);

      const response = await authAPI.login({
        email,
        mot_de_passe: password,
      });

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      return { success: true };
    } catch (error) {
      console.error("Erreur connexion:", error.response?.data);

      const errorMessage = error.response?.data?.error || "Erreur de connexion";
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
        status: error.response?.status,
      };
    }
  };

  const logout = (message = null) => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setError(message);

    setTimeout(() => {
      window.location.href = "/auth/login";
    }, 100);
  };

  const clearError = () => setError(null);

  const value = {
    user,
    login,
    logout,
    loading,
    error,
    clearError,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
