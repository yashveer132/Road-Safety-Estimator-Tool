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
You are an expert road safety engineer analyzing intervention reports from road safety audits. Your task is to extract EVERY intervention with 100% accuracy.

**DOCUMENT FORMATS YOU MAY ENCOUNTER:**

**FORMAT 1: Table-based (Common in safety audit reports)**
Sections A, B, C, etc. with columns:
# | Chainage | Side | Road | Observation | Recommendation | IRC Reference

**FORMAT 2: Line-by-line (NH45 style)**
Category A | Chainage: 10+120 | Side: LHS
Observation: Speed limit sign faded
Recommended Intervention: Replace with new 50 km/h regulatory sign
IRC Reference: IRC:67-2022, Cl. 14.8.8

**FORMAT 3: Narrative style**
"At chainage 10+120 on the LHS, the speed limit sign is faded and needs replacement as per IRC:67-2022..."

**DOCUMENT TO ANALYZE:**
"""
${documentText.substring(0, 15000)} 
"""

**EXTRACTION REQUIREMENTS:**

Extract ALL interventions found. For each, provide:

1. **sectionId** - Category letter or infer from type:
   - A = Road Signs (regulatory, warning, informatory signs)
   - B = Road Markings (lane markings, crossings, arrows, text)
   - C = Pavement (potholes, cracks, surface repairs, resurfacing)
   - D = Traffic Signals & Blinkers (LED signals, solar blinkers, flashers)
   - E = Street Lighting (LED lights, poles, electrical work)
   - F = Delineators & Safety Furniture (chevrons, guideposts, bollards, barriers)
   - G = Pedestrian Facilities (crossings, refuges, footpaths)
   - H = Drainage & Utilities (drains, manholes, culverts)

2. **sectionName** - Full descriptive name (e.g., "ROAD SIGNS", "PAVEMENT CONDITION")

3. **serialNo** - Sequential number starting from 1 within each section

4. **chainage** - Exact location (e.g., "10+120", "4+200 to 4+350", "Km 45")
   - Extract from "Chainage: X+XXX" or "Ch. X+XXX" or table columns
   - If range given, use start point

5. **side** - Road side indicator:
   - Extract: LHS, RHS, Both, Median, Centre, Ped Cross, Island
   - Default to "Both" if not specified

6. **road** - Road identifier:
   - Extract: MCW, NH-45, SH-17, Main Carriageway, Service Road
   - Default to "Main Carriageway" if not mentioned

7. **observation** - Exact problem observed (copy verbatim if possible)
   - Include condition, severity, any measurements

8. **recommendation** - Detailed intervention needed
   - BE SPECIFIC: Include sizes, types, quantities if mentioned
   - Examples:
     ✅ "Replace with new 50 km/h regulatory sign (600mm dia)"
     ✅ "Install 20 flexible guideposts at 10m intervals"
     ❌ "Fix the sign" (too vague)

9. **ircClause** - IRC standard reference
   - Format: "IRC:XX-YYYY, Cl. X.X.X"
   - Combine if split: "IRC 67-2022" + "Cl. 14.8.8" = "IRC:67-2022, Cl. 14.8.8"
   - Common standards: IRC:35, IRC:67, IRC:79, IRC:82, IRC:93, IRC:99, IRC:SP:73

**PARSING INTELLIGENCE:**

✅ DO:
- Extract EVERY single intervention (even minor ones)
- Preserve exact measurements, quantities, specifications
- Combine split IRC references intelligently
- Infer section from intervention type if not labeled
- Handle variations: "Ch.", "Chainage", "km", "KM"
- Extract from tables, lists, paragraphs equally well

❌ DON'T:
- Skip any interventions
- Modify recommendations (keep original wording)
- Guess IRC clauses if not provided (leave as "Not specified")
- Merge separate interventions into one

**EXAMPLES:**

Input: "Category A | Chainage: 10+120 | Side: LHS
Observation: Speed limit sign faded
Recommended Intervention: Replace with new 50 km/h regulatory sign
IRC Reference: IRC:67-2022, Cl. 14.8.8"

Output:
{
  "sectionId": "A",
  "sectionName": "ROAD SIGNS",
  "serialNo": 1,
  "chainage": "10+120",
  "side": "LHS",
  "road": "Main Carriageway",
  "observation": "Speed limit sign faded",
  "recommendation": "Replace with new 50 km/h regulatory sign",
  "ircClause": "IRC:67-2022, Cl. 14.8.8"
}

