import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_NAME = "gemini-2.0-flash";

const safetySettings = [
  {
    category: "HARM_CATEGORY_HARASSMENT",
    threshold: "BLOCK_NONE",
  },
  {
    category: "HARM_CATEGORY_HATE_SPEECH",
    threshold: "BLOCK_NONE",
  },
  {
    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    threshold: "BLOCK_NONE",
  },
  {
    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
    threshold: "BLOCK_NONE",
  },
];

const generationConfig = {
  temperature: 0.3,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
};

export const getGeminiModel = () => {
  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    safetySettings,
    generationConfig,
  });
};

export const cleanJsonResponse = (text) => {
  try {
    let cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    throw new Error("Failed to parse AI response as JSON");
  }
};

export const generateContent = async (prompt, retries = 3) => {
  console.log(`🤖 AI Request - Model: ${MODEL_NAME}`);
  const model = getGeminiModel();

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`   📡 Attempt ${i + 1}/${retries}...`);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log(`   ✅ Success - Response length: ${text.length} chars`);
      return text;
    } catch (error) {
      console.error(`   ❌ Attempt ${i + 1} failed:`, error.message);

      if (i === retries - 1) {
        console.error(`   🚫 All ${retries} attempts exhausted`);
        throw error;
      }

      let retryDelayMs = Math.pow(2, i) * 1000;

      if (error.status === 429) {
        console.warn(`   ⚠️ Rate limit hit (429) - Quota exhausted`);

        if (error.errorDetails) {
          const retryInfo = error.errorDetails.find(
            (detail) =>
              detail["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
          );

          if (retryInfo && retryInfo.retryDelay) {
            const delayMatch = retryInfo.retryDelay.match(/^(\d+(?:\.\d+)?)s$/);
            if (delayMatch) {
              retryDelayMs = parseFloat(delayMatch[1]) * 1000;
              console.log(`   ⏰ API suggested retry: ${retryDelayMs}ms`);
            }
          }
        } else {
          retryDelayMs = 60000;
          console.log(
            `   ⏰ Using fallback retry delay: ${retryDelayMs}ms (60s)`
          );
        }
      }

      console.log(`   ⏳ Waiting ${retryDelayMs}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
};

export const validateModel = async () => {
  try {
    console.log("🔍 Validating Gemini AI Model...");
    console.log(`   Model: ${MODEL_NAME}`);
    const model = getGeminiModel();
    const result = await model.generateContent("Test validation");
    console.log("   ✅ Gemini AI Model validated successfully");
    return true;
  } catch (error) {
    console.error("   ❌ Gemini AI Model validation failed:", error.message);
    return false;
  }
};

export default {
  getGeminiModel,
  cleanJsonResponse,
  generateContent,
  validateModel,
};
