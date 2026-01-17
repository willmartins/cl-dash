import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const {
    SHOPIFY_RETAIL_SHOP,
    SHOPIFY_RETAIL_API_KEY,
    SHOPIFY_RETAIL_API_SECRET,
    SHOPIFY_TRADE_SHOP,
    SHOPIFY_TRADE_API_KEY,
    SHOPIFY_TRADE_API_SECRET
} = process.env;

async function testHeaderAuth(shop, token) {
    if (!shop || !token) {
        console.error(`Missing info for ${shop}`);
        return;
    }

    const url = `https://${shop}/admin/api/2023-10/shop.json`;

    try {
        console.log(`Testing X-Shopify-Access-Token for ${shop}...`);
        const response = await axios.get(url, {
            headers: {
                'X-Shopify-Access-Token': token
            }
        });
        console.log(`Success! Shop name: ${response.data.shop.name}`);
    } catch (error) {
        console.error(`Failed for ${shop}: ${error.message}`);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

async function run() {
    console.log("--- Testing with SHOPIFY_RETAIL_API_SECRET as token ---");
    await testHeaderAuth(SHOPIFY_RETAIL_SHOP, SHOPIFY_RETAIL_API_SECRET);

    console.log("\n--- Testing with SHOPIFY_TRADE_API_SECRET as token ---");
    await testHeaderAuth(SHOPIFY_TRADE_SHOP, SHOPIFY_TRADE_API_SECRET);
}

run();
