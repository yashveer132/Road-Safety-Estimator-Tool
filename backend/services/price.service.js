import Price from "../models/Price.model.js";
import { scrapeCPWDPrices, scrapeGeMPrices } from "./scraper.service.js";
import { normalizeUnit } from "../utils/unit.js";
import { searchCPWDOffline, sanitycheckPrice } from "./cpwd.service.js";
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
      `💰 Finding OFFICIAL price for: ${material.itemName} (${material.unit})`
    );

    const normalizedUnit = normalizeUnit(material.unit);

    const cachedResult = getCachedEstimate(material.itemName, material.unit);
    if (cachedResult) {
      return cachedResult;
    }

    console.log(`   📚 Checking offline CPWD SOR 2024 database...`);
    const offlineMatch = searchCPWDOffline(material.itemName, material.unit);
    if (offlineMatch) {
      const sanitized = sanitycheckPrice(
        offlineMatch.unitPrice,
        material.unit,
        material.itemName
      );

      const result = {
        unitPrice: roundToDecimals(sanitized.price, 2),
        source: "CPWD_SOR_2024",
        itemId: offlineMatch.itemId,
        year: "2024",
        sourceUrl: "https://cpwd.gov.in/Documents/cpwd_publication.aspx",
        confidence: sanitized.isValid ? "high" : "medium",
        specification: offlineMatch.specification,
        official: true,
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
          source: "CPWD_SOR",
          sourceUrl: result.sourceUrl,
          description: material.description || offlineMatch.description,
          rateYear: "2024",
          validFrom: new Date(),
          isActive: true,
        });
        await newPrice.save();
        console.log(`   💾 Saved CPWD SOR 2024 price to database`);
      } catch (dbError) {
        console.log(`   ⚠️ Could not save to DB:`, dbError.message);
      }

      console.log(
        `   ✅ OFFICIAL RATE FOUND: ₹${result.unitPrice} (CPWD SOR Item: ${result.itemId})`
      );
      return result;
    }

    console.log(`   🌐 Searching official web sources (CPWD/GeM)...`);
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
        confidence: sanitized.isValid ? "high" : "medium",
        official: true,
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
        console.log(`   💾 Saved ${result.source} price to database`);
      } catch (dbError) {
        console.log(`   ⚠️ Could not save to DB:`, dbError.message);
      }

      console.log(
        `   ✅ OFFICIAL RATE FOUND: ₹${result.unitPrice} (${result.source})`
      );
      return result;
    }

    console.error(`\n${"=".repeat(80)}`);
    console.error(`❌ CRITICAL ERROR: NO OFFICIAL RATE FOUND`);
    console.error(`${"=".repeat(80)}`);
    console.error(`📌 Material: ${material.itemName}`);
    console.error(`📏 Unit: ${material.unit} (normalized: ${normalizedUnit})`);
    console.error(`📝 Description: ${material.description || "N/A"}`);
    console.error(`\n🔍 Searched in:`);
    console.error(
      `   ✗ CPWD SOR 2024 offline database (cpwdSORRates2024.json)`
    );
    console.error(`   ✗ CPWD SOR website (cpwd.gov.in)`);
    console.error(`   ✗ GeM Portal (mkp.gem.gov.in)`);
    console.error(`\n💡 RESOLUTION REQUIRED:`);
    console.error(
      `   1. Add this material to: backend/data/cpwdSORRates2024.json`
    );
    console.error(`   2. Include official CPWD SOR 2024 rate`);
    console.error(`   3. Provide correct item code and specification`);
    console.error(`   4. Re-run the estimate after updating the database`);
    console.error(`\n⚠️  As per hackathon requirements:`);
    console.error(
      `   - Only CPWD SOR 2024 and GeM Portal rates are acceptable`
    );
    console.error(`   - Fallback/estimated prices are NOT permitted`);
    console.error(`   - All interventions must have official rate sources`);
    console.error(`${"=".repeat(80)}\n`);

    throw new Error(
      `NO_OFFICIAL_RATE|${material.itemName}|${material.unit}|` +
        `Cannot find official CPWD SOR 2024 or GeM rate. ` +
        `This material must be added to cpwdSORRates2024.json with correct official rate. ` +
        `Fallback pricing is disabled per hackathon requirements.`
    );
  } catch (error) {
    if (error.message.startsWith("NO_OFFICIAL_RATE")) {
      throw error;
    }

    console.error("   ❌ Unexpected error in price estimation:", error.message);

    throw new Error(
      `PRICE_ESTIMATION_ERROR|${material.itemName}|${material.unit}|` +
        `Failed to estimate price: ${error.message}. ` +
        `Please check material specifications and database integrity.`
    );
  }
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
      source: { $in: ["CPWD_SOR", "GeM"] },
    })
      .sort({ score: { $meta: "textScore" } })
      .limit(limit);

    return items;
  } catch (error) {
    console.error("Error finding similar items:", error);
    return [];
  }
};

export const validateOfficialRates = (materials) => {
  const validation = {
    totalItems: materials.length,
    officialRates: 0,
    missingRates: [],
    lowConfidence: [],
  };

  materials.forEach((material) => {
    const isOfficial =
      material.source &&
      (material.source.includes("CPWD_SOR") || material.source.includes("GeM"));

    if (!isOfficial) {
      validation.missingRates.push({
        itemName: material.itemName,
        unit: material.unit,
        source: material.source || "NONE",
      });
    } else {
      validation.officialRates++;

      if (
        material.confidence &&
        (material.confidence === "low" || material.confidence === "medium")
      ) {
        validation.lowConfidence.push({
          itemName: material.itemName,
          confidence: material.confidence,
          source: material.source,
        });
      }
    }
  });

  validation.officialRatePercentage = Math.round(
    (validation.officialRates / validation.totalItems) * 100
  );
  validation.passesValidation =
    validation.missingRates.length === 0 &&
    validation.officialRatePercentage === 100;

  return validation;
};

export default {
  searchPriceData,
  searchWebPrices,
  estimatePriceIfNotFound,
  normalizeItemName,
  findSimilarItems,
  validateOfficialRates,
};
