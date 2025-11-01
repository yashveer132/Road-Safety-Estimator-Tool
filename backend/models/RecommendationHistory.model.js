import mongoose from "mongoose";

const recommendationHistorySchema = new mongoose.Schema(
  {
    roadType: String,
    environment: String,
    trafficVolume: String,
    speedLimit: String,
    issues: [String],
    problemDescription: String,
    constraints: String,
    additionalNotes: String,
    category: String,

    recommendations: [
      {
        title: String,
        sourceId: mongoose.Schema.Types.ObjectId,
        problem: String,
        recommendedAction: String,
        justification: String,
        ircReference: {
          code: String,
          clause: String,
          excerpt: String,
        },
        confidence: {
          type: String,
          enum: ["High", "Medium", "Low"],
        },
        matchingFactors: [String],
        followUp: [String],
      },
    ],
    supportingNotes: String,
    followUpQuestions: [String],
    candidateSnapshot: [
      {
        id: mongoose.Schema.Types.ObjectId,
        problem: String,
        category: String,
        interventionType: String,
        description: String,
        code: String,
        clause: String,
      },
    ],

    status: {
      type: String,
      enum: ["generated", "reviewed", "approved", "rejected"],
      default: "generated",
    },
    userNotes: String,
    estimatedCost: Number,
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

recommendationHistorySchema.index({ createdAt: -1 });
recommendationHistorySchema.index({ roadType: 1, category: 1 });
recommendationHistorySchema.index({ status: 1 });
recommendationHistorySchema.index({ priority: 1 });

const RecommendationHistory = mongoose.model(
  "RecommendationHistory",
  recommendationHistorySchema
);

export default RecommendationHistory;
