import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizeUnit } from "../utils/unit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cpwdData = null;

const extractIRCCodes = (specString) => {
  if (!specString) return [];

  const ircPattern =
    /IRC[\s:]*(\d{1,2}(?::\s?(?:SP\s?)?:?\s?\d{1,2})?[-–]?\d{4}|\d{1,2}[-–]?\d{4}|:\s?SP\s?:\s?\d{1,2}[-–]?\d{4})/gi;
  const matches = specString.match(ircPattern) || [];

  return matches
    .map((match) => {
      let cleaned = match
        .replace(/\s+/g, "")
        .replace(/–/g, "-")
        .replace(/:/g, ":");

      if (!cleaned.startsWith("IRC")) {
        cleaned = "IRC:" + cleaned;
      }

      return cleaned.toUpperCase();
    })
    .filter((v, i, a) => a.indexOf(v) === i);
};

const loadCPWDData = () => {
  if (cpwdData) return cpwdData;

  try {
    const filePath = path.join(__dirname, "../data/cpwdSORRates2024.json");
    const rawData = fs.readFileSync(filePath, "utf8");
    cpwdData = JSON.parse(rawData);
    console.log(
      `✅ Loaded ${cpwdData.rates.length} CPWD SOR rates from offline cache`
    );
    return cpwdData;
  } catch (error) {
    console.error("❌ Error loading CPWD SOR data:", error.message);
    return { rates: [], version: "CPWD SOR 2024", categories: {} };
  }
};

export const searchCPWDOffline = (itemName, unit) => {
  const data = loadCPWDData();
  const normalizedUnit = normalizeUnit(unit);
  const searchTerms = itemName.toLowerCase().split(" ");

  const exactMatch = data.rates.find(
    (rate) =>
      rate.itemName.toLowerCase() === itemName.toLowerCase() &&
      normalizeUnit(rate.unit) === normalizedUnit
  );

  if (exactMatch) {
    console.log(
      `   ✅ Exact CPWD match: ${exactMatch.itemName} (Item ${exactMatch.itemCode})`
    );
    const ircRefs = extractIRCCodes(exactMatch.specification);
    return {
      unitPrice: exactMatch.unitPrice,
      source: "CPWD_SOR",
      itemId: exactMatch.itemCode,
      year: "2024",
      sourceUrl: `https://cpwd.gov.in/SOR/Item/${exactMatch.itemCode}`,
      description: exactMatch.description,
      specification: exactMatch.specification,
      ircReferences: ircRefs,
      confidence: "high",
    };
  }

  const keywordMatches = data.rates.filter((rate) => {
    if (normalizeUnit(rate.unit) !== normalizedUnit) return false;

    const rateKeywords = rate.keywords || [];
    const matchCount = searchTerms.filter((term) =>
      rateKeywords.some((keyword) => keyword.includes(term))
    ).length;

    return matchCount > 0;
  });

  if (keywordMatches.length > 0) {
    keywordMatches.sort((a, b) => {
      const scoreA = searchTerms.filter((term) =>
        a.keywords.some((keyword) => keyword.includes(term))
      ).length;
      const scoreB = searchTerms.filter((term) =>
        b.keywords.some((keyword) => keyword.includes(term))
      ).length;
      return scoreB - scoreA;
    });

    const bestMatch = keywordMatches[0];
    console.log(
      `   ✅ Keyword CPWD match: ${bestMatch.itemName} (Item ${bestMatch.itemCode})`
    );
    return {
      unitPrice: bestMatch.unitPrice,
      source: "CPWD_SOR",
      itemId: bestMatch.itemCode,
      year: "2024",
      sourceUrl: `https://cpwd.gov.in/SOR/Item/${bestMatch.itemCode}`,
      description: bestMatch.description,
      specification: bestMatch.specification,
      confidence: "medium",
    };
  }

  const partialMatches = data.rates.filter((rate) => {
    if (normalizeUnit(rate.unit) !== normalizedUnit) return false;

    const rateName = rate.itemName.toLowerCase();
    return searchTerms.some(
      (term) => term.length > 3 && rateName.includes(term)
    );
  });

  if (partialMatches.length > 0) {
    const bestMatch = partialMatches[0];
    console.log(
      `   ⚠️ Partial CPWD match: ${bestMatch.itemName} (Item ${bestMatch.itemCode})`
    );
    return {
      unitPrice: bestMatch.unitPrice,
      source: "CPWD_SOR",
      itemId: bestMatch.itemCode,
      year: "2024",
      sourceUrl: `https://cpwd.gov.in/SOR/Item/${bestMatch.itemCode}`,
      description: bestMatch.description,
      specification: bestMatch.specification,
      confidence: "low",
    };
  }

  return null;
};

