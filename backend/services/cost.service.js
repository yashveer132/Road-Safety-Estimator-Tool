import Price from "../models/Price.model.js";
import {
  extractMaterialRequirements,
  generateCostRationale,
} from "./ai.service.js";
import { searchPriceData, estimatePriceIfNotFound } from "./price.service.js";

export const calculateMaterialCosts = async (interventions, ircMappings) => {
  try {
    console.log(
      "💰 Calculating material costs for",
      interventions.length,
      "interventions..."
    );

    const materialEstimates = [];

    for (let i = 0; i < interventions.length; i++) {
      const intervention = interventions[i];
      const ircMapping =
        ircMappings.find(
          (m) =>
            m.intervention === intervention.name ||
            m.intervention
              .toLowerCase()
              .includes(intervention.name.toLowerCase())
        ) || ircMappings[i];

      if (!ircMapping) {
        console.warn(`No IRC mapping found for: ${intervention.name}`);
        continue;
      }

      console.log(
        `Processing ${i + 1}/${interventions.length}: ${intervention.name}`
      );

      const materials = await extractMaterialRequirements(
        intervention,
        ircMapping
      );

      const itemsWithPrices = [];
      let totalCost = 0;

      for (const material of materials) {
        const priceInfo = await searchPriceData(
          material.itemName,
          material.unit
        );

        let unitPrice = priceInfo?.unitPrice || 0;
        let source = priceInfo?.source || "ESTIMATED";
        let sourceUrl = priceInfo?.sourceUrl || null;

        if (!priceInfo) {
          const estimatedPrice = await estimatePriceIfNotFound(material);
          unitPrice = estimatedPrice.unitPrice;
          source = "AI_ESTIMATED";
        }

        const totalPrice =
          Math.round(material.quantity * unitPrice * 100) / 100;
        totalCost += totalPrice;

        itemsWithPrices.push({
          itemName: material.itemName,
          description: material.description,
          quantity: material.quantity,
          unit: material.unit,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
          source: source,
          sourceUrl: sourceUrl,
          lastUpdated: new Date(),
        });
      }

      const { rationale, assumptions, notes } = await generateCostRationale(
        intervention,
        itemsWithPrices,
        ircMapping,
        totalCost
      );

      materialEstimates.push({
        intervention: intervention.name,
        items: itemsWithPrices,
        totalCost: Math.round(totalCost * 100) / 100,
        ircReference: `${ircMapping.ircCode} - ${ircMapping.clause}`,
        assumptions: assumptions || [],
        rationale: rationale || "Cost calculated based on IRC specifications",
        notes: notes || "",
      });

      console.log(`✓ ${intervention.name}: ₹${totalCost.toFixed(2)}`);
    }

    console.log("✅ Material cost calculation completed");
    return materialEstimates;
  } catch (error) {
    console.error("Error calculating material costs:", error);
    throw new Error(`Failed to calculate costs: ${error.message}`);
  }
};

export const recalculateCosts = async (estimateId) => {
  try {
    const estimate = await Estimate.findById(estimateId);

    if (!estimate) {
      throw new Error("Estimate not found");
    }

    const updatedEstimates = [];

    for (const materialEstimate of estimate.materialEstimates) {
      const updatedItems = [];
      let newTotal = 0;

      for (const item of materialEstimate.items) {
        const latestPrice = await searchPriceData(item.itemName, item.unit);
        const unitPrice = latestPrice?.unitPrice || item.unitPrice;
        const totalPrice = Math.round(item.quantity * unitPrice * 100) / 100;

        newTotal += totalPrice;

        updatedItems.push({
          ...item,
          unitPrice,
          totalPrice,
          lastUpdated: new Date(),
        });
      }

      updatedEstimates.push({
        ...materialEstimate,
        items: updatedItems,
        totalCost: Math.round(newTotal * 100) / 100,
      });
    }

    estimate.materialEstimates = updatedEstimates;
    estimate.totalMaterialCost = updatedEstimates.reduce(
      (sum, e) => sum + e.totalCost,
      0
    );
    await estimate.save();

    return estimate;
  } catch (error) {
    console.error("Error recalculating costs:", error);
    throw error;
  }
};

export default {
  calculateMaterialCosts,
  recalculateCosts,
};
