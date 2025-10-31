import {
  extractMaterialRequirements,
  generateCostRationale,
} from "./ai.service.js";
import { searchPriceData, estimatePriceIfNotFound } from "./price.service.js";
import { isCountableUnit, normalizeUnit } from "../utils/unit.js";

export const calculateMaterialCosts = async (interventions, ircMappings) => {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("💰 CALCULATING MATERIAL COSTS");
    console.log("=".repeat(60));
    console.log(`📊 Processing ${interventions.length} interventions...`);

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
          `⚠️ No IRC mapping found for: Section ${intervention.sectionId}, #${intervention.serialNo}`
        );
        continue;
      }

      console.log(
        `\n📍 [${intervention.sectionId}-${
          intervention.serialNo
        }] ${intervention.recommendation.substring(0, 60)}...`
      );

      const itemsWithPrices = [];
      let totalCost = 0;

      if (mapping.materials && Array.isArray(mapping.materials)) {
        console.log(
          `   🔧 Processing ${mapping.materials.length} materials...`
        );

        for (const material of mapping.materials) {
          console.log(`\n   📦 Material: ${material.item}`);

          let normalizedQuantity = material.quantity;
          const canonicalUnit = normalizeUnit(material.unit);

          if (isCountableUnit(canonicalUnit)) {
            normalizedQuantity = Math.max(
              0,
              Math.round(Number(material.quantity) || 0)
            );
          } else {
            normalizedQuantity =
              Math.round((Number(material.quantity) || 0) * 100) / 100;
          }

          console.log(`      Quantity: ${normalizedQuantity} ${material.unit}`);

          const priceInfo = await searchPriceData(material.item, material.unit);

          let unitPrice = priceInfo?.unitPrice || 0;
          let source = priceInfo?.source || null;
          let sourceUrl = priceInfo?.sourceUrl || null;

          if (!priceInfo) {
            console.log(`      ⚠️ Not in database, fetching from web...`);
            const estimatedPrice = await estimatePriceIfNotFound({
              itemName: material.item,
              description: material.details,
              unit: material.unit,
            });
            unitPrice = estimatedPrice.unitPrice;
            source = estimatedPrice.source;
            sourceUrl = estimatedPrice.sourceUrl || null;
          } else {
            console.log(`      ✅ Found in database: ${source}`);
          }

          const totalPrice =
            Math.round(normalizedQuantity * unitPrice * 100) / 100;
          totalCost += totalPrice;

          console.log(
            `      💵 Unit Price: ₹${unitPrice} per ${material.unit}`
          );
          console.log(`      💰 Total: ₹${totalPrice.toFixed(2)}`);
          console.log(`      📌 Source: ${source}`);

          itemsWithPrices.push({
            itemName: material.item,
            description: material.details,
            quantity: normalizedQuantity,
            unit: material.unit,
            unitPrice: unitPrice,
            totalPrice: totalPrice,
            source: source,
            sourceUrl: sourceUrl,
            lastUpdated: new Date(),
          });

          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      let aiRationale = null;
      try {
        aiRationale = await generateCostRationale(
          {
            name: intervention.recommendation,
            description: intervention.observation,
          },
          itemsWithPrices,
          mapping,
          Math.round(totalCost * 100) / 100
        );
      } catch (error) {
        console.warn(`⚠️ Failed to generate AI rationale: ${error.message}`);
        aiRationale = null;
      }

      const rationale =
        aiRationale?.rationale ||
        `Cost estimate based on ${mapping.ircCode} ${mapping.clause}: ${mapping.specification}. Materials priced from CPWD SOR/GeM portal.`;

      const assumptions = aiRationale?.assumptions || [
        `IRC specification: ${mapping.specification}`,
        "Standard quality materials as per IRC guidelines",
        "Prices exclude GST, labor, and installation",
        `Location: ${intervention.chainage} ${intervention.side} ${intervention.road}`,
      ];

      const notes =
        aiRationale?.notes ||
        "Excludes labor, installation, and taxes. Material costs only.";

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
        notes: notes,
      });

      sectionGroups[intervention.sectionId].totalCost += totalCost;

      console.log(
        `   ✅ Total cost for this intervention: ₹${totalCost.toFixed(2)}`
      );
    }

    const materialEstimates = Object.values(sectionGroups).map((section) => ({
      ...section,
      totalCost: Math.round(section.totalCost * 100) / 100,
    }));

    console.log("\n" + "=".repeat(60));
    console.log("✅ MATERIAL COST CALCULATION COMPLETED");
    materialEstimates.forEach((section) => {
      console.log(
        `   ${section.sectionId} - ${
          section.sectionName
        }: ₹${section.totalCost.toFixed(2)} (${section.items.length} items)`
      );
    });
    const grandTotal = materialEstimates.reduce(
      (sum, s) => sum + s.totalCost,
      0
    );
    console.log(`   📊 GRAND TOTAL: ₹${grandTotal.toFixed(2)}`);
    console.log("=".repeat(60) + "\n");

    return materialEstimates;
  } catch (error) {
    console.error("❌ Error calculating material costs:", error);
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
