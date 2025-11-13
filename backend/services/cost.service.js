import {
  extractMaterialRequirements,
  generateCostRationale,
} from "./ai.service.js";
import { searchPriceData, estimatePriceIfNotFound } from "./price.service.js";
import { isCountableUnit, normalizeUnit } from "../utils/unit.js";
import {
  getIRCQuantityGuidelines,
  validateInterventionAgainstIRC,
} from "./irc.service.js";
import {
  roundToDecimals,
  formatQuantity,
  formatCurrency,
} from "../utils/format.js";
import {
  validateQuantities,
  validatePricing,
  validateInterventionCost,
  getSORItemCode,
  flagImplausibleCosts,
} from "./validation.service.js";

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
      const missingOfficialRates = [];

      if (mapping.materials && Array.isArray(mapping.materials)) {
        console.log(
          `   🔧 Processing ${mapping.materials.length} materials...`
        );

        for (const material of mapping.materials) {
          try {
            console.log(`\n   📦 Material: ${material.item}`);

            if (!material.quantity || material.quantity <= 0) {
              console.warn(
                `      ⚠️ WARNING: Invalid or zero quantity for "${material.item}"`
              );
              console.warn(
                `      💡 TIP: Check if AI extracted dimensions correctly from document`
              );
              missingOfficialRates.push({
                itemName: material.item,
                unit: material.unit,
                error: "Invalid quantity (zero or negative)",
                suggestion:
                  "Review intervention description for dimensions/quantities",
              });
              continue;
            }

            const canonicalUnit = normalizeUnit(material.unit);

            let normalizedQuantity = material.quantity;
            if (isCountableUnit(canonicalUnit)) {
              normalizedQuantity = Math.max(
                0,
                Math.round(Number(material.quantity) || 0)
              );
              if (normalizedQuantity === 0) {
                console.warn(
                  `      ⚠️ WARNING: Quantity rounded to 0 for countable item`
                );
                continue;
              }
            } else {
              normalizedQuantity = formatQuantity(
                material.quantity,
                canonicalUnit
              );
            }

            console.log(
              `      Quantity: ${normalizedQuantity} ${material.unit}`
            );

            const priceInfo = await searchPriceData(
              material.item,
              material.unit
            );

            let unitPrice = 0;
            let source = null;
            let sourceUrl = null;
            let itemId = null;
            let rateYear = "2024";
            let confidence = "high";
            let sorCode = null;

            if (!priceInfo) {
              console.log(`      ⚠️ Not in database, fetching from web...`);
              const estimatedPrice = await estimatePriceIfNotFound({
                itemName: material.item,
                description: material.details,
                unit: material.unit,
              });
              unitPrice = roundToDecimals(estimatedPrice.unitPrice, 2);
              source = estimatedPrice.source;
              sourceUrl = estimatedPrice.sourceUrl || null;
              itemId = estimatedPrice.itemId || null;
              rateYear = estimatedPrice.year || "2024";
              confidence = estimatedPrice.confidence || "low";
              sorCode = getSORItemCode(material.item, null)?.code;
            } else {
              console.log(`      ✅ Found in database: ${priceInfo.source}`);
              unitPrice = roundToDecimals(priceInfo.unitPrice, 2);
              source = priceInfo.source;
              sourceUrl = priceInfo.sourceUrl || null;
              itemId = priceInfo.itemCode || null;
              rateYear = priceInfo.rateYear || "2024";
              confidence = "high";
              sorCode =
                priceInfo.itemCode || getSORItemCode(material.item, null)?.code;
            }

            const totalPrice = roundToDecimals(
              normalizedQuantity * unitPrice,
              2
            );
            totalCost += totalPrice;

            const isEstimated =
              source === "ESTIMATED" ||
              source === "EMERGENCY_FALLBACK" ||
              priceInfo.official === false;

            if (isEstimated) {
              console.log(`      ⚠️ ESTIMATED PRICE (Not official CPWD/GeM)`);
            }

            console.log(
              `      💵 Unit Price: ${formatCurrency(unitPrice)} per ${
                material.unit
              }`
            );
            console.log(`      💰 Total: ${formatCurrency(totalPrice)}`);
            console.log(
              `      📌 Source: ${source}${itemId ? ` (Item: ${itemId})` : ""}${
                sorCode ? ` [SOR: ${sorCode}]` : ""
              }`
            );

            if (priceInfo.reasoning) {
              console.log(`      💭 Reasoning: ${priceInfo.reasoning}`);
            }

            itemsWithPrices.push({
              itemName: material.item,
              description: material.details,
              quantity: normalizedQuantity,
              unit: material.unit,
              unitPrice: unitPrice,
              totalPrice: totalPrice,
              source: source,
              sourceUrl: sourceUrl,
              itemId: itemId,
              sorCode: sorCode,
              rateYear: rateYear,
              confidence: confidence,
              isEstimated: isEstimated,
              reasoning: priceInfo?.reasoning || null,
              lastUpdated: new Date(),
            });
          } catch (materialError) {
            console.error(
              `      ⚠️ Error processing material "${material.item}":`,
              materialError.message
            );
            console.error(`      ⏭️ Skipping this material and continuing...`);

            missingOfficialRates.push({
              itemName: material.item,
              unit: material.unit,
              intervention: intervention.recommendation,
              section: intervention.sectionName,
              error: materialError.message,
            });
          }
        }
      }

      if (missingOfficialRates.length > 0) {
        console.warn(`\n${"=".repeat(80)}`);
        console.warn(
          `⚠️ WARNING: ${missingOfficialRates.length} material(s) could not be processed`
        );
        console.warn(`${"=".repeat(80)}`);
        console.warn(`📍 Intervention: ${intervention.recommendation}`);
        console.warn(
          `📋 Section: ${intervention.sectionName} (${intervention.sectionId})`
        );
        console.warn(`\n⚠️ Problematic materials:`);
        missingOfficialRates.forEach((missing, idx) => {
          console.warn(`   ${idx + 1}. ${missing.itemName} (${missing.unit})`);
          if (missing.error) {
            console.warn(`      Error: ${missing.error}`);
          }
        });
        console.warn(`\n💡 Note:`);
        console.warn(
          `   Intervention will be processed with available materials only`
        );
        console.warn(
          `   Estimated prices will be marked accordingly in the report`
        );
        console.warn(`${"=".repeat(80)}\n`);
      }

      let aiRationale = null;
      try {
        const roundedTotalCost = roundToDecimals(totalCost, 2);
        aiRationale = await generateCostRationale(
          {
            name: intervention.recommendation,
            description: intervention.observation,
          },
          itemsWithPrices,
          mapping,
          roundedTotalCost
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
        totalCost: roundToDecimals(totalCost, 2),
        rationale: rationale,
        assumptions: assumptions,
        notes: notes,
      });

      sectionGroups[intervention.sectionId].totalCost += totalCost;

      console.log(
        `   ✅ Total cost for this intervention: ${formatCurrency(totalCost)}`
      );

      console.log(`   🔍 Running validation checks...`);
      const quantValidation = validateQuantities(
        itemsWithPrices,
        intervention.sectionName
      );
      const priceValidation = validatePricing(itemsWithPrices);
      const costValidation = validateInterventionCost(intervention, totalCost);
      const implausibleCosts = flagImplausibleCosts(itemsWithPrices);

      if (quantValidation.hasIssues) {
        console.log(`   ⚠️ Quantity issues detected:`);
        quantValidation.issues.forEach((issue) => {
          console.log(
            `      [${issue.severity.toUpperCase()}] ${issue.material}: ${
              issue.problem
            }`
          );
        });
      }

      if (priceValidation.hasIssues) {
        console.log(`   ⚠️ Pricing issues detected:`);
        priceValidation.issues.forEach((issue) => {
          console.log(
            `      [${issue.severity.toUpperCase()}] ${issue.material}: ${
              issue.problem
            }`
          );
        });
      }

      if (implausibleCosts.length > 0) {
        console.log(`   � Cost outliers detected:`);
        implausibleCosts.forEach((outlier) => {
          console.log(
            `      ${outlier.material}: ${roundToDecimals(
              outlier.percentage,
              1
            )}% of total`
          );
        });
      }

      const quantityGuidelines = getIRCQuantityGuidelines(
        intervention.sectionName
      );
      const quantityValidation = [];

      if (quantityGuidelines) {
        itemsWithPrices.forEach((item) => {
          const guideline =
            quantityGuidelines[
              item.itemName.toLowerCase().replace(/\s+/g, "")
            ] ||
            Object.values(quantityGuidelines).find(
              (g) =>
                g.formula &&
                item.itemName
                  .toLowerCase()
                  .includes(g.formula.split(" ")[0].toLowerCase())
            );

          if (guideline) {
            const isReasonable = item.quantity > 0 && item.quantity < 10000;
            quantityValidation.push({
              item: item.itemName,
              quantity: item.quantity,
              unit: item.unit,
              guideline: guideline.formula || "Standard IRC specification",
              isValid: isReasonable,
              notes: isReasonable
                ? "Quantity within reasonable range"
                : "Quantity may need review",
            });
          }
        });
      }

      const lastItem =
        sectionGroups[intervention.sectionId].items[
          sectionGroups[intervention.sectionId].items.length - 1
        ];
      lastItem.quantityValidation = quantityValidation;
    }

    const materialEstimates = Object.values(sectionGroups).map((section) => ({
      ...section,
      totalCost: roundToDecimals(section.totalCost, 2),
    }));

    console.log("\n" + "=".repeat(60));
    console.log("✅ MATERIAL COST CALCULATION COMPLETED");
    materialEstimates.forEach((section) => {
      console.log(
        `   ${section.sectionId} - ${section.sectionName}: ${formatCurrency(
          section.totalCost
        )} (${section.items.length} items)`
      );
    });
    const grandTotal = materialEstimates.reduce(
      (sum, s) => sum + s.totalCost,
      0
    );
    console.log(`   📊 GRAND TOTAL: ${formatCurrency(grandTotal)}`);

    const estimatedCount = materialEstimates.reduce(
      (count, section) =>
        count +
        section.items.filter((item) =>
          item.materials.some((m) => m.isEstimated)
        ).length,
      0
    );

    if (estimatedCount > 0) {
      console.warn(`\n${"=".repeat(60)}`);
      console.warn(
        `⚠️ NOTICE: ${estimatedCount} intervention(s) use estimated prices`
      );
      console.warn(`   These are marked as non-official in the report`);
      console.warn(`${"=".repeat(60)}`);
    }

    console.log("=".repeat(60) + "\n");

    return materialEstimates;
  } catch (error) {
    console.error("❌ Error calculating material costs:", error);

    if (error.message && error.message.includes("MISSING_OFFICIAL_RATES")) {
      console.warn(
        "⚠️ Some materials lack official rates, but continuing with available data"
      );
      console.warn(
        "   Please review the estimate and add missing rates to CPWD database"
      );
    }

    if (
      !error.message ||
      (!error.message.includes("MISSING") &&
        !error.message.includes("ESTIMATED"))
    ) {
      throw new Error(`Failed to calculate costs: ${error.message}`);
    }

    console.warn(
      `⚠️ Cost calculation completed with warnings: ${error.message}`
    );
    return [];
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
        const unitPrice = roundToDecimals(
          latestPrice?.unitPrice || item.unitPrice,
          2
        );
        const totalPrice = roundToDecimals(item.quantity * unitPrice, 2);

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
        totalCost: roundToDecimals(newTotal, 2),
      });
    }

    estimate.materialEstimates = updatedEstimates;
    estimate.totalMaterialCost = roundToDecimals(
      updatedEstimates.reduce((sum, e) => sum + e.totalCost, 0),
      2
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
