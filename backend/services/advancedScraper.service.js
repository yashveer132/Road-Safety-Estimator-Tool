import axios from "axios";
import * as cheerio from "cheerio";
import https from "https";
import { normalizeUnit } from "../utils/unit.js";

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  timeout: 30000,
});

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

const getRandomUserAgent = () =>
  USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const retryWithBackoff = async (
  fn,
  maxRetries = 5,
  baseDelay = 2000,
  maxDelay = 30000
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`❌ All ${maxRetries} attempts failed: ${error.message}`);
        throw error;
      }

      const jitter = Math.random() * 1000;
      const delayTime = Math.min(
        baseDelay * Math.pow(2, attempt - 1) + jitter,
        maxDelay
      );

      console.log(
        `   ⏳ Retry ${attempt}/${maxRetries} after ${Math.round(
          delayTime / 1000
        )}s... (${error.message})`
      );
      await delay(delayTime);
    }
  }
};

export const scrapeGeMAdvanced = async (searchQuery, category = null) => {
  console.log(`\n🔍 GeM Advanced Scraper: "${searchQuery}"`);

  const gemCategories = {
    signs: [
      "traffic-signs---bilinker-light",
      "traffic-signs-and-accessories",
      "road-safety-products",
    ],
    markings: [
      "paints-and-primers-and-finishes-paints-and-primers-thermoplastic-road-marking-paint",
      "road-marking-paint",
      "glass-beads",
    ],
    lighting: [
      "led-street-light",
      "street-light-luminaire",
      "solar-street-light",
      "lighting-pole",
    ],
    delineators: [
      "traffic-control-road-delineator-version-2-",
      "road-safety-products",
      "flexible-post-delineator",
    ],
    barriers: ["crash-barrier", "road-safety-barrier", "guard-rail"],
    materials: [
      "structural-materials-aluminum-sheets-aluminium-composite-panel-sheet",
      "paving-bitumen",
      "bituminous-material",
    ],
  };

  const searchCategories = category
    ? gemCategories[category] || gemCategories.signs
    : Object.values(gemCategories).flat();

  const results = [];

  for (const cat of searchCategories.slice(0, 3)) {
    try {
      const url = `https://mkp.gem.gov.in/${cat}/search`;
      console.log(`   🌐 Checking: ${cat}...`);

      const data = await retryWithBackoff(
        async () => {
          const response = await axios.get(url, {
            timeout: 15000,
            httpsAgent: httpsAgent,
            headers: {
              "User-Agent": getRandomUserAgent(),
              Accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.9",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          });
          return response.data;
        },
        3,
        2000
      );

      const $ = cheerio.load(data);

      const products = [];
      $(".product-card, .item-card, [class*='product']").each((i, elem) => {
        const $elem = $(elem);
        const title =
          $elem.find(".product-title, .item-name, h3, h4").text().trim() || "";
        const priceText =
          $elem
            .find(".price, .product-price, [class*='price'], .amount, .rate")
            .text()
            .trim() || "";

        if (title && priceText) {
          products.push({ title, priceText, source: cat });
        }
      });

      const priceRegexPatterns = [
        /₹\s*([\d,]+(?:\.\d{1,2})?)/g,
        /INR\s*([\d,]+(?:\.\d{1,2})?)/gi,
        /Rs\.?\s*([\d,]+(?:\.\d{1,2})?)/gi,
        /Price:\s*₹?\s*([\d,]+(?:\.\d{1,2})?)/gi,
        /([\d,]+(?:\.\d{1,2})?)\s*(?:per|\/)\s*(?:piece|unit|nos|sqm|kg|m)/gi,
      ];

      const extractedPrices = [];
      priceRegexPatterns.forEach((regex) => {
        let match;
        while ((match = regex.exec(data)) !== null) {
          const price = parseFloat(match[1].replace(/,/g, ""));
          if (price > 0 && price < 1000000) {
            extractedPrices.push(price);
          }
        }
      });

      if (extractedPrices.length > 0) {
        const validPrices = extractedPrices.filter((p) => p > 10 && p < 500000);
        if (validPrices.length > 0) {
          const avgPrice =
            validPrices.reduce((a, b) => a + b, 0) / validPrices.length;
          const minPrice = Math.min(...validPrices);
          const maxPrice = Math.max(...validPrices);

          results.push({
            category: cat,
            searchQuery,
            priceRange: {
              min: Math.round(minPrice * 100) / 100,
              avg: Math.round(avgPrice * 100) / 100,
              max: Math.round(maxPrice * 100) / 100,
            },
            sampleCount: validPrices.length,
            url,
          });

          console.log(
            `   ✅ Found ${validPrices.length} prices: ₹${minPrice.toFixed(
              2
            )} - ₹${maxPrice.toFixed(2)} (avg: ₹${avgPrice.toFixed(2)})`
          );
        }
      }

      await delay(1000 + Math.random() * 2000); // Polite delay
    } catch (error) {
      console.log(`   ⚠️ Failed to scrape ${cat}: ${error.message}`);
    }
  }

  return results;
};

export const scrapeCPWDAdvanced = async (searchQuery) => {
  console.log(`\n📚 CPWD Advanced Scraper: "${searchQuery}"`);

  const cpwdUrls = [
    "https://cpwd.gov.in/Documents/cpwd_publication.aspx",
    "https://cpwd.gov.in/SOR.aspx",
    "https://cpwd.gov.in/Publication/SOR.aspx",
  ];

  const results = [];

  for (const url of cpwdUrls) {
    try {
      console.log(`   🌐 Checking: ${url}...`);

      const data = await retryWithBackoff(
        async () => {
          const response = await axios.get(url, {
            timeout: 20000,
            httpsAgent: httpsAgent,
            headers: {
              "User-Agent": getRandomUserAgent(),
              Accept: "text/html,application/xhtml+xml,application/xml",
              "Accept-Language": "en-US,en;q=0.9",
            },
          });
          return response.data;
        },
        3,
        3000
      );

      const $ = cheerio.load(data);

      const pdfLinks = [];
      $('a[href*=".pdf"], a[href*="SOR"], a[href*="schedule"]').each(
        (i, elem) => {
          const href = $(elem).attr("href");
          const text = $(elem).text().trim().toLowerCase();

          if (
            href &&
            (text.includes("sor") ||
              text.includes("schedule") ||
              text.includes("rate") ||
              text.includes("2024") ||
              text.includes("2023"))
          ) {
            const fullUrl = href.startsWith("http")
              ? href
              : `https://cpwd.gov.in${href}`;
            pdfLinks.push({ url: fullUrl, text });
          }
        }
      );

      if (pdfLinks.length > 0) {
        console.log(`   📄 Found ${pdfLinks.length} SOR documents`);
        results.push({
          source: url,
          documents: pdfLinks,
          type: "document_links",
        });
      }

      const rateText = $("body").text();
      const rateMatches = rateText.match(
        /(?:Item|Sr\.?\s*No\.?)\s*[:\-]?\s*[\d.]+[:\-]?\s*([^₹\n]+)[\s\n]*₹?\s*([\d,]+(?:\.\d{1,2})?)/gi
      );

      if (rateMatches && rateMatches.length > 0) {
        console.log(
          `   📊 Found ${rateMatches.length} potential rate entries in page text`
        );
      }

      break;
    } catch (error) {
      console.log(`   ⚠️ Failed to access ${url}: ${error.message}`);
    }
  }

  return results;
};

export const smartSearch = async (itemName, unit, category = null) => {
  console.log(`\n🎯 Smart Search: "${itemName}" (${unit})`);

  const [gemResults, cpwdResults] = await Promise.allSettled([
    scrapeGeMAdvanced(itemName, category),
    scrapeCPWDAdvanced(itemName),
  ]);

  const consolidated = {
    itemName,
    unit: normalizeUnit(unit),
    timestamp: new Date().toISOString(),
    sources: {
      gem: gemResults.status === "fulfilled" ? gemResults.value : [],
      cpwd: cpwdResults.status === "fulfilled" ? cpwdResults.value : [],
    },
    recommendedPrice: null,
    confidence: "low",
  };

  if (
    consolidated.sources.gem &&
    Array.isArray(consolidated.sources.gem) &&
    consolidated.sources.gem.length > 0
  ) {
    const allAvgPrices = consolidated.sources.gem.map((r) => r.priceRange.avg);
    const medianPrice = allAvgPrices.sort((a, b) => a - b)[
      Math.floor(allAvgPrices.length / 2)
    ];

    consolidated.recommendedPrice = Math.round(medianPrice * 100) / 100;
    consolidated.confidence = allAvgPrices.length >= 3 ? "high" : "medium";

    console.log(
      `   💰 Recommended Price: ₹${consolidated.recommendedPrice} (confidence: ${consolidated.confidence})`
    );
  }

  return consolidated;
};

export const batchSearch = async (items, concurrency = 2) => {
  console.log(
    `\n🔄 Batch Search: ${items.length} items (concurrency: ${concurrency})`
  );

  const results = [];
  const batches = [];

  for (let i = 0; i < items.length; i += concurrency) {
    batches.push(items.slice(i, i + concurrency));
  }

  for (const [batchIndex, batch] of batches.entries()) {
    console.log(`\n📦 Processing batch ${batchIndex + 1}/${batches.length}...`);

    const batchResults = await Promise.allSettled(
      batch.map((item) => smartSearch(item.name, item.unit, item.category))
    );

    results.push(
      ...batchResults.map((r) =>
        r.status === "fulfilled" ? r.value : { error: r.reason.message }
      )
    );

    if (batchIndex < batches.length - 1) {
      await delay(3000 + Math.random() * 2000);
    }
  }

  console.log(`\n✅ Batch search completed: ${results.length} results`);
  return results;
};

export default {
  scrapeGeMAdvanced,
  scrapeCPWDAdvanced,
  smartSearch,
  batchSearch,
};
