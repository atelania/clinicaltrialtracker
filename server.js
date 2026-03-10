const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const SAVED_FILE = path.join(__dirname, "saved_records.json");
function loadSaved() { try { return JSON.parse(fs.readFileSync(SAVED_FILE, "utf8")); } catch { return []; } }
function writeSaved(records) { fs.writeFileSync(SAVED_FILE, JSON.stringify(records, null, 2)); }
function dedup(arr) {
  const seen = new Set();
  return arr.filter(r => {
    const k = `${(r.company||"").toLowerCase().trim()}::${(r.drug||"").toLowerCase().trim()}`;
    if (seen.has(k)) return false; seen.add(k); return true;
  });
}

// Sweep endpoint
app.post("/api/sweep", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set on server" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: err?.error?.message || `Anthropic API error ${response.status}`,
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Saved records — GET to load, POST to append, DELETE to clear
app.get("/api/saved", (_, res) => res.json(loadSaved()));
app.post("/api/saved", (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records)) return res.status(400).json({ error: "records must be array" });
  const merged = dedup([...records, ...loadSaved()]);
  writeSaved(merged);
  res.json(merged);
});
app.delete("/api/saved", (_, res) => {
  writeSaved([]);
  res.json([]);
});

// Health check
app.get("/api/health", (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Pharma Dashboard running on http://localhost:${PORT}`));
