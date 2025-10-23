import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- Check if API key is loaded ---
console.log(
  "🧠 Loaded Perplexity API key:",
  process.env.PERPLEXITY_API_KEY ? "✅ Present" : "❌ Missing"
);

// --- Proxy route for AI Suggest ---
app.post("/api/ask", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Missing query" });
  }

  const perplexityKey = process.env.PERPLEXITY_API_KEY;

  if (!perplexityKey) {
    console.error("❌ Perplexity API key missing!");
    return res.status(500).json({ error: "Server missing API key" });
  }

  try {
    const response = await fetch(
      "https://api.perplexity.ai/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${perplexityKey}`,
        },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: [
            {
              role: "system",
              content:
                "You are an AI assistant that compares and suggests electronic products clearly and helpfully.",
            },
            { role: "user", content: query },
          ],
        }),
      }
    );

    const text = await response.text();

    if (!response.ok) {
      console.error("❌ Perplexity API error:", text);
      return res.status(500).json({
        error: "Failed to get response from Perplexity API",
        details: text,
      });
    }

    // Try parsing JSON safely
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("❌ Failed to parse Perplexity response:", text);
      return res.status(500).json({
        error: "Invalid JSON returned by Perplexity API",
        raw: text,
      });
    }

    const answer =
      data?.choices?.[0]?.message?.content || "No meaningful response received.";
    res.json({ reply: answer });
  } catch (error) {
    console.error("❌ Proxy error:", error);
    res.status(500).json({ error: "Unable to reach Perplexity API" });
  }
});

// --- Run proxy on port 9091 ---
app.listen(9091, () =>
  console.log("✅ AI Proxy running on http://localhost:9091")
);
