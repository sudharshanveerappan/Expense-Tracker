const router = require('express').Router();
const { chat } = require('../controllers/chatController');
const { checkOllamaHealth } = require('../services/ollamaService');

// ✅ Public health endpoint
router.get('/health', async (req, res) => {
  try {
    const status = await checkOllamaHealth();

    res.status(status.ok || status.modelReady ? 200 : 503).json(status);

  } catch (err) {
    console.error("❌ Health check error:", err);

    res.status(500).json({
      ok: false,
      message: "Health check failed",
      error: err.message
    });
  }
});

// 🔥 FIX: Removed protect middleware (no auth required for now)
router.post('/', chat);

module.exports = router;