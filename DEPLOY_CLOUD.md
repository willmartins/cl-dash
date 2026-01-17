
# ☁️ Cloud Deployment Guide (Free Tier)

This guide explains how to deploy your **Chocolate Factory Dashboard** to **Vercel** (Frontend/Backend) using free services for the database (MongoDB) and images (Cloudinary).

## 1. Get Your Free Services

### A. MongoDB Atlas (Database)
1.  Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2.  Create a free account.
3.  Create a **Cluster** (select "M0 Shared" - it's free).
4.  Create a **Database User** (username/password).
5.  Go to **Network Access** > Add IP Address > Allow Access from Anywhere (`0.0.0.0/0`).
6.  Click **Connect** > Drivers > Copy your connection string.
    *   It looks like: `mongodb+srv://<username>:<password>@cluster0.exmpl.mongodb.net/`

### B. Cloudinary (Images)
1.  Go to [Cloudinary](https://cloudinary.com/users/register/free).
2.  Sign up for a free account.
3.  On the Dashboard, copy your:
    *   **Cloud Name**
    *   **API Key**
    *   **API Secret**

## 2. Deploy to Vercel

1.  Push your latest code to GitHub (you already did this!).
2.  Go to [Vercel.com](https://vercel.com/signup) and sign up with GitHub.
3.  Click **"Add New..."** > **Project**.
4.  Import your `cl-dash` repository.
5.  **Environment Variables**: In the deployment screen, paste these names and your values:

| Name | Value Example |
|------|--------------|
| `MONGODB_URI` | `mongodb+srv://user:pass@...` |
| `CLOUDINARY_CLOUD_NAME` | `dxy....` |
| `CLOUDINARY_API_KEY` | `837...` |
| `CLOUDINARY_API_SECRET` | `abc...` |
| `SHOPIFY_RETAIL_SHOP` | `cocoaloco-retail.myshopify.com` |
| `SHOPIFY_TRADE_SHOP` | `cocoaloco-trade.myshopify.com` |
| `SHOPIFY_RETAIL_API_KEY` | *(Your Shopify Keys)* |
| `SHOPIFY_TRADE_API_KEY` | *(Your Shopify Keys)* |

6.  Click **Deploy**.

## 3. That's it!
Vercel will build your site and give you a URL (e.g., `https://cl-dash.vercel.app`).
*   Go to `/admin` to upload photos (password: `BAL00n9822!`).
*   Go to `/kitchen` or `/dispatch` to see your dashboards.
*   Your images will now save to Cloudinary and persist forever!
