import express from "express";
import {
  uploadDocument,
  processDocument,
  getEstimate,
  getAllEstimates,
  generateReport,
} from "../controllers/estimator.controller.js";

const router = express.Router();

router.post("/upload", uploadDocument);

router.post("/process/:estimateId", processDocument);

router.get("/:estimateId", getEstimate);

router.get("/", getAllEstimates);

router.post("/report/:estimateId", generateReport);

export default router;
