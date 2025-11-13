/**
 * SALONHUB - Configuration MySQL
 * Gestion du pool de connexions
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

// Configuration du pool MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test de connexion au démarrage
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL connecté avec succès");
    console.log(`📦 Base de données: ${process.env.DB_NAME}`);
    console.log(`🌐 Hôte: ${process.env.DB_HOST}`);
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Erreur de connexion MySQL:");
    console.error(`   Message: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    console.error("\n💡 Vérifiez:");
    console.error("   - MySQL est démarré");
    console.error("   - Les identifiants dans .env sont corrects");
    console.error("   - La base de données existe");
    return false;
  }
};

// Wrapper pour les requêtes avec gestion d'erreur
const query = async (sql, params) => {
  try {
    const [results] = await pool.query(sql, params);
    return results;
  } catch (error) {
    console.error("❌ Erreur requête SQL:", error.message);
    throw error;
  }
};

// Fonction helper pour les transactions
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const result = await callback(connection);
    await connection.commit();
    connection.release();
    return result;
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
};
