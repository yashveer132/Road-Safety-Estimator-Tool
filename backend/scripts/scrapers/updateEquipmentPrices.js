import axios from "axios";
import * as cheerio from "cheerio";
import Price from "../../models/Price.model.js";

const parseDelineatorProducts = (html) => {
  const $ = cheerio.load(html);
  const products = [];

  $(".product-item, .product-card").each((i, elem) => {
    const name = $(elem).find(".product-name, .title").text().trim();
    const priceText = $(elem).find(".price, .cost").text().trim();
    const price = parseFloat(priceText.replace(/[^\d.]/g, ""));

    if (name && price && name.toLowerCase().includes("delineator")) {
      products.push({
        itemName: name,
        unitPrice: price,
        unit: "nos",
        source: "GeM",
        category: "equipment",
      });
    }
  });

  return products;
};

const parseTrafficConeProducts = (html) => {
  const $ = cheerio.load(html);
  const products = [];

  $(".product-item, .product-card").each((i, elem) => {
    const name = $(elem).find(".product-name, .title").text().trim();
    const priceText = $(elem).find(".price, .cost").text().trim();
    const price = parseFloat(priceText.replace(/[^\d.]/g, ""));

    if (name && price && name.toLowerCase().includes("cone")) {
      products.push({
        itemName: name,
        unitPrice: price,
        unit: "nos",
        source: "GeM",
        category: "equipment",
      });
    }
  });

  return products;
};

const scrapeEquipmentPrices = async () => {
  try {
    const urls = [
      "https://mkp.gem.gov.in/traffic-control-road-delineator-version-2-/search",
      "https://mkp.gem.gov.in/traffic-signs---bilinker-light/search",
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

      if (url.includes("delineator")) {
        allProducts.push(...parseDelineatorProducts(response.data));
      } else if (url.includes("traffic-signs")) {
        allProducts.push(...parseTrafficConeProducts(response.data));
      }
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

    console.log(`Scraped and saved ${allProducts.length} equipment prices`);
  } catch (error) {
    console.error("Error scraping equipment prices:", error.message);
  }
};

scrapeEquipmentPrices();
