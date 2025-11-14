const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const authRoutes = require("./routes/auth");
const { authMiddleware, requireRole } = require("./middleware/auth");
const interventionRoutes = require("./routes/interventions");
const themeRoutes = require("./routes/themes");
const userRoutes = require("./routes/users");
const communeRoutes = require("./routes/communes");
const statsRoutes = require("./routes/stats");
const archiveRoutes = require("./routes/archives");
const cronService = require("./services/cronService");
const testArchivesRoutes = require("./tests/test-archive");
const retentionRoutes = require("./routes/retention-policies");

// Middleware
app.use(cors()); // Permet à React de communiquer avec Express
app.use(express.json()); // Permet de recevoir du JSON dans les requêtes

app.use("/api/auth", authRoutes);
app.use("/api/interventions", interventionRoutes);

app.use("/api/themes", themeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/communes", communeRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/archives", archiveRoutes);
app.use("/api/retention-policies", retentionRoutes);
app.use("/api/test", testArchivesRoutes);

// ==================== ROUTES PROTÉGÉES ====================

// Route test - accessible à tous les utilisateurs authentifiés
app.get("/api/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Accès autorisé! ",
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

// Route admin seulement
app.get("/api/admin", authMiddleware, requireRole(["admin"]), (req, res) => {
  res.json({
    message: "Bienvenue dans l'espace admin! 👑",
    user: req.user,
  });
});

// Route juriste seulement
app.get(
  "/api/juriste",
  authMiddleware,
  requireRole(["juriste"]),
  (req, res) => {
    res.json({
      message: "Bienvenue dans l'espace juriste! ⚖️",
      user: req.user,
    });
  }
);

// Route commune seulement
app.get(
  "/api/commune",
  authMiddleware,
  requireRole(["commune"]),
  (req, res) => {
    res.json({
      message: "Bienvenue dans l'espace commune! 🏠",
      user: req.user,
    });
  }
);

// Route test pour juriste OU admin
app.get(
  "/api/staff",
  authMiddleware,
  requireRole(["juriste", "admin"]),
  (req, res) => {
    res.json({
      message: "Bienvenue dans l'espace staff! 👥",
      user: req.user,
    });
  }
);

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Serveur TAG démarré sur http://localhost:${PORT}`);
  console.log(`🔐 Routes protégées activées`);

  cronService.startAutoArchive();
});
