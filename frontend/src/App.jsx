import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Upload from "./pages/Upload.jsx";
import Estimates from "./pages/Estimates.jsx";
import EstimateDetails from "./pages/EstimateDetails.jsx";
import PriceManagement from "./pages/PriceManagement.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="upload" element={<Upload />} />
        <Route path="estimates" element={<Estimates />} />
        <Route path="estimates/:id" element={<EstimateDetails />} />
        <Route path="prices" element={<PriceManagement />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
