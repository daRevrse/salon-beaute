/**
 * SALONHUB - Script d'exécution de migration SQL
 * Usage: node scripts/run-migration.js database/create_superadmin.sql
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config();
const db = require("../src/config/database");

async function runMigration(sqlFilePath) {
  try {
    console.log("");
    console.log("=========================================");
    console.log("🚀 EXÉCUTION DE MIGRATION SQL");
    console.log("=========================================");
    console.log("");

    // Lire le fichier SQL
    const fullPath = path.join(__dirname, "..", sqlFilePath);
    console.log(`📄 Fichier: ${sqlFilePath}`);

    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Fichier non trouvé: ${fullPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(fullPath, "utf-8");
    console.log(`📊 Taille: ${sql.length} caractères`);
    console.log("");

    // Exécuter le SQL
    console.log("⏳ Exécution en cours...");
    console.log("");

    // Séparer les requêtes (simple split sur ';')
    const queries = sql
      .split(";")
      .map((q) => q.trim())
      .filter((q) => q.length > 0 && !q.startsWith("--"));

    let successCount = 0;
    let errorCount = 0;

    for (const query of queries) {
      try {
        // Ignorer les commentaires
        if (query.startsWith("--") || query.startsWith("/*")) {
          continue;
        }

        await db.query(query);
        successCount++;
      } catch (error) {
        // Certaines erreurs sont acceptables (ex: table already exists)
        if (error.code === "ER_TABLE_EXISTS_ERROR") {
          console.log(`⚠️  Table existe déjà (ignoré)`);
          successCount++;
        } else {
          console.error(`❌ Erreur requête:`, error.message);
          errorCount++;
        }
      }
    }

    console.log("");
    console.log("=========================================");
    console.log("✅ MIGRATION TERMINÉE");
    console.log("=========================================");
    console.log(`   Requêtes exécutées: ${successCount}`);
    console.log(`   Erreurs: ${errorCount}`);
    console.log("");

    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error) {
    console.error("");
    console.error("❌ Erreur fatale:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Récupérer le chemin du fichier SQL depuis les arguments
const sqlFile = process.argv[2];

if (!sqlFile) {
  console.error("❌ Usage: node scripts/run-migration.js <chemin-fichier.sql>");
  console.error("   Exemple: node scripts/run-migration.js database/create_superadmin.sql");
  process.exit(1);
}

// Exécuter
runMigration(sqlFile);
