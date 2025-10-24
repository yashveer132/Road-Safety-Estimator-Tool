import mongoose from "mongoose";

const estimateSchema = new mongoose.Schema(
  {
    documentName: {
      type: String,
      required: true,
    },
    documentType: {
      type: String,
      enum: ["pdf", "docx", "txt"],
      required: true,
    },
    extractedText: {
      type: String,
      required: true,
    },

    interventions: [
      {
        name: String,
        description: String,
        quantity: Number,
        unit: String,
        location: String,
        priority: String,
      },
    ],

    ircMappings: [
      {
        intervention: String,
        ircCode: String,
        clause: String,
        specification: String,
        relevance: String,
      },
    ],

    materialEstimates: [
      {
        intervention: String,
        items: [
          {
            itemName: String,
            description: String,
            quantity: Number,
            unit: String,
            unitPrice: Number,
            totalPrice: Number,
            source: String,
            sourceUrl: String,
            lastUpdated: Date,
          },
        ],
        totalCost: Number,
        ircReference: String,
        assumptions: [String],
        rationale: String,
      },
    ],

    totalMaterialCost: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "₹",
    },

    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },
    errorMessage: String,

    reportGenerated: {
      type: Boolean,
      default: false,
    },
    reportUrl: String,
  },
  {
    timestamps: true,
  }
);

estimateSchema.index({ createdAt: -1 });
estimateSchema.index({ status: 1 });

const Estimate = mongoose.model("Estimate", estimateSchema);

export default Estimate;
