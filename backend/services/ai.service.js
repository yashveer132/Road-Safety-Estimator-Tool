import { generateContent, cleanJsonResponse } from "../config/gemini.js";
import {
  fetchIRCStandards,
  validateInterventionAgainstIRC,
  getIRCQuantityGuidelines,
} from "./irc.service.js";

export const parseInterventions = async (documentText) => {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("🤖 AI: PARSING INTERVENTIONS FROM DOCUMENT");
    console.log("=".repeat(60));
    console.log(`📄 Document length: ${documentText.length} characters`);

    const prompt = `
You are an expert road safety engineer analyzing intervention reports formatted in sections (A, B, C, etc.) with tables.

Document:
"""
${documentText.substring(0, 15000)} 
"""

The document contains sections like:
- SECTION A — ROAD SIGNS
- SECTION B — ROAD MARKINGS  
- SECTION C — PAVEMENT CONDITION
- SECTION D — TRAFFIC SIGNAL
- SECTION E — FACILITIES
- SECTION F — ROADSIDE FURNITURE

Each section has a table with columns:
- # (serial number)
- Chainage (location marker)
- Side (LHS/RHS)
- Road (road name/type)
- Observation (problem description)
- Recommendation (suggested intervention)
- IRC Clause (IRC standard reference)

Extract ALL interventions and organize them by section. For each intervention:
1. Section ID (A, B, C, etc.)
2. Section Name (Road Signs, Road Markings, etc.)
3. Serial number within section
4. Chainage + Side + Road combined as location
5. Observation (what was found)
6. Recommendation (what needs to be done)
7. IRC Clause reference

Return ONLY a JSON array with this exact structure:
[
  {
    "sectionId": "A",
    "sectionName": "ROAD SIGNS",
    "serialNo": 1,
    "chainage": "4+200",
    "side": "LHS",
    "road": "MCW",
    "observation": "The speed limit sign is absent before the academic zone.",
    "recommendation": "The maximum speed limit sign shall be provided for the school zone.",
    "ircClause": "IRC:67-2022, Cl. 14.8.8"
  },
  {
    "sectionId": "A",
    "sectionName": "ROAD SIGNS",
    "serialNo": 2,
    "chainage": "4+250",
    "side": "LHS",
    "road": "MCW",
    "observation": "The school ahead sign provided on MCW is non-standard.",
    "recommendation": "The non-standard school ahead sign shall be replaced by the standard sign.",
    "ircClause": "IRC:67-2022, Cl. 15.28"
  }
]

IMPORTANT:
- Extract ALL interventions from ALL sections
- Maintain the section grouping
- Keep serial numbers within each section
- Combine chainage, side, and road for complete location context
- Keep recommendation and IRC clause separate (they will be combined in display)
- Return valid JSON only, no additional text
- If no interventions found, return empty array []
`;

    const response = await generateContent(prompt);
    const interventions = cleanJsonResponse(response);

    console.log(`✅ Successfully parsed ${interventions.length} interventions`);

    const bySection = {};
    interventions.forEach((int) => {
      if (!bySection[int.sectionId]) {
        bySection[int.sectionId] = { name: int.sectionName, count: 0 };
      }
      bySection[int.sectionId].count++;
    });

    console.log("\n📊 Interventions by section:");
    Object.entries(bySection).forEach(([id, info]) => {
      console.log(`   ${id} - ${info.name}: ${info.count} interventions`);
    });
    console.log("=".repeat(60) + "\n");

    return Array.isArray(interventions) ? interventions : [];
  } catch (error) {
    console.error("❌ Error parsing interventions:", error);
    throw new Error(`Failed to parse interventions: ${error.message}`);
  }
};

