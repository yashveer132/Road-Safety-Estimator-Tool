import Price from "../models/Price.model.js";
import { generateContent, cleanJsonResponse } from "../config/gemini.js";

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
    console.log(`🤖 AI: Estimating price for: ${material.itemName}`);

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

    return {
      unitPrice: priceEstimate.unitPrice,
      source: "AI_ESTIMATED",
      confidence: priceEstimate.confidence,
    };
  } catch (error) {
    console.error("Error estimating price:", error);
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
  estimatePriceIfNotFound,
  normalizeItemName,
  findSimilarItems,
};
