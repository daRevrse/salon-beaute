/**
 * SALONHUB - Script de création du premier SuperAdmin
 * Usage: node scripts/create-superadmin.js
 */

const readline = require("readline");
const bcrypt = require("bcrypt");
const db = require("../src/config/database");

// Interface pour lire l'input utilisateur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Helper: Poser une question et attendre la réponse
 */
const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

/**
 * Permissions SuperAdmin par défaut
 */
const DEFAULT_PERMISSIONS = {
  tenants: {
    view: true,
    create: true,
    edit: true,
    suspend: true,
    delete: false, // Réservé aux super admins
  },
  analytics: {
    view_global: true,
    view_tenant: true,
    export: true,
  },
  impersonate: {
    enabled: true,
    require_2fa: false,
  },
  billing: {
    view: true,
    modify: false,
  },
  system: {
    view_logs: true,
    manage_admins: false, // Réservé aux super admins
    manage_settings: false,
  },
};

/**
 * Permissions Super Admin (tous les droits)
 */
const SUPER_ADMIN_PERMISSIONS = {
  tenants: {
    view: true,
    create: true,
    edit: true,
    suspend: true,
    delete: true,
  },
  analytics: {
    view_global: true,
    view_tenant: true,
    export: true,
  },
  impersonate: {
    enabled: true,
    require_2fa: false,
  },
  billing: {
    view: true,
    modify: true,
  },
  system: {
    view_logs: true,
    manage_admins: true,
    manage_settings: true,
  },
};

/**
 * Créer un SuperAdmin
 */
async function createSuperAdmin() {
  console.log("");
  console.log("=========================================");
  console.log("🔐 CRÉATION D'UN SUPERADMIN");
  console.log("=========================================");
  console.log("");

  try {
    // Vérifier si des SuperAdmins existent déjà
    const [existingAdmins] = await db.query(
      `SELECT COUNT(*) as count FROM super_admins`
    );

    const hasExisting = existingAdmins[0].count > 0;

    if (hasExisting) {
      console.log(
        `⚠️  Il existe déjà ${existingAdmins[0].count} SuperAdmin(s) dans le système.`
      );
      console.log("");
      const proceed = await question("Voulez-vous en créer un autre ? (oui/non): ");
      if (proceed.toLowerCase() !== "oui") {
        console.log("❌ Annulé.");
        rl.close();
        process.exit(0);
      }
      console.log("");
    }

    // Collecter les informations
    const email = await question("📧 Email: ");
    const firstName = await question("👤 Prénom: ");
    const lastName = await question("👤 Nom: ");
    const password = await question("🔑 Mot de passe: ");

    console.log("");
    console.log("🎯 Type de compte:");
    console.log("  1. Super Admin (tous les droits - fondateur)");
    console.log("  2. Admin (droits limités)");
    const typeChoice = await question("Choisir (1 ou 2): ");

    const isSuper = typeChoice === "1";
    const permissions = isSuper ? SUPER_ADMIN_PERMISSIONS : DEFAULT_PERMISSIONS;

    // Validation basique
    if (!email || !firstName || !lastName || !password) {
      console.log("❌ Tous les champs sont requis.");
      rl.close();
      process.exit(1);
    }

    if (password.length < 6) {
      console.log("❌ Le mot de passe doit contenir au moins 6 caractères.");
      rl.close();
      process.exit(1);
    }

    // Vérifier si l'email existe déjà
    const [emailCheck] = await db.query(
      `SELECT id FROM super_admins WHERE email = ?`,
      [email]
    );

    if (emailCheck.length > 0) {
      console.log("❌ Cet email est déjà utilisé.");
      rl.close();
      process.exit(1);
    }

    // Confirmation
    console.log("");
    console.log("📋 Récapitulatif:");
    console.log(`   Email: ${email}`);
    console.log(`   Nom: ${firstName} ${lastName}`);
    console.log(`   Type: ${isSuper ? "SUPER ADMIN" : "Admin"}`);
    console.log("");

    const confirm = await question("✅ Confirmer la création ? (oui/non): ");

    if (confirm.toLowerCase() !== "oui") {
      console.log("❌ Annulé.");
      rl.close();
      process.exit(0);
    }

    // Hasher le mot de passe
    console.log("");
    console.log("🔐 Hashage du mot de passe...");
    const passwordHash = await bcrypt.hash(password, 10);

    // Insérer dans la DB
    console.log("💾 Création du SuperAdmin...");
    const [result] = await db.query(
      `INSERT INTO super_admins
       (email, password_hash, first_name, last_name, permissions, is_active, is_super)
       VALUES (?, ?, ?, ?, ?, TRUE, ?)`,
      [
        email,
        passwordHash,
        firstName,
        lastName,
        JSON.stringify(permissions),
        isSuper,
      ]
    );

    console.log("");
    console.log("✅ ========================================");
    console.log("✅ SUPERADMIN CRÉÉ AVEC SUCCÈS !");
    console.log("✅ ========================================");
    console.log("");
    console.log(`   ID: #${result.insertId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Type: ${isSuper ? "SUPER ADMIN (tous les droits)" : "Admin"}`);
    console.log("");
    console.log("🔑 Vous pouvez maintenant vous connecter:");
    console.log(`   POST /api/admin/auth/login`);
    console.log(`   Body: { "email": "${email}", "password": "..." }`);
    console.log("");

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error("");
    console.error("❌ Erreur lors de la création:", error.message);
    console.error(error);
    rl.close();
    process.exit(1);
  }
}

// Démarrer le script
(async () => {
  try {
    // Test connexion DB
    const connected = await db.testConnection();
    if (!connected) {
      console.error("❌ Impossible de se connecter à la base de données.");
      process.exit(1);
    }

    await createSuperAdmin();
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
})();
