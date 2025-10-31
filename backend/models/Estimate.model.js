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
        sectionId: String,
        sectionName: String,
        serialNo: Number,
        chainage: String,
        side: String,
        road: String,
        observation: String,
        recommendation: String,
        ircClause: String,
      },
    ],

    ircMappings: [
      {
        sectionId: String,
        serialNo: Number,
        recommendation: String,
        ircCode: String,
        clause: String,
        specification: String,
        materials: [
          {
            item: String,
            quantity: Number,
            unit: String,
            details: String,
          },
        ],
      },
    ],

    materialEstimates: [
      {
        sectionId: String,
        sectionName: String,
        items: [
          {
            no: Number,
            chainage: String,
            side: String,
            road: String,
            observation: String,
            recommendation: String,
            ircReference: String,
            materials: [
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
            rationale: String,
            assumptions: [String],
            notes: String,
          },
        ],
        totalCost: Number,
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
