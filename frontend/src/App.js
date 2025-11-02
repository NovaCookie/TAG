import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SidebarProvider } from "./context/SidebarContext";

// === Main Pages ===
import LoginForm from "./components/LoginForm";
import Dashboard from "./components/Dashboard";
import AdvancedStats from "./components/stats/AdvancedStats";
import Interventions from "./components/Interventions";
import Users from "./components/Users";
import Communes from "./components/Communes";
import Settings from "./components/Settings";
import Support from "./components/Support";

// === Auth Pages ===
import PasswordForgot from "./components/auth/PasswordForgot";
import PasswordReset from "./components/auth/PasswordReset";

// === Intervention Pages ===
import InterventionDetail from "./components/interventions/InterventionDetail";
import ReplyIntervention from "./components/interventions/ReplyIntervention";
import NewIntervention from "./components/interventions/NewIntervention";

// === User Pages ===
import NewUser from "./components/users/NewUser";
import EditUser from "./components/users/EditUser";

// ===================================================================
// 🔒 Custom Route Wrappers
// ===================================================================
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen message="Loading..." />;
  return user ? children : <Navigate to="/auth/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen message="Loading..." />;
  return user ? <Navigate to="/dashboard" /> : children;
};

const AuthRoute = ({ children }) => {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen message="Loading..." />;
  return children;
};

// ===================================================================
// ⏳ Loading Screen
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
// 🚀 Main Application
// ===================================================================
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SidebarProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* === Authentication === */}
                <Route
                  path="/auth/login"
                  element={
                    <PublicRoute>
                      <LoginForm />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/auth/forgot-password"
                  element={
                    <AuthRoute>
                      <PasswordForgot />
                    </AuthRoute>
                  }
                />
                <Route
                  path="/auth/reset-password"
                  element={
                    <AuthRoute>
                      <PasswordReset />
                    </AuthRoute>
                  }
                />

                {/* === Dashboard & Main Sections === */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/advanced"
                  element={
                    <ProtectedRoute>
                      <AdvancedStats />
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
                  path="/interventions/:id"
                  element={
                    <ProtectedRoute>
                      <InterventionDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/interventions/:id/reply"
                  element={
                    <ProtectedRoute>
                      <ReplyIntervention />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/interventions/new"
                  element={
                    <ProtectedRoute>
                      <NewIntervention />
                    </ProtectedRoute>
                  }
                />

                {/* === User Management === */}
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute>
                      <Users />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users/new"
                  element={
                    <ProtectedRoute>
                      <NewUser />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users/edit/:id"
                  element={
                    <ProtectedRoute>
                      <EditUser />
                    </ProtectedRoute>
                  }
                />

                {/* === Communes === */}
                <Route
                  path="/communes"
                  element={
                    <ProtectedRoute>
                      <Communes />
                    </ProtectedRoute>
                  }
                />

                {/* === Settings & Support === */}
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

                {/* === Default Redirects === */}
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
