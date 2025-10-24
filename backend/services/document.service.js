import pdf from "pdf-parse";
import mammoth from "mammoth";

export const extractTextFromDocument = async (file) => {
  try {
    const buffer = file.data;
    const mimeType = file.mimetype;

    let extractedText = "";

    if (mimeType === "application/pdf") {
      const pdfData = await pdf(buffer);
      extractedText = pdfData.text;
    } else if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (mimeType === "text/plain") {
      extractedText = buffer.toString("utf-8");
    } else {
      throw new Error("Unsupported file type");
    }
    extractedText = extractedText
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return extractedText;
  } catch (error) {
    console.error("Error extracting text from document:", error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
};

export const validateDocumentContent = (text) => {
  if (!text || text.trim().length < 100) {
    return {
      valid: false,
      message: "Document content is too short or empty",
    };
  }

  const keywords = [
    "intervention",
    "road",
    "safety",
    "traffic",
    "sign",
    "marking",
    "barrier",
    "signal",
    "speed",
    "pedestrian",
  ];

  const lowerText = text.toLowerCase();
  const foundKeywords = keywords.filter((keyword) =>
    lowerText.includes(keyword)
  );

  if (foundKeywords.length < 2) {
    return {
      valid: false,
      message:
        "Document does not appear to be a road safety intervention report",
    };
  }

  return {
    valid: true,
    message: "Document validated successfully",
  };
};

export default {
  extractTextFromDocument,
  validateDocumentContent,
};
