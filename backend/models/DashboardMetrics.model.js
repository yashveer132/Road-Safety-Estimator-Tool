import mongoose from "mongoose";

const dashboardMetricsSchema = new mongoose.Schema(
  {
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly", "all-time"],
      default: "daily",
    },
    date: {
      type: Date,
      default: () => new Date().setHours(0, 0, 0, 0),
      index: true,
    },

    estimates: {
      total: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      processing: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 }, // percentage
    },

    costs: {
      totalMaterialCost: { type: Number, default: 0 },
      averageCostPerEstimate: { type: Number, default: 0 },
      minCost: { type: Number, default: 0 },
      maxCost: { type: Number, default: 0 },
      medianCost: { type: Number, default: 0 },
      stdDeviation: { type: Number, default: 0 },
    },

    interventions: {
      total: { type: Number, default: 0 },
      byCategory: {
        type: Map,
        of: {
          count: Number,
          totalCost: Number,
          avgCost: Number,
        },
      },
      averagePerEstimate: { type: Number, default: 0 },
      maxPerEstimate: { type: Number, default: 0 },
      minPerEstimate: { type: Number, default: 0 },
    },

    ircStandards: {
      byCode: {
        type: Map,
        of: {
          usageCount: Number,
          totalCost: Number,
          estimatesCount: Number,
        },
      },
      topUsed: [
        {
          code: String,
          usageCount: Number,
          percentage: Number,
        },
      ],
    },

    materials: {
      totalUnique: { type: Number, default: 0 },
      byCategory: {
        type: Map,
        of: {
          count: Number,
          totalCost: Number,
          avgUnitPrice: Number,
        },
      },
      topUsed: [
        {
          itemName: String,
          count: Number,
          totalQuantity: Number,
          unit: String,
          totalCost: Number,
          avgUnitPrice: Number,
        },
      ],
    },

    sources: {
      byType: {
        type: Map,
        of: {
          count: Number,
          percentage: Number,
          totalCost: Number,
          reliability: Number,
        },
      },
    },

    documents: {
      total: { type: Number, default: 0 },
      byType: {
        type: Map,
        of: Number,
      },
      avgProcessingTimeMs: { type: Number, default: 0 },
      successRate: { type: Number, default: 0 },
    },

    performance: {
      avgExtractionTime: { type: Number, default: 0 },
      avgAIProcessingTime: { type: Number, default: 0 },
      avgCostCalculationTime: { type: Number, default: 0 },
      totalProcessingTime: { type: Number, default: 0 },
      apiCallsCount: { type: Number, default: 0 },
      cacheHitRate: { type: Number, default: 0 }, // percentage
    },

    trends: [
      {
        date: Date,
        estimates: Number,
        totalCost: Number,
        avgCost: Number,
        completionRate: Number,
      },
    ],

    quality: {
      priceDataAccuracy: { type: Number, default: 95 }, // percentage
      estimateAccuracy: { type: Number, default: 92 }, // percentage
      dataFreshness: { type: Number, default: 100 }, // percentage
    },

    engagement: {
      estimatesCreatedLastDay: { type: Number, default: 0 },
      estimatesCreatedLastWeek: { type: Number, default: 0 },
      estimatesCreatedLastMonth: { type: Number, default: 0 },
      activeUsersLastDay: { type: Number, default: 0 },
      activeUsersLastWeek: { type: Number, default: 0 },
    },

    alerts: [
      {
        type: String,
        severity: {
          type: String,
          enum: ["info", "warning", "error"],
        },
        message: String,
        createdAt: Date,
        resolved: { type: Boolean, default: false },
      },
    ],

    lastCalculated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

dashboardMetricsSchema.index({ date: -1, period: 1 });
dashboardMetricsSchema.index({ period: 1 });
dashboardMetricsSchema.index({ lastCalculated: -1 });

const DashboardMetrics = mongoose.model(
  "DashboardMetrics",
  dashboardMetricsSchema
);

export default DashboardMetrics;
