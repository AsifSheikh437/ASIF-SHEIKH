import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support large json payloads for company logos (base64) & full ERP backup states
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  const DATA_DIR = path.join(process.cwd(), "data");
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const STATE_FILE = path.join(DATA_DIR, "erp_state.json");

  // Helper to read state from disk
  const readServerState = () => {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const raw = fs.readFileSync(STATE_FILE, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error("Error reading erp_state.json:", e);
    }
    return null;
  };

  // Helper to write state atomically to disk
  const writeServerState = (data: any) => {
    try {
      const tempFile = `${STATE_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
      fs.renameSync(tempFile, STATE_FILE);
      return true;
    } catch (e) {
      console.error("Error writing erp_state.json:", e);
      return false;
    }
  };

  // ERP Persistent State Endpoints
  app.get("/api/erp/state", (_req, res) => {
    const state = readServerState();
    if (!state) {
      return res.json({ exists: false, data: null });
    }
    res.json({ exists: true, data: state, updatedAt: state.updatedAt });
  });

  app.post("/api/erp/state", (req, res) => {
    try {
      const incoming = req.body;
      if (!incoming || typeof incoming !== "object") {
        return res.status(400).json({ error: "Invalid state payload" });
      }
      const existing = readServerState() || {};
      const updated = {
        ...existing,
        ...incoming,
        updatedAt: new Date().toISOString(),
      };
      writeServerState(updated);
      res.json({ success: true, updatedAt: updated.updatedAt });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to save state" });
    }
  });

  app.get("/api/erp/settings", (_req, res) => {
    const state = readServerState();
    if (state && state.settings) {
      return res.json({ exists: true, settings: state.settings, updatedAt: state.updatedAt });
    }
    res.json({ exists: false, settings: null });
  });

  app.post("/api/erp/settings", (req, res) => {
    try {
      const { settings } = req.body;
      if (!settings || typeof settings !== "object") {
        return res.status(400).json({ error: "Invalid settings payload" });
      }
      const existing = readServerState() || {};
      const updated = {
        ...existing,
        settings: {
          ...(existing.settings || {}),
          ...settings,
        },
        updatedAt: new Date().toISOString(),
      };
      writeServerState(updated);
      res.json({ success: true, settings: updated.settings, updatedAt: updated.updatedAt });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to save settings" });
    }
  });

  // API route for AI insights
  app.post("/api/gemini/insights", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is missing." });
      }

      const { salesData } = req.body;
      
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Analyze the following historical sales data and provide actionable business insights and a monthly revenue projection for the next month. 
Data: ${JSON.stringify(salesData)}

Please provide:
1. Key Trends (e.g. best-selling items, revenue growth).
2. Actionable Recommendations.
3. Next Month Revenue Projection.
Format the output as clean markdown, avoid generic advice.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      res.json({ insights: response.text });
    } catch (error: any) {
      console.error("Error generating insights:", error);
      res.status(500).json({ error: error.message || "Failed to generate insights" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
