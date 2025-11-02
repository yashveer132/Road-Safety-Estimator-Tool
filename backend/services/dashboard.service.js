import Estimate from "../models/Estimate.model.js";
import Price from "../models/Price.model.js";
import DashboardMetrics from "../models/DashboardMetrics.model.js";

export const calculateDashboardMetrics = async (period = "all-time") => {
  try {
    console.log(`📊 Calculating dashboard metrics for period: ${period}`);

    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case "daily":
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          },
        };
        break;
      case "weekly":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        dateFilter = {
          createdAt: {
            $gte: weekStart,
            $lt: now,
          },
        };
        break;
      case "monthly":
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1),
            $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
          },
        };
        break;
      case "yearly":
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), 0, 1),
            $lt: new Date(now.getFullYear() + 1, 0, 1),
          },
        };
        break;
    }

    const estimates = await Estimate.find(dateFilter);

    const estimateStats = {
      total: estimates.length,
      completed: estimates.filter((e) => e.status === "completed").length,
      processing: estimates.filter((e) => e.status === "processing").length,
      failed: estimates.filter((e) => e.status === "failed").length,
      completionRate:
        estimates.length > 0
          ? Math.round(
              (estimates.filter((e) => e.status === "completed").length /
                estimates.length) *
                100
            )
          : 0,
    };

    const costs = estimates
      .filter((e) => e.status === "completed")
      .map((e) => e.totalMaterialCost || 0);

    const costStats = {
      totalMaterialCost: costs.reduce((a, b) => a + b, 0),
      averageCostPerEstimate:
        costs.length > 0
          ? Math.round(costs.reduce((a, b) => a + b, 0) / costs.length)
          : 0,
      minCost: costs.length > 0 ? Math.min(...costs) : 0,
      maxCost: costs.length > 0 ? Math.max(...costs) : 0,
      medianCost: calculateMedian(costs),
      stdDeviation: calculateStdDeviation(costs),
    };

    let totalInterventions = 0;
    const interventionsByCategory = {};

    estimates.forEach((estimate) => {
      totalInterventions += estimate.interventions?.length || 0;

      estimate.materialEstimates?.forEach((section) => {
        if (!interventionsByCategory[section.sectionId]) {
          interventionsByCategory[section.sectionId] = {
            count: 0,
            totalCost: 0,
          };
        }
        interventionsByCategory[section.sectionId].count +=
          section.items?.length || 0;
        interventionsByCategory[section.sectionId].totalCost +=
          section.totalCost || 0;
      });
    });

    const interventionStats = {
      total: totalInterventions,
      byCategory: interventionsByCategory,
      averagePerEstimate:
        estimates.length > 0
          ? Math.round(totalInterventions / estimates.length)
          : 0,
    };

    const ircUsage = {};
    const ircCostMap = {};

    estimates.forEach((estimate) => {
      estimate.ircMappings?.forEach((mapping) => {
        const sanitizedCode = mapping.ircCode.replace(/\./g, "_");

        if (!ircUsage[sanitizedCode]) {
          ircUsage[sanitizedCode] = {
            usageCount: 0,
            totalCost: 0,
            estimatesCount: new Set(),
            originalCode: mapping.ircCode,
          };
        }
        ircUsage[sanitizedCode].usageCount++;
        ircUsage[sanitizedCode].estimatesCount.add(estimate._id.toString());
        ircCostMap[sanitizedCode] =
          (ircCostMap[sanitizedCode] || 0) +
          (mapping.materials?.reduce((sum, m) => sum + (m.quantity || 0), 0) ||
            0);
      });
    });

    const topIRC = Object.entries(ircUsage)
      .map(([sanitizedCode, data]) => ({
        code: data.originalCode,
        usageCount: data.usageCount,
        percentage:
          estimates.length > 0
            ? Math.round((data.usageCount / estimates.length) * 100)
            : 0,
        estimatesCount: data.estimatesCount.size,
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);

    const materialInsights = {};
    const allMaterials = [];

    estimates.forEach((estimate) => {
      estimate.materialEstimates?.forEach((section) => {
        section.items?.forEach((item) => {
          item.materials?.forEach((material) => {
            allMaterials.push(material);
            if (!materialInsights[material.itemName]) {
              materialInsights[material.itemName] = {
                count: 0,
                totalQuantity: 0,
                unit: material.unit,
                totalCost: 0,
              };
            }
            materialInsights[material.itemName].count++;
            materialInsights[material.itemName].totalQuantity +=
              material.quantity || 0;
            materialInsights[material.itemName].totalCost +=
              material.totalPrice || 0;
          });
        });
      });
    });

    const topMaterials = Object.entries(materialInsights)
      .map(([name, data]) => ({
        itemName: name,
        count: data.count,
        totalQuantity: data.totalQuantity,
        unit: data.unit,
        totalCost: data.totalCost,
        avgUnitPrice:
          data.totalQuantity > 0
            ? Math.round(data.totalCost / data.totalQuantity)
            : 0,
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10);

    const sourceStats = {};
    allMaterials.forEach((material) => {
      const source = material.source || "UNKNOWN";
      if (!sourceStats[source]) {
        sourceStats[source] = {
          count: 0,
          totalCost: 0,
        };
      }
      sourceStats[source].count++;
      sourceStats[source].totalCost += material.totalPrice || 0;
    });

    const totalMaterials = allMaterials.length;

    const docStats = {
      total: estimates.length,
      byType: {},
      successRate: estimateStats.completionRate,
    };

    estimates.forEach((est) => {
      docStats.byType[est.documentType] =
        (docStats.byType[est.documentType] || 0) + 1;
    });

    const trends = [];
    const last7Days = new Array(7).fill(null).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    });

    for (const day of last7Days) {
      const dayEstimates = estimates.filter((e) => {
        const eDate = new Date(e.createdAt);
        return (
          eDate.getFullYear() === day.getFullYear() &&
          eDate.getMonth() === day.getMonth() &&
          eDate.getDate() === day.getDate()
        );
      });

      const dayCosts = dayEstimates
        .filter((e) => e.status === "completed")
        .map((e) => e.totalMaterialCost || 0);

      trends.push({
        date: day,
        estimates: dayEstimates.length,
        totalCost: dayCosts.reduce((a, b) => a + b, 0),
        avgCost:
          dayCosts.length > 0
            ? Math.round(dayCosts.reduce((a, b) => a + b, 0) / dayCosts.length)
            : 0,
        completionRate:
          dayEstimates.length > 0
            ? Math.round(
                (dayEstimates.filter((e) => e.status === "completed").length /
                  dayEstimates.length) *
                  100
              )
            : 0,
      });
    }

    const metricsData = {
      period,
      date: dateFilter.createdAt ? dateFilter.createdAt.$gte : now,
      estimates: estimateStats,
      costs: costStats,
      interventions: interventionStats,
      ircStandards: {
        byCode: Object.fromEntries(
          Object.entries(ircUsage).map(([sanitizedCode, data]) => [
            sanitizedCode,
            {
              usageCount: data.usageCount,
              estimatesCount: data.estimatesCount.size,
              originalCode: data.originalCode,
            },
          ])
        ),
        topUsed: topIRC,
      },
      materials: {
        totalUnique: Object.keys(materialInsights).length,
        byCategory: {},
        topUsed: topMaterials,
      },
      sources: {
        byType: Object.fromEntries(
          Object.entries(sourceStats).map(([source, data]) => [
            source,
            {
              count: data.count,
              percentage:
                totalMaterials > 0
                  ? Math.round((data.count / totalMaterials) * 100)
                  : 0,
              totalCost: data.totalCost,
              reliability: getSourceReliability(source),
            },
          ])
        ),
      },
      documents: docStats,
      trends,
      quality: {
        priceDataAccuracy: 95,
        estimateAccuracy: 92,
        dataFreshness: 100,
      },
      lastCalculated: new Date(),
    };

    return metricsData;
  } catch (error) {
    console.error("Error calculating dashboard metrics:", error);
    throw error;
  }
};

