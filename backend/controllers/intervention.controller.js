import RoadSafetyIntervention from "../models/RoadSafetyIntervention.model.js";
import RecommendationHistory from "../models/RecommendationHistory.model.js";
import {
  findCandidateInterventions,
  generateRoadSafetyRecommendations,
} from "../services/intervention.service.js";

export const getInterventions = async (req, res) => {
  try {
    const { category, search, limit = 50 } = req.query;

    const filter = {};

    if (category) {
      filter.category = new RegExp(category, "i");
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const interventions = await RoadSafetyIntervention.find(filter)
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      data: interventions,
      count: interventions.length,
    });
  } catch (error) {
    console.error("Error fetching interventions:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch interventions",
      details: error.message,
    });
  }
};

export const getCandidates = async (req, res) => {
  try {
    const { issues, keywords, category } = req.query;

    const candidateIssues = Array.isArray(issues)
      ? issues
      : typeof issues === "string"
      ? issues.split(",").map((item) => item.trim())
      : [];

    const data = await findCandidateInterventions({
      issues: candidateIssues,
      keywords,
      category,
    });

    res.status(200).json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error("Error fetching candidate interventions:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch candidate interventions",
      details: error.message,
    });
  }
};

export const createRecommendations = async (req, res) => {
  try {
    const {
      roadType,
      environment,
      issues,
      problemDescription,
      constraints,
      trafficVolume,
      speedLimit,
      additionalNotes,
      category,
    } = req.body || {};

    if (!problemDescription && !Array.isArray(issues)) {
      return res.status(400).json({
        error: true,
        message:
          "Provide a problem description or at least one road safety issue to analyze.",
      });
    }

    const normalizedIssues = Array.isArray(issues)
      ? issues
      : typeof issues === "string"
      ? issues
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    const result = await generateRoadSafetyRecommendations({
      roadType,
      environment,
      issues: normalizedIssues,
      problemDescription,
      constraints,
      trafficVolume,
      speedLimit,
      additionalNotes,
      category,
    });

    const history = new RecommendationHistory({
      roadType,
      environment,
      trafficVolume,
      speedLimit,
      issues: normalizedIssues,
      problemDescription,
      constraints,
      additionalNotes,
      category,
      recommendations: result.recommendations || [],
      supportingNotes: result.supportingNotes || "",
      followUpQuestions: result.followUpQuestions || [],
      candidateSnapshot: result.candidateSnapshot || [],
      status: "generated",
      priority: "medium",
    });

    await history.save();

    res.status(200).json({
      success: true,
      data: result,
      historyId: history._id,
    });
  } catch (error) {
    console.error("Error generating road safety recommendations:", error);
    res.status(500).json({
      error: true,
      message: "Failed to generate road safety recommendations",
      details: error.message,
    });
  }
};

export const getRecommendationHistory = async (req, res) => {
  try {
    const { status, category, priority, limit = 50, skip = 0 } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (category) {
      filter.category = new RegExp(category, "i");
    }

    if (priority) {
      filter.priority = priority;
    }

    const recommendations = await RecommendationHistory.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .skip(parseInt(skip, 10))
      .select(
        "roadType environment problemDescription status priority createdAt category recommendations supportingNotes followUpQuestions candidateSnapshot"
      );

    const total = await RecommendationHistory.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: recommendations,
      total,
      limit: parseInt(limit, 10),
      skip: parseInt(skip, 10),
    });
  } catch (error) {
    console.error("Error fetching recommendation history:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch recommendation history",
      details: error.message,
    });
  }
};

export const getRecommendationDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const recommendation = await RecommendationHistory.findById(id);

    if (!recommendation) {
      return res.status(404).json({
        error: true,
        message: "Recommendation not found",
      });
    }

    res.status(200).json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    console.error("Error fetching recommendation detail:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch recommendation detail",
      details: error.message,
    });
  }
};

export const updateRecommendationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, userNotes, estimatedCost } = req.body;

    const validStatus = ["generated", "reviewed", "approved", "rejected"];
    const validPriority = ["low", "medium", "high", "critical"];

    if (status && !validStatus.includes(status)) {
      return res.status(400).json({
        error: true,
        message: `Invalid status. Must be one of: ${validStatus.join(", ")}`,
      });
    }

    if (priority && !validPriority.includes(priority)) {
      return res.status(400).json({
        error: true,
        message: `Invalid priority. Must be one of: ${validPriority.join(
          ", "
        )}`,
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (userNotes) updateData.userNotes = userNotes;
    if (estimatedCost) updateData.estimatedCost = estimatedCost;
    updateData.updatedAt = new Date();

    const recommendation = await RecommendationHistory.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!recommendation) {
      return res.status(404).json({
        error: true,
        message: "Recommendation not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Recommendation updated successfully",
      data: recommendation,
    });
  } catch (error) {
    console.error("Error updating recommendation:", error);
    res.status(500).json({
      error: true,
      message: "Failed to update recommendation",
      details: error.message,
    });
  }
};

export const deleteRecommendation = async (req, res) => {
  try {
    const { id } = req.params;

    const recommendation = await RecommendationHistory.findByIdAndDelete(id);

    if (!recommendation) {
      return res.status(404).json({
        error: true,
        message: "Recommendation not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Recommendation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting recommendation:", error);
    res.status(500).json({
      error: true,
      message: "Failed to delete recommendation",
      details: error.message,
    });
  }
};

export default {
  getInterventions,
  getCandidates,
  createRecommendations,
  getRecommendationHistory,
  getRecommendationDetail,
  updateRecommendationStatus,
  deleteRecommendation,
};
