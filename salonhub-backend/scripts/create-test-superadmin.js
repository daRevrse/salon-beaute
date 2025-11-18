/**
 * SALONHUB - Script de création d'un SuperAdmin de test
 * Pour développement uniquement
 */

const bcrypt = require("bcrypt");
require("dotenv").config();
const db = require("../src/config/database");

const TEST_SUPERADMIN = {
  email: "admin@test.com",
  password: "admin123",
  first_name: "Test",
  last_name: "SuperAdmin",
  is_super: true,
};

async function createTestSuperAdmin() {
  try {
    console.log("");
    console.log("=========================================");
    console.log("🧪 CRÉATION SUPERADMIN DE TEST");
    console.log("=========================================");
    console.log("");

    // Vérifier si existe déjà
    const existing = await db.query(
      `SELECT id FROM super_admins WHERE email = ?`,
      [TEST_SUPERADMIN.email]
    );

    if (existing && existing.length > 0) {
      console.log("⚠️  Un SuperAdmin avec cet email existe déjà.");
      console.log(`   ID: ${existing[0].id}`);
      console.log(`   Email: ${TEST_SUPERADMIN.email}`);
      console.log("");
      console.log("✅ Vous pouvez l'utiliser pour vous connecter:");
      console.log(`   Email: ${TEST_SUPERADMIN.email}`);
      console.log(`   Password: ${TEST_SUPERADMIN.password}`);
      console.log("");
      process.exit(0);
    }

    // Hasher le mot de passe
    console.log("🔐 Hashage du mot de passe...");
    const passwordHash = await bcrypt.hash(TEST_SUPERADMIN.password, 10);

    // Permissions Super Admin
    const permissions = {
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

    // Insérer
    console.log("💾 Création du SuperAdmin de test...");
    const result = await db.query(
      `INSERT INTO super_admins
       (email, password_hash, first_name, last_name, permissions, is_active, is_super)
       VALUES (?, ?, ?, ?, ?, TRUE, ?)`,
      [
        TEST_SUPERADMIN.email,
        passwordHash,
        TEST_SUPERADMIN.first_name,
        TEST_SUPERADMIN.last_name,
        JSON.stringify(permissions),
        TEST_SUPERADMIN.is_super,
      ]
    );

    console.log("");
    console.log("✅ ========================================");
    console.log("✅ SUPERADMIN DE TEST CRÉÉ !");
    console.log("✅ ========================================");
    console.log("");
    console.log(`   ID: #${result.insertId}`);
    console.log(`   Email: ${TEST_SUPERADMIN.email}`);
    console.log(`   Password: ${TEST_SUPERADMIN.password}`);
    console.log(`   Type: SUPER ADMIN`);
    console.log("");
    console.log("🌐 Connexion:");
    console.log("   Frontend: http://localhost:3000/superadmin/login");
    console.log("   API: POST http://localhost:5000/admin/auth/login");
    console.log("");
    console.log("⚠️  ATTENTION: Utilisez ce compte uniquement pour le développement !");
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("");
    console.error("❌ Erreur:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter
createTestSuperAdmin();
