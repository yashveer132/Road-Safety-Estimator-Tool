export const extractRoadMarkingLength = (observation) => {
  const patterns = [
    /(\d+)\s*m(?:eters?)?/i,
    /about\s+(\d+)\s*m/i,
    /(\d+)\s*m\s+near/i,
    /for\s+(?:about\s+)?(\d+)\s*m/i,
  ];

  for (const pattern of patterns) {
    const match = observation.match(pattern);
    if (match) {
      const length = parseFloat(match[1]);
      if (length > 0 && length < 10000) {
        return length;
      }
    }
  }

  return null;
};

export const extractArea = (observation) => {
  const patterns = [
    /(\d+\.?\d*)\s*(?:sqm|sq\s*m|square\s*meters?)/i,
    /area\s+(?:of\s+)?(\d+\.?\d*)\s*(?:sqm|sq\s*m)/i,
  ];

  for (const pattern of patterns) {
    const match = observation.match(pattern);
    if (match) {
      const area = parseFloat(match[1]);
      if (area > 0 && area < 10000) {
        return area;
      }
    }
  }

  return null;
};

export const extractDepth = (observation) => {
  const patterns = [
    /(\d+)\s*mm\s+depth/i,
    /depth\s+(?:of\s+)?(\d+)\s*mm/i,
    /(\d+)\s*mm\s+deep/i,
    /(\d+)\s*mm/i,
  ];

  for (const pattern of patterns) {
    const match = observation.match(pattern);
    if (match) {
      const depthMm = parseFloat(match[1]);
      if (depthMm > 0 && depthMm < 1000) {
        return depthMm / 1000;
      }
    }
  }

  return null;
};

export const extractWidth = (observation) => {
  const patterns = [
    /(\d+\.?\d*)\s*m\s+width/i,
    /width\s+(?:of\s+)?(\d+\.?\d*)\s*m/i,
    /(\d+\.?\d*)\s*m\s+wide/i,
  ];

  for (const pattern of patterns) {
    const match = observation.match(pattern);
    if (match) {
      const width = parseFloat(match[1]);
      if (width > 0 && width < 100) {
        return width;
      }
    }
  }

  return null;
};

export const extractLengthFromChainage = (chainage) => {
  const pattern = /(\d+)\+(\d+)\s+to\s+(\d+)\+(\d+)/i;
  const match = chainage.match(pattern);

  if (match) {
    const start = parseFloat(match[1]) * 1000 + parseFloat(match[2]);
    const end = parseFloat(match[3]) * 1000 + parseFloat(match[4]);
    const length = Math.abs(end - start);

    if (length > 0 && length < 100000) {
      return length;
    }
  }

  return null;
};

export const calculateThermoplasticQuantities = (observation, chainage) => {
  let length = extractRoadMarkingLength(observation);

  if (!length) {
    console.warn(
      "      ⚠️ Could not extract length from observation, using default 100m"
    );
    length = 100;
  }

  const edgeLineWidth = 0.15;
  const centerLineWidth = 0.1;
  const thickness = 0.003;
  const density = 2400;

  const numEdgeLines = 2;
  const numCenterLines = 1;

  const edgeLineArea = length * edgeLineWidth * numEdgeLines;
  const centerLineArea = length * centerLineWidth * numCenterLines;
  const totalArea = edgeLineArea + centerLineArea;

  console.log(
    `      📐 Calculation: ${length}m × (${numEdgeLines} edges @${edgeLineWidth}m + ${numCenterLines} center @${centerLineWidth}m) = ${totalArea.toFixed(
      2
    )} sqm`
  );

  const thermoplasticPaint = totalArea * thickness * density;
  const glassBeads = totalArea * 0.4;
  const primer = totalArea * 0.1;

  return {
    length,
    area: totalArea,
    edgeLineArea,
    centerLineArea,
    materials: [
      {
        item: "Thermoplastic Paint",
        quantity: Math.round(thermoplasticPaint * 100) / 100,
        unit: "kg",
        details: `For ${length}m (${numEdgeLines} edge lines + ${numCenterLines} center line = ${totalArea.toFixed(
          2
        )} sqm), 3mm thick @ 2400 kg/cum`,
      },
      {
        item: "Glass Beads Type A",
        quantity: Math.round(glassBeads * 100) / 100,
        unit: "kg",
        details: `For retroreflectivity @ 400g/sqm (${totalArea.toFixed(
          2
        )} sqm × 0.4 kg/sqm)`,
      },
      {
        item: "Primer",
        quantity: Math.round(primer * 10) / 10,
        unit: "litre",
        details: "Surface preparation @ 0.1 L/sqm",
      },
    ],
  };
};

