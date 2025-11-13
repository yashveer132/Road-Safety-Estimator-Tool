import { generateContent } from "../config/gemini.js";
import { normalizeUnit } from "../utils/unit.js";
import { roundToDecimals } from "../utils/format.js";
import Price from "../models/Price.model.js";

export const searchInternetForPrice = async (itemName, unit, description) => {
  try {
    console.log(
      `   🌐 AI: Searching internet for price of "${itemName}" (${unit})...`
    );

    const prompt = `You are a construction material price expert. Search your knowledge base for the approximate current market price of the following construction material in India:

Material Name: ${itemName}
Unit: ${unit}
Description: ${description || "Standard quality for road construction"}

Based on your knowledge of Indian construction markets, CPWD rates, GeM prices, and general market rates:

1. Provide a reasonable estimated price per ${unit} in Indian Rupees (₹)
2. Consider similar materials like:
   - If it's bitumen emulsion: similar to tack coat, SS-1 grade emulsion
   - If it's paint: similar to thermoplastic or road marking paint
   - If it's equipment: similar items from GeM portal
   - If it's civil work: similar to CPWD SOR rates

3. Your estimate should be:
   - Conservative (not too high or too low)
   - Based on 2024 market rates
   - Suitable for government procurement
   - In the range of similar CPWD/GeM items

Return ONLY a JSON object with this exact structure:
{
  "estimatedPrice": <number>,
  "confidence": <"low" | "medium" | "high">,
  "reasoning": "<brief explanation>",
  "similarMaterials": ["<material1>", "<material2>"],
  "priceRange": {
    "min": <number>,
    "max": <number>
  }
}

Example for "Tack Coat SS-1 Emulsion" per kg:
{
  "estimatedPrice": 65,
  "confidence": "medium",
  "reasoning": "SS-1 emulsion is a slow-setting bitumen emulsion used as tack coat. Based on CPWD rates for similar bituminous materials and GeM rates for emulsions, the price typically ranges from ₹50-80 per kg.",
  "similarMaterials": ["Bitumen Emulsion", "RS-1 Emulsion", "Prime Coat"],
  "priceRange": {
    "min": 50,
    "max": 80
  }
}`;

    const response = await generateContent(prompt, {
      maxTokens: 1000,
      temperature: 0.3,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI did not return valid JSON");
    }

    const aiEstimate = JSON.parse(jsonMatch[0]);

    console.log(
      `   ✅ AI Estimate: ₹${aiEstimate.estimatedPrice} (${aiEstimate.confidence} confidence)`
    );
    console.log(`      Reasoning: ${aiEstimate.reasoning}`);

    return aiEstimate;
  } catch (error) {
    console.error(`   ⚠️ AI price estimation failed: ${error.message}`);
    return null;
  }
};

export const findSimilarMaterialPrices = async (itemName, unit) => {
  try {
    const normalizedUnit = normalizeUnit(unit);

    const keywords = itemName
      .toLowerCase()
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 3 &&
          !["grade", "type", "for", "and", "the", "with"].includes(word)
      );

    console.log(
      `   🔍 Searching for similar materials using keywords: ${keywords.join(
        ", "
      )}...`
    );

    const similarItems = [];

    for (const keyword of keywords.slice(0, 3)) {
      const items = await Price.find({
        itemName: new RegExp(keyword, "i"),
        unit: normalizedUnit,
        isActive: true,
        source: { $in: ["CPWD_SOR", "GeM"] },
      })
        .sort({ lastVerified: -1 })
        .limit(5);

      similarItems.push(...items);
    }

    const uniqueItems = Array.from(
      new Map(similarItems.map((item) => [item._id.toString(), item])).values()
    );

    if (uniqueItems.length > 0) {
      const prices = uniqueItems.map((item) => item.unitPrice);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      console.log(
        `   ✅ Found ${uniqueItems.length} similar items: ₹${minPrice.toFixed(
          2
        )} - ₹${maxPrice.toFixed(2)} (avg: ₹${avgPrice.toFixed(2)})`
      );

      return {
        items: uniqueItems,
        priceStats: {
          min: minPrice,
          max: maxPrice,
          avg: avgPrice,
        },
      };
    }

    console.log(`   ℹ️ No similar materials found in database`);
    return null;
  } catch (error) {
    console.error(`   ⚠️ Error finding similar materials: ${error.message}`);
    return null;
  }
};

