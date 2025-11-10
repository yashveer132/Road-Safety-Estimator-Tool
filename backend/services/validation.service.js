import { roundToDecimals, formatCurrency } from "../utils/format.js";
import { normalizeUnit, isCountableUnit } from "../utils/unit.js";

const SOR_ITEM_REGISTRY = {
  "Road Signs": {
    "Retroreflective Sheeting Type III": "14.15",
    "Aluminum Sheets for Road Signs": "14.16",
    "MS Pipe Support for Signs": "14.17",
    "GI Pipe Post 50mm": "14.17",
    Concrete: "CPWD-2024-BC-001",
  },
  "Road Markings": {
    "Thermoplastic Paint or Cold Plastic Paint": "14.18",
    "Thermoplastic Road Marking Paint": "14.18",
    "Glass Beads": "14.19",
    "Glass Beads for Road Markings": "14.19",
    "Retroreflective Road Studs": "14.23",
    "Retroreflective Road Studs (Red-White Bidirectional)": "14.23",
    "Epoxy Adhesive": "CPWD-2024-AD-001",
  },
  "Pavement Condition": {
    "Hot Mix Asphalt (HMA) Patching Mix": "CPWD-2024-BC-002",
    "Bituminous Emulsion": "CPWD-2024-BE-001",
    "Bituminous Emulsion (SS Grade)": "CPWD-2024-BE-001",
    "Tack Coat Sprayer": "CPWD-2024-SP-001",
    "Compaction Equipment": "CPWD-2024-CE-001",
  },
  "Traffic Signal": {
    "Solar Panel (Replacement)": "14.24-SP",
    "Battery (Replacement)": "14.24-BAT",
    "Amber LED Blinker Unit (Replacement)": "14.24",
    "Solar LED Blinker": "14.24",
    "Wiring and Connectors": "CPWD-2024-WC-001",
    "Mounting Hardware (Nuts, Bolts, Washers)": "CPWD-2024-MH-001",
    "Rust Preventive Coating": "14.26",
  },
  Facilities: {
    "LED Luminaire": "CPWD-2024-LED-001",
    "Hot-Dip Galvanized Steel Pole": "CPWD-2024-LP-003",
    "Underground Cable": "CPWD-2024-UC-001",
    "Cable Duct": "CPWD-2024-CD-001",
    "Control Panel": "CPWD-2024-CP-001",
    "Foundation Concrete": "CPWD-2024-BC-001",
    "Earthing Electrode": "CPWD-2024-EE-001",
    "LED Street Light": "CPWD-2024-LED-001",
    "Lighting Pole": "CPWD-2024-LP-003",
  },
  "Roadside Furniture": {
    "Flexible Marker Mount (FMM)": "14.22",
    "Retroreflective Delineator": "14.22",
    "Adhesive/Epoxy": "CPWD-2024-AD-001",
    Fasteners: "CPWD-2024-FT-001",
    "Delineator Posts": "14.22",
  },
};

const REASONABLE_PRICE_RANGES = {
  sqm: { min: 50, max: 5000, category: "area" },
  m: { min: 20, max: 10000, category: "length" },
  kg: { min: 10, max: 2000, category: "weight" },
  nos: { min: 50, max: 50000, category: "count" },
  cum: { min: 500, max: 20000, category: "volume" },
  litre: { min: 20, max: 2000, category: "liquid" },
  set: { min: 100, max: 50000, category: "count" },
  job: { min: 1000, max: 500000, category: "lumpsum" },
};

export const validateQuantities = (materials, sectionName) => {
  const issues = [];
  const warnings = [];

  materials.forEach((material, index) => {
    const normalizedUnit = normalizeUnit(material.unit);
    const isCountable = isCountableUnit(normalizedUnit);
    const quantity = Number(material.quantity) || 0;
    const materialName =
      material.itemName || material.item || "Unknown Material";

    if (isCountable && quantity % 1 !== 0) {
      issues.push({
        severity: "high",
        material: materialName,
        problem: `Fractional quantity (${quantity}) for countable unit (${normalizedUnit})`,
        suggestion: `Round to ${Math.round(
          quantity
        )} or change unit to measurable unit`,
        fixed: false,
        index,
      });
    }

    if (quantity <= 0) {
      issues.push({
        severity: "critical",
        material: materialName,
        problem: `Invalid quantity: ${quantity}`,
        suggestion: "Quantity must be positive",
        fixed: false,
        index,
      });
    }

    if (quantity > 100000) {
      warnings.push({
        severity: "medium",
        material: materialName,
        problem: `Unusually large quantity: ${quantity} ${normalizedUnit}`,
        suggestion: "Verify if correct - check material breakdown",
        index,
      });
    }

    const lower = materialName.toLowerCase();
    if (
      (lower.includes("sign") || lower.includes("plate")) &&
      normalizedUnit === "nos"
    ) {
      if (quantity > 100) {
        warnings.push({
          severity: "low",
          material: materialName,
          problem: `Large quantity of countable items (${quantity} nos)`,
          suggestion: "Confirm if this represents multiple sign installations",
          index,
        });
      }
    }
  });

  return { issues, warnings, hasIssues: issues.length > 0 };
};

