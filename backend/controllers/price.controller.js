import Price from "../models/Price.model.js";
import {
  scrapeCPWDPrices,
  scrapeGeMPrices,
} from "../services/scraper.service.js";

export const searchPrices = async (req, res) => {
  try {
    const { query, category, source } = req.query;

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
        .limit(20);
    } else {
      prices = await Price.find(filter).sort({ createdAt: -1 }).limit(20);
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
