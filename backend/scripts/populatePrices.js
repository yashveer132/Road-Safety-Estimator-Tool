#!/usr/bin/env node

import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import Price from "../models/Price.model.js";
import {
  scrapeCPWDPrices,
  scrapeGeMPrices,
} from "../services/scraper.service.js";
import { normalizeUnit } from "../utils/unit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log("✅ MongoDB Connected for price population");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

const populatePrices = async () => {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("🚀 POPULATING PRICE DATABASE");
    console.log("=".repeat(60));

    await connectDB();

    const beforeCount = await Price.countDocuments();
    console.log(`📊 Current prices in database: ${beforeCount}`);

    console.log("\n📥 Fetching CPWD SOR prices...");
    const cpwdPrices = await scrapeCPWDPrices();
    console.log(`   ✅ Got ${cpwdPrices.length} CPWD prices`);

    console.log("\n📥 Fetching GeM portal prices...");
    const gemPrices = await scrapeGeMPrices();
    console.log(`   ✅ Got ${gemPrices.length} GeM prices`);

    const allPrices = [...cpwdPrices, ...gemPrices];
    console.log(`\n📦 Total prices to process: ${allPrices.length}`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    console.log("\n💾 Saving to database...");
    for (const price of allPrices) {
      const normalizedUnit = normalizeUnit(price.unit);
      const sanitizedPrice = {
        ...price,
        unit: normalizedUnit,
      };

      try {
        const existing = await Price.findOne({
          itemCode: sanitizedPrice.itemCode,
        });

        if (existing) {
          if (
            existing.unitPrice !== sanitizedPrice.unitPrice ||
            normalizeUnit(existing.unit) !== normalizedUnit
          ) {
            await Price.findByIdAndUpdate(existing._id, {
              unitPrice: sanitizedPrice.unitPrice,
              unit: normalizedUnit,
              lastVerified: new Date(),
            });
            updated++;
            console.log(`   🔄 Updated: ${sanitizedPrice.itemName}`);
          } else {
            skipped++;
          }
        } else {
          const newPrice = new Price(sanitizedPrice);
          await newPrice.save();
          inserted++;
          console.log(`   ✅ Inserted: ${sanitizedPrice.itemName}`);
        }
      } catch (dbError) {
        console.error(
          `   ❌ Error with ${sanitizedPrice.itemName}:`,
          dbError.message
        );
      }
    }

    const afterCount = await Price.countDocuments();

    console.log("\n" + "=".repeat(60));
    console.log("✅ PRICE DATABASE POPULATION COMPLETED");
    console.log("=".repeat(60));
    console.log(`📊 Before: ${beforeCount} prices`);
    console.log(`📊 After: ${afterCount} prices`);
    console.log(`➕ Inserted: ${inserted} new prices`);
    console.log(`🔄 Updated: ${updated} prices`);
    console.log(`⏭️  Skipped: ${skipped} prices (unchanged)`);
    console.log("=".repeat(60) + "\n");

    console.log("📋 Sample Prices by Category:");
    const categories = await Price.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    for (const cat of categories) {
      const samples = await Price.find({ category: cat._id, isActive: true })
        .limit(2)
        .select("itemName unitPrice unit source");

      console.log(`\n${cat._id.toUpperCase()} (${cat.count} items):`);
      samples.forEach((p) => {
        console.log(
          `   • ${p.itemName}: ₹${p.unitPrice} per ${p.unit} [${p.source}]`
        );
      });
    }

    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error populating prices:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

populatePrices();