export const validatePricing = (materials) => {
  const issues = [];
  const warnings = [];

  materials.forEach((material, index) => {
    const normalizedUnit = normalizeUnit(material.unit);
    const unitPrice = Number(material.unitPrice) || 0;
    const totalPrice = Number(material.totalPrice) || 0;
    const materialName =
      material.itemName || material.item || "Unknown Material";

    if (unitPrice <= 0) {
      issues.push({
        severity: "high",
        material: materialName,
        problem: `Invalid unit price: ₹${unitPrice}`,
        suggestion: "Price must be positive; check source data",
        index,
      });
    }

    const range = REASONABLE_PRICE_RANGES[normalizedUnit];
    if (range) {
      if (unitPrice < range.min) {
        warnings.push({
          severity: "medium",
          material: materialName,
          problem: `Price ₹${unitPrice}/${normalizedUnit} is unusually low`,
          suggestion: `Typical range: ₹${range.min}-${range.max}/${normalizedUnit}; verify source`,
          index,
        });
      }
      if (unitPrice > range.max) {
        warnings.push({
          severity: "medium",
          material: materialName,
          problem: `Price ₹${unitPrice}/${normalizedUnit} is unusually high`,
          suggestion: `Typical range: ₹${range.min}-${range.max}/${normalizedUnit}; verify source`,
          index,
        });
      }
    }

    const source = material.source || "";
    if (
      source.includes("DB_SIMILAR_ITEMS") ||
      source.includes("CATEGORY_FALLBACK") ||
      source.includes("DEFAULT_FALLBACK")
    ) {
      issues.push({
        severity: "high",
        material: materialName,
        problem: `Non-official rate source: ${source}`,
        suggestion:
          "Replace with official CPWD SOR or GeM rate before final approval",
        index,
      });
    }

    if (!material.itemId || material.itemId.includes("UNKNOWN")) {
      warnings.push({
        severity: "low",
        material: materialName,
        problem: "Missing SOR item code for traceability",
        suggestion: "Recommend linking to official SOR item code",
        index,
      });
    }
  });

  return { issues, warnings, hasIssues: issues.length > 0 };
};

export const validateInterventionCost = (intervention, totalCost) => {
  const issues = [];
  const warnings = [];

  const lower = intervention.recommendation?.toLowerCase() || "";
  if (lower.includes("streetlight") || lower.includes("street light")) {
    if (totalCost < 500000) {
      warnings.push({
        severity: "medium",
        intervention: "Streetlight Installation",
        problem: `Cost (₹${formatCurrency(
          totalCost
        )}) seems low for street lighting`,
        suggestion:
          "Verify number of lights, cable length, and pole specifications",
      });
    }
  }

  if (lower.includes("sign")) {
    if (totalCost < 4000) {
      warnings.push({
        severity: "medium",
        intervention: "Sign Installation",
        problem: `Cost (₹${formatCurrency(
          totalCost
        )}) seems low for sign installation`,
        suggestion:
          "Verify sign size, post height, and concrete footing specifications",
      });
    }
    if (totalCost > 50000) {
      warnings.push({
        severity: "low",
        intervention: "Sign Installation",
        problem: `Cost (₹${formatCurrency(
          totalCost
        )}) is higher than typical single sign`,
        suggestion: "Check if this covers multiple sign installations",
      });
    }
  }

  if (lower.includes("marking") || lower.includes("repaint")) {
    if (totalCost < 50) {
      warnings.push({
        severity: "high",
        intervention: "Road Marking",
        problem: `Cost (₹${formatCurrency(
          totalCost
        )}) unusually low for road marking`,
        suggestion:
          "Check quantity calculations and unit rates for paint/glass beads",
      });
    }
  }

  return { issues, warnings, hasIssues: issues.length > 0 };
};

