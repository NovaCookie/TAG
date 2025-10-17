// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  try {
    // Récupérer le token du header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Accès refusé. Token manquant.' });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier que l'utilisateur existe toujours
    const user = await prisma.utilisateurs.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, actif: true }
    });

    if (!user || !user.actif) {
      return res.status(401).json({ error: 'Utilisateur invalide ou désactivé.' });
    }

    // Ajouter les infos utilisateur à la requête
    req.user = {
      id: user.id,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Erreur auth middleware:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invalide.' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré.' });
    }
    
    res.status(500).json({ error: 'Erreur d\'authentification.' });
  }
};

// Middleware pour vérifier les rôles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Accès interdit. Rôles autorisés: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

module.exports = { authMiddleware, requireRole };