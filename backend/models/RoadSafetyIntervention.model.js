import mongoose from "mongoose";

const roadSafetyInterventionSchema = new mongoose.Schema(
  {
    problem: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    interventionType: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    clause: {
      type: String,
      required: true,
    },
    tags: [String],
    context: {
      roadType: [String],
      environment: [String],
      issueKeywords: [String],
    },
  },
  {
    timestamps: true,
  }
);

roadSafetyInterventionSchema.index({
  problem: "text",
  category: "text",
  interventionType: "text",
  description: "text",
  code: "text",
  clause: "text",
  tags: "text",
});

const RoadSafetyIntervention = mongoose.model(
  "RoadSafetyIntervention",
  roadSafetyInterventionSchema
);

export default RoadSafetyIntervention;
