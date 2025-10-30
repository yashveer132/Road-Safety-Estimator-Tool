import {
  getDashboardMetrics,
  getAllMetricsPeriods,
  getMetricsComparison,
} from "../services/dashboard.service.js";
import Estimate from "../models/Estimate.model.js";

export const getDashboardData = async (req, res) => {
  try {
    const { period = "all-time" } = req.query;

    const metrics = await getDashboardMetrics(period);

    res.status(200).json({
      success: true,
      data: {
        period,
        metrics,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch dashboard metrics",
      details: error.message,
    });
  }
};

export const getAllMetrics = async (req, res) => {
  try {
    const allMetrics = await getAllMetricsPeriods();

    res.status(200).json({
      success: true,
      data: allMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching all metrics:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch all metrics",
      details: error.message,
    });
  }
};

export const getKPISummary = async (req, res) => {
  try {
    const metrics = await getDashboardMetrics("all-time");

    const kpis = {
      totalEstimates: metrics.estimates.total,
      completionRate: metrics.estimates.completionRate,
      totalMaterialCost: metrics.costs.totalMaterialCost,
      averageCostPerEstimate: metrics.costs.averageCostPerEstimate,

      totalInterventions: metrics.interventions.total,
      uniqueMaterials: metrics.materials.totalUnique,
      topIRCStandard: metrics.ircStandards.topUsed[0],
      topMaterial: metrics.materials.topUsed[0],

      estimateAccuracy: metrics.quality.estimateAccuracy,
      priceDataAccuracy: metrics.quality.priceDataAccuracy,

      successRate: metrics.documents.successRate,
      failedEstimates: metrics.estimates.failed,
    };

    res.status(200).json({
      success: true,
      data: kpis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching KPI summary:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch KPI summary",
      details: error.message,
    });
  }
};

export const getComparison = async (req, res) => {
  try {
    const comparison = await getMetricsComparison();

    res.status(200).json({
      success: true,
      data: comparison,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching comparison data:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch comparison data",
      details: error.message,
    });
  }
};

export const getPerformanceAnalytics = async (req, res) => {
  try {
    const estimates = await Estimate.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const performanceData = {
      avgProcessingTime: 0,
      successRate: 0,
      failureReasons: {},
      estimatesByStatus: {
        completed: 0,
        processing: 0,
        failed: 0,
      },
      estimatesByCost: {
        under50k: 0,
        between50kTo100k: 0,
        between100kTo500k: 0,
        between500kTo1m: 0,
        above1m: 0,
      },
      costDistribution: {
        min: 0,
        max: 0,
        avg: 0,
        median: 0,
      },
    };

    let totalCosts = [];

    estimates.forEach((estimate) => {
      performanceData.estimatesByStatus[estimate.status]++;

      if (estimate.status === "completed") {
        const cost = estimate.totalMaterialCost || 0;
        totalCosts.push(cost);

        if (cost < 50000) performanceData.estimatesByCost.under50k++;
        else if (cost < 100000)
          performanceData.estimatesByCost.between50kTo100k++;
        else if (cost < 500000)
          performanceData.estimatesByCost.between100kTo500k++;
        else if (cost < 1000000)
          performanceData.estimatesByCost.between500kTo1m++;
        else performanceData.estimatesByCost.above1m++;
      } else if (estimate.status === "failed") {
        const reason = estimate.errorMessage || "Unknown";
        performanceData.failureReasons[reason] =
          (performanceData.failureReasons[reason] || 0) + 1;
      }
    });

    const completed = performanceData.estimatesByStatus.completed;
    performanceData.successRate =
      estimates.length > 0
        ? Math.round((completed / estimates.length) * 100)
        : 0;

    if (totalCosts.length > 0) {
      performanceData.costDistribution.min = Math.min(...totalCosts);
      performanceData.costDistribution.max = Math.max(...totalCosts);
      performanceData.costDistribution.avg = Math.round(
        totalCosts.reduce((a, b) => a + b, 0) / totalCosts.length
      );

      const sorted = [...totalCosts].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      performanceData.costDistribution.median =
        sorted.length % 2 !== 0
          ? sorted[mid]
          : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
    }

    res.status(200).json({
      success: true,
      data: performanceData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching performance analytics:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch performance analytics",
      details: error.message,
    });
  }
};

export const getRecentEstimates = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const estimates = await Estimate.find({ status: "completed" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select(
        "documentName totalMaterialCost status createdAt interventions materialEstimates"
      )
      .lean();

    const formatted = estimates.map((est) => ({
      id: est._id,
      documentName: est.documentName,
      totalCost: est.totalMaterialCost,
      interventionsCount: est.interventions?.length || 0,
      sectionsCount: est.materialEstimates?.length || 0,
      createdAt: est.createdAt,
      costPerIntervention:
        est.interventions && est.interventions.length > 0
          ? Math.round(est.totalMaterialCost / est.interventions.length)
          : 0,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching recent estimates:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch recent estimates",
      details: error.message,
    });
  }
};

export const getCategoryBreakdown = async (req, res) => {
  try {
    const estimates = await Estimate.find({ status: "completed" }).lean();

    const categoryData = {};

    estimates.forEach((estimate) => {
      estimate.materialEstimates?.forEach((section) => {
        if (!categoryData[section.sectionId]) {
          categoryData[section.sectionId] = {
            name: section.sectionName,
            count: 0,
            totalCost: 0,
            items: [],
          };
        }

        categoryData[section.sectionId].count += section.items?.length || 0;
        categoryData[section.sectionId].totalCost += section.totalCost || 0;

        section.items?.forEach((item) => {
          categoryData[section.sectionId].items.push({
            intervention: item.recommendation,
            cost: item.totalCost,
            materials: item.materials?.length || 0,
          });
        });
      });
    });

    const breakdown = Object.entries(categoryData).map(([id, data]) => ({
      id,
      name: data.name,
      itemCount: data.count,
      totalCost: data.totalCost,
      averageCostPerItem:
        data.count > 0 ? Math.round(data.totalCost / data.count) : 0,
      percentage:
        Object.values(categoryData).reduce((sum, c) => sum + c.totalCost, 0) > 0
          ? Math.round(
              (data.totalCost /
                Object.values(categoryData).reduce(
                  (sum, c) => sum + c.totalCost,
                  0
                )) *
                100
            )
          : 0,
    }));

    res.status(200).json({
      success: true,
      data: breakdown,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching category breakdown:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch category breakdown",
      details: error.message,
    });
  }
};

export const getIRCDistribution = async (req, res) => {
  try {
    const estimates = await Estimate.find({ status: "completed" }).lean();

    const ircMap = {};

    estimates.forEach((estimate) => {
      estimate.ircMappings?.forEach((mapping) => {
        const code = mapping.ircCode || "Unknown";
        if (!ircMap[code]) {
          ircMap[code] = {
            code,
            usageCount: 0,
            estimatesCount: new Set(),
            clause: mapping.clause || "N/A",
          };
        }
        ircMap[code].usageCount++;
        ircMap[code].estimatesCount.add(estimate._id.toString());
      });
    });

    const distribution = Object.values(ircMap)
      .map((irc) => ({
        code: irc.code,
        clause: irc.clause,
        usageCount: irc.usageCount,
        estimatesAffected: irc.estimatesCount.size,
        percentage:
          estimates.length > 0
            ? Math.round((irc.usageCount / estimates.length) * 100)
            : 0,
      }))
      .sort((a, b) => b.usageCount - a.usageCount);

    res.status(200).json({
      success: true,
      data: distribution,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching IRC distribution:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch IRC distribution",
      details: error.message,
    });
  }
};

export default {
  getDashboardData,
  getAllMetrics,
  getKPISummary,
  getComparison,
  getPerformanceAnalytics,
  getRecentEstimates,
  getCategoryBreakdown,
  getIRCDistribution,
};
