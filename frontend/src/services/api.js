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

// === Auth ===
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  resetPassword: (data) => api.post("/auth/reset-password", data),
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

  getStats: () => api.get("/interventions/stats/dashboard"),

  getSimilarQuestions: (themeId, keywords) =>
    api.get(`/interventions/theme/${themeId}/similar`, { params: { keywords } }),

  uploadAttachments: (interventionId, formData) =>
    api.post(`/interventions/${interventionId}/attachments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  downloadAttachment: (attachmentId) =>
    api.get(`/interventions/attachments/${attachmentId}`, {
      responseType: "blob",
    }),
};

// === Themes ===
export const themesAPI = {
  getAll: () => api.get("/themes"),
  create: (data) => api.post("/themes", data),
};

// === Users ===
export const usersAPI = {
  getAll: (params) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post("/users", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
  getCommunesList: () => api.get("/users/communes/list"),
  updateInfos: (id, data) => api.put(`/users/${id}/infos`, data),
  updateEmail: (id, data) => api.put(`/users/${id}/email`, data),
  updatePassword: (id, data) => api.put(`/users/${id}/password`, data),
  getStats: () => api.get("/users/stats"),
};

// === Communes ===
export const communesAPI = {
  getAll: (params) => api.get("/communes", { params }),
  getById: (id) => api.get(`/communes/${id}`),
  create: (data) => api.post("/communes", data),
  update: (id, data) => api.put(`/communes/${id}`, data),
  toggleStatus: (id) => api.patch(`/communes/${id}/toggle-status`),
  getStats: () => api.get("/communes/stats/global"),
};