export const getCategoryFallback = (itemName, unit, category = null) => {
  const data = loadCPWDData();
  const normalizedUnit = normalizeUnit(unit);

  const categoryFallbacks = {
    signage: {
      sqm: { min: 800, max: 1500, default: 1250 },
      nos: { min: 600, max: 1200, default: 850 },
      m: { min: 200, max: 400, default: 285 },
    },
    marking: {
      kg: { min: 200, max: 350, default: 285 },
      sqm: { min: 120, max: 250, default: 180 },
      m: { min: 100, max: 200, default: 150 },
      litre: { min: 35, max: 60, default: 45 },
    },
    barrier: {
      m: { min: 2800, max: 4500, default: 3500 },
      nos: { min: 1800, max: 3200, default: 2500 },
    },
    lighting: {
      nos: { min: 5000, max: 12000, default: 8500 },
      m: { min: 150, max: 250, default: 185 },
    },
    equipment: {
      nos: { min: 300, max: 600, default: 425 },
      m: { min: 1800, max: 2800, default: 2200 },
      kg: { min: 150, max: 300, default: 220 },
    },
    adhesive: {
      kg: { min: 600, max: 900, default: 750 },
      litre: { min: 100, max: 180, default: 125 },
    },
    electrical: {
      m: { min: 120, max: 250, default: 185 },
      nos: { min: 300, max: 800, default: 500 },
    },
    other: {
      sqm: { min: 350, max: 700, default: 500 },
      nos: { min: 350, max: 700, default: 500 },
      m: { min: 180, max: 350, default: 250 },
      kg: { min: 150, max: 300, default: 200 },
      litre: { min: 150, max: 300, default: 220 },
    },
  };

  const detectedCategory = category || detectCategory(itemName);
  const fallbackData = categoryFallbacks[detectedCategory]?.[normalizedUnit] ||
    categoryFallbacks.other[normalizedUnit] || {
      min: 300,
      max: 800,
      default: 500,
    };

  const similarItems = data.rates.filter(
    (rate) => normalizeUnit(rate.unit) === normalizedUnit
  );

  let finalPrice = fallbackData.default;

  if (similarItems.length > 0) {
    const prices = similarItems
      .map((item) => item.unitPrice)
      .sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];

    if (median >= fallbackData.min && median <= fallbackData.max) {
      finalPrice = median;
      console.log(
        `   📊 Using median fallback (${similarItems.length} items): ₹${finalPrice}`
      );
    } else {
      console.log(
        `   ⚠️ Median ₹${median} out of range [${fallbackData.min}-${fallbackData.max}], using default`
      );
    }
  }

  return {
    unitPrice: finalPrice,
    source: "CATEGORY_FALLBACK",
    itemId: null,
    year: "2024",
    sourceUrl: null,
    confidence: "low",
    category: detectedCategory,
    range: {
      min: fallbackData.min,
      max: fallbackData.max,
    },
  };
};

const detectCategory = (itemName) => {
  const lower = itemName.toLowerCase();

  if (
    lower.includes("sign") ||
    lower.includes("reflective") ||
    lower.includes("aluminum") ||
    lower.includes("aluminium") ||
    lower.includes("board")
  ) {
    return "signage";
  }
  if (
    lower.includes("barrier") ||
    lower.includes("guard") ||
    lower.includes("rail") ||
    lower.includes("crash")
  ) {
    return "barrier";
  }
  if (
    lower.includes("marking") ||
    lower.includes("paint") ||
    lower.includes("thermoplastic") ||
    lower.includes("bead") ||
    lower.includes("glass")
  ) {
    return "marking";
  }
  if (
    lower.includes("signal") ||
    lower.includes("light") ||
    lower.includes("led") ||
    lower.includes("blinker") ||
    lower.includes("luminaire")
  ) {
    return "lighting";
  }
  if (
    lower.includes("stud") ||
    lower.includes("cone") ||
    lower.includes("delineator") ||
    lower.includes("breaker") ||
    lower.includes("bollard")
  ) {
    return "equipment";
  }
  if (
    lower.includes("adhesive") ||
    lower.includes("epoxy") ||
    lower.includes("resin") ||
    lower.includes("glue") ||
    lower.includes("primer")
  ) {
    return "adhesive";
  }
  if (
    lower.includes("cable") ||
    lower.includes("wire") ||
    lower.includes("electrical") ||
    lower.includes("controller")
  ) {
    return "electrical";
  }

  return "other";
};

export const sanitycheckPrice = (price, unit, itemName) => {
  const data = loadCPWDData();
  const normalizedUnit = normalizeUnit(unit);

  const similarItems = data.rates.filter(
    (rate) => normalizeUnit(rate.unit) === normalizedUnit
  );

  if (similarItems.length === 0) {
    return { isValid: true, price, reason: "No reference data for comparison" };
  }

  const prices = similarItems.map((item) => item.unitPrice);
  const median = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)];
  const maxAllowed = median * 3;

  if (price > maxAllowed) {
    console.log(
      `   ⚠️ Sanity check failed: ₹${price} > 3× median (₹${maxAllowed})`
    );
    return {
      isValid: false,
      price: median,
      reason: `Original price ₹${price} exceeds 3× median, capped to ₹${median}`,
      originalPrice: price,
    };
  }

  return { isValid: true, price, reason: "Within acceptable range" };
};

export const getCPWDCategories = () => {
  const data = loadCPWDData();
  return data.categories || {};
};

export const getCPWDVersion = () => {
  const data = loadCPWDData();
  return {
    version: data.version,
    lastUpdated: data.lastUpdated,
    source: data.source,
    totalItems: data.rates.length,
  };
};

export default {
  searchCPWDOffline,
  getCategoryFallback,
  sanitycheckPrice,
  getCPWDCategories,
  getCPWDVersion,
};
