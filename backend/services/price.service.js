import Price from "../models/Price.model.js";
import { generateContent, cleanJsonResponse } from "../config/gemini.js";
import { scrapeCPWDPrices, scrapeGeMPrices } from "./scraper.service.js";

const priceEstimateCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

const getCacheKey = (itemName, unit) =>
  `${itemName.toLowerCase().trim()}_${unit}`;

const getCachedEstimate = (itemName, unit) => {
  const key = getCacheKey(itemName, unit);
  const cached = priceEstimateCache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`📋 Using cached price estimate for: ${itemName}`);
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
    console.log(`🌐 Searching web prices for: ${itemName}`);

    const cpwdPrices = await scrapeCPWDPrices([itemName]);
    const cpwdMatch = cpwdPrices.find(
      (price) =>
        price.itemName
          .toLowerCase()
          .includes(itemName.toLowerCase().split(" ")[0]) ||
        itemName
          .toLowerCase()
          .includes(price.itemName.toLowerCase().split(" ")[0])
    );

    if (cpwdMatch && cpwdMatch.unit === unit) {
      console.log(`📊 Found CPWD price: ₹${cpwdMatch.unitPrice} per ${unit}`);
      return {
        unitPrice: cpwdMatch.unitPrice,
        source: cpwdMatch.source,
        sourceUrl: cpwdMatch.sourceUrl,
        confidence: "high",
      };
    }

    const gemPrices = await scrapeGeMPrices([itemName]);
    const gemMatch = gemPrices.find(
      (price) =>
        price.itemName
          .toLowerCase()
          .includes(itemName.toLowerCase().split(" ")[0]) ||
        itemName
          .toLowerCase()
          .includes(price.itemName.toLowerCase().split(" ")[0])
    );

    if (gemMatch && gemMatch.unit === unit) {
      console.log(`📊 Found GeM price: ₹${gemMatch.unitPrice} per ${unit}`);
      return {
        unitPrice: gemMatch.unitPrice,
        source: gemMatch.source,
        sourceUrl: gemMatch.sourceUrl,
        confidence: "high",
      };
    }

    console.log(`❌ No web prices found for: ${itemName}`);
    return null;
  } catch (error) {
    console.error("Error searching web prices:", error);
    return null;
  }
};

export const searchPriceData = async (itemName, unit) => {
  try {
    let price = await Price.findOne({
      itemName: new RegExp(`^${itemName}$`, "i"),
      unit: unit,
      isActive: true,
    }).sort({ lastVerified: -1 });

    if (price) {
      return price;
    }

    price = await Price.findOne({
      itemName: new RegExp(itemName, "i"),
      isActive: true,
    }).sort({ lastVerified: -1 });

    if (price) {
      return price;
    }

    const prices = await Price.find({
      $text: { $search: itemName },
      isActive: true,
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
    const cachedResult = getCachedEstimate(material.itemName, material.unit);
    if (cachedResult) {
      return cachedResult;
    }

    console.log(`🌐 Searching web sources for: ${material.itemName}`);
    const webPrice = await searchWebPrices(material.itemName, material.unit);
    if (webPrice) {
      setCachedEstimate(material.itemName, material.unit, webPrice);

      if (webPrice.source !== "AI_ESTIMATED") {
        const newPrice = new Price({
          itemName: material.itemName,
          itemCode: `${webPrice.source}-${Date.now()}`,
          category: "other",
          unitPrice: webPrice.unitPrice,
          unit: material.unit,
          currency: "₹",
          source: webPrice.source,
          sourceUrl: webPrice.sourceUrl,
          description: material.description,
          validFrom: new Date(),
          isActive: true,
        });
        await newPrice.save();
      }

      return webPrice;
    }

    console.log(`🤖 AI: Estimating price for: ${material.itemName}`);

    const similarItems = await findSimilarItems(material.itemName, 3);
    if (similarItems.length > 0) {
      const avgPrice =
        similarItems.reduce((sum, item) => sum + item.unitPrice, 0) /
        similarItems.length;
      console.log(
        `📊 Using similar DB items for fallback price: ₹${avgPrice.toFixed(2)}`
      );
      return {
        unitPrice: Math.round(avgPrice * 100) / 100,
        source: "DB_SIMILAR_FALLBACK",
        confidence: "medium",
      };
    }

    const prompt = `
You are a cost estimation expert for road safety materials in India. Estimate the current market price for the following material.

Material: ${material.itemName}
Description: ${material.description}
Unit: ${material.unit}

Provide a realistic estimate based on:
1. Current market rates in India
2. Standard specifications
3. Typical supplier pricing
4. CPWD/GeM portal reference prices

Return ONLY a JSON object with this structure:
{
  "unitPrice": 150.50,
  "currency": "INR",
  "confidence": "medium",
  "reasoning": "Based on typical market rates for reflective sheeting materials",
  "priceRange": {
    "min": 120,
    "max": 180
  }
}

IMPORTANT:
- Provide realistic Indian market prices in INR (₹)
- Consider the material quality and specifications
- Use confidence: "high", "medium", or "low"
- Return valid JSON only
`;

    const response = await generateContent(prompt);
    const priceEstimate = cleanJsonResponse(response);

    const result = {
      unitPrice: priceEstimate.unitPrice,
      source: "AI_ESTIMATED",
      confidence: priceEstimate.confidence,
    };

    setCachedEstimate(material.itemName, material.unit, result);

    const newPrice = new Price({
      itemName: material.itemName,
      itemCode: `EST-${Date.now()}`,
      category: "other",
      unitPrice: priceEstimate.unitPrice,
      unit: material.unit,
      currency: "₹",
      source: "AI_ESTIMATED",
      description: material.description,
      validFrom: new Date(),
      isActive: true,
      specifications: new Map([
        ["estimationMethod", "AI"],
        ["confidence", priceEstimate.confidence],
        ["reasoning", priceEstimate.reasoning],
      ]),
    });

    await newPrice.save();
    console.log(
      `✓ Estimated price: ₹${priceEstimate.unitPrice} per ${material.unit}`
    );

    return result;
  } catch (error) {
    console.error("Error estimating price:", error);

    if (error.status === 429) {
      const cachedResult = getCachedEstimate(material.itemName, material.unit);
      if (cachedResult) {
        console.log(
          `⚠️ Quota exceeded, using cached price for: ${material.itemName}`
        );
        return cachedResult;
      }

      const similarItems = await findSimilarItems(material.itemName, 3);
      if (similarItems.length > 0) {
        const avgPrice =
          similarItems.reduce((sum, item) => sum + item.unitPrice, 0) /
          similarItems.length;
        console.log(
          `📊 Quota exceeded, using DB similar items fallback: ₹${avgPrice.toFixed(
            2
          )}`
        );
        return {
          unitPrice: Math.round(avgPrice * 100) / 100,
          source: "DB_SIMILAR_QUOTA_FALLBACK",
          confidence: "low",
        };
      }
    }

    return {
      unitPrice: 100,
      source: "DEFAULT_ESTIMATE",
      confidence: "low",
    };
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
