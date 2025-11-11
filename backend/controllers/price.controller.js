import Price from "../models/Price.model.js";
import {
  scrapeCPWDPrices,
  scrapeGeMPrices,
} from "../services/scraper.service.js";

export const searchPrices = async (req, res) => {
  try {
    const { query, category, source, limit = 500 } = req.query;

    let filter = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (source) {
      filter.source = source;
    }

    let prices;
    if (query) {
      prices = await Price.find({
        ...filter,
        $text: { $search: query },
      })
        .sort({ score: { $meta: "textScore" } })
        .limit(parseInt(limit));
    } else {
      prices = await Price.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));
    }

    res.status(200).json({
      success: true,
      data: prices,
      count: prices.length,
    });
  } catch (error) {
    console.error("Error searching prices:", error);
    res.status(500).json({
      error: true,
      message: "Failed to search prices",
      details: error.message,
    });
  }
};

export const getPriceStats = async (req, res) => {
  try {
    const { category, source } = req.query;

    let filter = { isActive: true };
    if (category) filter.category = category;
    if (source) filter.source = source;

    const prices = await Price.find(filter);

    if (prices.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          total: 0,
          avgPrice: 0,
          minPrice: 0,
          maxPrice: 0,
          sourceDistribution: {},
          categoryDistribution: {},
          lastUpdated: null,
        },
      });
    }

    const priceValues = prices.map((p) => p.unitPrice || 0);
    const avgPrice = Math.round(
      priceValues.reduce((a, b) => a + b, 0) / priceValues.length
    );

    const sourceDistribution = {};
    prices.forEach((p) => {
      if (!sourceDistribution[p.source]) {
        sourceDistribution[p.source] = { count: 0, total: 0, avg: 0 };
      }
      sourceDistribution[p.source].count += 1;
      sourceDistribution[p.source].total += p.unitPrice || 0;
    });

    Object.keys(sourceDistribution).forEach((src) => {
      sourceDistribution[src].avg = Math.round(
        sourceDistribution[src].total / sourceDistribution[src].count
      );
    });

    const categoryDistribution = {};
    prices.forEach((p) => {
      if (!categoryDistribution[p.category]) {
        categoryDistribution[p.category] = { count: 0, avg: 0 };
      }
      categoryDistribution[p.category].count += 1;
    });

    const lastUpdated = new Date(
      Math.max(...prices.map((p) => new Date(p.lastVerified)))
    );

    res.status(200).json({
      success: true,
      data: {
        total: prices.length,
        avgPrice,
        minPrice: Math.min(...priceValues),
        maxPrice: Math.max(...priceValues),
        sourceDistribution,
        categoryDistribution,
        lastUpdated,
      },
    });
  } catch (error) {
    console.error("Error fetching price stats:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch price statistics",
      details: error.message,
    });
  }
};

export const getCachedPrices = async (req, res) => {
  try {
    const { category, limit = 100 } = req.query;

    const filter = { isActive: true };
    if (category) {
      filter.category = category;
    }

    const prices = await Price.find(filter)
      .sort({ lastVerified: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: prices,
      count: prices.length,
    });
  } catch (error) {
    console.error("Error fetching cached prices:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch cached prices",
      details: error.message,
    });
  }
};

export const fetchLatestPrices = async (req, res) => {
  try {
    const { source, items } = req.body;

    console.log("🔍 Fetching latest prices from:", source || "all sources");

    let fetchedPrices = [];

    if (!source || source === "CPWD_SOR") {
      const cpwdPrices = await scrapeCPWDPrices(items);
      fetchedPrices.push(...cpwdPrices);
    }

    if (!source || source === "GeM") {
      const gemPrices = await scrapeGeMPrices(items);
      fetchedPrices.push(...gemPrices);
    }

    const savedPrices = [];
    for (const priceData of fetchedPrices) {
      const existing = await Price.findOne({
        itemName: priceData.itemName,
        source: priceData.source,
      });

      if (existing) {
        existing.unitPrice = priceData.unitPrice;
        existing.lastVerified = new Date();
        existing.verificationCount += 1;
        await existing.save();
        savedPrices.push(existing);
      } else {
        const newPrice = new Price(priceData);
        await newPrice.save();
        savedPrices.push(newPrice);
      }
    }

    console.log("✅ Fetched and saved", savedPrices.length, "prices");

    res.status(200).json({
      success: true,
      message: "Prices fetched successfully",
      data: savedPrices,
      count: savedPrices.length,
    });
  } catch (error) {
    console.error("Error fetching latest prices:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch latest prices",
      details: error.message,
    });
  }
};

export const updatePrices = async (req, res) => {
  try {
    const { prices } = req.body;

    if (!Array.isArray(prices) || prices.length === 0) {
      return res.status(400).json({
        error: true,
        message: "Invalid prices data",
      });
    }

    const updatedPrices = [];

    for (const priceData of prices) {
      if (!priceData.itemName || !priceData.unitPrice) {
        continue;
      }

      const price = await Price.findOneAndUpdate(
        { itemName: priceData.itemName, source: priceData.source || "MANUAL" },
        {
          ...priceData,
          lastVerified: new Date(),
          source: priceData.source || "MANUAL",
        },
        { upsert: true, new: true }
      );

      updatedPrices.push(price);
    }

    res.status(200).json({
      success: true,
      message: "Prices updated successfully",
      data: updatedPrices,
      count: updatedPrices.length,
    });
  } catch (error) {
    console.error("Error updating prices:", error);
    res.status(500).json({
      error: true,
      message: "Failed to update prices",
      details: error.message,
    });
  }
};

export const addPrice = async (req, res) => {
  try {
    const priceData = req.body;

    if (!priceData.itemName || !priceData.unitPrice) {
      return res.status(400).json({
        error: true,
        message: "Item name and unit price are required",
      });
    }

    const newPrice = new Price({
      ...priceData,
      source: priceData.source || "MANUAL",
      lastVerified: new Date(),
      createdAt: new Date(),
      isActive: true,
    });

    const savedPrice = await newPrice.save();

    res.status(201).json({
      success: true,
      message: "Price added successfully",
      data: savedPrice,
    });
  } catch (error) {
    console.error("Error adding price:", error);
    res.status(500).json({
      error: true,
      message: "Failed to add price",
      details: error.message,
    });
  }
};

export const deletePrice = async (req, res) => {
  try {
    const { id } = req.params;

    const price = await Price.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Price deleted successfully",
      data: price,
    });
  } catch (error) {
    console.error("Error deleting price:", error);
    res.status(500).json({
      error: true,
      message: "Failed to delete price",
      details: error.message,
    });
  }
};

export const getRecentUpdates = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const prices = await Price.find({ isActive: true })
      .sort({ lastVerified: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: prices,
      count: prices.length,
    });
  } catch (error) {
    console.error("Error fetching recent updates:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch recent updates",
      details: error.message,
    });
  }
};
