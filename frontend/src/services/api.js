import axios from "axios";

const API_URL = "http://localhost:5000/api";

/**
 * === Configuration globale d’Axios ===
 * L’instance `api` gère automatiquement :
 *  - la base URL de l’API
 *  - l’ajout du token JWT à chaque requête
 */
const api = axios.create({
  baseURL: API_URL,
});

// === Intercepteur : ajout automatique du token JWT ===
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// === Authentification ===

export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  resetPassword: (data) => api.post("/auth/reset-password", data),
};

// === Interventions (Questions / Réponses / Satisfaction) ===

export const interventionsAPI = {
  getAll: (params) => api.get("/interventions", { params }),
  getById: (id) => api.get(`/interventions/${id}`),
  create: (data) => api.post("/interventions", data),
  addResponse: (id, data) => api.put(`/interventions/${id}/reponse`, data),

  // Notation de satisfaction (1 à 5)
  rateSatisfaction: (id, satisfaction) =>
    api.put(`/interventions/${id}/satisfaction`, { satisfaction }),

  // Statistiques pour le tableau de bord
  getStats: () => api.get("/interventions/stats/dashboard"),

  // Recherche de questions similaires
  getSimilarQuestions: (themeId, keywords) =>
    api.get(`/interventions/theme/${themeId}/similaires`, {
      params: { keywords },
    }),

  // Gestion des pièces jointes
  uploadPiecesJointes: (interventionId, formData) =>
    api.post(`/interventions/${interventionId}/pieces-jointes`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  downloadPieceJointe: (pieceId) =>
    api.get(`/interventions/pieces-jointes/${pieceId}`, {
      responseType: "blob",
    }),
};

// === Thèmes ===

export const themesAPI = {
  getAll: () => api.get("/themes"),
  create: (data) => api.post("/themes", data),
};

// === Utilisateurs ===

export const usersAPI = {
  getAll: (params) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post("/users", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
  getStats: () => api.get("/users/stats"),
};

export default api;
