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

async function getAccessToken(shop, clientId, clientSecret) {
    const url = `https://${shop}/admin/oauth/access_token`;
    const payload = {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
    };

    try {
        console.log(`Getting token for ${shop}...`);
        const response = await axios.post(url, payload);
        return response.data.access_token;
    } catch (error) {
        console.error(`Failed to get token for ${shop}: ${error.message}`);
        if (error.response) {
            console.error('Data:', error.response.data);
        }
        return null;
    }
}

async function testOrders(shop, token) {
    const url = `https://${shop}/admin/api/2024-01/orders.json?status=any&limit=1`;
    try {
        const response = await axios.get(url, {
            headers: { 'X-Shopify-Access-Token': token }
        });
        console.log(`Success fetching orders for ${shop}!`);
    } catch (error) {
        console.error(`Failed to fetch orders for ${shop}: ${error.message}`);
    }
}

async function run() {
    const retailToken = await getAccessToken(SHOPIFY_RETAIL_SHOP, SHOPIFY_RETAIL_API_KEY, SHOPIFY_RETAIL_API_SECRET);
    if (retailToken) await testOrders(SHOPIFY_RETAIL_SHOP, retailToken);

    console.log('\n');

    const tradeToken = await getAccessToken(SHOPIFY_TRADE_SHOP, SHOPIFY_TRADE_API_KEY, SHOPIFY_TRADE_API_SECRET);
    if (tradeToken) await testOrders(SHOPIFY_TRADE_SHOP, tradeToken);
}

run();
