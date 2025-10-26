import Estimate from "../models/Estimate.model.js";
import { extractTextFromDocument } from "../services/document.service.js";
import {
  parseInterventions,
  mapToIRCStandards,
} from "../services/ai.service.js";
import { calculateMaterialCosts } from "../services/cost.service.js";
import { generatePDFReport } from "../services/report.service.js";

export const uploadDocument = async (req, res) => {
  try {
    if (!req.files || !req.files.document) {
      return res.status(400).json({
        error: true,
        message: "No document uploaded",
      });
    }

    const document = req.files.document;
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(document.mimetype)) {
      return res.status(400).json({
        error: true,
        message: "Invalid file type. Please upload PDF, DOCX, or TXT file.",
      });
    }

    console.log("📄 Processing document:", document.name);

    const extractedText = await extractTextFromDocument(document);

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({
        error: true,
        message:
          "Could not extract text from document. Please ensure the document contains readable text.",
      });
    }

    const fileExtension = document.name.split(".").pop().toLowerCase();
    const documentType =
      fileExtension === "pdf"
        ? "pdf"
        : fileExtension === "docx"
        ? "docx"
        : "txt";

    const estimate = new Estimate({
      documentName: document.name,
      documentType,
      extractedText,
      status: "processing",
    });

    await estimate.save();

    console.log("✅ Document uploaded and saved:", estimate._id);

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: {
        estimateId: estimate._id,
        documentName: estimate.documentName,
        textLength: extractedText.length,
      },
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({
      error: true,
      message: "Failed to upload document",
      details: error.message,
    });
  }
};

export const processDocument = async (req, res) => {
  try {
    const { estimateId } = req.params;

    const estimate = await Estimate.findById(estimateId);

    if (!estimate) {
      return res.status(404).json({
        error: true,
        message: "Estimate not found",
      });
    }

    if (estimate.status === "completed") {
      return res.status(200).json({
        success: true,
        message: "Estimate already processed",
        data: estimate,
      });
    }

    console.log("🔄 Processing estimate:", estimateId);

    console.log("📊 Step 1: Parsing interventions...");
    const interventions = await parseInterventions(estimate.extractedText);
    estimate.interventions = interventions;
    await estimate.save();

    console.log("📚 Step 2: Mapping to IRC standards...");
    const ircMappings = await mapToIRCStandards(interventions);
    estimate.ircMappings = ircMappings;
    await estimate.save();

    console.log("💰 Step 3: Calculating material costs...");
    const materialEstimates = await calculateMaterialCosts(
      interventions,
      ircMappings
    );
    estimate.materialEstimates = materialEstimates;

    const totalCost = materialEstimates.reduce(
      (sum, section) => sum + (section.totalCost || 0),
      0
    );
    estimate.totalMaterialCost = totalCost;
    estimate.status = "completed";

    await estimate.save();

    console.log("✅ Processing completed. Total cost:", totalCost);

    const categories = materialEstimates.map((section, index) => {
      const emojiMap = {
        A: "🅰️",
        B: "🅱️",
        C: "🅲",
        D: "🅳",
        E: "🅴",
        F: "🅵",
        G: "🅶",
        H: "🅷",
      };

      return {
        id: section.sectionId,
        name: section.sectionName,
        emoji: emojiMap[section.sectionId] || "📋",
        totalCost: section.totalCost,
        count: section.items.length,
      };
    });

    res.status(200).json({
      success: true,
      message: "Estimate processed successfully",
      data: {
        estimateId: estimate._id,
        interventionsCount: interventions.length,
        sectionsCount: materialEstimates.length,
        totalMaterialCost: totalCost,
        currency: estimate.currency,
        categories: categories,
      },
    });
  } catch (error) {
    console.error("Error processing document:", error);

    let errorMessage = error.message;
    let userMessage = "Failed to process document";

    if (error.message && error.message.includes("429") && error.message.includes("Too Many Requests")) {
      userMessage = "AI service quota exceeded. Some material prices may use default estimates. Consider upgrading your API plan or waiting for quota reset.";
      errorMessage = "Gemini API quota exceeded during price estimation";
    }

    if (req.params.estimateId) {
      await Estimate.findByIdAndUpdate(req.params.estimateId, {
        status: "failed",
        errorMessage: errorMessage,
      });
    }

    res.status(500).json({
      error: true,
      message: userMessage,
      details: errorMessage,
    });
  }
};

