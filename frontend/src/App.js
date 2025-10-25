import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SidebarProvider } from "./context/SidebarContext";

// === Pages principales ===
import LoginForm from "./components/LoginForm";
import Dashboard from "./components/Dashboard";
import Interventions from "./components/Interventions";
import Users from "./components/Users";
import Communes from "./components/Communes";
import Settings from "./components/Settings";
import Support from "./components/Support";

// === Pages d'authentification ===
import PasswordForgot from "./components/auth/PasswordForgot";
import PasswordReset from "./components/auth/PasswordReset";

// === Pages interventions ===
import InterventionDetail from "./components/interventions/InterventionDetail";
import RepondreIntervention from "./components/interventions/RepondreIntervention";
import NouvelleIntervention from "./components/interventions/NouvelleIntervention";

// ===================================================================
// 🔒 ROUTES PERSONNALISÉES
// ===================================================================

// Route protégée : accessible uniquement si connecté
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Chargement..." />;
  }

  return user ? children : <Navigate to="/login" />;
};

// Route publique : redirige vers le tableau de bord si déjà connecté
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Chargement..." />;
  }

  return user ? <Navigate to="/dashboard" /> : children;
};

// Route d’auth uniquement (accessible même si connecté)
const AuthRoute = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Chargement..." />;
  }

  return children;
};

// ===================================================================
// ⏳ ÉCRAN DE CHARGEMENT
// ===================================================================
const LoadingScreen = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center bg-light dark:bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="mt-4 text-secondary dark:text-gray-400">{message}</p>
    </div>
  </div>
);

// ===================================================================
// 🚀 APPLICATION PRINCIPALE
// ===================================================================
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SidebarProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* === Authentification === */}
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

                {/* === Tableau de bord & sections principales === */}
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
                  path="/users"
                  element={
                    <ProtectedRoute>
                      <Users />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/communes"
                  element={
                    <ProtectedRoute>
                      <Communes />
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

                {/* === Gestion des interventions === */}
                <Route
                  path="/interventions/:id"
                  element={
                    <ProtectedRoute>
                      <InterventionDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/interventions/:id/repondre"
                  element={
                    <ProtectedRoute>
                      <RepondreIntervention />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/nouvelle-intervention"
                  element={
                    <ProtectedRoute>
                      <NouvelleIntervention />
                    </ProtectedRoute>
                  }
                />

                {/* === Routes par défaut === */}
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </div>
          </Router>
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
