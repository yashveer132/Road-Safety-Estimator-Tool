import express from "express";
import {
  searchPrices,
  updatePrices,
  getCachedPrices,
  fetchLatestPrices,
} from "../controllers/price.controller.js";

const router = express.Router();

router.get("/search", searchPrices);

router.get("/cached", getCachedPrices);

router.post("/fetch", fetchLatestPrices);

router.put("/update", updatePrices);

export default router;
