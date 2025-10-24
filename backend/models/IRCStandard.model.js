import mongoose from "mongoose";

const ircStandardSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    year: Number,
    version: String,

    clauses: [
      {
        clauseNumber: String,
        title: String,
        content: String,
        specifications: [
          {
            parameter: String,
            value: String,
            unit: String,
            condition: String,
          },
        ],
        relatedInterventions: [String],
      },
    ],

    category: {
      type: String,
      enum: [
        "signage",
        "marking",
        "geometric_design",
        "safety_barrier",
        "lighting",
        "general",
      ],
    },
    keywords: [String],

    documentUrl: String,
    lastUpdated: Date,
  },
  {
    timestamps: true,
  }
);

ircStandardSchema.index({
  title: "text",
  "clauses.content": "text",
  keywords: "text",
});

const IRCStandard = mongoose.model("IRCStandard", ircStandardSchema);

export default IRCStandard;
