/**
 * SALONHUB - Routes Uploads
 * Gestion complète de l'upload de fichiers avec multer
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authMiddleware } = require("../middleware/auth");
const { tenantMiddleware } = require("../middleware/tenant");

// Appliquer middlewares sur toutes les routes
router.use(authMiddleware);
router.use(tenantMiddleware);

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, _file, cb) {
    const { target } = req.params;
    let uploadPath = "public/uploads/";

    // Déterminer le dossier selon le type
    if (target === "tenant-logo") {
      uploadPath += "tenants";
    } else if (target === "service-image") {
      uploadPath += "services";
    } else if (target === "user-avatar") {
      uploadPath += "users";
    } else {
      uploadPath += "misc";
    }

    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Générer un nom unique
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = `${req.tenantId}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

// Filtrer les types de fichiers
const fileFilter = (_req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Seules les images sont autorisées (JPEG, PNG, GIF, WebP)"));
  }
};

// Configuration multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// ==========================================
// POST - Upload de fichier
// ==========================================
router.post("/:target", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Aucun fichier uploadé",
      });
    }

    // Construire l'URL du fichier
    const imageUrl = `/uploads/${path.relative(
      "public/uploads",
      req.file.path
    )}`.replace(/\\/g, "/");

    console.log(`✅ Upload réussi pour tenant ${req.tenantId}: ${imageUrl}`);

    res.json({
      success: true,
      message: "Fichier uploadé avec succès",
      data: {
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error("Erreur upload:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Erreur serveur lors de l'upload",
    });
  }
});

// ==========================================
// DELETE - Supprimer un fichier
// ==========================================
router.delete("/", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "URL du fichier requise",
      });
    }

    // Construire le chemin du fichier
    const filePath = path.join(__dirname, "../../public", url);

    // Vérifier si le fichier existe
    if (fs.existsSync(filePath)) {
      // Supprimer le fichier
      fs.unlinkSync(filePath);
      console.log(`🗑️ Fichier supprimé: ${filePath}`);

      res.json({
        success: true,
        message: "Fichier supprimé avec succès",
      });
    } else {
      res.status(404).json({
        success: false,
        error: "Fichier introuvable",
      });
    }
  } catch (error) {
    console.error("Erreur suppression fichier:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la suppression",
    });
  }
});

module.exports = router;
