#!/usr/bin/env node

import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import {
  comprehensivePriceScrape,
  getPriceStats,
} from "../services/deepScraper.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log("✅ MongoDB Connected for scraping");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

const runScraping = async () => {
  try {
    console.log("🚀 Starting Deep Price Scraping Script");
    console.log("=====================================");

    await connectDB();

    console.log("\n📊 Database stats before scraping:");
    const beforeStats = await getPriceStats();
    if (beforeStats) {
      console.log(`Total prices: ${beforeStats.total}`);
      console.log(`Active prices: ${beforeStats.active}`);
      console.log(
        "By source:",
        beforeStats.bySource.map((s) => `${s._id}: ${s.count}`).join(", ")
      );
    }

    console.log("\n🔄 Starting comprehensive price scraping...");
    const results = await comprehensivePriceScrape();

    console.log("\n📊 Database stats after scraping:");
    const afterStats = await getPriceStats();
    if (afterStats) {
      console.log(
        `Total prices: ${afterStats.total} (+${
          afterStats.total - (beforeStats?.total || 0)
        })`
      );
      console.log(`Active prices: ${afterStats.active}`);
      console.log(
        "By source:",
        afterStats.bySource.map((s) => `${s._id}: ${s.count}`).join(", ")
      );
    }

    console.log("\n🎉 Scraping script completed successfully!");
    console.log("==========================================");
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error("❌ Scraping script failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
};

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Deep Price Scraping Script
==========================

This script performs comprehensive price scraping from:
- CPWD SOR (Schedule of Rates) documents
- GeM (Government e-Marketplace) portal

Usage:
  npm run scrape
  node scripts/scrapePrices.js

Options:
  --help, -h    Show this help message

The script will:
1. Download and parse CPWD SOR PDF documents
2. Scrape real-time prices from GeM portal
3. Update the MongoDB database with new prices
4. Provide fallback data when AI services fail

Results are stored in the Price collection and can be used
as reliable fallback data for the Estimator Tool For Intervention.
  `);
  process.exit(0);
}

runScraping();
