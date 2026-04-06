const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/chat', require('./routes/chat'));

// Warn early if Ollama is unreachable — non-fatal, server still starts
const { checkOllamaHealth } = require('./services/ollamaService');
checkOllamaHealth().then(({ ok, modelReady, model, error }) => {
  if (!ok) {
    console.warn(`\n⚠️  Ollama unreachable: ${error}`);
    console.warn(`   AI chat will return 503 until Ollama is running.`);
    console.warn(`   Fix: ollama serve\n`);
  } else if (!modelReady) {
    console.warn(`\n⚠️  Model "${model}" not found in Ollama.`);
    console.warn(`   Fix: ollama pull ${model}\n`);
  } else {
    console.log(`✅  Ollama ready — model: ${model}`);
  }
});

// 404 handler
app.use((req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found` }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

if (require.main === module) {
  app.listen(process.env.PORT || 5000, () =>
    console.log(`Server running on port ${process.env.PORT || 5000}`)
  );
}

module.exports = app;
