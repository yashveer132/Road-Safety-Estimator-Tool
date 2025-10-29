import express from "express";
import {
  searchPrices,
  updatePrices,
  getCachedPrices,
  fetchLatestPrices,
  getPriceStats,
  deletePrice,
  getRecentUpdates,
  addPrice,
} from "../controllers/price.controller.js";

const router = express.Router();

router.get("/search", searchPrices);
router.get("/stats", getPriceStats);
router.get("/cached", getCachedPrices);
router.get("/recent", getRecentUpdates);
router.post("/fetch", fetchLatestPrices);
router.post("/add", addPrice);
router.put("/update", updatePrices);
router.delete("/:id", deletePrice);

export default router;
