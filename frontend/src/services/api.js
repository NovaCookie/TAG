import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Configuration axios avec intercepteur pour le token
const api = axios.create({
  baseURL: API_URL,
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  PasswordForgot: (data) => api.post("/auth/forgot-password", data),
  resetPassword: (data) => api.post("/auth/reset-password", data),
};

export const interventionsAPI = {
  getAll: (params) => api.get("/interventions", { params }),
  getById: (id) => api.get(`/interventions/${id}`),
  create: (data) => api.post("/interventions", data),
  addResponse: (id, data) => api.put(`/interventions/${id}/reponse`, data),
  addSatisfaction: (id, satisfaction) =>
    api.put(`/interventions/${id}/satisfaction`, { satisfaction }),
  getStats: () => api.get("/interventions/stats/dashboard"),
  getSimilarQuestions: (themeId, keywords) =>
    api.get(`/interventions/theme/${themeId}/similaires`, {
      params: { keywords },
    }),
};

export const themesAPI = {
  getAll: () => api.get("/themes"),
  create: (data) => api.post("/themes", data),
};

export const usersAPI = {
  getStats: () => api.get("/users/stats"),
};

export default api;
