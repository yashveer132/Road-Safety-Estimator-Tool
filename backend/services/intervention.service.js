import RoadSafetyIntervention from "../models/RoadSafetyIntervention.model.js";
import { generateContent, cleanJsonResponse } from "../config/gemini.js";

const buildSearchFilter = ({ issues, keywords, category }) => {
  const filter = {};

  if (category) {
    filter.category = new RegExp(category, "i");
  }

  const textTerms = [];

  if (Array.isArray(issues)) {
    textTerms.push(...issues.filter(Boolean));
  }

  if (typeof keywords === "string" && keywords.trim().length > 0) {
    textTerms.push(keywords.trim());
  }

  if (textTerms.length > 0) {
    filter.$text = { $search: textTerms.join(" ") };
  }

  return filter;
};

export const findCandidateInterventions = async (params = {}) => {
  const filter = buildSearchFilter(params);
  let query = RoadSafetyIntervention.find(filter).lean();

  if (!filter.$text) {
    query = query.sort({ updatedAt: -1 });
  } else {
    query = query.sort({ score: { $meta: "textScore" } });
  }

  const interventions = await query.limit(params.limit || 15);

  if (interventions.length === 0) {
    return RoadSafetyIntervention.find()
      .sort({ updatedAt: -1 })
      .limit(params.fallbackLimit || 10)
      .lean();
  }

  const contextWeighted = interventions.map((doc) => {
    let contextScore = 0;
    const { roadType, environment, trafficVolume, speedLimit, issues } = params;

    if (
      roadType &&
      doc.context?.roadType?.some((rt) =>
        rt.toLowerCase().includes(roadType.toLowerCase())
      )
    ) {
      contextScore += 2;
    }

    if (
      environment &&
      doc.context?.environment?.some((env) =>
        env.toLowerCase().includes(environment.toLowerCase())
      )
    ) {
      contextScore += 2;
    }

    if (issues && Array.isArray(issues)) {
      const matchedIssues = issues.filter((issue) =>
        doc.context?.issueKeywords?.some((keyword) =>
          keyword.toLowerCase().includes(issue.toLowerCase())
        )
      );
      contextScore += matchedIssues.length * 1.5;
    }

    if (
      environment?.toLowerCase().includes("pedestrian") &&
      doc.category?.toLowerCase().includes("pedestrian")
    ) {
      contextScore += 3;
    }

    if (
      environment?.toLowerCase().includes("visibility") &&
      doc.category?.toLowerCase().includes("lighting")
    ) {
      contextScore += 3;
    }

    return {
      ...doc,
      contextScore,
      totalScore: (doc.score || 0) + contextScore,
    };
  });

  contextWeighted.sort((a, b) => b.totalScore - a.totalScore);

  return contextWeighted;
};

const toPromptDataset = (docs) =>
  docs
    .map(
      (doc, index) =>
        `${index + 1}. [id:${doc._id}] Problem: ${doc.problem} | Category: ${
          doc.category
        } | Type: ${doc.interventionType} | Description: ${
          doc.description
        } | Reference: ${doc.code} Clause ${doc.clause}`
    )
    .join("\n");

