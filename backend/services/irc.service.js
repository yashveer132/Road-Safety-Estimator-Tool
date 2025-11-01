import axios from "axios";
import * as cheerio from "cheerio";
import { Agent as HttpsAgent } from "https";
const httpsAgent = new HttpsAgent({
  rejectUnauthorized: false,
});

export const fetchIRCStandards = async () => {
  try {
    console.log("🔍 Fetching IRC standards from official website...");

    const standards = [];

    try {
      const response = await axios.get("https://irc.nic.in/standards", {
        timeout: 15000,
        httpsAgent: httpsAgent,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const $ = cheerio.load(response.data);
      console.log("✅ Fetched IRC website");

      const standardsList = [];
      $('a[href*="IRC-"][href*="pdf"]').each((i, elem) => {
        const href = $(elem).attr("href");
        const title = $(elem).text().trim();
        if (href && title) {
          standardsList.push({
            code: title.match(/IRC\s*\d+/i)?.[0] || "IRC",
            title: title,
            url: href.startsWith("http") ? href : `https://irc.nic.in${href}`,
            type: "pdf",
          });
        }
      });

      if (standardsList.length > 0) {
        console.log(`📄 Found ${standardsList.length} IRC standards`);
        standards.push(...standardsList);
      }
    } catch (error) {
      console.log("⚠️ Failed to fetch IRC standards:", error.message);
    }

    if (standards.length === 0) {
      standards.push(
        {
          code: "IRC 35",
          title: "Code of Practice for Road Markings",
          url: "https://irc.nic.in/standards",
          type: "guidelines",
          content: {
            roadMarkings: {
              longitudinalLines: {
                width: { center: 150, edge: 150 },
                thickness: 2.5,
                spacing: { broken: 3, continuous: 0 },
              },
              transverseLines: {
                stopLines: { width: 300, thickness: 2.5 },
                giveWayLines: { width: 600, thickness: 2.5 },
                pedestrianCrossings: { width: 600, thickness: 2.5 },
              },
              symbols: {
                spacing: 50,
                size: { min: 1.2, max: 2.4 },
              },
            },
          },
        },
        {
          code: "IRC 67",
          title: "Code of Practice for Road Signs",
          url: "https://irc.nic.in/standards",
          type: "guidelines",
          content: {
            regulatorySigns: {
              size: { small: "600x600", medium: "900x900", large: "1200x1200" },
              height: { ground: 1.5, overhead: 5.5 },
            },
            warningSigns: {
              size: "900x900",
              height: 1.5,
            },
            informatorySigns: {
              size: { small: "600x600", medium: "900x900" },
              height: 1.5,
            },
          },
        },
        {
          code: "IRC 79",
          title: "Recommendations for Traffic Calming Measures",
          url: "https://irc.nic.in/standards",
          type: "guidelines",
          content: {
            speedBreakers: {
              height: { min: 75, max: 100 },
              width: 350,
              length: { min: 3.5, max: 4.0 },
              spacing: { min: 100, max: 150 },
            },
            speedHumps: {
              height: 100,
              width: 3.7,
              radius: 1.0,
            },
          },
        },
        {
          code: "IRC 99",
          title: "Guidelines for Traffic Safety Barriers",
          url: "https://irc.nic.in/standards",
          type: "guidelines",
          content: {
            wBeamBarriers: {
              height: 850,
              thickness: 3,
              postSpacing: 2,
              embedment: 1.5,
            },
            concreteBarriers: {
              height: 810,
              width: 240,
              length: 2,
            },
          },
        }
      );
    }

    console.log(`✅ Retrieved ${standards.length} IRC standards`);
    return standards;
  } catch (error) {
    console.error("Error fetching IRC standards:", error);
    return [];
  }
};

export const validateInterventionAgainstIRC = (intervention, standards) => {
  const issues = [];
  const recommendations = [];

  const relevantStandard = standards.find(
    (s) =>
      intervention.type
        .toLowerCase()
        .includes(s.title.toLowerCase().split(" ")[0]) ||
      s.title.toLowerCase().includes(intervention.type.toLowerCase())
  );

  if (!relevantStandard) {
    issues.push(`No specific IRC standard found for ${intervention.type}`);
    return { valid: false, issues, recommendations };
  }

  switch (intervention.type.toLowerCase()) {
    case "road markings":
      const markingSpec = relevantStandard.content?.roadMarkings;
      if (markingSpec) {
        if (
          intervention.parameters?.width <
          markingSpec.longitudinalLines.width.center
        ) {
          issues.push(
            `Line width ${intervention.parameters.width}mm below IRC minimum ${markingSpec.longitudinalLines.width.center}mm`
          );
        }
        if (
          intervention.parameters?.thickness !==
          markingSpec.longitudinalLines.thickness
        ) {
          recommendations.push(
            `Adjust thickness to IRC standard ${markingSpec.longitudinalLines.thickness}mm`
          );
        }
      }
      break;

    case "traffic signs":
      const signSpec = relevantStandard.content?.regulatorySigns;
      if (signSpec && intervention.parameters?.size) {
        const sizes = Object.values(signSpec.size);
        if (!sizes.includes(intervention.parameters.size)) {
          issues.push(
            `Sign size ${intervention.parameters.size} not matching IRC standards`
          );
        }
      }
      break;

    case "speed breakers":
      const breakerSpec = relevantStandard.content?.speedBreakers;
      if (breakerSpec && intervention.parameters?.height) {
        if (
          intervention.parameters.height < breakerSpec.height.min ||
          intervention.parameters.height > breakerSpec.height.max
        ) {
          issues.push(
            `Speed breaker height ${intervention.parameters.height}mm outside IRC range ${breakerSpec.height.min}-${breakerSpec.height.max}mm`
          );
        }
      }
      break;

    case "safety barriers":
      const barrierSpec = relevantStandard.content?.wBeamBarriers;
      if (barrierSpec && intervention.parameters?.height) {
        if (intervention.parameters.height !== barrierSpec.height) {
          recommendations.push(
            `Adjust barrier height to IRC standard ${barrierSpec.height}mm`
          );
        }
      }
      break;
  }

  return {
    valid: issues.length === 0,
    issues,
    recommendations,
    standard: relevantStandard.code,
  };
};

export const getIRCQuantityGuidelines = (interventionType) => {
  const guidelines = {
    "road markings": {
      longitudinal: {
        formula: "length * lanes * 2",
        unit: "linear meters",
        notes: "Includes center lines and edge lines",
      },
      transverse: {
        formula: "number of crossings * width",
        unit: "square meters",
        notes: "Based on crossing width requirements",
      },
      symbols: {
        formula: "number of symbols * area per symbol",
        unit: "square meters",
        notes: "Symbols spaced at 50m intervals minimum",
      },
    },
    "traffic signs": {
      regulatory: {
        formula: "number of locations",
        unit: "nos",
        notes: "One sign per location as per traffic study",
      },
      warning: {
        formula: "number of hazard points",
        unit: "nos",
        notes: "Based on road geometry and hazard analysis",
      },
      informatory: {
        formula: "number of decision points",
        unit: "nos",
        notes: "At intersections and route changes",
      },
    },
    "speed breakers": {
      rubber: {
        formula: "number of locations * length",
        unit: "linear meters",
        notes: "Spacing 100-150m, length 3.5-4.0m per breaker",
      },
    },
    "safety barriers": {
      w_beam: {
        formula: "length of barrier required",
        unit: "linear meters",
        notes: "Based on accident data and road geometry",
      },
    },
    "road studs": {
      reflective: {
        formula: "length * studs per meter",
        unit: "nos",
        notes: "Typically 1 stud per 1-2 meters on edge lines",
      },
    },
    delineators: {
      flexible: {
        formula: "length / spacing",
        unit: "nos",
        notes: "Spacing 10-20m on curves, 50m on straights",
      },
    },
  };

  return guidelines[interventionType.toLowerCase()] || null;
};

export default {
  fetchIRCStandards,
  validateInterventionAgainstIRC,
  getIRCQuantityGuidelines,
};
