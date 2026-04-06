const { parseIntents } = require('../services/intentParser');
const { dispatchAll } = require('../services/functionDispatcher');
const { getContext } = require('../services/chatContextStore');

/**
 * POST /api/chat
 */
exports.chat = async (req, res) => {
  try {
    console.log("📥 BODY:", req.body);

    const message = req.body?.message;

    // ✅ Validate message
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'message is required'
      });
    }

    if (message.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: 'message must be 500 characters or fewer'
      });
    }

    // 🔥 FIX: fallback user (prevents crash)
    const userId = req.user?._id || "demo-user";

    console.log("👤 USER:", userId);

    // ✅ Step 1: Parse intents
    const intents = await parseIntents(message.trim());

    console.log("🤖 INTENTS:", intents);

    // ✅ Step 2: Execute intents safely
    const results = await dispatchAll(intents, userId);

    console.log("⚙️ RESULTS:", results);

    // ✅ Step 3: Aggregate response
    const allSucceeded = Array.isArray(results) && results.every(r => r.success);

    const summaryMessage = results.length === 1
      ? results[0]?.message
      : results.map((r, i) => `(${i + 1}) ${r.message}`).join(' ');

    // ✅ Final response
    return res.status(allSucceeded ? 200 : 207).json({
      success: allSucceeded,
      message: summaryMessage,
      results: results.map(({ intent, success, message: msg, data }) => ({
        success,
        message: msg,
        intent,
        data: data || null,
      })),
      context: getContext(userId),
    });

  } catch (err) {
    console.error("🔥 FULL ERROR:", err);

    // ✅ Ollama-specific handling
    if (err.message?.includes('Ollama')) {
      return res.status(503).json({
        success: false,
        message: err.message
      });
    }

    // ❌ Generic fallback (no crash)
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      details: err.message
    });
  }
};