export const mapToIRCStandards = async (interventions) => {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("🤖 AI: MAPPING TO IRC STANDARDS");
    console.log("=".repeat(60));
    console.log(`📚 Processing ${interventions.length} interventions...`);

    const ircStandards = await fetchIRCStandards();
    console.log(
      `📋 Loaded ${ircStandards.length} IRC standards for validation`
    );

    const interventionsBySection = interventions.reduce((acc, int) => {
      if (!acc[int.sectionId]) {
        acc[int.sectionId] = [];
      }
      acc[int.sectionId].push(int);
      return acc;
    }, {});

    const allMappings = [];

    for (const [sectionId, sectionInterventions] of Object.entries(
      interventionsBySection
    )) {
      console.log(
        `\n📋 Processing Section ${sectionId} - ${sectionInterventions[0].sectionName} (${sectionInterventions.length} items)...`
      );

      const interventionsList = sectionInterventions
        .map(
          (int) =>
            `${int.serialNo}. [${int.chainage} ${int.side} ${int.road}] ${int.recommendation} (${int.ircClause})`
        )
        .join("\n");

      const prompt = `
You are an expert on Indian Roads Congress (IRC) standards. For each intervention below, provide detailed technical specifications and material requirements.

Section ${sectionId} - ${sectionInterventions[0].sectionName}:
${interventionsList}

Available IRC Standards:
- IRC:35 (Code of Practice for Road Markings)
- IRC:67 (Code of Practice for Road Signs)
- IRC:99 (Tentative Guidelines on the Provision of Safety Barriers)
- IRC:SP:73 (Manual on Road Safety Measures and Safety Audit)
- IRC:SP:84 (Manual for Survey, Investigation and Preparation of Road Projects)
- IRC:SP:87 (Guidelines for the Design, Installation and Maintenance of Road Safety Audit)
- IRC:79 (Recommended Practice for Road Delineators)
- IRC:82 (Code of Practice for Maintenance of Bituminous Road Surfaces)
- IRC:93 (Guidelines on Design and Installation of Road Traffic Signals)

For each intervention, provide:
1. The IRC standard code and clause already mentioned
2. Specific technical specification details from that clause
3. Material requirements based on the specification
4. Estimated quantity needed (calculate from description if possible)

Return ONLY a JSON array with this exact structure:
[
  {
    "sectionId": "A",
    "serialNo": 1,
    "recommendation": "The maximum speed limit sign shall be provided for the school zone.",
    "ircCode": "IRC:67-2022",
    "clause": "Cl. 14.8.8",
    "specification": "Speed limit regulatory sign, Type B, Size 600mm dia, Class III retroreflective sheeting",
    "materials": [
      {
        "item": "Retroreflective Sheeting Type III",
        "quantity": 0.28,
        "unit": "sqm",
        "details": "High intensity grade for speed limit sign"
      },
      {
        "item": "Aluminum Sign Plate 2mm",
        "quantity": 1,
        "unit": "nos",
        "details": "600mm diameter circular plate"
      },
      {
        "item": "GI Pipe Post 50mm",
        "quantity": 1,
        "unit": "nos",
        "details": "2.5m height including foundation"
      }
    ]
  }
]

IMPORTANT:
- Use the IRC clause already provided in the intervention
- Provide accurate technical specifications
- Break down materials into individual items
- Calculate realistic quantities
- Use standard units (sqm, m, kg, nos, etc.)
- Return valid JSON only
`;

      const response = await generateContent(prompt);
      const mappings = cleanJsonResponse(response);
      allMappings.push(...mappings);

      console.log(
        `   ✅ Mapped ${mappings.length} interventions with specifications`
      );
    }

    console.log("\n🔍 Validating interventions against IRC standards...");
    const validatedMappings = allMappings.map((mapping) => {
      const intervention = interventions.find(
        (int) =>
          int.sectionId === mapping.sectionId &&
          int.serialNo === mapping.serialNo
      );

      if (intervention) {
        const validation = validateInterventionAgainstIRC(
          { type: intervention.sectionName, parameters: mapping.specification },
          ircStandards
        );

        return {
          ...mapping,
          validation: {
            isValid: validation.valid,
            issues: validation.issues,
            recommendations: validation.recommendations,
            standard: validation.standard,
          },
        };
      }

      return mapping;
    });

    console.log(`\n✅ Total IRC mappings created: ${validatedMappings.length}`);
    console.log("=".repeat(60) + "\n");
    return validatedMappings;
  } catch (error) {
    console.error("❌ Error mapping to IRC standards:", error);
    console.log("🔄 Using fallback data from database for IRC mappings...");

    const fallbackMappings = [];

    for (const intervention of interventions) {
      let mapping = null;

      switch (intervention.sectionId) {
        case "A":
          mapping = {
            sectionId: "A",
            serialNo: intervention.serialNo,
            recommendation: intervention.recommendation,
            ircCode: "IRC:67-2022",
            clause: intervention.ircClause || "Cl. 14.8.8",
            specification:
              "Standard regulatory sign with retroreflective sheeting",
            materials: [
              {
                item: "Retroreflective Sheeting Type III",
                quantity: 0.28,
                unit: "sqm",
                details: "High intensity grade",
              },
              {
                item: "Aluminum Sign Plate 2mm",
                quantity: 1,
                unit: "nos",
                details: "600mm diameter",
              },
              {
                item: "GI Pipe Post 50mm",
                quantity: 1,
                unit: "nos",
                details: "2.5m height",
              },
            ],
          };
          break;

        case "B":
          mapping = {
            sectionId: "B",
            serialNo: intervention.serialNo,
            recommendation: intervention.recommendation,
            ircCode: "IRC:35-2015",
            clause: intervention.ircClause || "Cl. 3.1",
            specification: "Longitudinal markings with retroreflective paint",
            materials: [
              {
                item: "Road Marking Paint White",
                quantity: 200,
                unit: "sqm",
                details: "Retroreflective thermoplastic paint",
              },
            ],
          };
          break;

        case "C":
          mapping = {
            sectionId: "C",
            serialNo: intervention.serialNo,
            recommendation: intervention.recommendation,
            ircCode: "IRC:82-2023",
            clause: intervention.ircClause || "Cl. 7.5.3.5",
            specification: "Pothole repair with bituminous mix",
            materials: [
              {
                item: "Bituminous Concrete",
                quantity: 2.5,
                unit: "cum",
                details: "Dense graded bituminous concrete",
              },
            ],
          };
          break;

        case "D":
          mapping = {
            sectionId: "D",
            serialNo: intervention.serialNo,
            recommendation: intervention.recommendation,
            ircCode: "IRC:93-1985",
            clause: intervention.ircClause || "Cl. 4.2",
            specification: "Solar blinker maintenance",
            materials: [
              {
                item: "Solar Blinker Unit",
                quantity: 1,
                unit: "nos",
                details: "LED solar powered blinker",
              },
            ],
          };
          break;

        case "E":
          mapping = {
            sectionId: "E",
            serialNo: intervention.serialNo,
            recommendation: intervention.recommendation,
            ircCode: "IRC:SP:73-2018",
            clause: intervention.ircClause || "Cl. 12.4",
            specification: "Street lighting installation",
            materials: [
              {
                item: "LED Street Light 50W",
                quantity: 10,
                unit: "nos",
                details: "Solar powered LED fixtures",
              },
              {
                item: "Light Pole 6m",
                quantity: 10,
                unit: "nos",
                details: "Galvanized steel poles",
              },
            ],
          };
          break;

        case "F":
          mapping = {
            sectionId: "F",
            serialNo: intervention.serialNo,
            recommendation: intervention.recommendation,
            ircCode: "IRC:79-2019",
            clause: intervention.ircClause || "Cl. 4",
            specification: "Road delineators installation",
            materials: [
              {
                item: "Road Delineator",
                quantity: 20,
                unit: "nos",
                details: "Reflective delineators",
              },
            ],
          };
          break;

        default:
          mapping = {
            sectionId: intervention.sectionId,
            serialNo: intervention.serialNo,
            recommendation: intervention.recommendation,
            ircCode: "IRC:SP:73-2018",
            clause: "General",
            specification: "Standard road safety intervention",
            materials: [],
          };
      }

      if (mapping) {
        fallbackMappings.push(mapping);
      }
    }

    console.log(
      `✅ Generated ${fallbackMappings.length} fallback IRC mappings`
    );
    return fallbackMappings;
  }
};

