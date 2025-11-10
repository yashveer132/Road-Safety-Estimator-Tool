import { roundToDecimals } from "../utils/format.js";

export const validateQuantities = (itemsWithPrices, sectionName) => {
  const issues = [];

  itemsWithPrices.forEach((item) => {
    if (item.quantity <= 0) {
      issues.push({
        severity: "error",
        material: item.itemName,
        problem: `Invalid quantity: ${item.quantity} ${item.unit}`,
      });
    }

    if (item.quantity > 100000) {
      issues.push({
        severity: "warning",
        material: item.itemName,
        problem: `Unusually large quantity: ${item.quantity} ${item.unit}`,
      });
    }

    if (isNaN(item.quantity)) {
      issues.push({
        severity: "error",
        material: item.itemName,
        problem: `Non-numeric quantity: ${item.quantity}`,
      });
    }
  });

  return {
    hasIssues: issues.length > 0,
    issues,
  };
};

export const validatePricing = (itemsWithPrices) => {
  const issues = [];

  itemsWithPrices.forEach((item) => {
    if (item.unitPrice <= 0) {
      issues.push({
        severity: "error",
        material: item.itemName,
        problem: `Invalid unit price: ${item.unitPrice} per ${item.unit}`,
      });
    }

    if (item.unitPrice > 1000000) {
      issues.push({
        severity: "warning",
        material: item.itemName,
        problem: `Unusually high unit price: ₹${item.unitPrice} per ${item.unit}`,
      });
    }

    if (!item.source) {
      issues.push({
        severity: "warning",
        material: item.itemName,
        problem: "Missing price source information",
      });
    }

    if (item.confidence === "low") {
      issues.push({
        severity: "warning",
        material: item.itemName,
        problem: "Low confidence in price estimate",
      });
    }
  });

  return {
    hasIssues: issues.length > 0,
    issues,
  };
};

export const validateInterventionCost = (intervention, totalCost) => {
  const issues = [];

  if (totalCost <= 0) {
    issues.push({
      severity: "error",
      problem: "Total cost is zero or negative",
    });
  }

  if (totalCost > 50000000) {
    issues.push({
      severity: "warning",
      problem: `Unusually high total cost: ₹${totalCost.toLocaleString()}`,
    });
  }

  return {
    hasIssues: issues.length > 0,
    issues,
  };
};

export const getSORItemCode = (itemName, unit) => {
  const sorMappings = {
    cement: { code: "2.1.1" },
    steel: { code: "4.1.1" },
    aggregate: { code: "3.1.1" },
    sand: { code: "3.2.1" },
    bitumen: { code: "5.1.1" },
    paint: { code: "8.1.1" },
    "sign board": { code: "15.1.1" },
    "retro reflective": { code: "15.2.1" },
    "solar panel": { code: "16.1.1" },
    "led light": { code: "16.2.1" },
  };

  const normalizedItem = itemName.toLowerCase().replace(/\s+/g, " ").trim();

  for (const [key, value] of Object.entries(sorMappings)) {
    if (normalizedItem.includes(key)) {
      return value;
    }
  }

  return null;
};

export const flagImplausibleCosts = (itemsWithPrices) => {
  if (itemsWithPrices.length === 0) return [];

  const totalCost = itemsWithPrices.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

  const outliers = itemsWithPrices
    .map((item) => ({
      material: item.itemName,
      cost: item.totalPrice,
      percentage: (item.totalPrice / totalCost) * 100,
    }))
    .filter((item) => item.percentage > 50)
    .sort((a, b) => b.percentage - a.percentage);

  return outliers;
};

export default {
  validateQuantities,
  validatePricing,
  validateInterventionCost,
  getSORItemCode,
  flagImplausibleCosts,
};