export const generateFallbackPrice = async (material) => {
  console.log(`\n💡 FALLBACK PRICING: ${material.itemName} (${material.unit})`);
  console.log(`   Attempting intelligent price estimation...`);

  try {
    const similarMaterials = await findSimilarMaterialPrices(
      material.itemName,
      material.unit
    );

    const aiEstimate = await searchInternetForPrice(
      material.itemName,
      material.unit,
      material.description
    );

    let finalPrice = null;
    let confidence = "low";
    let reasoning = "";
    let sources = [];

    if (similarMaterials && aiEstimate) {
      const similarAvg = similarMaterials.priceStats.avg;
      const aiPrice = aiEstimate.estimatedPrice;

      const priceDiff = Math.abs(similarAvg - aiPrice);
      const percentDiff = (priceDiff / similarAvg) * 100;

      if (percentDiff < 20) {
        finalPrice = roundToDecimals((similarAvg + aiPrice) / 2, 2);
        confidence = "medium";
        reasoning = `Price estimated from ${
          similarMaterials.items.length
        } similar materials (avg ₹${similarAvg.toFixed(
          2
        )}) and AI analysis (₹${aiPrice}). Estimates agree within ${percentDiff.toFixed(
          1
        )}%.`;
      } else {
        finalPrice = roundToDecimals(Math.min(similarAvg, aiPrice) * 1.1, 2);
        confidence = "low";
        reasoning = `Price estimated conservatively from similar materials and AI analysis. Variance detected: ${percentDiff.toFixed(
          1
        )}%.`;
      }

      sources = [
        ...similarMaterials.items.map((item) => ({
          name: item.itemName,
          price: item.unitPrice,
          source: item.source,
        })),
        {
          name: "AI Market Analysis",
          price: aiPrice,
          source: "AI_INTERNET",
        },
      ];
    } else if (similarMaterials) {
      finalPrice = roundToDecimals(similarMaterials.priceStats.avg * 1.1, 2);
      confidence = "medium";
      reasoning = `Estimated from ${similarMaterials.items.length} similar materials in CPWD/GeM database with 10% markup for safety.`;
      sources = similarMaterials.items.map((item) => ({
        name: item.itemName,
        price: item.unitPrice,
        source: item.source,
      }));
    } else if (aiEstimate) {
      finalPrice = roundToDecimals(aiEstimate.estimatedPrice, 2);
      confidence = aiEstimate.confidence === "high" ? "medium" : "low";
      reasoning = aiEstimate.reasoning;
      sources = [
        {
          name: "AI Market Analysis",
          price: aiEstimate.estimatedPrice,
          source: "AI_INTERNET",
        },
      ];
    } else {
      const fallbackPrices = getFallbackPriceByCategory(
        material.itemName,
        material.unit
      );
      finalPrice = fallbackPrices.price;
      confidence = "low";
      reasoning = fallbackPrices.reasoning;
      sources = [
        {
          name: "Rule-based Estimate",
          price: finalPrice,
          source: "FALLBACK",
        },
      ];
    }

    console.log(`   ✅ ESTIMATED PRICE: ₹${finalPrice}`);
    console.log(`   📊 Confidence: ${confidence}`);
    console.log(`   💭 Reasoning: ${reasoning}`);

    return {
      unitPrice: finalPrice,
      source: "ESTIMATED",
      confidence: confidence,
      official: false,
      reasoning: reasoning,
      estimationSources: sources,
      estimatedAt: new Date(),
    };
  } catch (error) {
    console.error(`   ❌ Fallback pricing failed: ${error.message}`);

    const emergency = getFallbackPriceByCategory(
      material.itemName,
      material.unit
    );
    return {
      unitPrice: emergency.price,
      source: "ESTIMATED",
      confidence: "very-low",
      official: false,
      reasoning: emergency.reasoning + " (Emergency fallback)",
      estimationSources: [],
      estimatedAt: new Date(),
    };
  }
};

