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
import {
  calculateThermoplasticQuantities,
  calculatePedestrianCrossingQuantities,
  calculateRoadStudQuantities,
  calculatePotholeRepairQuantities,
  calculateRoadSignQuantities,
  calculateGuardrailQuantities,
  calculateChevronQuantities,
  calculateSpeedHumpQuantities,
  calculateFootpathQuantities,
  calculateDrainageQuantities,
} from "../utils/dimension-parser.js";

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

      let materialsToProcess = mapping.materials || [];
      let quantitySource = "AI_EXTRACTED";

      if (
        materialsToProcess.length === 0 ||
        materialsToProcess.every((m) => !m.quantity || m.quantity <= 0)
      ) {
        console.warn(
          `   ⚠️ AI failed to extract quantities, using fallback parser...`
        );
        quantitySource = "FALLBACK_PARSER";

        const sectionName = intervention.sectionName.toUpperCase();
        const recommendation = intervention.recommendation.toLowerCase();
        const observation = intervention.observation.toLowerCase();
        let fallbackMaterials = null;

        if (sectionName.includes("SIGN")) {
          console.log(`      🔧 Calculating road sign quantities...`);
          const result = calculateRoadSignQuantities(
            intervention.observation,
            intervention.recommendation
          );
          fallbackMaterials = result.materials;
          console.log(`      ✅ Calculated for ${result.size} sign`);
        } else if (
          sectionName.includes("ROAD MARKING") ||
          sectionName.includes("MARKINGS")
        ) {
          if (
            recommendation.includes("longitudinal") ||
            recommendation.includes("edge line") ||
            recommendation.includes("center line") ||
            recommendation.includes("lane marking") ||
            (observation.includes("faded") && observation.includes("marking"))
          ) {
            console.log(
              `      🔧 Calculating thermoplastic marking quantities...`
            );
            const result = calculateThermoplasticQuantities(
              intervention.observation,
              intervention.chainage
            );
            fallbackMaterials = result.materials;
            console.log(
              `      ✅ Calculated for ${result.length}m marking (${result.area} sqm)`
            );
          } else if (
            recommendation.includes("pedestrian crossing") ||
            recommendation.includes("zebra")
          ) {
            console.log(
              `      🔧 Calculating pedestrian crossing quantities...`
            );
            const result = calculatePedestrianCrossingQuantities(
              intervention.observation
            );
            fallbackMaterials = result.materials;
            console.log(
              `      ✅ Calculated for ${result.width}m × ${result.length}m crossing`
            );
          } else if (
            recommendation.includes("road stud") ||
            recommendation.includes("cat eye")
          ) {
            console.log(`      🔧 Calculating road stud quantities...`);
            const result = calculateRoadStudQuantities(
              intervention.observation,
              intervention.chainage
            );
            fallbackMaterials = result.materials;
            console.log(
              `      ✅ Calculated ${result.numStuds} studs for ${result.length}m`
            );
          }
        } else if (
          sectionName.includes("PAVEMENT") ||
          sectionName.includes("POTHOLE") ||
          recommendation.includes("pothole") ||
          recommendation.includes("patch")
        ) {
          console.log(`      🔧 Calculating pothole repair quantities...`);
          const result = calculatePotholeRepairQuantities(
            intervention.observation
          );
          fallbackMaterials = result.materials;
          console.log(
            `      ✅ Calculated for ${result.area} sqm × ${result.depth}m depth`
          );
        } else if (
          sectionName.includes("DELINEATOR") ||
          sectionName.includes("SAFETY FURNITURE") ||
          sectionName.includes("ROADSIDE")
        ) {
          if (
            recommendation.includes("guardrail") ||
            recommendation.includes("barrier") ||
            recommendation.includes("crash barrier")
          ) {
            console.log(`      🔧 Calculating guardrail quantities...`);
            const result = calculateGuardrailQuantities(
              intervention.observation,
              intervention.chainage
            );
            fallbackMaterials = result.materials;
            console.log(`      ✅ Calculated for ${result.length}m guardrail`);
          } else if (
            recommendation.includes("chevron") ||
            recommendation.includes("curve marker")
          ) {
            console.log(`      🔧 Calculating chevron board quantities...`);
            const result = calculateChevronQuantities(
              intervention.observation,
              intervention.chainage
            );
            fallbackMaterials = result.materials;
            console.log(
              `      ✅ Calculated ${result.numBoards} chevron boards`
            );
          } else {
            console.log(`      🔧 Using standard delineator quantities...`);
            fallbackMaterials = [
              {
                item: "Flexible Guidepost",
                quantity: 1,
                unit: "nos",
                details: "FP-750 type, 750mm height",
              },
              {
                item: "Adhesive for Delineator",
                quantity: 0.5,
                unit: "kg",
                details: "For fixing",
              },
              {
                item: "Fasteners",
                quantity: 1,
                unit: "set",
                details: "Bolts and nuts",
              },
            ];
          }
        } else if (
          sectionName.includes("PEDESTRIAN") ||
          sectionName.includes("FOOTPATH") ||
          sectionName.includes("SIDEWALK")
        ) {
          if (
            recommendation.includes("footpath") ||
            recommendation.includes("sidewalk") ||
            recommendation.includes("walkway")
          ) {
            console.log(`      🔧 Calculating footpath quantities...`);
            const result = calculateFootpathQuantities(
              intervention.observation,
              intervention.chainage
            );
            fallbackMaterials = result.materials;
            console.log(
              `      ✅ Calculated for ${result.length}m × ${result.width}m footpath`
            );
          } else if (
            recommendation.includes("speed hump") ||
            recommendation.includes("speed bump") ||
            recommendation.includes("rumble strip")
          ) {
            console.log(`      🔧 Calculating speed hump quantities...`);
            const result = calculateSpeedHumpQuantities(
              intervention.observation
            );
            fallbackMaterials = result.materials;
            console.log(`      ✅ Calculated ${result.quantity} speed hump(s)`);
          }
        } else if (
          sectionName.includes("DRAINAGE") ||
          sectionName.includes("UTILITIES") ||
          recommendation.includes("drain") ||
          recommendation.includes("culvert")
        ) {
          console.log(`      🔧 Calculating drainage quantities...`);
          const result = calculateDrainageQuantities(
            intervention.observation,
            intervention.chainage
          );
          fallbackMaterials = result.materials;
          console.log(`      ✅ Calculated for ${result.length}m drainage`);
        }

        if (fallbackMaterials && fallbackMaterials.length > 0) {
          materialsToProcess = fallbackMaterials;
          quantitySource = "FALLBACK_PARSER";
          console.log(
            `      ✅ Fallback parser extracted ${materialsToProcess.length} materials`
          );
        }
      } else {
        console.log(`      ✅ AI successfully extracted quantities`);
      }

      if (materialsToProcess && Array.isArray(materialsToProcess)) {
        console.log(
          `   🔧 Processing ${materialsToProcess.length} materials...`
        );

        for (const material of materialsToProcess) {
          try {
            console.log(`\n   📦 Material: ${material.item}`);

            if (!material.quantity || material.quantity <= 0) {
              console.warn(
                `      ⚠️ WARNING: Invalid or zero quantity for "${material.item}"`
              );
              console.warn(`      📝 Observation: ${intervention.observation}`);
              console.warn(
                `      💡 TIP: AI should extract dimensions from observation text`
              );
              console.warn(
                `      🔍 Expected patterns: "200m", "2.5 sqm", "20mm depth", "3.5m width"`
              );

              missingOfficialRates.push({
                itemName: material.item,
                unit: material.unit,
                error: "Invalid quantity (zero or negative)",
                observation: intervention.observation,
                suggestion:
                  "Check if observation contains dimensions that AI should have extracted",
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
              (priceInfo && priceInfo.official === false);

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
              quantitySource: quantitySource,
              quantityConfidence:
                quantitySource === "AI_EXTRACTED" ? "high" : "medium",
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

      // Add quantity extraction method to assumptions if using fallback
      if (
        quantitySource === "FALLBACK_PARSER" &&
        !assumptions.some((a) => a.includes("Quantities calculated"))
      ) {
        assumptions.unshift(
          "Quantities calculated using rule-based dimension parser (AI extraction fallback)"
        );
      }

      // Add stretch length assumption for street lighting if applicable
      if (
        intervention.sectionName.toUpperCase().includes("LIGHTING") &&
        !intervention.observation.match(/\d+\s*km|\d+\s*m/) &&
        !assumptions.some((a) => a.toLowerCase().includes("stretch"))
      ) {
        assumptions.push(
          "Assumed 500m typical road section length (not specified in observation)"
        );
      }

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
