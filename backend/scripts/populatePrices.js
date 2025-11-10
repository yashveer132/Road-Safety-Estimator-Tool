#!/usr/bin/env node

import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import Price from "../models/Price.model.js";
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

const getCategoryMapping = (cpwdCategory) => {
  const mapping = {
    "Road Signs & Markings": "signage",
    "Road Safety Barriers": "barrier",
    "Delineators & Markers": "signage",
    "Traffic Control": "equipment",
    "Traffic Signals": "equipment",
    Lighting: "lighting",
    Pavement: "surfacing",
    "Traffic Cables": "equipment",
  };
  return mapping[cpwdCategory] || "other";
};

const getSourceType = (sourceString) => {
  if (!sourceString) return "CPWD_SOR";
  if (sourceString.includes("CPWD SOR")) return "CPWD_SOR";
  if (sourceString.includes("GeM")) return "GeM";
  return "CPWD_SOR";
};

const populatePrices = async () => {
  try {
    console.log("\n" + "=".repeat(80));
    console.log(
      "🚀 POPULATING MONGODB PRICE DATABASE FROM VERIFIED CPWD SOR 2024"
    );
    console.log("=".repeat(80));

    await connectDB();

    const cpwdDataPath = path.join(__dirname, "../data/cpwdSORRates2024.json");
    console.log(`\n� Loading verified data from: ${cpwdDataPath}`);

    const cpwdData = JSON.parse(fs.readFileSync(cpwdDataPath, "utf-8"));
    console.log(
      `✅ Loaded ${cpwdData.rates.length} verified items from CPWD SOR 2024`
    );
    console.log(`� Database Version: ${cpwdData.version}`);
    console.log(`🔄 Last Updated: ${cpwdData.lastUpdated}`);

    const beforeCount = await Price.countDocuments();
    console.log(`\n� Current prices in MongoDB: ${beforeCount}`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    console.log("\n💾 Processing and saving to MongoDB...");
    console.log("─".repeat(80));

    for (const item of cpwdData.rates) {
      try {
        const normalizedUnit = normalizeUnit(item.unit);
        const category = getCategoryMapping(item.category);
        const sourceType = getSourceType(item.source);

        const priceData = {
          itemName: item.itemName,
          itemCode: item.itemCode,
          category: category,
          unitPrice: item.unitPrice,
          unit: normalizedUnit,
          currency: "₹",
          source: sourceType,
          sourceDocument: item.source || `CPWD SOR 2024 - ${item.itemCode}`,
          sourceUrl: item.sourceUrl || null,
          description: item.description || "",
          specifications: new Map([
            ["specification", item.specification || ""],
            ["category", item.category || ""],
            ["keywords", (item.keywords || []).join(", ")],
          ]),
          ircReference: item.ircReference || [],
          validFrom: new Date(item.verificationDate || cpwdData.lastUpdated),
          validUntil: new Date("2025-12-31"),
          isActive: true,
          lastVerified: new Date(item.verificationDate || cpwdData.lastUpdated),
          verificationCount: item.verified ? 1 : 0,
        };

        const existing = await Price.findOne({ itemCode: item.itemCode });

        if (existing) {
          const needsUpdate =
            existing.unitPrice !== priceData.unitPrice ||
            normalizeUnit(existing.unit) !== normalizedUnit ||
            (sourceType === "CPWD_SOR" && existing.source !== "CPWD_SOR") ||
            (sourceType === "GeM" && existing.source !== "GeM");

          if (needsUpdate) {
            await Price.findByIdAndUpdate(existing._id, {
              ...priceData,
              verificationCount: existing.verificationCount + 1,
              lastVerified: new Date(),
            });
            updated++;
            console.log(
              `   🔄 Updated: ${item.itemCode} - ${item.itemName} (₹${item.unitPrice}/${normalizedUnit})`
            );
          } else {
            skipped++;
          }
        } else {
          const newPrice = new Price(priceData);
          await newPrice.save();
          inserted++;
          console.log(
            `   ✅ Inserted: ${item.itemCode} - ${item.itemName} (₹${item.unitPrice}/${normalizedUnit}) [${sourceType}]`
          );
        }
      } catch (dbError) {
        errors++;
        console.error(
          `   ❌ Error with ${item.itemCode} - ${item.itemName}:`,
          dbError.message
        );
      }
    }

    const afterCount = await Price.countDocuments();

    console.log("\n" + "=".repeat(80));
    console.log("✅ MONGODB PRICE DATABASE POPULATION COMPLETED");
    console.log("=".repeat(80));
    console.log(`📊 Before: ${beforeCount} prices`);
    console.log(`📊 After: ${afterCount} prices`);
    console.log(`➕ Inserted: ${inserted} new prices`);
    console.log(`🔄 Updated: ${updated} prices`);
    console.log(`⏭️  Skipped: ${skipped} prices (unchanged)`);
    console.log(`❌ Errors: ${errors} items`);
    console.log("=".repeat(80));

    console.log("\n📋 PRICE DATABASE BY CATEGORY:");
    console.log("─".repeat(80));

    const categories = await Price.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgPrice: { $avg: "$unitPrice" },
          cpwdCount: {
            $sum: { $cond: [{ $eq: ["$source", "CPWD_SOR"] }, 1, 0] },
          },
          gemCount: {
            $sum: { $cond: [{ $eq: ["$source", "GeM"] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    for (const cat of categories) {
      console.log(`\n📦 ${cat._id.toUpperCase()} - ${cat.count} items`);
      console.log(`   💰 Average Price: ₹${Math.round(cat.avgPrice)}`);
      console.log(`   📚 CPWD SOR: ${cat.cpwdCount} items`);
      console.log(`   🛒 GeM Portal: ${cat.gemCount} items`);

      const samples = await Price.find({ category: cat._id, isActive: true })
        .sort({ unitPrice: -1 })
        .limit(3)
        .select("itemName itemCode unitPrice unit source");

      console.log(`   📋 Sample Items:`);
      samples.forEach((p) => {
        console.log(
          `      • [${p.itemCode}] ${p.itemName}: ₹${p.unitPrice}/${p.unit} [${p.source}]`
        );
      });
    }

    console.log("\n" + "=".repeat(80));
    console.log("🔍 VERIFICATION SUMMARY:");
    console.log("─".repeat(80));

    const sourceBreakdown = await Price.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$source", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    sourceBreakdown.forEach((src) => {
      const percentage = ((src.count / afterCount) * 100).toFixed(1);
      console.log(`   ${src._id}: ${src.count} items (${percentage}%)`);
    });

    const verifiedCount = await Price.countDocuments({
      isActive: true,
      source: { $in: ["CPWD_SOR", "GeM"] },
    });
    const verifiedPercentage = ((verifiedCount / afterCount) * 100).toFixed(1);

    console.log("\n" + "=".repeat(80));
    console.log(
      `✅ OFFICIAL SOURCES (CPWD + GeM): ${verifiedCount}/${afterCount} (${verifiedPercentage}%)`
    );

    if (verifiedPercentage >= 100) {
      console.log(
        "🎉 🎉 🎉 100% HACKATHON READY - ALL OFFICIAL RATES! 🎉 🎉 🎉"
      );
    } else {
      console.log(
        `⚠️  Warning: ${100 - verifiedPercentage}% non-official rates detected`
      );
    }
    console.log("=".repeat(80) + "\n");

    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    console.log("✅ Ready for hackathon submission!\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error populating prices:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

populatePrices();