/**
 * Rule-based fallback pricing by category
 */
function getFallbackPriceByCategory(itemName, unit) {
  const normalizedUnit = normalizeUnit(unit);
  const itemLower = itemName.toLowerCase();

  if (
    itemLower.includes("bitumen") ||
    itemLower.includes("emulsion") ||
    itemLower.includes("tack") ||
    itemLower.includes("prime")
  ) {
    return {
      price: normalizedUnit === "kg" ? 65 : 6500,
      reasoning:
        "Estimated based on typical bituminous material rates (₹6,500/quintal or ₹65/kg)",
    };
  }

  if (
    itemLower.includes("paint") ||
    itemLower.includes("marking") ||
    itemLower.includes("thermoplastic")
  ) {
    return {
      price: normalizedUnit === "kg" ? 295 : 100,
      reasoning:
        "Estimated based on typical road marking paint rates (₹295/kg for thermoplastic)",
    };
  }

  if (itemLower.includes("glass") && itemLower.includes("bead")) {
    return {
      price: normalizedUnit === "kg" ? 95 : 100,
      reasoning:
        "Estimated based on typical glass beads rates (₹95/kg for Type A)",
    };
  }

  if (itemLower.includes("aluminum") || itemLower.includes("aluminium")) {
    return {
      price:
        normalizedUnit === "sqm" ? 850 : normalizedUnit === "kg" ? 250 : 500,
      reasoning:
        "Estimated based on typical aluminum sheet rates (₹850/sqm or ₹250/kg)",
    };
  }

  if (
    itemLower.includes("steel") ||
    itemLower.includes("gi ") ||
    itemLower.includes("galvanized")
  ) {
    return {
      price: normalizedUnit === "kg" ? 75 : 1180,
      reasoning:
        "Estimated based on typical steel/GI rates (₹75/kg or ₹1,180/nos for posts)",
    };
  }

  if (itemLower.includes("concrete") || itemLower.includes("cement")) {
    return {
      price: normalizedUnit === "cum" ? 6500 : 350,
      reasoning: "Estimated based on typical concrete rates (₹6,500/cum)",
    };
  }

  if (
    itemLower.includes("reflective") ||
    itemLower.includes("retroreflective")
  ) {
    return {
      price: normalizedUnit === "sqm" ? 1420 : 1500,
      reasoning:
        "Estimated based on typical retroreflective sheeting rates (₹1,420/sqm for Type III)",
    };
  }

  if (itemLower.includes("led") || itemLower.includes("light")) {
    return {
      price: normalizedUnit === "nos" ? 2500 : 1000,
      reasoning:
        "Estimated based on typical LED/lighting equipment rates (₹2,500/nos)",
    };
  }

  if (
    itemLower.includes("delineator") ||
    itemLower.includes("stud") ||
    itemLower.includes("marker")
  ) {
    return {
      price: normalizedUnit === "nos" ? 185 : 200,
      reasoning:
        "Estimated based on typical delineator/road stud rates (₹185/nos)",
    };
  }

  return {
    price:
      normalizedUnit === "kg"
        ? 100
        : normalizedUnit === "sqm"
        ? 500
        : normalizedUnit === "cum"
        ? 5000
        : 250,
    reasoning:
      "Generic estimate based on material category and unit (Conservative pricing applied)",
  };
}
