import api from "./api.js";

export const searchPrices = (params) => api.get("/prices/search", { params });

export const getCachedPrices = (params) =>
  api.get("/prices/cached", { params });

export const fetchLatestPrices = (data) => api.post("/prices/fetch", data);

export const updatePrices = (data) => api.put("/prices/update", data);

export const getPriceStats = (params) => api.get("/prices/stats", { params });

export const deletePrice = (id) => api.delete(`/prices/${id}`);

export const addPrice = (data) => api.post("/prices/add", data);

export const getRecentUpdates = (params) =>
  api.get("/prices/recent", { params });

export const exportPrices = (prices) => {
  const headers = [
    "Item Name",
    "Category",
    "Unit Price",
    "Unit",
    "Source",
    "Created At",
    "Last Updated",
    "IRC Reference",
  ];

  const rows = prices.map((item) => [
    item.itemName,
    item.category,
    item.unitPrice,
    item.unit,
    item.source,
    new Date(item.createdAt).toLocaleString("en-IN"),
    new Date(item.lastVerified).toLocaleString("en-IN"),
    item.ircReference?.join("; ") || "N/A",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) =>
          typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell
        )
        .join(",")
    ),
  ].join("\n");

  return csvContent;
};