export const extractMaterialRequirements = async (intervention, ircMapping) => {
  try {
    const prompt = `
You are a quantity surveyor analyzing road safety material requirements. Based on the intervention and IRC specification, determine the required materials and quantities.

Intervention: ${intervention.name}
Description: ${intervention.description}
Quantity: ${intervention.quantity || "Not specified"} ${intervention.unit || ""}
IRC Standard: ${ircMapping.ircCode}
Specification: ${ircMapping.specification}

Identify all materials needed for this intervention. For each material:
1. Item name
2. Description
3. Quantity required (calculate if possible)
4. Unit of measurement
5. Any assumptions made

Return ONLY a JSON array with this structure:
[
  {
    "itemName": "Retro-reflective Sheeting Type III",
    "description": "High-intensity grade reflective material for traffic signs",
    "quantity": 12.15,
    "unit": "sqm",
    "assumptions": ["Sign size: 900mm x 900mm", "15 signs required", "5% wastage included"]
  },
  {
    "itemName": "Aluminum Sign Plate",
    "description": "2mm thick aluminum sheet for sign substrate",
    "quantity": 15,
    "unit": "numbers",
    "assumptions": ["One plate per sign"]
  }
]

IMPORTANT:
- List ONLY materials (exclude labor, installation, taxes)
- Calculate realistic quantities based on specifications
- Include all assumptions clearly
- Use standard measurement units (sqm, meters, kg, numbers, etc.)
- Return valid JSON only
`;

    const response = await generateContent(prompt);
    const materials = cleanJsonResponse(response);

    return Array.isArray(materials) ? materials : [];
  } catch (error) {
    console.error("Error extracting material requirements:", error);
    throw new Error(`Failed to extract materials: ${error.message}`);
  }
};

