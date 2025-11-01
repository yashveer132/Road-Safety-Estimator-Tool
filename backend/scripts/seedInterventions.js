import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import connectDB from "../config/database.js";
import RoadSafetyIntervention from "../models/RoadSafetyIntervention.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const seedInterventions = async () => {
  try {
    await connectDB();

    const dataPath = path.resolve(
      __dirname,
      "../data/roadSafetyInterventions.json"
    );
    const raw = fs.readFileSync(dataPath, "utf-8");
    const interventions = JSON.parse(raw);

    for (const record of interventions) {
      await RoadSafetyIntervention.findOneAndUpdate(
        {
          problem: record.problem,
          interventionType: record.interventionType,
          code: record.code,
          clause: record.clause,
        },
        record,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log(`✅ Seeded ${interventions.length} road safety interventions`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed interventions:", error);
    process.exit(1);
  }
};

seedInterventions();
