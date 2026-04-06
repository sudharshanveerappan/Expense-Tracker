// ✅ IMPORTANT: add this at top
const fetch = require("node-fetch");

const OLLAMA_URL = "http://127.0.0.1:11434";

// 🔹 Generate response
const generateFromOllama = async (prompt) => {
  try {
    if (!prompt) {
      throw new Error("Prompt is required");
    }

    console.log("📤 Sending to Ollama:", prompt);

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "phi",
        prompt,
        stream: false,
      }),
    });

    console.log("📥 Response status:", response.status);

    if (!response.ok) {
      const text = await response.text();
      throw new Error("Ollama API error: " + text);
    }

    const data = await response.json();
    console.log("📥 Ollama response:", data);

    if (!data.response) {
      throw new Error("Invalid response from Ollama");
    }

    return data.response;

  } catch (error) {
    console.error("❌ FULL ERROR:", error);
    throw new Error("Ollama service failed");
  }
};

// 🔹 Health check
const checkOllamaHealth = async () => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);

    if (!response.ok) {
      throw new Error("Ollama not reachable");
    }

    const data = await response.json();

    return {
      ok: true,
      modelReady: (data.models || []).length > 0,
      model: data.models?.[0]?.name || "none",
    };

  } catch (error) {
    return {
      ok: false,
      error: error.message,
    };
  }
};

module.exports = {
  generateFromOllama,
  checkOllamaHealth,
};