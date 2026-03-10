[README.md](https://github.com/user-attachments/files/25876983/README.md)
# Solid Tumor Pipeline Dashboard — Deployment Guide

## What's in this package

```
pharma-dashboard/
├── server.js          ← Express backend (proxies Anthropic API calls)
├── package.json       ← Node dependencies
├── .env.example       ← Environment variable template
└── public/
    └── index.html     ← Full dashboard (React via CDN, no build step)
```

No build step. No npm compile. Just Node + Express serving a single HTML file.

---

## Option A: Deploy to Render.com (recommended — free tier, persistent URL)

**Step 1 — Push to GitHub**
1. Create a new GitHub repo (public or private)
2. Upload all files maintaining the folder structure above
3. Commit and push

**Step 2 — Create a Render Web Service**
1. Go to https://render.com → New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free

**Step 3 — Add your API key**
1. In Render dashboard → your service → Environment
2. Add environment variable:
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-api03-your-key-here`
3. Click Save — service restarts automatically

**Step 4 — Open your dashboard**
- Render gives you a URL like `https://pharma-dashboard-xxxx.onrender.com`
- Bookmark it. Live Refresh works immediately, no key entry ever again.

> **Note:** Free tier spins down after 15 min inactivity. First load after idle takes ~30 seconds to wake up. Upgrade to Starter ($7/mo) for always-on.

---

## Option B: Run locally

```bash
# 1. Install dependencies
npm install

# 2. Set your API key
cp .env.example .env
# Edit .env and paste your key

# 3. Start
npm start

# 4. Open
open http://localhost:3000
```

For the .env file to be picked up locally, install dotenv:
```bash
npm install dotenv
```
Then add this line to the TOP of server.js:
```js
require('dotenv').config();
```

---

## Option C: Deploy to Railway.app

1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select your repo
3. Add environment variable: `ANTHROPIC_API_KEY = sk-ant-...`
4. Railway auto-detects Node and deploys. Done.

---

## How the Live Refresh works

The frontend calls **your own server** at `/api/sweep` — never touching the Anthropic API directly. Your server reads `ANTHROPIC_API_KEY` from the environment and makes the API call server-side. The key is never exposed to the browser.

Each refresh runs 6 sequential sweeps:
1. 🟢 IND Clearances & Submissions
2. 🟡 IND-Enabling & Pre-IND Activity  
3. 🔴 FDA Designations (Fast Track, Orphan, Breakthrough)
4. 🔵 Phase 1 Initiations & First Patient Dosed
5. 🟣 Pre-Clinical Data & Platform Announcements
6. 🤝 Partnerships, Licensing & Financings

Takes ~60–90 seconds total. Results deduplicated automatically.