export const calculatePedestrianCrossingQuantities = (observation) => {
  let width = extractWidth(observation);

  const perLanePattern1 =
    /(\d+\.?\d*)\s*m\s+width\s+for\s+each\s+lane\s+on\s+(\d+)\s+lane/i;
  const perLanePattern2 =
    /(\d+\.?\d*)\s*m\s+(?:per|for\s+each)\s+lane.*?(\d+)\s+lane/i;

  let match =
    observation.match(perLanePattern1) || observation.match(perLanePattern2);

  if (match) {
    const widthPerLane = parseFloat(match[1]);
    const numLanes = parseFloat(match[2]);
    width = widthPerLane * numLanes;
    console.log(
      `      📐 Detected: ${widthPerLane}m per lane × ${numLanes} lanes = ${width}m total width`
    );
  } else if (!width) {
    width = extractWidth(observation);
  }

  if (!width) {
    console.warn("      ⚠️ Could not extract width, using default 4m");
    width = 4;
  }

  const length = 3;
  const area = width * length * 0.5;

  const paint = area * 0.003 * 2400;
  const glassBeads = area * 0.4;

  return {
    width,
    length,
    area,
    materials: [
      {
        item: "Pedestrian Crossing Paint",
        quantity: Math.round(paint * 100) / 100,
        unit: "kg",
        details: `For ${width}m × ${length}m zebra crossing`,
      },
      {
        item: "Glass Beads Type B",
        quantity: Math.round(glassBeads * 100) / 100,
        unit: "kg",
        details: "For retroreflectivity @ 400g/sqm",
      },
    ],
  };
};

export const calculateRoadStudQuantities = (observation, chainage) => {
  let length = extractLengthFromChainage(chainage);

  if (!length) {
    length = extractRoadMarkingLength(observation);
  }

  if (!length) {
    console.warn("      ⚠️ Could not extract length, using default 100m");
    length = 100;
  }

  const spacing = 10;
  const numStuds = Math.ceil(length / spacing);
  const adhesive = numStuds * 0.5;

  return {
    length,
    numStuds,
    materials: [
      {
        item: "Retroreflective Road Studs",
        quantity: numStuds,
        unit: "nos",
        details: `For ${length}m stretch @ ${spacing}m spacing`,
      },
      {
        item: "Adhesive for Road Studs",
        quantity: Math.round(adhesive * 100) / 100,
        unit: "kg",
        details: "Epoxy adhesive @ 0.5kg per stud",
      },
    ],
  };
};

export const calculatePotholeRepairQuantities = (observation) => {
  const area = extractArea(observation);
  const depth = extractDepth(observation);

  if (!area || !depth) {
    console.warn(
      `      ⚠️ Could not extract area (${area}) or depth (${depth}), using defaults`
    );
    return {
      area: area || 1,
      depth: depth || 0.05,
      materials: [
        {
          item: "Cold Mix Asphalt",
          quantity: 0.055,
          unit: "cum",
          details: "Default: 1 sqm × 50mm depth",
        },
        {
          item: "Tack Coat SS-1 Emulsion",
          quantity: 0.25,
          unit: "kg",
          details: "Default: 1 sqm @ 0.25 kg/sqm",
        },
      ],
    };
  }

  const volume = area * depth;
  const coldMix = volume * 1.1;
  const tackCoat = area * 0.25;

  return {
    area,
    depth,
    volume,
    materials: [
      {
        item: "Cold Mix Asphalt",
        quantity: Math.round(coldMix * 1000) / 1000,
        unit: "cum",
        details: `For ${area} sqm × ${depth * 1000}mm depth`,
      },
      {
        item: "Tack Coat SS-1 Emulsion",
        quantity: Math.round(tackCoat * 100) / 100,
        unit: "kg",
        details: `Surface bonding @ 0.25 kg/sqm`,
      },
    ],
  };
};

export const calculateRoadSignQuantities = (observation, recommendation) => {
  let size = "900mm";
  let sheetingArea = 0.81;
  let platePrice = 680;

  if (
    recommendation.toLowerCase().includes("speed limit") ||
    recommendation.toLowerCase().includes("no parking") ||
    recommendation.toLowerCase().includes("no entry") ||
    observation.toLowerCase().includes("600mm") ||
    observation.toLowerCase().includes("circular")
  ) {
    size = "600mm";
    sheetingArea = 0.28;
    platePrice = 380;
  }

  if (
    observation.toLowerCase().includes("1200mm") ||
    recommendation.toLowerCase().includes("major")
  ) {
    size = "1200mm";
    sheetingArea = 1.44;
    platePrice = 980;
  }

  return {
    size,
    materials: [
      {
        item: "Retroreflective Sheeting Type III",
        quantity: sheetingArea,
        unit: "sqm",
        details: `High intensity grade for ${size} sign`,
      },
      {
        item:
          size === "600mm"
            ? "Aluminum Plate 600mm Dia"
            : `Aluminum Plate ${size}`,
        quantity: 1,
        unit: "nos",
        details: "2mm thick aluminum substrate",
      },
      {
        item: "GI Pipe Post 50mm",
        quantity: 1,
        unit: "nos",
        details: "2.5m height galvanized iron post",
      },
      {
        item: "Concrete for Sign Foundation",
        quantity: 0.1,
        unit: "cum",
        details: "M20 grade concrete for base",
      },
    ],
  };
};

