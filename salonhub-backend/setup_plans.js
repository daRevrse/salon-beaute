require("dotenv").config();
const { pool } = require("./src/config/database");

async function setup() {
  try {
    console.log("Creating subscription_plans table...");
    // Create table if not exists (with technical_features)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'EUR',
        interval_type VARCHAR(20) DEFAULT 'month',
        stripe_price_id VARCHAR(100),
        features JSON,
        technical_features JSON,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Check if empty
    const [rows] = await pool.query("SELECT COUNT(*) as count FROM subscription_plans");
    if (rows[0].count === 0) {
      console.log("Seeding default plans...");
      await pool.query(`
        INSERT INTO subscription_plans (name, display_name, description, price, features, technical_features) VALUES 
        ('essential', 'Essential', 'Idéal pour démarrer votre activité', 29.00, '["Agenda en ligne", "1 Collaborateur", "Support email"]', '[]'),
        ('pro', 'Pro', 'Pour les salons en développement', 79.00, '["Agenda en ligne", "Jusqu\\'à 5 Collaborateurs", "Rappels SMS", "Statistiques", "Support prioritaire"]', '["shop", "wallet"]'),
        ('custom', 'Sur mesure', 'Pour les franchises et grands salons', 149.00, '["Toutes les fonctionnalités Pro", "Marque blanche", "API Accès", "Account Manager dédié"]', '["shop", "wallet", "api_access", "webhooks"]')
      `);
    } else {
      // Optionnel: Mettre à jour les plans existants pour s'assurer qu'ils ont les features
      console.log("Plans already exist. Updating technical_features if null...");
      await pool.query(`
        UPDATE subscription_plans SET technical_features = '[]' WHERE name = 'essential' AND technical_features IS NULL;
        UPDATE subscription_plans SET technical_features = '["shop", "wallet"]' WHERE name = 'pro' AND technical_features IS NULL;
        UPDATE subscription_plans SET technical_features = '["shop", "wallet", "api_access", "webhooks"]' WHERE name = 'custom' AND technical_features IS NULL;
      `);
    }

    console.log("Setup complete.");
    process.exit(0);
  } catch (err) {
    console.error("Error setting up plans table:", err);
    process.exit(1);
  }
}

setup();
