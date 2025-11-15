const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configuration de stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Filtrage des fichiers
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Type de fichier non autorisé. Seuls JPEG, PNG et PDF sont acceptés."
      ),
      false
    );
  }
};

// Configuration multer
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 10MB
    files: 5, // Maximum 5 fichiers
  },
  fileFilter,
});

// Middleware pour gérer les erreurs d'upload
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "Fichier trop volumineux. Taille maximale: 10MB." });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res
        .status(400)
        .json({ error: "Trop de fichiers. Maximum 5 fichiers." });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ error: "Champ de fichier inattendu." });
    }
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

module.exports = {
  upload,
  handleUploadErrors,
};
