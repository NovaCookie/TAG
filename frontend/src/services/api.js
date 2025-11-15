import axios from "axios";

const API_URL = "http://localhost:5000/api";

// === Axios Global Config ===
const api = axios.create({
  baseURL: API_URL,
});

// === Add JWT Token Automatically ===
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// === INTERCEPTEUR RÉPONSE - Gestion erreurs globales ===
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "Erreur API interceptée:",
      error.response?.status,
      error.response?.data
    );

    // Si erreur 410 (Compte archivé) - Déconnecter immédiatement
    if (error.response?.status === 410) {
      // Nettoyer le storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Rediriger vers login avec message
      if (window.location.pathname !== "/auth/login") {
        window.location.href = "/auth/login?error=archived";
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/auth/login") {
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  }
);

// === Auth ===
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  resetPassword: (data) => api.post("/auth/reset-password", data),
};

// === Stats ===
export const statsAPI = {
  getGlobal: () => api.get("/stats/global"),
  getUsers: () => api.get("/stats/utilisateurs"),
  getCommunes: () => api.get("/stats/communes"),
  getThemes: () => api.get("/stats/themes"),
  getAdvanced: (filters = {}) =>
    api.get("/stats/advanced", { params: filters }),
  getDashboard: () => api.get("/stats/dashboard"),
};

// === Interventions ===
export const interventionsAPI = {
  getAll: (params) => api.get("/interventions", { params }),
  getById: (id) => api.get(`/interventions/${id}`),
  create: (data) => api.post("/interventions", data),
  addResponse: (id, data) => api.put(`/interventions/${id}/response`, data),
  delete: (id) => api.delete(`/interventions/${id}`),
  rateSatisfaction: (id, satisfaction) =>
    api.put(`/interventions/${id}/satisfaction`, { satisfaction }),
  getArchives: (params) => api.get("/interventions/archives/list", { params }),
  downloadPieceJointe: (pieceId) =>
    api.get(`/interventions/pieces-jointes/${pieceId}/download`, {
      responseType: "blob",
    }),

  previewPieceJointe: (pieceId) =>
    api.get(`/interventions/pieces-jointes/${pieceId}/preview`, {
      responseType: "blob",
    }),

  uploadPiecesJointes: (interventionId, formData) =>
    api.post(`/interventions/${interventionId}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  getPiecesJointes: (interventionId) =>
    api.get(`/interventions/${interventionId}/pieces-jointes`),
};

// === Archives ===
export const archivesAPI = {
  getAll: (params) => api.get("/archives", { params }),
  archiveEntity: (table, id, raison) =>
    api.post(`/archives/${table}/${id}`, { raison }),
  restoreEntity: (table, id) => api.delete(`/archives/${table}/${id}`),
  checkStatus: (table, id) => api.get(`/archives/${table}/${id}/status`),
  getStats: () => api.get("/archives/stats/global"),
  getCommuneArchives: (params) =>
    api.get("/archives", { params: { ...params, table_name: "communes" } }),
  getUserArchives: (params) =>
    api.get("/archives", { params: { ...params, table_name: "utilisateurs" } }),
  getInterventionArchives: (params) =>
    api.get("/archives", {
      params: { ...params, table_name: "interventions" },
    }),
};

// === Users ===
export const usersAPI = {
  getAll: (params) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post("/users", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  updateInfos: (id, data) => api.put(`/users/${id}/infos`, data),
  updateEmail: (id, data) => api.put(`/users/${id}/email`, data),
  updatePassword: (id, data) => api.put(`/users/${id}/password`, data),
  getCommunesList: () => api.get("/users/communes/list"),
  confirmEmail: (token) => api.get(`/users/confirm-email/${token}`),
};

// === Communes ===
export const communesAPI = {
  getAll: (params) => api.get("/communes", { params }),
  getById: (id) => api.get(`/communes/${id}`),
  create: (data) => api.post("/communes", data),
  update: (id, data) => api.put(`/communes/${id}`, data),
  delete: (id) => api.delete(`/communes/${id}`),
  getUsersList: () => api.get("/communes/users/communes/list"),
};

// === Themes ===
export const themesAPI = {
  getAll: () => api.get("/themes"),
  getAllIncludingInactive: () => api.get("/themes/all"),
  getById: (id) => api.get(`/themes/${id}`),
  create: (data) => api.post("/themes", data),
  update: (id, data) => api.put(`/themes/${id}`, data),
  delete: (id) => api.delete(`/themes/${id}`),
};

export const retentionAPI = {
  getByTheme: (themeId) => api.get(`/retention-policies/theme/${themeId}`),
  create: (data) => api.post("/retention-policies", data),
  update: (id, data) => api.put(`/retention-policies/${id}`, data),
  delete: (id) => api.delete(`/retention-policies/${id}`),
};

export const suggestionsAPI = {
  getSimilar: (interventionId, limit) =>
    api.get(`/suggestions/interventions/${interventionId}/similar`, {
      params: { limit },
    }),
  getSimilarCount: (interventionId) =>
    api.get(`/suggestions/interventions/${interventionId}/similar/count`),
  getSimilarForNew: (data) =>
    api.post("/suggestions/interventions/similar", data),
};
export default api;
