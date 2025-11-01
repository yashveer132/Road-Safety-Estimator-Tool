import { Router } from "express";
import {
  getInterventions,
  getCandidates,
  createRecommendations,
  getRecommendationHistory,
  getRecommendationDetail,
  updateRecommendationStatus,
  deleteRecommendation,
} from "../controllers/intervention.controller.js";

const router = Router();

router.get("/", getInterventions);
router.get("/candidates", getCandidates);

router.post("/recommendations", createRecommendations);
router.get("/history", getRecommendationHistory);
router.get("/history/:id", getRecommendationDetail);
router.patch("/history/:id", updateRecommendationStatus);
router.delete("/history/:id", deleteRecommendation);

export default router;
