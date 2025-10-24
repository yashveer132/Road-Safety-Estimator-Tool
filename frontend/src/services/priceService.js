import api from "./api.js";

export const searchPrices = (params) => api.get("/prices/search", { params });
export const getCachedPrices = (params) =>
  api.get("/prices/cached", { params });
export const fetchLatestPrices = (data) => api.post("/prices/fetch", data);
export const updatePrices = (data) => api.put("/prices/update", data);
