import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs-extra';
import path from 'path';
import multer from 'multer';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

fs.ensureDirSync(UPLOADS_DIR);

const TOKENS_FILE = path.join(__dirname, 'tokens.json');

async function getTokens() {
  if (await fs.pathExists(TOKENS_FILE)) {
    return await fs.readJson(TOKENS_FILE);
  }
  return {};
}

async function saveToken(shop, token) {
  const tokens = await getTokens();
  tokens[shop] = token;
  await fs.writeJson(TOKENS_FILE, tokens, { spaces: 2 });
}

const initialData = {
  logoUrl: '',
  kitchenMessage: 'Welcome to the Kitchen!',
  kitchenWelcome: 'Happy Cooking!',
  dispatchMessage: 'Ready for shipping!',
  dispatchWelcome: 'Dispatch Center',
  gallery: [],
  reviews: [],
  shopifyData: {
    retail: { today: 12, unfulfilled: 5 },
    trade: { today: 4, unfulfilled: 2 }
  },
  lastUpdated: Date.now()
};

async function readData() {
  try {
    if (await fs.pathExists(DATA_FILE)) {
      return await fs.readJson(DATA_FILE);
    }
  } catch (err) {
    console.error('Error reading data:', err);
  }
  return initialData;
}

async function writeData(data) {
  try {
    await fs.writeJson(DATA_FILE, data, { spaces: 2 });
  } catch (err) {
    console.error('Error writing data:', err);
  }
}

// Multer storage for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.get('/api/config', async (req, res) => {
  const data = await readData();
  res.json(data);
});

app.post('/api/config', async (req, res) => {
  const data = await readData();
  const newData = { ...data, ...req.body, lastUpdated: Date.now() };
  await writeData(newData);
  res.json(newData);
});

app.post('/api/upload', (req, res, next) => {
  console.log('Incoming upload request:', {
    headers: req.headers['content-type'],
    method: req.method,
    url: req.url
  });
  upload.array('images', 20)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer Error:', err.code, err.message, err.field);
      return res.status(400).json({ error: `Multer Error (${err.code}): ${err.message}` });
    } else if (err) {
      console.error('Unknown Error during upload:', err);
      return res.status(500).json({ error: 'Unknown Error' });
    }
    next();
  });
}, async (req, res) => {
  if (!req.files || req.files.length === 0) {
    console.warn('Upload attempt with no files');
    return res.status(400).send('No files uploaded.');
  }
  console.log(`Received ${req.files.length} files:`, req.files.map(f => f.filename));
  const data = await readData();
  const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
  data.gallery.push(...imageUrls);
  data.lastUpdated = Date.now();
  await writeData(data);
  res.json({ imageUrls });
});

app.delete('/api/gallery/:filename', async (req, res) => {
  const { filename } = req.params;
  const data = await readData();
  data.gallery = data.gallery.filter(img => !img.includes(filename));
  data.lastUpdated = Date.now();
  await writeData(data);
  try {
    await fs.remove(path.join(UPLOADS_DIR, filename));
  } catch (err) {
    console.error('Error deleting file:', err);
  }
  res.json(data);
});

// --- Shopify OAuth Routes ---

app.get('/api/shopify/ping', (req, res) => res.send("Server is alive and reachable at " + new Date().toISOString()));

app.get('/api/shopify/auth/:type', (req, res) => {
  const { type } = req.params;
  console.log(`[Shopify Auth] Initializing ${type} auth...`);

  const shop = type === 'retail' ? process.env.SHOPIFY_RETAIL_SHOP : process.env.SHOPIFY_TRADE_SHOP;
  const clientId = type === 'retail' ? process.env.SHOPIFY_RETAIL_API_KEY : process.env.SHOPIFY_TRADE_API_KEY;
  const redirectUri = `http://localhost:3001/api/shopify/callback/${type}`;
  const scopes = 'read_orders,read_fulfillments';

  if (!shop || !clientId) {
    console.error(`[Shopify Auth] ERROR: Missing shop (${shop}) or client ID (${clientId}) in .env`);
    return res.status(400).send("Missing credentials in .env");
  }

  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}`;
  console.log(`[Shopify Auth] Redirecting to: ${authUrl}`);
  res.redirect(authUrl);
});

app.get('/api/shopify/callback/:type', async (req, res) => {
  const { type } = req.params;
  const { shop, code, error, error_description } = req.query;
  console.log(`[Shopify Callback] Received callback for ${type}:`, { shop, hasCode: !!code, error });

  if (error) {
    console.error(`[Shopify Callback] ERROR from Shopify: ${error} - ${error_description}`);
    return res.status(400).send(`Shopify Error: ${error_description || error}`);
  }

  const clientId = type === 'retail' ? process.env.SHOPIFY_RETAIL_API_KEY : process.env.SHOPIFY_TRADE_API_KEY;
  const clientSecret = type === 'retail' ? process.env.SHOPIFY_RETAIL_API_SECRET : process.env.SHOPIFY_TRADE_API_SECRET;

  if (!code) return res.status(400).send("No code provided.");

  try {
    console.log(`[Shopify Callback] Exchanging code for token for ${shop}...`);
    const response = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: clientId,
      client_secret: clientSecret,
      code
    });

    const accessToken = response.data.access_token;
    await saveToken(shop, accessToken);

    console.log(`[Shopify Callback] SUCCESS: Token saved for ${shop}`);
    res.send(`<h1>Success!</h1><p>Authenticated ${shop}. You can close this window now.</p>`);

    fetchShopifyData();
  } catch (err) {
    const errorData = (err.response && err.response.data) || err.message;
    console.error(`[Shopify Callback] Token exchange failed:`, errorData);
    res.status(500).send("Failed to exchange code for token.");
  }
});

// --- Shopify Data Polling ---

async function fetchShopifyData() {
  const tokens = await getTokens();
  const data = await readData();
  let updated = false;

  const stores = [
    { type: 'retail', shop: process.env.SHOPIFY_RETAIL_SHOP },
    { type: 'trade', shop: process.env.SHOPIFY_TRADE_SHOP }
  ];

  for (const store of stores) {
    const token = tokens[store.shop];
    if (!token) continue;

    try {
      // Get orders count for today
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const countUrl = `https://${store.shop}/admin/api/2024-01/orders/count.json?created_at_min=${startOfToday.toISOString()}`;
      const unfulfilledUrl = `https://${store.shop}/admin/api/2024-01/orders/count.json?fulfillment_status=unshipped`;

      const [countRes, unfulfilledRes] = await Promise.all([
        axios.get(countUrl, { headers: { 'X-Shopify-Access-Token': token } }),
        axios.get(unfulfilledUrl, { headers: { 'X-Shopify-Access-Token': token } })
      ]);

      data.shopifyData[store.type] = {
        today: countRes.data.count,
        unfulfilled: unfulfilledRes.data.count
      };
      updated = true;
      console.log(`Updated Shopify data for ${store.type}:`, data.shopifyData[store.type]);
    } catch (err) {
      console.error(`Error fetching data for ${store.shop}:`, (err.response && err.response.data) || err.message);
    }
  }

  if (updated) {
    data.lastUpdated = Date.now();
    await writeData(data);
  }
}

// Poll every 5 minutes
setInterval(fetchShopifyData, 5 * 60 * 1000);
// Initial fetch
fetchShopifyData();

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
