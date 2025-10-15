// backend/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors()); // Permet à React de communiquer avec Express
app.use(express.json()); // Permet de recevoir du JSON dans les requêtes

// Route de test
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "TAG API is running! 🚀",
    timestamp: new Date().toISOString(),
  });
});

// Route d'authentification test
app.post("/api/auth/test", (req, res) => {
  const { email, password } = req.body;
  res.json({
    message: "Auth endpoint works!",
    received: { email, password },
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur TAG démarré sur http://localhost:${PORT}`);
  console.log(`Accéder via : http://localhost:${PORT}/api/health`);
});