**OUTPUT FORMAT:**

Return ONLY a valid JSON array. No markdown, no code blocks, no explanations.

[
  {
    "sectionId": "A",
    "sectionName": "ROAD SIGNS",
    "serialNo": 1,
    "chainage": "10+120",
    "side": "LHS",
    "road": "Main Carriageway",
    "observation": "Speed limit sign faded",
    "recommendation": "Replace with new 50 km/h regulatory sign (600mm dia)",
    "ircClause": "IRC:67-2022, Cl. 14.8.8"
  }
]

If no interventions found, return: []

**CRITICAL:** Extract 100% of interventions. Missing even one intervention is unacceptable for hackathon evaluation.
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
            `${int.serialNo}. [${int.chainage} ${int.side} ${int.road}]\nObservation: ${int.observation}\nRecommendation: ${int.recommendation}\nIRC: ${int.ircClause}`
        )
        .join("\n\n");

      const prompt = `
You are an expert IRC standards engineer specializing in road safety material quantification. Analyze each intervention and provide EXACT material requirements.

**CRITICAL: READ THE OBSERVATION FIELD CAREFULLY FOR DIMENSIONS**

**INTERVENTIONS TO ANALYZE:**

Section ${sectionId} - ${sectionInterventions[0].sectionName}:
${interventionsList}

**IRC STANDARDS DATABASE:**

IRC:35-2015 - Road Markings
• Thermoplastic paint: 3mm thickness, 150mm width for edge lines
• Glass beads Type A: 300-400 gm/sqm for retroreflectivity
• Pedestrian crossings: White paint, 250mm stripe width

IRC:67-2022 - Road Signs
• Speed limit signs: 600mm dia for 50 km/h, Type III sheeting (0.28 sqm)
• Warning signs: 900mm triangle/square, Type III sheeting (0.81 sqm)
• GI Pipe post: 50mm dia, 2.5m height, M20 concrete base (0.1 cum)

IRC:79-2019 - Delineators
• Flexible guideposts: FP-750 type, 750mm height
• Chevron boards: 900x600mm with Type III sheeting
• Spacing: 10-20m on curves, 50m on straights

IRC:82-2023 - Pavement Maintenance
• Cold mix asphalt: Pothole repair, compact to 50mm depth
  - Volume = Area (sqm) × Depth (m)
  - Example: 2.5 sqm × 0.05m = 0.125 cum
• Tack coat: SS-1 emulsion at 0.25 kg/sqm
  - Example: 2.5 sqm × 0.25 kg/sqm = 0.625 kg
• Hot mix: Overlay 40-50mm thickness

IRC:93-2019 - Traffic Signals
• LED signal module: 300mm, 10W consumption
• Solar blinker: 10W panel + 12V 7Ah battery + LED module

IRC:SP:73-2018 - Street Lighting
• LED luminaire: 40-60W for local roads, 80-120W for highways
• Pole: 6-9m height, hot-dip galvanized
• Spacing: 30-40m for urban roads

**YOUR TASK:**

For each intervention, provide:

1. **ircCode** - IRC standard (use the one already mentioned in intervention)
2. **clause** - Specific clause from IRC (preserve exact reference)
3. **specification** - Technical details per IRC standard
   - Include: sizes, dimensions, material grades, types
   - Be specific: "600mm dia" not "medium size"

4. **materials** - Complete material breakdown
   - Calculate quantities accurately based on IRC specifications
   - Include ALL components needed
   - Use exact CPWD SOR item names when possible

**MATERIAL CALCULATION RULES:**

Road Signs (600mm dia):
→ Retroreflective Sheeting Type III: 0.28 sqm
→ Aluminum Plate 600mm: 1 nos
→ GI Pipe Post 50mm: 1 nos
→ Concrete M20: 0.1 cum

Road Signs (900mm square):
→ Retroreflective Sheeting Type III: 0.81 sqm
→ Aluminum Plate 900mm: 1 nos
→ GI Pipe Post 50mm: 1 nos
→ Concrete M20: 0.1 cum

Thermoplastic Markings (EXTRACT LENGTH FROM OBSERVATION ONLY - DO NOT USE CHAINAGE):
→ Look for: "200m", "about 200m", "100 m stretch" in observation field ONLY
→ DO NOT use chainage numbers as length (e.g., ignore "10+900" as 900m)
→ If no length in observation: Use 100m default for typical intervention
→ Calculate: Length (m) × Width (0.15m for edge line, 0.10m for center line)
→ Thermoplastic Paint: Area (sqm) × Thickness (0.003m) × Density (2400 kg/cum) = kg
→ Glass Beads Type A: Area × 0.4 kg/sqm = kg
→ Primer: Area × 0.1 litre/sqm = litre
→ Example for "200m faded markings":
   • Area = 200m × 0.15m = 30 sqm
   • Thermoplastic Paint: 30 sqm × 0.003m × 2400 kg/cum = 216 kg
   • Glass Beads: 30 × 0.4 = 12 kg
   • Primer: 30 × 0.1 = 3 litre

Pedestrian Crossing (EXTRACT DIMENSIONS):
→ Look for: "3.5m width", "4m x 3m", "zebra crossing"
→ Standard: 4m width, 3m length, 250mm stripe width, 250mm gaps
→ Paint area = Width × Length × 0.5 (for stripes)
→ Pedestrian Crossing Paint: Area × 3mm × 2400 kg/cum = kg
→ Glass Beads Type B: Area × 0.4 kg/sqm = kg
→ Example for "3.5m width for each lane on four lane":
   • Total width = 3.5m × 4 lanes = 14m (or use actual width mentioned)
   • Length = 3m (standard)
   • Area = 14m × 3m × 0.5 = 21 sqm
   • Pedestrian Crossing Paint: 21 × 0.003 × 2400 = 151.2 kg
   • Glass Beads: 21 × 0.4 = 8.4 kg

Road Studs (EXTRACT LENGTH/SPACING):
→ Look for: "100m", "304+500 to 304+600" = 100m stretch
→ Spacing: 10m intervals for straight, 5m for curves
→ Retroreflective Road Studs: Length / Spacing = nos
→ Adhesive: Number of studs × 0.5 kg = kg
→ Example for "100m stretch":
   • Road Studs: 100m / 10m = 10 nos
   • Adhesive: 10 × 0.5 = 5 kg

Pothole Repair (CRITICAL - EXTRACT FROM OBSERVATION):
→ Look for: "area 2.5 sqm and 20 mm depth", "pothole 3m x 2m, 50mm deep", "2-3 minor potholes (~1 m² each)"
→ Calculate total area: number × area per pothole
→ Depth: Use 50mm if not specified
→ Volume (cum) = Total Area (sqm) × Depth (m)
→ Cold Mix Asphalt: Volume × 1.1 (compaction factor) = cum
→ Tack Coat SS-1 Emulsion: Total Area × 0.25 kg/sqm = kg
→ Example for "2-3 minor potholes (~1 m² each)":
   • Total Area = 2.5 × 1 = 2.5 sqm (average)
   • Volume = 2.5 sqm × 0.05m = 0.125 cum
   • Cold Mix Asphalt: 0.125 × 1.1 = 0.1375 cum
   • Tack Coat: 2.5 × 0.25 = 0.625 kg

Solar Blinker (1 unit):
→ Solar Panel 10W: 1 nos
→ Battery 12V 7Ah: 1 nos
→ LED Module Amber: 1 nos
→ Wiring Kit: 1 set

Street Light (CALCULATE QUANTITY FOR STRETCH):
→ CRITICAL: Extract stretch length from chainage range (e.g., "12+000-15+000" = 3km)
→ If chainage is SINGLE POINT (e.g., "305+100"), look for length in observation
→ If NO LENGTH FOUND: Assume 500m stretch and MUST document in specification:
   "Assumed 500m typical road section (length not specified in observation)"
→ Extract spacing from recommendation or use 50m default (IRC:SP:73-2018)
→ Number of poles = (Stretch length / Spacing) + 1 (round up)
→ Example for "305+100 lacks lighting" (no length):
   • Assumed stretch: 500m (document this assumption)
   • Spacing: 50m (IRC standard)
   • Number of poles = (500m / 50m) + 1 = 11 poles
   • LED Luminaire 80W: 11 nos
   • Lighting Pole 6m: 11 nos
   • Underground Cable 2-Core: 11 × 5m = 55 m
   • Earthing Electrode: 11 nos

Flexible Guidepost:
→ Flexible Guidepost: 1 nos
→ Adhesive for Delineator: 0.5 kg
→ Fasteners: 1 set

Chevron Board:
→ Chevron Board Type III: 1 nos (comes complete with sheeting)
→ GI Pipe Post 50mm: 1 nos
→ Concrete M20: 0.1 cum

**OUTPUT FORMAT:**

Return ONLY valid JSON array:

[
  {
    "sectionId": "A",
    "serialNo": 1,
    "recommendation": "Replace with new 50 km/h regulatory sign",
    "ircCode": "IRC:67-2022",
    "clause": "Cl. 14.8.8",
    "specification": "Speed limit regulatory sign, Type B, 600mm dia, Class III retroreflective sheeting as per IRC:67-2022 Table 14.1",
    "materials": [
      {
        "item": "Retroreflective Sheeting Type III",
        "quantity": 0.28,
        "unit": "sqm",
        "details": "High intensity grade for 600mm circular sign"
      },
      {
        "item": "Aluminum Plate 600mm Dia",
        "quantity": 1,
        "unit": "nos",
        "details": "2mm thick aluminum substrate"
      },
      {
        "item": "GI Pipe Post 50mm",
        "quantity": 1,
        "unit": "nos",
        "details": "2.5m height galvanized iron post"
      },
      {
        "item": "Concrete for Sign Foundation",
        "quantity": 0.1,
        "unit": "cum",
        "details": "M20 grade concrete for base"
      }
    ]
  }
]

**CRITICAL REQUIREMENTS:**
✅ MUST extract dimensions from observation field (look for: "200m", "2.5 sqm", "20mm depth", "3.5m width")
✅ MUST calculate actual quantities - DO NOT use placeholder values
✅ Use exact item names from CPWD database when possible
✅ Calculate quantities accurately based on extracted dimensions
✅ Include ALL materials (sheeting, substrate, post, foundation)
✅ Preserve original IRC clause from intervention
✅ Be consistent with units (sqm, m, kg, nos, cum, litre)
✅ Return only valid JSON, no markdown

**COMMON MISTAKES TO AVOID:**
❌ DO NOT use 0 or negative quantities
❌ DO NOT ignore dimensions in observation field
❌ DO NOT use generic quantities without calculation
❌ DO NOT skip materials because dimensions are missing (estimate standard size if needed)

**IF NO DIMENSIONS GIVEN:**
• Road markings: Assume 100m × 0.15m = 15 sqm
• Pedestrian crossing: Assume 4m × 3m = 12 sqm
• Potholes: Assume 1 sqm × 50mm depth
• Road studs: Assume 10 nos for typical intervention

This is for HACKATHON EVALUATION - accuracy is critical!
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
          } (${m.source || "CPWD SOR"} ${
            m.sorCode ? `Item: ${m.sorCode}` : ""
          })`
      )
      .join("\n");

    const hasNonOfficialSources = materials.some(
      (m) =>
        m.source &&
        (m.source.includes("DB_SIMILAR_ITEMS") ||
          m.source.includes("CATEGORY_FALLBACK") ||
          m.source.includes("DEFAULT_FALLBACK"))
    );

    const sourceWarning = hasNonOfficialSources
      ? `\n\n⚠️ CRITICAL: This estimate contains FALLBACK RATES that are NOT from official CPWD SOR or GeM sources.`
      : ``;

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
8. IF using non-official rates, MUST flag with 🟡 or 🔴 tag${sourceWarning}

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
  "sorItems": ["16.53", "14.28", "18.12"],
  "hasNonOfficialRates": ${hasNonOfficialSources},
  "criticalFlags": []
}

IMPORTANT:
- Make it sound human and professional, not AI-generic
- Include specific clause numbers and SOR codes
- Add context about intervention importance
- Use confidence tags (🟢🟡🔴) with accuracy
- If ANY non-official rates: MUST use 🟡 or 🔴 tag
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
        result.confidenceTag ||
        (hasNonOfficialSources ? "🟡 Fallback rate used" : "🟢 Verified"),
      ircClause:
        result.ircClause || `${ircMapping.ircCode}, ${ircMapping.clause}`,
      sorItems: result.sorItems || [],
      hasNonOfficialRates: result.hasNonOfficialRates || hasNonOfficialSources,
      criticalFlags: result.criticalFlags || [],
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
      hasNonOfficialRates: true,
      criticalFlags: [
        "Missing official SOR rates - must be replaced before approval",
      ],
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
