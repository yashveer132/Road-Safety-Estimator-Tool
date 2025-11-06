import axios from "axios";
import * as cheerio from "cheerio";
import Price from "../../models/Price.model.js";

const parseLEDProducts = (html) => {
  const $ = cheerio.load(html);
  const products = [];

  $(".product-item, .product-card").each((i, elem) => {
    const name = $(elem).find(".product-name, .title").text().trim();
    const priceText = $(elem).find(".price, .cost").text().trim();
    const price = parseFloat(priceText.replace(/[^\d.]/g, ""));

    if (name && price && name.toLowerCase().includes("led")) {
      const wattageMatch = name.match(/(\d+)\s*w/i);
      const wattage = wattageMatch ? parseInt(wattageMatch[1]) : null;

      const brandMatch = name.match(/(philips|wipro|havells|syska|crompton)/i);
      const brand = brandMatch ? brandMatch[1] : "Generic";

      products.push({
        itemName: `${brand} LED Street Light ${wattage || ""}W`,
        unitPrice: price,
        unit: "nos",
        source: "GeM",
        category: "lighting",
      });
    }
  });

  return products;
};

const scrapeLEDPrices = async () => {
  try {
    const urls = [
      "https://mkp.gem.gov.in/street-lighting/search",
      "https://mkp.gem.gov.in/led-street-light/search",
    ];

    const allProducts = [];

    for (const url of urls) {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      allProducts.push(...parseLEDProducts(response.data));
    }

    for (const product of allProducts) {
      await Price.findOneAndUpdate(
        { itemName: product.itemName, source: "GeM" },
        {
          ...product,
          lastVerified: new Date(),
          isActive: true,
        },
        { upsert: true, new: true }
      );
    }

    console.log(`Scraped and saved ${allProducts.length} LED prices`);
  } catch (error) {
    console.error("Error scraping LED prices:", error.message);
  }
};

scrapeLEDPrices();
