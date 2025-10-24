import api from "./api.js";

export const uploadDocument = (formData, onProgress) =>
  api.post("/estimator/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress,
  });
export const processEstimate = (id) => api.post(`/estimator/process/${id}`);
export const getEstimate = (id) => api.get(`/estimator/${id}`);
export const getEstimates = (params) => api.get("/estimator", { params });
export const generateReport = (id) => api.post(`/estimator/report/${id}`, {});
