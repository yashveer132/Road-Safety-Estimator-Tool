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

    const sectionGroups = {};

    interventions.forEach((intervention) => {
      const sectionId = intervention.sectionId;
      if (!sectionGroups[sectionId]) {
        sectionGroups[sectionId] = {
          sectionId,
          sectionName: intervention.sectionName,
          items: [],
          totalCost: 0,
        };
      }
    });

    for (let i = 0; i < interventions.length; i++) {
      const intervention = interventions[i];
      const mapping = ircMappings.find(
        (m) =>
          m.sectionId === intervention.sectionId &&
          m.serialNo === intervention.serialNo
      );

      if (!mapping) {
        console.warn(
          `No IRC mapping found for: Section ${intervention.sectionId}, #${intervention.serialNo}`
        );
        continue;
      }

      console.log(
        `Processing ${intervention.sectionId}-${intervention.serialNo}: ${intervention.recommendation}`
      );

      const itemsWithPrices = [];
      let totalCost = 0;

      if (mapping.materials && Array.isArray(mapping.materials)) {
        for (const material of mapping.materials) {
          const priceInfo = await searchPriceData(material.item, material.unit);

          let unitPrice = priceInfo?.unitPrice || 0;
          let source = priceInfo?.source || "ESTIMATED";
          let sourceUrl = priceInfo?.sourceUrl || null;

          if (!priceInfo) {
            const estimatedPrice = await estimatePriceIfNotFound({
              itemName: material.item,
              description: material.details,
              unit: material.unit,
            });
            unitPrice = estimatedPrice.unitPrice;
            source = estimatedPrice.source;

            if (estimatedPrice.source === "DEFAULT_ESTIMATE") {
              source = "QUOTA_LIMITED_DEFAULT";
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          const totalPrice =
            Math.round(material.quantity * unitPrice * 100) / 100;
          totalCost += totalPrice;

          itemsWithPrices.push({
            itemName: material.item,
            description: material.details,
            quantity: material.quantity,
            unit: material.unit,
            unitPrice: unitPrice,
            totalPrice: totalPrice,
            source: source,
            sourceUrl: sourceUrl,
            lastUpdated: new Date(),
          });
        }
      }

      const rationale = `Cost estimate based on ${mapping.ircCode} ${mapping.clause}: ${mapping.specification}. Materials priced from CPWD SOR/GeM portal.`;
      const assumptions = [
        `IRC specification: ${mapping.specification}`,
        "Standard quality materials as per IRC guidelines",
        "Prices exclude GST, labor, and installation",
        `Location: ${intervention.chainage} ${intervention.side} ${intervention.road}`,
      ];

      sectionGroups[intervention.sectionId].items.push({
        no: intervention.serialNo,
        chainage: intervention.chainage,
        side: intervention.side,
        road: intervention.road,
        observation: intervention.observation,
        recommendation: intervention.recommendation,
        ircReference: `${mapping.ircCode} ${mapping.clause}`,
        materials: itemsWithPrices,
        totalCost: Math.round(totalCost * 100) / 100,
        rationale: rationale,
        assumptions: assumptions,
      });

      sectionGroups[intervention.sectionId].totalCost += totalCost;

      console.log(
        `✓ ${intervention.sectionId}-${
          intervention.serialNo
        }: ₹${totalCost.toFixed(2)}`
      );
    }

    const materialEstimates = Object.values(sectionGroups).map((section) => ({
      ...section,
      totalCost: Math.round(section.totalCost * 100) / 100,
    }));

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