export const calculateGuardrailQuantities = (observation, chainage) => {
  let length = extractLengthFromChainage(chainage);

  if (!length) {
    length = extractRoadMarkingLength(observation);
  }

  if (!length) {
    console.warn("      ⚠️ Could not extract length, using default 50m");
    length = 50;
  }

  const posts = Math.ceil(length / 2);
  const beams = Math.ceil(length / 4);

  return {
    length,
    materials: [
      {
        item: "W-Beam Guardrail",
        quantity: beams,
        unit: "nos",
        details: `4m length beams for ${length}m stretch`,
      },
      {
        item: "Guardrail Post",
        quantity: posts,
        unit: "nos",
        details: "Steel posts @ 2m spacing",
      },
      {
        item: "Bolts and Fasteners",
        quantity: posts * 2,
        unit: "set",
        details: "Connection hardware",
      },
    ],
  };
};

export const calculateChevronQuantities = (observation, chainage) => {
  let numBoards = 1;

  const numberMatch = observation.match(/(\d+)\s+(?:chevron|board)/i);
  if (numberMatch) {
    numBoards = parseInt(numberMatch[1]);
  } else {
    const length =
      extractLengthFromChainage(chainage) ||
      extractRoadMarkingLength(observation);
    if (length) {
      numBoards = Math.ceil(length / 20);
    }
  }

  return {
    numBoards,
    materials: [
      {
        item: "Chevron Board Type III",
        quantity: numBoards,
        unit: "nos",
        details: "900mm × 600mm with retroreflective sheeting",
      },
      {
        item: "GI Pipe Post 50mm",
        quantity: numBoards,
        unit: "nos",
        details: "2.5m height posts",
      },
      {
        item: "Concrete for Sign Foundation",
        quantity: numBoards * 0.1,
        unit: "cum",
        details: "M20 grade concrete",
      },
    ],
  };
};

export const calculateSpeedHumpQuantities = (observation) => {
  const width = extractWidth(observation) || 3.5;
  const numHumps = 1;

  const numberMatch = observation.match(/(\d+)\s+(?:hump|bump)/i);
  const quantity = numberMatch ? parseInt(numberMatch[1]) : numHumps;

  return {
    quantity,
    materials: [
      {
        item: "Speed Hump Kit",
        quantity: quantity,
        unit: "nos",
        details: `Rubber/plastic modular hump, ${width}m width`,
      },
      {
        item: "Anchor Bolts",
        quantity: quantity * 10,
        unit: "nos",
        details: "M12 bolts for fixing",
      },
      {
        item: "Retroreflective Tape",
        quantity: quantity * 2,
        unit: "m",
        details: "Yellow/black chevron marking",
      },
    ],
  };
};

export const calculateFootpathQuantities = (observation, chainage) => {
  let length =
    extractLengthFromChainage(chainage) ||
    extractRoadMarkingLength(observation);
  let width = extractWidth(observation) || 1.5;

  if (!length) {
    console.warn("      ⚠️ Could not extract length, using default 50m");
    length = 50;
  }

  const area = length * width;
  const volume = area * 0.15;

  return {
    length,
    width,
    area,
    materials: [
      {
        item: "Paver Blocks",
        quantity: area,
        unit: "sqm",
        details: `For ${length}m × ${width}m footpath`,
      },
      {
        item: "Sand Bedding",
        quantity: Math.round(volume * 1000) / 1000,
        unit: "cum",
        details: "50mm bedding layer",
      },
      {
        item: "Kerb Stones",
        quantity: length * 2,
        unit: "m",
        details: "Both edges",
      },
    ],
  };
};

export const calculateDrainageQuantities = (observation, chainage) => {
  let length =
    extractLengthFromChainage(chainage) ||
    extractRoadMarkingLength(observation);

  if (!length) {
    console.warn("      ⚠️ Could not extract length, using default 50m");
    length = 50;
  }

  return {
    length,
    materials: [
      {
        item: "RCC Drain 300x300",
        quantity: length,
        unit: "m",
        details: "Reinforced concrete drain",
      },
      {
        item: "Drain Cover Slab",
        quantity: length,
        unit: "m",
        details: "Precast RCC cover",
      },
      {
        item: "Excavation",
        quantity: Math.round(length * 0.3 * 0.5 * 100) / 100,
        unit: "cum",
        details: "For drain installation",
      },
    ],
  };
};

export default {
  extractRoadMarkingLength,
  extractArea,
  extractDepth,
  extractWidth,
  extractLengthFromChainage,
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
};