export const generateRoadSafetyRecommendations = async ({
  roadType,
  environment,
  issues,
  problemDescription,
  constraints,
  trafficVolume,
  speedLimit,
  additionalNotes,
  category,
} = {}) => {
  const keywords = [roadType, environment, trafficVolume, speedLimit]
    .concat(issues || [])
    .filter(Boolean)
    .join(" ");

  const candidates = await findCandidateInterventions({
    issues,
    keywords,
    category,
  });

  if (!candidates || candidates.length === 0) {
    return {
      recommendations: [],
      supportingNotes: "No interventions found in the curated database.",
      candidateSnapshot: [],
    };
  }

  const promptDataset = toPromptDataset(candidates).slice(0, 6000);

  const prompt = `You are a senior road safety engineer. Select the best road safety interventions from the curated dataset below. Use only the provided entries; do not invent new references.

Dataset Entries:
${promptDataset}

Context:
- Road Type: ${roadType || "Not specified"}
- Environment: ${environment || "Not specified"}
- Traffic Volume: ${trafficVolume || "Not specified"}
- Operating Speed: ${speedLimit || "Not specified"}
- Reported Issues: ${(issues || []).join(", ") || "Not provided"}
- Detailed Problem Description: ${problemDescription || "Not provided"}
- Constraints/Notes: ${constraints || "None"}
- Additional Notes: ${additionalNotes || "None"}

Instructions:
1. Recommend up to 3 interventions that best address the described safety problem.
2. Each recommendation must reference the corresponding dataset entry via its id and quote the IRC code and clause verbatim.
3. Provide engineering reasoning tailored to the context, considering pedestrian safety, lighting conditions, and site constraints.
4. Include confidence (High/Medium/Low) and highlight relevant matching factors (e.g., matching issue keywords, environment suitability).
5. Suggest follow-up data you would request if confidence is below High.
6. Where applicable, include pedestrian-specific measures referencing IRC:103-2012 (pedestrian signals) and IRC:99-2018 (pedestrian facilities).
7. Incorporate lighting considerations referencing IRC:SP:90 or MoRTH lighting guidelines for night-time safety.
8. Quantitatively address cost and space constraints where mentioned (e.g., "low-cost retroreflective upgrade feasible within ₹X/km").
9. Prioritize cost-effective, non-invasive geometric solutions when ROW is limited.
10. For signage interventions, specify quantitative spacing requirements based on operating speed (e.g., minimum 150m for 80 km/h roads).
11. Include environmental durability considerations (e.g., corrosion-resistant materials for rural/highway environments).
12. Provide cost matrices for key interventions (e.g., retroreflective sheet ₹X/sign, LED light ₹Y/unit).
13. Consider complementary visibility aids like delineators (IRC:79) for fog/high-speed conditions.

Return ONLY valid JSON with the exact structure:
{
  "recommendations": [
    {
      "title": "Concise intervention name",
      "sourceId": "id from dataset e.g. 6521...",
      "problem": "Short description of the issue being solved",
      "recommendedAction": "Detailed intervention guidance including pedestrian/lighting considerations, quantitative spacing, environmental durability, and cost estimates where relevant",
      "justification": "Why this intervention fits the provided context, with specific IRC references for pedestrian and lighting measures, durability, and complementary aids",
      "ircReference": {
        "code": "e.g. IRC:67-2022",
        "clause": "e.g. 14.4",
        "excerpt": "Relevant excerpt or principle in one sentence"
      },
      "confidence": "High | Medium | Low",
      "matchingFactors": ["keyword match", "environment fit", "road type alignment", "pedestrian consideration", "lighting adequacy", "durability", "visibility aids"],
      "followUp": ["Additional information needed if any"]
    }
  ],
  "supportingNotes": "Additional overall considerations for planners, including pedestrian safety, lighting, durability recommendations, and cost matrices",
  "followUpQuestions": ["Optional open questions for the site team"]
}`;

  try {
    const response = await generateContent(prompt);
    const parsed = cleanJsonResponse(response);

    return {
      ...parsed,
      candidateSnapshot: candidates.map((doc) => ({
        id: doc._id.toString(),
        problem: doc.problem,
        category: doc.category,
        interventionType: doc.interventionType,
        description: doc.description,
        code: doc.code,
        clause: doc.clause,
      })),
    };
  } catch (error) {
    console.error("Failed to generate AI recommendations:", error.message);

    return {
      recommendations: candidates.map((doc) => ({
        title: doc.interventionType,
        sourceId: doc._id.toString(),
        problem: doc.problem,
        recommendedAction: doc.description,
        justification:
          "Returned automatically because AI reasoning was unavailable. Review manually.",
        ircReference: {
          code: doc.code,
          clause: doc.clause,
          excerpt: "Refer to the cited clause for full specification.",
        },
        confidence: "Low",
        matchingFactors: ["Automatic fallback"],
        followUp: ["Review IRC clause and site conditions"],
      })),
      supportingNotes:
        "AI reasoning unavailable; recommendations are direct extracts from the curated database.",
      followUpQuestions: [],
      candidateSnapshot: candidates.map((doc) => ({
        id: doc._id.toString(),
        problem: doc.problem,
        category: doc.category,
        interventionType: doc.interventionType,
        description: doc.description,
        code: doc.code,
        clause: doc.clause,
      })),
    };
  }
};

export default {
  findCandidateInterventions,
  generateRoadSafetyRecommendations,
};
