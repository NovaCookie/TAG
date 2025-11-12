const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/auth");
const StatsService = require("../services/statsService");
const router = express.Router();

// ==================== STATS GLOBALES ====================

/**
 * @route   GET /api/stats/global
 * @desc    Statistiques globales pour l'admin
 * @access  Admin seulement
 */
router.get(
  "/global",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const stats = await StatsService.getGlobalStats();
      res.json(stats);
    } catch (error) {
      console.error("Erreur stats globales:", error);
      res.status(500).json({
        error: "Erreur lors du calcul des statistiques globales",
        details: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/stats/utilisateurs
 * @desc    Statistiques utilisateurs
 * @access  Admin seulement
 */
router.get(
  "/utilisateurs",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const stats = await StatsService.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error("Erreur stats utilisateurs:", error);
      res.status(500).json({
        error: "Erreur lors du calcul des statistiques utilisateurs",
        details: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/stats/communes
 * @desc    Statistiques communes
 * @access  Admin seulement
 */
router.get(
  "/communes",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const stats = await StatsService.getCommuneStats();
      res.json(stats);
    } catch (error) {
      console.error("Erreur stats communes:", error);
      res.status(500).json({
        error: "Erreur lors du calcul des statistiques communes",
        details: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/stats/themes
 * @desc    Statistiques thèmes
 * @access  Admin seulement
 */
router.get(
  "/themes",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const stats = await StatsService.getThemeStats();
      res.json(stats);
    } catch (error) {
      console.error("Erreur stats thèmes:", error);
      res.status(500).json({
        error: "Erreur lors du calcul des statistiques thèmes",
        details: error.message,
      });
    }
  }
);

// ==================== STATS AVANCÉES ====================

/**
 * @route   GET /api/stats/advanced
 * @desc    Statistiques avancées avec filtres
 * @access  Admin et Juristes
 */
router.get(
  "/advanced",
  authMiddleware,
  requireRole(["admin", "juriste"]),
  async (req, res) => {
    try {
      const { dateDebut, dateFin, strate } = req.query;

      const filters = {
        dateDebut,
        dateFin,
        strate,
      };

      const stats = await StatsService.getAdvancedStats(filters);
      res.json(stats);
    } catch (error) {
      console.error("Erreur stats avancées:", error);
      res.status(500).json({
        error: "Erreur lors du calcul des statistiques avancées",
        details: error.message,
      });
    }
  }
);

// ==================== DASHBOARD ====================

/**
 * @route   GET /api/stats/dashboard
 * @desc    Statistiques du dashboard selon le rôle
 * @access  Tous rôles authentifiés
 */
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const stats = await StatsService.getDashboardStats(
      req.user.role,
      req.user.id
    );
    res.json(stats);
  } catch (error) {
    console.error("Erreur stats dashboard:", error);
    res.status(500).json({
      error: "Erreur lors du calcul des statistiques dashboard",
      details: error.message,
    });
  }
});

module.exports = router;
