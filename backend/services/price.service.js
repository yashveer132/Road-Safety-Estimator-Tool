import Price from "../models/Price.model.js";
import { scrapeCPWDPrices, scrapeGeMPrices } from "./scraper.service.js";
import { normalizeUnit } from "../utils/unit.js";
import {
  searchCPWDOffline,
  getCategoryFallback,
  sanitycheckPrice,
} from "./cpwd.service.js";
import { roundToDecimals } from "../utils/format.js";

const priceEstimateCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

const getCacheKey = (itemName, unit) =>
  `${itemName.toLowerCase().trim()}_${normalizeUnit(unit)}`;

const getCachedEstimate = (itemName, unit) => {
  const key = getCacheKey(itemName, unit);
  const cached = priceEstimateCache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`   📋 Using cached price for: ${itemName}`);
    return cached.data;
  }

  if (cached) {
    priceEstimateCache.delete(key);
  }

  return null;
};

const setCachedEstimate = (itemName, unit, data) => {
  const key = getCacheKey(itemName, unit);
  priceEstimateCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

export const searchWebPrices = async (itemName, unit) => {
  try {
    const normalizedUnit = normalizeUnit(unit);
    console.log(
      `🌐 Searching REAL web prices for: ${itemName} (${normalizedUnit})`
    );

    let existingPrice = await Price.findOne({
      itemName: new RegExp(`^${itemName}$`, "i"),
      unit: normalizedUnit,
      source: { $in: ["CPWD_SOR", "GeM"] },
      isActive: true,
    });

    if (existingPrice) {
      console.log(
        `   ✅ Found existing web price in database: ₹${existingPrice.unitPrice}`
      );
      return {
        unitPrice: existingPrice.unitPrice,
        source: existingPrice.source,
        sourceUrl: existingPrice.sourceUrl,
        confidence: "high",
      };
    }

    console.log(`   📊 Checking CPWD SOR...`);
    const cpwdPrices = await scrapeCPWDPrices([itemName]);
    const cpwdMatch = cpwdPrices.find(
      (price) =>
        (price.itemName
          .toLowerCase()
          .includes(itemName.toLowerCase().split(" ")[0]) ||
          itemName
            .toLowerCase()
            .includes(price.itemName.toLowerCase().split(" ")[0])) &&
        normalizeUnit(price.unit) === normalizedUnit
    );

    if (cpwdMatch) {
      console.log(
        `   ✅ Found CPWD price: ₹${cpwdMatch.unitPrice} per ${normalizedUnit}`
      );
      return {
        unitPrice: cpwdMatch.unitPrice,
        source: cpwdMatch.source,
        sourceUrl: cpwdMatch.sourceUrl,
        confidence: "high",
      };
    }

    console.log(`   🛒 Checking GeM portal...`);
    const gemPrices = await scrapeGeMPrices([itemName]);
    const gemMatch = gemPrices.find(
      (price) =>
        (price.itemName
          .toLowerCase()
          .includes(itemName.toLowerCase().split(" ")[0]) ||
          itemName
            .toLowerCase()
            .includes(price.itemName.toLowerCase().split(" ")[0])) &&
        normalizeUnit(price.unit) === normalizedUnit
    );

    if (gemMatch) {
      console.log(
        `   ✅ Found GeM price: ₹${gemMatch.unitPrice} per ${normalizedUnit}`
      );
      return {
        unitPrice: gemMatch.unitPrice,
        source: gemMatch.source,
        sourceUrl: gemMatch.sourceUrl,
        confidence: "high",
      };
    }

    console.log(`   ❌ No web prices found for: ${itemName}`);
    return null;
  } catch (error) {
    console.error("   ⚠️ Error searching web prices:", error.message);
    return null;
  }
};

export const searchPriceData = async (itemName, unit) => {
  try {
    const normalizedUnit = normalizeUnit(unit);

    let price = await Price.findOne({
      itemName: new RegExp(`^${itemName}$`, "i"),
      unit: normalizedUnit,
      isActive: true,
    }).sort({ lastVerified: -1 });

    if (price) {
      return price;
    }

    price = await Price.findOne({
      itemName: new RegExp(itemName, "i"),
      unit: normalizedUnit,
      isActive: true,
    }).sort({ lastVerified: -1 });

    if (price) {
      return price;
    }

    const prices = await Price.find({
      $text: { $search: itemName },
      isActive: true,
      unit: normalizedUnit,
    })
      .sort({ score: { $meta: "textScore" } })
      .limit(1);

    return prices.length > 0 ? prices[0] : null;
  } catch (error) {
    console.error("Error searching price data:", error);
    return null;
  }
};

export const estimatePriceIfNotFound = async (material) => {
  try {
    console.log(
      `💰 Finding price for: ${material.itemName} (${material.unit})`
    );

    const normalizedUnit = normalizeUnit(material.unit);

    const cachedResult = getCachedEstimate(material.itemName, material.unit);
    if (cachedResult) {
      return cachedResult;
    }

    console.log(`   📚 Checking offline CPWD SOR cache...`);
    const offlineMatch = searchCPWDOffline(material.itemName, material.unit);
    if (offlineMatch) {
      const sanitized = sanitycheckPrice(
        offlineMatch.unitPrice,
        material.unit,
        material.itemName
      );

      const result = {
        unitPrice: roundToDecimals(sanitized.price, 2),
        source: offlineMatch.source,
        itemId: offlineMatch.itemId,
        year: offlineMatch.year,
        sourceUrl: offlineMatch.sourceUrl,
        confidence: sanitized.isValid ? offlineMatch.confidence : "medium",
        specification: offlineMatch.specification,
      };

      setCachedEstimate(material.itemName, material.unit, result);

      try {
        const newPrice = new Price({
          itemName: material.itemName,
          itemCode: offlineMatch.itemId || `CPWD-${Date.now()}`,
          category: "road_safety",
          unitPrice: result.unitPrice,
          unit: normalizedUnit,
          currency: "₹",
          source: result.source,
          sourceUrl: result.sourceUrl,
          description: material.description || offlineMatch.description,
          rateYear: result.year,
          validFrom: new Date(),
          isActive: true,
        });
        await newPrice.save();
        console.log(`   💾 Saved CPWD offline price to database`);
      } catch (dbError) {
        console.log(`   ⚠️ Could not save to DB:`, dbError.message);
      }

      return result;
    }

    console.log(`   🌐 Searching web sources...`);
    const webPrice = await searchWebPrices(material.itemName, material.unit);
    if (webPrice) {
      const sanitized = sanitycheckPrice(
        webPrice.unitPrice,
        material.unit,
        material.itemName
      );

      const result = {
        ...webPrice,
        unitPrice: roundToDecimals(sanitized.price, 2),
        confidence: sanitized.isValid ? webPrice.confidence : "medium",
      };

      setCachedEstimate(material.itemName, material.unit, result);

      try {
        const newPrice = new Price({
          itemName: material.itemName,
          itemCode: webPrice.itemId || `${webPrice.source}-${Date.now()}`,
          category: "road_safety",
          unitPrice: result.unitPrice,
          unit: normalizedUnit,
          currency: "₹",
          source: result.source,
          sourceUrl: result.sourceUrl,
          description: material.description,
          rateYear: webPrice.year || "2024",
          validFrom: new Date(),
          isActive: true,
        });
        await newPrice.save();
        console.log(`   💾 Saved web price to database`);
      } catch (dbError) {
        console.log(`   ⚠️ Could not save to DB:`, dbError.message);
      }

      return result;
    }

    console.log(`   📊 Searching for similar items in database...`);
    const similarItems = await findSimilarItems(material.itemName, 5);
    if (similarItems.length > 0) {
      const avgPrice =
        similarItems.reduce((sum, item) => sum + item.unitPrice, 0) /
        similarItems.length;
      console.log(
        `   ⚠️  Found ${
          similarItems.length
        } similar items, avg price: ₹${roundToDecimals(
          avgPrice,
          2
        )} (FALLBACK - NOT OFFICIAL)`
      );

      const result = {
        unitPrice: roundToDecimals(avgPrice, 2),
        source: "DB_SIMILAR_ITEMS (FALLBACK)",
        itemId: null,
        year: "2024",
        confidence: "low",
      };

      setCachedEstimate(material.itemName, material.unit, result);
      return result;
    }

    console.log(
      `   ⚠️  No matches found, using category fallback with sanity checks`
    );
    const fallback = getCategoryFallback(
      material.itemName,
      material.unit,
      detectCategory(material.itemName)
    );

    const result = {
      unitPrice: roundToDecimals(fallback.unitPrice, 2),
      source: fallback.source,
      itemId: fallback.itemId,
      year: fallback.year,
      confidence: fallback.confidence,
      category: fallback.category,
      priceRange: fallback.range,
    };

    console.log(
      `   � FALLBACK RATE APPLIED: ${fallback.category} category – ₹${result.unitPrice} (range: ₹${fallback.range.min}-${fallback.range.max}). ⚠️  MUST BE REPLACED WITH OFFICIAL RATE BEFORE FINAL SUBMISSION.`
    );

    setCachedEstimate(material.itemName, normalizedUnit, result);
    return result;
  } catch (error) {
    console.error("   ❌ Error in price estimation:", error.message);

    return {
      unitPrice: 500,
      source: "DEFAULT_FALLBACK (CRITICAL - MUST REPLACE)",
      itemId: null,
      year: "2024",
      confidence: "very_low",
    };
  }
};

const detectCategory = (itemName) => {
  const lower = itemName.toLowerCase();

  if (
    lower.includes("sign") ||
    lower.includes("reflective") ||
    lower.includes("aluminum")
  ) {
    return "signage";
  }
  if (
    lower.includes("barrier") ||
    lower.includes("guard") ||
    lower.includes("rail")
  ) {
    return "barrier";
  }
  if (
    lower.includes("marking") ||
    lower.includes("paint") ||
    lower.includes("thermoplastic")
  ) {
    return "marking";
  }
  if (
    lower.includes("signal") ||
    lower.includes("light") ||
    lower.includes("led") ||
    lower.includes("blinker")
  ) {
    return "lighting";
  }
  if (
    lower.includes("stud") ||
    lower.includes("cone") ||
    lower.includes("delineator") ||
    lower.includes("breaker")
  ) {
    return "equipment";
  }

  return "other";
};

export const normalizeItemName = (itemName) => {
  return itemName
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

export const findSimilarItems = async (itemName, limit = 5) => {
  try {
    const normalized = normalizeItemName(itemName);

    const items = await Price.find({
      $text: { $search: normalized },
      isActive: true,
    })
      .sort({ score: { $meta: "textScore" } })
      .limit(limit);

    return items;
  } catch (error) {
    console.error("Error finding similar items:", error);
    return [];
  }
};

export default {
  searchPriceData,
  searchWebPrices,
  estimatePriceIfNotFound,
  normalizeItemName,
  findSimilarItems,
};
