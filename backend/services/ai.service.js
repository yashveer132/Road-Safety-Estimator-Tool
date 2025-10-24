import { generateContent, cleanJsonResponse } from "../config/gemini.js";

export const parseInterventions = async (documentText) => {
  try {
    console.log("🤖 AI: Parsing interventions from document...");

    const prompt = `
You are an expert road safety engineer analyzing intervention reports. Extract all road safety interventions from the following document.

Document:
"""
${documentText.substring(0, 15000)} 
"""

For each intervention found, extract:
1. Name/title of the intervention
2. Detailed description
3. Quantity (if mentioned)
4. Unit of measurement (if applicable)
5. Location/road section (if mentioned)
6. Priority level (High/Medium/Low based on context)

Return ONLY a JSON array with this exact structure:
[
  {
    "name": "Installation of Warning Signs",
    "description": "Install reflective warning signs at sharp curves",
    "quantity": 15,
    "unit": "numbers",
    "location": "NH-44, Km 125-130",
    "priority": "High"
  },
  {
    "name": "Road Marking",
    "description": "Thermoplastic road markings for edge lines",
    "quantity": 5000,
    "unit": "meters",
    "location": "State Highway 15",
    "priority": "Medium"
  }
]

IMPORTANT:
- Extract ALL interventions mentioned in the document
- If quantity/unit/location is not specified, use null
- Use "High", "Medium", or "Low" for priority
- Return valid JSON only, no additional text
- If no interventions found, return empty array []
`;

    const response = await generateContent(prompt);
    const interventions = cleanJsonResponse(response);

    console.log(`✅ Parsed ${interventions.length} interventions`);
    return Array.isArray(interventions) ? interventions : [];
  } catch (error) {
    console.error("Error parsing interventions:", error);
    throw new Error(`Failed to parse interventions: ${error.message}`);
  }
};

export const mapToIRCStandards = async (interventions) => {
  try {
    console.log("🤖 AI: Mapping interventions to IRC standards...");

    const interventionsList = interventions
      .map((int, idx) => `${idx + 1}. ${int.name}: ${int.description}`)
      .join("\n");

    const prompt = `
You are an expert on Indian Roads Congress (IRC) standards. Map the following road safety interventions to relevant IRC standard specifications.

Interventions:
${interventionsList}

Available IRC Standards:
- IRC:35 (Code of Practice for Road Markings)
- IRC:67 (Code of Practice for Road Signs)
- IRC:99 (Tentative Guidelines on the Provision of Safety Barriers)
- IRC:SP:84 (Manual for Survey, Investigation and Preparation of Road Projects)
- IRC:SP:87 (Guidelines for the Design, Installation and Maintenance of Road Safety Audit)

For each intervention, identify:
1. The most relevant IRC standard code
2. Specific clause/section number
3. Technical specification details
4. Why this standard is relevant

Return ONLY a JSON array with this exact structure:
[
  {
    "intervention": "Installation of Warning Signs",
    "ircCode": "IRC:67",
    "clause": "Section 4.3.2",
    "specification": "Retro-reflective Type III sheeting, size 900mm x 900mm for curve warning signs",
    "relevance": "Specifies design, size, and reflectivity requirements for warning signs on curves"
  },
  {
    "intervention": "Road Marking",
    "ircCode": "IRC:35",
    "clause": "Clause 6.2",
    "specification": "Thermoplastic material, white color, 100mm width for edge lines",
    "relevance": "Defines material specifications and dimensions for edge line markings"
  }
]

IMPORTANT:
- Map ALL interventions to appropriate IRC standards
- Provide accurate clause/section numbers
- Include specific technical specifications
- Return valid JSON only, no additional text
`;

    const response = await generateContent(prompt);
    const ircMappings = cleanJsonResponse(response);

    console.log(
      `✅ Mapped ${ircMappings.length} interventions to IRC standards`
    );
    return Array.isArray(ircMappings) ? ircMappings : [];
  } catch (error) {
    console.error("Error mapping to IRC standards:", error);
    throw new Error(`Failed to map IRC standards: ${error.message}`);
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
          `${m.itemName}: ${m.quantity} ${m.unit} @ ₹${m.unitPrice} = ₹${m.totalPrice}`
      )
      .join("\n");

    const prompt = `
Generate a clear, professional rationale explaining how this cost estimate was derived.

Intervention: ${intervention.name}
IRC Reference: ${ircMapping.ircCode} - ${ircMapping.clause}
Materials:
${materialsText}

Total Material Cost: ₹${totalCost}

Provide:
1. A clear explanation of the costing methodology
2. Key assumptions made
3. IRC clause used and why
4. Any limitations or notes

Return a JSON object with this structure:
{
  "rationale": "The cost estimate is based on IRC:67 specifications for warning signs...",
  "assumptions": [
    "Material prices sourced from CPWD SOR 2024",
    "Standard sign size as per IRC:67 clause 4.3.2",
    "5% wastage factor included"
  ],
  "notes": "Excludes installation labor and signpost foundation"
}

Return valid JSON only.
`;

    const response = await generateContent(prompt);
    const result = cleanJsonResponse(response);

    return result;
  } catch (error) {
    console.error("Error generating rationale:", error);
    return {
      rationale:
        "Cost calculated based on IRC specifications and current market rates",
      assumptions: ["Standard specifications applied", "Material costs only"],
      notes: "Excludes labor and installation costs",
    };
  }
};

export default {
  parseInterventions,
  mapToIRCStandards,
  extractMaterialRequirements,
  generateCostRationale,
};
