const { parseIntent } = require("../services/intentParser");

exports.chat = async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const message = req.body?.message;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const intent = await parseIntent(message);

    console.log("INTENT:", intent);

    const params = intent?.parameters || {};
    const amount = params.amount || 0;
    const category = params.category || "Other";

    switch (intent?.function) {

      case "add_expense":
        return res.json({ reply: `Added ₹${amount} for ${category}` });

      case "delete_expense":
        return res.json({ reply: "Deleted last expense" });

      case "get_expenses":
        return res.json({ reply: "Showing your expenses" });

      case "update_expense":
        return res.json({ reply: `Updated to ₹${amount}` });

      default:
        return res.json({ reply: "Try: I spent 50 on food" });
    }

  } catch (err) {
    console.error("🔥 FULL ERROR:", err);

    return res.status(500).json({
      error: "Internal server error",
      details: err.message
    });
  }
};