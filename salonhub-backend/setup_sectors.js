require("dotenv").config();
const { pool } = require("./src/config/database");

async function setup() {
  try {
    console.log("Creating business_sectors table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS business_sectors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        value VARCHAR(50) NOT NULL UNIQUE,
        label VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Check if empty
    const [rows] = await pool.query("SELECT COUNT(*) as count FROM business_sectors");
    if (rows[0].count === 0) {
      console.log("Seeding default sectors...");
      const defaultSectors = [
        { value: 'coiffure', label: 'Salon de coiffure' },
        { value: 'barbier', label: 'Barbier / Barber shop' },
        { value: 'institut', label: 'Institut de beauté' },
        { value: 'spa', label: 'Spa / Centre bien-être' },
        { value: 'onglerie', label: 'Onglerie / Prothésiste' },
        { value: 'massage', label: 'Salon de massage' },
        { value: 'medical', label: 'Médical / Paramédical' },
        { value: 'restaurant', label: 'Restaurant / Café' },
        { value: 'other', label: 'Autre activités' }
      ];
      for (const s of defaultSectors) {
         await pool.query("INSERT IGNORE INTO business_sectors (value, label, is_active) VALUES (?, ?, true)", [s.value, s.label]);
      }
    }

    console.log("Setup sectors complete.");
    process.exit(0);
  } catch (err) {
    console.error("Error setting up sectors table:", err);
    process.exit(1);
  }
}

setup();
