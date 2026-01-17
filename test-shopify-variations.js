import axios from 'axios';
import dotenv from 'dotenv';
import qs from 'qs';

dotenv.config();

const {
    SHOPIFY_RETAIL_SHOP,
    SHOPIFY_RETAIL_API_KEY,
    SHOPIFY_RETAIL_API_SECRET
} = process.env;

async function testVariation(name, config) {
    console.log(`--- Testing variation: ${name} ---`);
    try {
        const response = await axios(config);
        console.log('Success!', response.data);
    } catch (error) {
        console.error('Failed:', error.response ? error.response.status : error.message);
        if (error.response && error.response.data) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
    console.log('\n');
}

async function run() {
    const shop = SHOPIFY_RETAIL_SHOP;
    const clientId = SHOPIFY_RETAIL_API_KEY;
    const clientSecret = SHOPIFY_RETAIL_API_SECRET;

    // Variation 1: JSON body (as in Python script)
    await testVariation('JSON body', {
        method: 'post',
        url: `https://${shop}/admin/oauth/access_token`,
        data: {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials'
        },
        headers: { 'Content-Type': 'application/json' }
    });

    // Variation 2: URL Form body
    await testVariation('URL Form body', {
        method: 'post',
        url: `https://${shop}/admin/oauth/access_token`,
        data: qs.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials'
        }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    // Variation 3: Basic Auth + grant_type in body
    await testVariation('Basic Auth + grant_type in body', {
        method: 'post',
        url: `https://${shop}/admin/oauth/access_token`,
        data: { grant_type: 'client_credentials' },
        auth: {
            username: clientId,
            password: clientSecret
        }
    });
}

run();
