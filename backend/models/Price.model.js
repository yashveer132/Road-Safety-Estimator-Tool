import mongoose from "mongoose";

const priceSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
      index: true,
    },
    itemCode: String,
    category: {
      type: String,
      enum: [
        "signage",
        "marking",
        "barrier",
        "lighting",
        "surfacing",
        "equipment",
        "other",
      ],
      required: true,
    },

    unitPrice: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      default: "₹",
    },

    source: {
      type: String,
      enum: ["CPWD_SOR", "GeM", "AOR", "MANUAL", "AI_ESTIMATED"],
      required: true,
    },
    sourceUrl: String,
    sourceDocument: String,

    specifications: {
      type: Map,
      of: String,
    },
    description: String,

    ircReference: [String],

    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: Date,
    isActive: {
      type: Boolean,
      default: true,
    },

    lastVerified: {
      type: Date,
      default: Date.now,
    },
    verificationCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

priceSchema.index({ itemName: "text", description: "text" });
priceSchema.index({ category: 1, isActive: 1 });
priceSchema.index({ source: 1 });
priceSchema.index({ validFrom: -1 });

const Price = mongoose.model("Price", priceSchema);

export default Price;
