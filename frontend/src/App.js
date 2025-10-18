import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext"; // ← Nouvel import
import LoginForm from "./components/LoginForm";
import Dashboard from "./components/Dashboard";
import Interventions from "./components/Interventions";
import Messaging from "./components/Messaging";
import Users from "./components/Users";
import Settings from "./components/Settings";
import Support from "./components/Support";
import PasswordForgot from "./components/auth/PasswordForgot";
import PasswordReset from "./components/auth/PasswordReset";
import NouvelleIntervention from "./components/NouvelleIntervention";

// Composant pour protéger les routes
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-secondary dark:text-gray-400">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

// Route publique (redirige vers dashboard si déjà connecté)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-secondary dark:text-gray-400">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" /> : children;
};

// Route d'authentification uniquement (pas de redirection si connecté)
const AuthRoute = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-secondary dark:text-gray-400">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Routes d'authentification (accessibles même si connecté) */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginForm />
                  </PublicRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <AuthRoute>
                    <PasswordForgot />
                  </AuthRoute>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <AuthRoute>
                    <PasswordReset />
                  </AuthRoute>
                }
              />

              {/* Routes protégées */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interventions"
                element={
                  <ProtectedRoute>
                    <Interventions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messaging"
                element={
                  <ProtectedRoute>
                    <Messaging />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/support"
                element={
                  <ProtectedRoute>
                    <Support />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/nouvelle-intervention"
                element={<NouvelleIntervention />}
              />

              {/* Routes de navigation */}
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
