require("dotenv").config();
const { pool } = require("./src/config/database");
const bcrypt = require("bcrypt");

async function createAdmin() {
  try {
    const email = "admin@salonhub.com";
    const password = "admin123";
    const firstName = "Super";
    const lastName = "Admin";

    console.log(`🔍 Checking if superadmin ${email} exists...`);
    const [existing] = await pool.query("SELECT id FROM super_admins WHERE email = ?", [email]);

    if (existing.length > 0) {
      console.log("✅ Superadmin already exists.");
      process.exit(0);
    }

    console.log("⏳ Hashing password...");
    const hash = await bcrypt.hash(password, 10);

    console.log("⏳ Creating superadmin...");
    await pool.query(
      `INSERT INTO super_admins (email, password_hash, first_name, last_name, is_active, is_super)
       VALUES (?, ?, ?, ?, 1, 1)`,
      [email, hash, firstName, lastName]
    );

    console.log("🚀 Superadmin created successfully!");
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating superadmin:", error);
    process.exit(1);
  }
}

createAdmin();