export const getEstimate = async (req, res) => {
  try {
    const { estimateId } = req.params;

    const estimate = await Estimate.findById(estimateId);

    if (!estimate) {
      return res.status(404).json({
        error: true,
        message: "Estimate not found",
      });
    }

    const emojiMap = {
      A: "🅰️",
      B: "🅱️",
      C: "🅲",
      D: "🅳",
      E: "🅴",
      F: "🅵",
      G: "🅶",
      H: "🅷",
    };

    const categories =
      estimate.materialEstimates?.map((section) => ({
        id: section.sectionId,
        name: section.sectionName,
        emoji: emojiMap[section.sectionId] || "📋",
        totalCost: section.totalCost,
        count: section.items.length,
      })) || [];

    const formattedInterventions =
      estimate.materialEstimates?.map((section) => ({
        categoryId: section.sectionId,
        categoryName: section.sectionName,
        categoryEmoji: emojiMap[section.sectionId] || "📋",
        totalCost: section.totalCost,
        items: section.items.map((item) => ({
          no: item.no,
          intervention: item.recommendation,
          location: `${item.chainage} ${item.side} ${item.road}`,
          observation: item.observation,
          ircReference: item.ircReference,
          materials: item.materials
            .map((m) => `${m.itemName} (${m.quantity} ${m.unit})`)
            .join(", "),
          materialsList: item.materials,
          quantity: item.materials.reduce((sum, m) => sum + m.quantity, 0),
          unit: item.materials.length > 0 ? "items" : "",
          unitRate:
            item.materials.length > 0
              ? Math.round(
                  (item.totalCost /
                    item.materials.reduce((sum, m) => sum + m.quantity, 0)) *
                    100
                ) / 100
              : 0,
          totalCost: item.totalCost,
          source: item.materials.length > 0 ? item.materials[0].source : "N/A",
          rationale: item.rationale,
          assumptions: item.assumptions,
        })),
      })) || [];

    res.status(200).json({
      success: true,
      data: {
        _id: estimate._id,
        documentName: estimate.documentName,
        documentType: estimate.documentType,
        status: estimate.status,
        createdAt: estimate.createdAt,
        updatedAt: estimate.updatedAt,
        totalMaterialCost: estimate.totalMaterialCost,
        totalInterventions: estimate.interventions?.length || 0,
        currency: estimate.currency,
        categories: categories,
        interventions: formattedInterventions,
      },
    });
  } catch (error) {
    console.error("Error fetching estimate:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch estimate",
      details: error.message,
    });
  }
};

export const getAllEstimates = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const estimates = await Estimate.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-extractedText");

    const total = await Estimate.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        estimates,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching estimates:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch estimates",
      details: error.message,
    });
  }
};

export const generateReport = async (req, res) => {
  try {
    const { estimateId } = req.params;

    const estimate = await Estimate.findById(estimateId);

    if (!estimate) {
      return res.status(404).json({
        error: true,
        message: "Estimate not found",
      });
    }

    if (estimate.status !== "completed") {
      return res.status(400).json({
        error: true,
        message: "Estimate processing is not complete",
      });
    }

    console.log("📄 Generating PDF report for:", estimateId);

    const reportBuffer = await generatePDFReport(estimate);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="estimate-${estimateId}.pdf"`
    );
    res.send(reportBuffer);
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({
      error: true,
      message: "Failed to generate report",
      details: error.message,
    });
  }
};
