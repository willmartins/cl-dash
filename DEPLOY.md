# Deployment Guide for Chocolate Factory Dashboard

This application consists of a **Node.js backend** (which handles Shopify data, image uploads, and dashboard configuration) and a **React frontend** (Vite).

## Recommended Hardware
For a "Dispatch" or "Kitchen" display, we recommend:
- **Raspberry Pi 4 or 5** (4GB RAM recommended)
- OR any Mini PC (Intel NUC, etc.)
- Connected to a TV/Monitor via HDMI.

## Option 1: Running Locally (The Simplest Way)
If you just want to run this on a Mac Mini or PC connected to the screen:

1.  **Install Node.js** (v18+)
2.  **Clone/Copy** this project folder to the machine.
3.  Open Terminal in the folder and install dependencies:
    ```bash
    npm install
    ```
4.  **Start the System**:
    ```bash
    npm run server & npm run dev
    ```
    *(Or use two separate terminal windows)*
5.  Open Chrome and go to `http://localhost:3000/dispatch` (or `/kitchen`).
6.  **Full Screen**: Press `F11` (or `Cmd+Ctrl+F` on Mac) to enter Kiosk mode.

## Option 2: Production Build (More Robust)
For a stable long-term setup, you should "build" the frontend so you don't need the development server (`npm run dev`) running.

1.  **Build the Frontend**:
    ```bash
    npm run build
    ```
    This creates a `dist/` folder with optimized files.
2.  **Serve Everything with Node**:
    You need to tell the server to serve these files. (Currently, the `server.js` is set up primarily for API, but can easily serve the static build).
    *Modify `server.js` to add:*
    ```javascript
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
    ```
3.  **Run**:
    ```bash
    node server.js
    ```
    (Now strictly runs on port 3001, so visit `http://localhost:3001/dispatch`).

## Option 3: Raspberry Pi Kiosk (Automated)
If using a Raspberry Pi, use **autostart** to launch the browser on boot.

1.  Set up Raspberry Pi OS (Desktop version).
2.  Install Node.js on the Pi.
3.  Copy project files to `/home/pi/cl-dashboard`.
4.  Install dependencies: `npm install`.
5.  Use **PM2** to keep the server running:
    ```bash
    sudo npm install -g pm2
    pm2 start server.js --name "dashboard-backend"
    pm2 start "npm run dev" --name "dashboard-frontend"
    pm2 save
    pm2 startup
    ```
6.  **Configure Chromium Kiosk Mode**:
    Edit autostart: `sudo nano /etc/xdg/lxsession/LXDE-pi/autostart`
    Add:
    ```bash
    @xset s off
    @xset -dpms
    @xset s noblank
    @chromium-browser --kiosk --incognito http://localhost:3000/dispatch
    ```

## Network Access
To control the Admin panel from your laptop while the dashboard is on the TV:
1.  Find the dashboard machine's **IP Address** (e.g., `192.168.1.50`).
2.  On your laptop, go to `http://192.168.1.50:3000/admin`.
3.  Upload photos or change messages remotely!
