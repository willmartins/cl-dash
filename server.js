import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs-extra';
import path from 'path';
import multer from 'multer';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// --- Configuration ---
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// MongoDB
let isMongoConnected = false;
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      isMongoConnected = true;
      console.log('Connected to MongoDB');
    })
    .catch(err => console.error('MongoDB error:', err));
}

// Data Schema
const configSchema = new mongoose.Schema({
  id: { type: String, default: 'main' }, // Singleton document
  logoUrl: String,
  kitchenMessage: String,
  kitchenWelcome: String,
  dispatchMessage: String,
  dispatchWelcome: String,
  gallery: [String],
  reviews: [{ name: String, product: String, review: String }],
  shopifyData: {
    retail: { today: Number, unfulfilled: Number },
    trade: { today: Number, unfulfilled: Number }
  },
  lastUpdated: Number,
  shopifyLastChecked: Number
});
const DashboardConfig = mongoose.model('DashboardConfig', configSchema);

const DATA_FILE = path.join(__dirname, 'data.json');
const TOKENS_FILE = path.join(__dirname, 'tokens.json');

// --- Helper Functions ---

// Get Data (MongoDB > Local JSON)
async function getConfigs() {
  try {
    if (isMongoConnected) {
      let doc = await DashboardConfig.findOne({ id: 'main' });
      if (!doc) {
        doc = await DashboardConfig.create({
          id: 'main',
          ...await fs.readJson(DATA_FILE).catch(() => ({}))
        });
      }
      return doc;
    }
  } catch (err) {
    console.error("Mongo fetch error:", err);
    // Fallthrough to local
  }

  // Fallback to local file
  if (await fs.pathExists(DATA_FILE)) {
    return await fs.readJson(DATA_FILE);
  }
  return {
    logoUrl: '',
    gallery: [],
    reviews: [],
    shopifyData: { retail: { today: 0, unfulfilled: 0 }, trade: { today: 0, unfulfilled: 0 } },
    lastUpdated: Date.now()
  };
}

// Save Data
async function saveConfigs(data) {
  if (isMongoConnected) {
    // Ensure "id" is stripped if passed in data to avoid immutable field error, 
    // or just use findOneAndUpdate
    const { _id, id, ...updateData } = data;
    await DashboardConfig.findOneAndUpdate({ id: 'main' }, updateData, { upsert: true, new: true });
  } else {
    await fs.writeJson(DATA_FILE, data, { spaces: 2 });
  }
}

async function getTokens() {
  // For now, tokens stay in local JSON or Env vars. 
  // In strict production, these should also be in DB. 
  // We'll proceed with local file check for simplicity in this hybrid step.
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

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());
// Serve static uploads only if local
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok' });
});

// --- Upload Logic (Cloudinary vs Local) ---
const upload = multer({ storage: multer.memoryStorage() }); // Always memory for Vercel/Cloudinary

async function handleImageUpload(buffer) {
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'chocolate-dashboard' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  } else {
    // Fallback: Save to local disk (won't persist on Vercel!)
    const filename = Date.now() + '-image.jpg';
    const filepath = path.join(__dirname, 'uploads', filename);
    await fs.outputFile(filepath, buffer);
    return `/uploads/${filename}`;
  }
}

// --- Shopify Logic (On-Demand) ---

async function checkShopifyUpdates() {
  const data = await getConfigs();
  const now = Date.now();
  const lastChecked = data.shopifyLastChecked || 0;

  // Only check if > 5 minutes have passed
  if (now - lastChecked < 5 * 60 * 1000) {
    return data;
  }

  console.log('Checking Shopify for updates...');
  const tokens = await getTokens();
  let updated = false;

  const stores = [
    { type: 'retail', shop: process.env.SHOPIFY_RETAIL_SHOP },
    { type: 'trade', shop: process.env.SHOPIFY_TRADE_SHOP }
  ];

  for (const store of stores) {
    const token = tokens[store.shop];
    if (!token) continue;

    try {
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
    } catch (err) {
      console.error(`Error polling ${store.shop}:`, err.message);
    }
  }

  if (updated) {
    data.lastUpdated = now;
    data.shopifyLastChecked = now;
    await saveConfigs(data);
  }
  return data;
}


// --- Routes ---

app.get('/api/config', async (req, res) => {
  console.log('GET /api/config called');
  const data = await getConfigs();
  res.json(data);
});


app.post('/api/config', async (req, res) => {
  // Password check could go here
  const data = await getConfigs();

  // Merge new data
  const newData = {
    ...data.toObject ? data.toObject() : data, // handle mongoose doc
    ...req.body,
    lastUpdated: Date.now()
  };

  await saveConfigs(newData);
  res.json(newData);
});

app.post('/api/upload', upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files' });
    }

    const data = await getConfigs();
    const uploadPromises = req.files.map(file => handleImageUpload(file.buffer));
    const newUrls = await Promise.all(uploadPromises);

    // Add to gallery
    // Mongoose array push needs careful handling if plain object vs doc
    const gallery = data.gallery || [];
    const updatedGallery = [...gallery, ...newUrls];

    // Save
    if (isMongoConnected) {
      await DashboardConfig.findOneAndUpdate({ id: 'main' }, {
        gallery: updatedGallery,
        lastUpdated: Date.now()
      });
    } else {
      data.gallery = updatedGallery;
      await saveConfigs(data);
    }

    res.json({ imageUrls: newUrls });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/gallery/:filename', async (req, res) => {
  const { filename } = req.params;
  const data = await getConfigs();
  // This logic is a bit brittle with full URLs but filter usually works
  // Ideally we pass full URL to delete

  let newGallery = data.gallery.filter(img => !img.includes(filename));

  if (isMongoConnected) {
    await DashboardConfig.findOneAndUpdate({ id: 'main' }, {
      gallery: newGallery,
      lastUpdated: Date.now()
    });
  } else {
    data.gallery = newGallery;
    data.lastUpdated = Date.now();
    await saveConfigs(data);

    // Try delete local file
    try { await fs.remove(path.join(__dirname, 'uploads', filename)); } catch { }
  }

  res.json({ success: true, gallery: newGallery });
});

// --- Auth Routes (Shopify) ---
// (Kept largely the same, but should ideally store tokens in DB too)
app.get('/api/shopify/auth/:type', (req, res) => {
  const { type } = req.params;
  const shop = type === 'retail' ? process.env.SHOPIFY_RETAIL_SHOP : process.env.SHOPIFY_TRADE_SHOP;
  const clientId = type === 'retail' ? process.env.SHOPIFY_RETAIL_API_KEY : process.env.SHOPIFY_TRADE_API_KEY;
  const redirectUri = `${req.protocol}://${req.get('host')}/api/shopify/callback/${type}`;
  const scopes = 'read_orders,read_fulfillments';

  if (!shop || !clientId) return res.send("Missing credentials");
  res.redirect(`https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}`);
});

app.get('/api/shopify/callback/:type', async (req, res) => {
  const { type } = req.params;
  const { shop, code } = req.query;
  if (!code) return res.send("No code");

  const clientId = type === 'retail' ? process.env.SHOPIFY_RETAIL_API_KEY : process.env.SHOPIFY_TRADE_API_KEY;
  const clientSecret = type === 'retail' ? process.env.SHOPIFY_RETAIL_API_SECRET : process.env.SHOPIFY_TRADE_API_SECRET;

  try {
    const response = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: clientId, client_secret: clientSecret, code
    });
    await saveToken(shop, response.data.access_token);
    res.send("Success! Token saved. Restart server to pick up new token if local.");
  } catch (err) {
    res.send("Error: " + err.message);
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
