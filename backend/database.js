import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, "salon.db"));

// Configuration
db.pragma("journal_mode = WAL");

// Initialisation des tables
const initDB = () => {
  // Table des services
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      description TEXT,
      duree INTEGER NOT NULL,
      prix REAL NOT NULL,
      actif INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table des clients
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      telephone TEXT NOT NULL UNIQUE,
      email TEXT,
      notes TEXT,
      moyen_confirmation TEXT DEFAULT 'email',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table des rendez-vous
  db.exec(`
    CREATE TABLE IF NOT EXISTS rendez_vous (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      date_heure DATETIME NOT NULL,
      statut TEXT DEFAULT 'en_attente',
      notes TEXT,
      pris_par TEXT DEFAULT 'client',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (service_id) REFERENCES services(id)
    )
  `);

  // Table des horaires d'ouverture
  db.exec(`
    CREATE TABLE IF NOT EXISTS horaires (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jour_semaine INTEGER NOT NULL,
      heure_debut TEXT NOT NULL,
      heure_fin TEXT NOT NULL,
      actif INTEGER DEFAULT 1,
      UNIQUE(jour_semaine)
    )
  `);

  // Table des jours fermés / exceptions
  db.exec(`
    CREATE TABLE IF NOT EXISTS jours_fermes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL UNIQUE,
      raison TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table de configuration
  db.exec(`
    CREATE TABLE IF NOT EXISTS configuration (
      cle TEXT PRIMARY KEY,
      valeur TEXT NOT NULL
    )
  `);

  // Insertion de données de démonstration si les tables sont vides
  const serviceCount = db
    .prepare("SELECT COUNT(*) as count FROM services")
    .get();

  if (serviceCount.count === 0) {
    const insertService = db.prepare(`
      INSERT INTO services (nom, description, duree, prix) 
      VALUES (?, ?, ?, ?)
    `);

    const services = [
      ["Coupe Femme", "Coupe et brushing inclus", 60, 35000],
      ["Coupe Homme", "Coupe classique ou moderne", 30, 20000],
      ["Coloration", "Coloration complète avec soin", 120, 65000],
      ["Mèches", "Mèches avec soin protecteur", 150, 80000],
      ["Brushing", "Brushing professionnel", 30, 25000],
      ["Soin Capillaire", "Soin profond hydratant", 45, 30000],
      ["Manucure", "Soin des ongles et vernis", 45, 25000],
      ["Pédicure", "Soin complet des pieds", 60, 35000],
      ["Épilation Sourcils", "Mise en forme des sourcils", 15, 10000],
      ["Maquillage", "Maquillage professionnel", 60, 45000],
    ];

    const insertMany = db.transaction((services) => {
      for (const service of services) {
        insertService.run(...service);
      }
    });

    insertMany(services);

    // Insertion de clients de démonstration
    const insertClient = db.prepare(`
      INSERT INTO clients (nom, prenom, telephone, email) 
      VALUES (?, ?, ?, ?)
    `);

    const clients = [
      ["Dubois", "Marie", "0601020304", "marie.dubois@email.fr"],
      ["Martin", "Sophie", "0605060708", "sophie.martin@email.fr"],
      ["Bernard", "Julie", "0609101112", "julie.bernard@email.fr"],
    ];

    const insertManyClients = db.transaction((clients) => {
      for (const client of clients) {
        insertClient.run(...client);
      }
    });

    insertManyClients(clients);

    // Insertion des horaires d'ouverture par défaut (Lundi-Samedi: 9h-18h)
    const insertHoraire = db.prepare(`
      INSERT INTO horaires (jour_semaine, heure_debut, heure_fin, actif) 
      VALUES (?, ?, ?, ?)
    `);

    const horaires = [
      [1, "09:00", "18:00", 1], // Lundi
      [2, "09:00", "18:00", 1], // Mardi
      [3, "09:00", "18:00", 1], // Mercredi
      [4, "09:00", "18:00", 1], // Jeudi
      [5, "09:00", "18:00", 1], // Vendredi
      [6, "09:00", "17:00", 1], // Samedi
      [0, "00:00", "00:00", 0], // Dimanche fermé
    ];

    const insertManyHoraires = db.transaction((horaires) => {
      for (const horaire of horaires) {
        insertHoraire.run(...horaire);
      }
    });

    insertManyHoraires(horaires);

    // Configuration par défaut
    const insertConfig = db.prepare(`
      INSERT OR REPLACE INTO configuration (cle, valeur) VALUES (?, ?)
    `);

    insertConfig.run("nom_salon", "Salon de Beauté Girls Dream");
    insertConfig.run("telephone", "93 23 13 46");
    insertConfig.run("adresse", "123 Avenue de la Beauté, 75001 Lomé");
    insertConfig.run("duree_creneau", "30"); // Minutes entre chaque créneau
    insertConfig.run("validation_auto", "false"); // RDV en attente de validation
    insertConfig.run("admin_password", "admin123"); // À CHANGER en production

    console.log(
      "✅ Base de données initialisée avec des données de démonstration"
    );
  }
};

// Initialiser la base de données
initDB();

export default db;
