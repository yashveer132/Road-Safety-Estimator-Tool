import express from "express";
import {
  getDashboardData,
  getAllMetrics,
  getKPISummary,
  getComparison,
  getPerformanceAnalytics,
  getRecentEstimates,
  getCategoryBreakdown,
  getCategoryDetails,
  getIRCDistribution,
} from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/data", getDashboardData);

router.get("/metrics/all", getAllMetrics);

router.get("/kpi", getKPISummary);

router.get("/comparison", getComparison);

router.get("/analytics/performance", getPerformanceAnalytics);

router.get("/estimates/recent", getRecentEstimates);

router.get("/breakdown/categories", getCategoryBreakdown);

router.get("/breakdown/category/:categoryName", getCategoryDetails);

router.get("/distribution/irc", getIRCDistribution);

export default router;
