const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const archiveService = require("../services/archiveService");
const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  try {
    // Récupérer le token du header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Accès refusé. Token manquant." });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Vérifier que l'utilisateur existe toujours et est actif
    const user = await prisma.utilisateurs.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        role: true,
        nom: true,
        prenom: true,
        email: true,
        actif: true,
        commune_id: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Utilisateur invalide." });
    }

    // Vérifier si l'utilisateur est désactivé
    if (!user.actif) {
      return res.status(401).json({ error: "Compte désactivé. Accès refusé." });
    }

    const archiveStatus = await archiveService.checkArchiveStatus(
      "utilisateurs",
      user.id
    );

    if (archiveStatus.archived) {
      return res.status(410).json({
        error: "Compte archivé. Accès refusé.",
        archive_date: archiveStatus.archive_date,
        archived_by: archiveStatus.archive?.archived_by,
        details: "Votre compte a été archivé et n'est plus accessible.",
      });
    }

    // Ajouter les infos utilisateur à la requête
    req.user = {
      id: user.id,
      role: user.role,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      commune_id: user.commune_id,
      actif: user.actif,
    };

    next();
  } catch (error) {
    console.error("Erreur auth middleware:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Token invalide." });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expiré." });
    }

    // En cas d'erreur de vérification d'archivage, on refuse l'accès par sécurité
    if (error.message.includes("archiv")) {
      return res.status(410).json({
        error:
          "Impossible de vérifier le statut du compte. Accès refusé par sécurité.",
      });
    }

    res.status(500).json({ error: "Erreur d'authentification." });
  }
};

// Middleware pour vérifier les rôles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentification requise." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Accès interdit. Rôles autorisés: ${roles.join(", ")}`,
        your_role: req.user.role,
      });
    }

    next();
  };
};

module.exports = { authMiddleware, requireRole };
