import api from "./api";

export const fetchInterventions = async (params = {}) => {
  const response = await api.get("/interventions", { params });
  return response.data;
};

export const fetchCandidates = async (params = {}) => {
  const response = await api.get("/interventions/candidates", { params });
  return response.data;
};

export const generateRecommendations = async (payload) => {
  const response = await api.post("/interventions/recommendations", payload);
  return response.data;
};

export const fetchRecommendationHistory = async (params = {}) => {
  const response = await api.get("/interventions/history", { params });
  return response.data;
};

export const fetchRecommendationDetail = async (id) => {
  const response = await api.get(`/interventions/history/${id}`);
  return response.data;
};

export const updateRecommendationStatus = async (id, updateData) => {
  const response = await api.patch(`/interventions/history/${id}`, updateData);
  return response.data;
};

export const deleteRecommendation = async (id) => {
  const response = await api.delete(`/interventions/history/${id}`);
  return response.data;
};

export default {
  fetchInterventions,
  fetchCandidates,
  generateRecommendations,
  fetchRecommendationHistory,
  fetchRecommendationDetail,
  updateRecommendationStatus,
  deleteRecommendation,
};