export const generateCostRationale = async (
  intervention,
  materials,
  ircMapping,
  totalCost
) => {
  try {
    const materialsText = materials
      .map(
        (m) =>
          `${m.itemName}: ${m.quantity} ${m.unit} @ ₹${m.unitPrice} = ₹${
            m.totalPrice
          } (${m.source || "CPWD SOR"})`
      )
      .join("\n");

    const prompt = `
Generate a professional, audit-ready rationale for this road safety intervention cost estimate. Follow this exact format:

**Format Template:**
📌 **Rationale:**
[One paragraph explaining what’s being costed and which IRC standard governs it. Include specific clause reference.]

**Key Assumptions:**
• [Source and version of rates with SOR item codes if available]
• [Reference to IRC clause for size/type specifications]
• [Special design or material notes]
• [Price tolerance or validity note]

[Confidence tag: 🟢 Fully validated / 🟡 Fallback rate used / 🔴 Assumed]

**Technical Details:**
Intervention: ${intervention.name}
IRC Reference: ${ircMapping.ircCode} - ${ircMapping.clause}
Materials: ${materialsText}
Total Cost: ₹${totalCost}

Requirements:
1. Start rationale with varied, professional openers (avoid "The cost estimate is derived...")
2. Include specific IRC clause numbers and SOR item codes
3. Limit assumptions to 3-4 most relevant bullets
4. Add confidence tag based on data source reliability
5. Keep rationale concise (under 150 words)
6. Use proper formatting for technical references
7. Add brief context about why this intervention matters

Return a JSON object with this structure:
{
  "rationale": "This intervention's cost has been computed using IRC:67–2022 specifications for regulatory signage. Quantities follow standard sign dimensions while material rates are taken from CPWD SOR 2024 (Items 16.53, 14.28, 18.12).",
  "assumptions": [
    "Retroreflective Sheeting Type III used for regulatory sign as per IRC:67 Cl. 4.3.2",
    "Standard GI pipe post (50 mm dia) with 0.1 m³ concrete footing for stable foundation",
    "Prices reflect CPWD SOR 2024 (Delhi Region) rates inclusive of standard wastage",
    "±5% cost tolerance due to regional rate variation"
  ],
  "confidence": "high",
  "confidenceTag": "🟢 Fully validated using CPWD SOR 2024 items",
  "ircClause": "${ircMapping.ircCode}, ${ircMapping.clause}",
  "sorItems": ["16.53", "14.28", "18.12"]
}

IMPORTANT:
- Make it sound human and professional, not AI-generic
- Include specific clause numbers and SOR codes
- Add context about intervention importance
- Use confidence tags (🟢🟡🔴)
- Keep assumptions focused and relevant
- Return valid JSON only
`;

    const response = await generateContent(prompt);
    const result = cleanJsonResponse(response);

    return {
      rationale:
        result.rationale ||
        `Cost calculated for ${intervention.name} based on ${ircMapping.ircCode} specifications and current market rates.`,
      assumptions: result.assumptions || [
        "Standard specifications applied as per IRC guidelines",
        "Material costs only (excludes labor and installation)",
        "Prices sourced from CPWD SOR 2024",
      ],
      confidence: result.confidence || "medium",
      confidenceTag:
        result.confidenceTag || "🟡 Fallback rate used (verify with DPR)",
      ircClause:
        result.ircClause || `${ircMapping.ircCode}, ${ircMapping.clause}`,
      sorItems: result.sorItems || [],
      notes: result.notes || "Excludes labor, installation, and taxes",
    };
  } catch (error) {
    console.error("Error generating rationale:", error);
    return {
      rationale: `This intervention provides essential road safety improvements as per ${ircMapping.ircCode} specifications. Material quantities and rates are determined in accordance with current engineering standards.`,
      assumptions: [
        "Standard specifications applied as per IRC guidelines",
        "Material costs only (excludes labor and installation)",
        "Prices reflect CPWD SOR 2024 rates where available",
      ],
      confidence: "medium",
      confidenceTag:
        "🟡 Fallback rate used (check with detailed project report)",
      ircClause: `${ircMapping.ircCode}, ${ircMapping.clause}`,
      sorItems: [],
      notes:
        "Excludes labor, installation, equipment rental, transportation, and taxes",
    };
  }
};

export default {
  parseInterventions,
  mapToIRCStandards,
  extractMaterialRequirements,
  generateCostRationale,
};