export const getSORItemCode = (materialName, sectionName = null) => {
  for (const [section, items] of Object.entries(SOR_ITEM_REGISTRY)) {
    if (section === sectionName) {
      if (items[materialName]) {
        return { code: items[materialName], section, confidence: "high" };
      }
    }
  }

  for (const [section, items] of Object.entries(SOR_ITEM_REGISTRY)) {
    for (const [itemName, code] of Object.entries(items)) {
      if (itemName.toLowerCase().includes(materialName.toLowerCase())) {
        return { code, section, confidence: "medium" };
      }
      if (materialName.toLowerCase().includes(itemName.toLowerCase())) {
        return { code, section, confidence: "medium" };
      }
    }
  }

  return { code: null, section: null, confidence: "none" };
};

export const generateValidationReport = (materialEstimates, interventions) => {
  const report = {
    timestamp: new Date().toISOString(),
    sections: [],
    summary: {
      totalSections: 0,
      totalInterventions: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumWarnings: 0,
      lowWarnings: 0,
      complianceScore: 0,
    },
    recommendations: [],
  };

  let totalItems = 0;
  let passedItems = 0;

  materialEstimates.forEach((section) => {
    const sectionReport = {
      sectionId: section.sectionId,
      sectionName: section.sectionName,
      interventions: [],
      issues: [],
      warnings: [],
    };

    section.items.forEach((item) => {
      totalItems++;
      const quantityValidation = validateQuantities(
        [item],
        section.sectionName
      );
      const pricingValidation = validatePricing([item]);
      const costValidation = validateInterventionCost(item, item.totalCost);
      const sorCode = getSORItemCode(
        item.materials[0]?.itemName,
        section.sectionName
      );

      const itemReport = {
        interventionNo: item.no,
        recommendation: item.recommendation,
        hasIssues:
          quantityValidation.issues.length > 0 ||
          pricingValidation.issues.length > 0,
        issues: [
          ...quantityValidation.issues,
          ...pricingValidation.issues,
          ...costValidation.issues,
        ],
        warnings: [
          ...quantityValidation.warnings,
          ...pricingValidation.warnings,
          ...costValidation.warnings,
        ],
        sorCode: sorCode.code,
        sorCodeConfidence: sorCode.confidence,
      };

      if (!itemReport.hasIssues) {
        passedItems++;
      }

      sectionReport.interventions.push(itemReport);

      sectionReport.issues.push(...itemReport.issues);
      sectionReport.warnings.push(...itemReport.warnings);
    });

    report.sections.push(sectionReport);
  });

  const allIssues = report.sections.flatMap((s) => s.issues);
  report.summary.totalSections = materialEstimates.length;
  report.summary.totalInterventions = interventions.length;
  report.summary.criticalIssues = allIssues.filter(
    (i) => i.severity === "critical"
  ).length;
  report.summary.highIssues = allIssues.filter(
    (i) => i.severity === "high"
  ).length;
  report.summary.mediumWarnings = report.sections
    .flatMap((s) => s.warnings)
    .filter((w) => w.severity === "medium").length;
  report.summary.lowWarnings = report.sections
    .flatMap((s) => s.warnings)
    .filter((w) => w.severity === "low").length;
  report.summary.complianceScore = Math.round((passedItems / totalItems) * 100);

  if (report.summary.criticalIssues > 0) {
    report.recommendations.push({
      priority: "critical",
      action: "Fix all critical issues before submission",
      count: report.summary.criticalIssues,
    });
  }

  if (report.summary.highIssues > 0) {
    report.recommendations.push({
      priority: "high",
      action: "Replace non-official rates with CPWD SOR or GeM entries",
      count: report.summary.highIssues,
    });
  }

  if (report.summary.mediumWarnings > 0) {
    report.recommendations.push({
      priority: "medium",
      action: "Verify quantities and pricing against reference documents",
      count: report.summary.mediumWarnings,
    });
  }

  return report;
};

export const flagImplausibleCosts = (materials) => {
  const outliers = [];

  const totalCost = materials.reduce((sum, m) => sum + m.totalPrice, 0);

  materials.forEach((material) => {
    const percentage = (material.totalPrice / totalCost) * 100;

    if (percentage > 75) {
      outliers.push({
        material: material.itemName,
        cost: material.totalPrice,
        percentage: roundToDecimals(percentage, 1),
        suggestion:
          "This item represents >75% of total cost; verify quantity and rate",
        severity: "high",
      });
    } else if (percentage > 50) {
      outliers.push({
        material: material.itemName,
        cost: material.totalPrice,
        percentage: roundToDecimals(percentage, 1),
        suggestion: "This item represents >50% of total cost; confirm quantity",
        severity: "medium",
      });
    }
  });

  return outliers;
};

export default {
  validateQuantities,
  validatePricing,
  validateInterventionCost,
  getSORItemCode,
  generateValidationReport,
  flagImplausibleCosts,
};
