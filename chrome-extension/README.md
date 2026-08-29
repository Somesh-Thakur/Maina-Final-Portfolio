# 🪶 Maina Discord Rich Presence — Chrome Extension

Broadcast your live 320kbps music playback on **Maina** straight to your Discord profile as Rich Presence activity.

---

## ⚡ 3-Step Installation Guide

### Step 1: Open Chrome Extensions
In your Chrome, Brave, Edge, or Chromium browser, navigate to:
```text
chrome://extensions
```

### Step 2: Enable Developer Mode
Turn on the **Developer mode** toggle in the top-right corner of the extensions page.

### Step 3: Load Unpacked Extension
1. Click the **Load unpacked** button in the top-left corner.
2. Select the `chrome-extension` folder inside this project.
3. That's it! Pin the Maina extension icon to your browser toolbar.

---

## 📡 Starting the Local Bridge (Optional)

The extension communicates with Discord using the local RPC bridge. In your terminal:
```bash
npm run rpc
```
Open **Maina** at `http://localhost:3000` (or your deployed URL) and start streaming — your active song, artist, album art, and progress will appear directly on your Discord status!