export const getDashboardMetrics = async (period = "all-time") => {
  try {
    const cacheExpiry =
      period === "daily" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    const cachedMetrics = await DashboardMetrics.findOne({
      period,
      lastCalculated: {
        $gte: new Date(Date.now() - cacheExpiry),
      },
    }).sort({ lastCalculated: -1 });

    if (cachedMetrics) {
      console.log(`✅ Using cached metrics for period: ${period}`);
      return cachedMetrics;
    }

    const metricsData = await calculateDashboardMetrics(period);

    const savedMetrics = new DashboardMetrics(metricsData);
    await savedMetrics.save();

    return savedMetrics;
  } catch (error) {
    console.error("Error getting dashboard metrics:", error);
    throw error;
  }
};

export const getAllMetricsPeriods = async () => {
  try {
    const periods = ["daily", "weekly", "monthly", "yearly", "all-time"];
    const results = {};

    for (const period of periods) {
      results[period] = await getDashboardMetrics(period);
    }

    return results;
  } catch (error) {
    console.error("Error getting all metrics periods:", error);
    throw error;
  }
};

export const getMetricsComparison = async () => {
  try {
    const now = new Date();

    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());

    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(currentWeekStart.getDate() - 7);

    const currentWeekEstimates = await Estimate.find({
      createdAt: {
        $gte: currentWeekStart,
        $lt: now,
      },
    });

    const previousWeekEstimates = await Estimate.find({
      createdAt: {
        $gte: previousWeekStart,
        $lt: currentWeekStart,
      },
    });

    const currentCost = currentWeekEstimates.reduce(
      (sum, e) => sum + (e.totalMaterialCost || 0),
      0
    );
    const previousCost = previousWeekEstimates.reduce(
      (sum, e) => sum + (e.totalMaterialCost || 0),
      0
    );

    const costChange =
      previousCost > 0
        ? Math.round(((currentCost - previousCost) / previousCost) * 100)
        : 0;

    return {
      current: {
        week: {
          estimates: currentWeekEstimates.length,
          totalCost: currentCost,
          avgCost:
            currentWeekEstimates.length > 0
              ? Math.round(currentCost / currentWeekEstimates.length)
              : 0,
        },
      },
      previous: {
        week: {
          estimates: previousWeekEstimates.length,
          totalCost: previousCost,
          avgCost:
            previousWeekEstimates.length > 0
              ? Math.round(previousCost / previousWeekEstimates.length)
              : 0,
        },
      },
      comparison: {
        estimatesChange:
          currentWeekEstimates.length - previousWeekEstimates.length,
        costChange,
      },
    };
  } catch (error) {
    console.error("Error getting metrics comparison:", error);
    throw error;
  }
};

function calculateMedian(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function calculateStdDeviation(arr) {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const squareDiffs = arr.map((n) => Math.pow(n - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / arr.length;
  return Math.round(Math.sqrt(avgSquareDiff));
}

function getSourceReliability(source) {
  const reliabilityMap = {
    CPWD_SOR: 95,
    GeM: 90,
    AOR: 85,
    MANUAL: 70,
    AI_ESTIMATED: 80,
    UNKNOWN: 60,
  };
  return reliabilityMap[source] || 65;
}

export default {
  calculateDashboardMetrics,
  getDashboardMetrics,
  getAllMetricsPeriods,
  getMetricsComparison,
};
