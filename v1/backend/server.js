import express from 'express';
import cors from 'cors';
import db from './database.js';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ===== MIDDLEWARE D'AUTHENTIFICATION =====
const checkAdminAuth = (req, res, next) => {
  const password = req.headers['x-admin-password'];
  const configPassword = db.prepare('SELECT valeur FROM configuration WHERE cle = ?').get('admin_password');
  
  if (password !== configPassword?.valeur) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  next();
};

// ===== ROUTES PUBLIQUES (INTERFACE CLIENT) =====

// Obtenir les informations du salon
app.get('/api/public/info', (req, res) => {
  try {
    const config = db.prepare('SELECT cle, valeur FROM configuration WHERE cle IN (?, ?, ?)').all('nom_salon', 'telephone', 'adresse');
    const info = {};
    config.forEach(item => {
      info[item.cle] = item.valeur;
    });
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir tous les services actifs
app.get('/api/public/services', (req, res) => {
  try {
    const services = db.prepare('SELECT id, nom, description, duree, prix FROM services WHERE actif = 1 ORDER BY nom').all();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir les horaires d'ouverture
app.get('/api/public/horaires', (req, res) => {
  try {
    const horaires = db.prepare('SELECT jour_semaine, heure_debut, heure_fin, actif FROM horaires ORDER BY jour_semaine').all();
    res.json(horaires);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir les créneaux disponibles pour un service et une date
app.get('/api/public/creneaux-disponibles', (req, res) => {
  try {
    const { service_id, date } = req.query;
    
    if (!service_id || !date) {
      return res.status(400).json({ error: 'service_id et date requis' });
    }

    // Récupérer le service pour connaître sa durée
    const service = db.prepare('SELECT duree FROM services WHERE id = ?').get(service_id);
    if (!service) {
      return res.status(404).json({ error: 'Service non trouvé' });
    }

    // Récupérer la durée du créneau
    const dureeCreneau = parseInt(db.prepare('SELECT valeur FROM configuration WHERE cle = ?').get('duree_creneau')?.valeur || '30');

    // Récupérer le jour de la semaine (0 = dimanche, 1 = lundi, etc.)
    const dateObj = new Date(date);
    const jourSemaine = dateObj.getDay();

    // Vérifier si le jour est fermé
    const horaire = db.prepare('SELECT heure_debut, heure_fin, actif FROM horaires WHERE jour_semaine = ?').get(jourSemaine);
    
    if (!horaire || !horaire.actif) {
      return res.json({ creneaux: [], message: 'Fermé ce jour' });
    }

    // Vérifier si c'est un jour férié/fermé exceptionnel
    const jourFerme = db.prepare('SELECT * FROM jours_fermes WHERE date = ?').get(date);
    if (jourFerme) {
      return res.json({ creneaux: [], message: jourFerme.raison || 'Fermé exceptionnellement' });
    }

    // Générer tous les créneaux possibles
    const creneaux = [];
    const [heureDebut, minuteDebut] = horaire.heure_debut.split(':').map(Number);
    const [heureFin, minuteFin] = horaire.heure_fin.split(':').map(Number);
    
    let currentMinutes = heureDebut * 60 + minuteDebut;
    const endMinutes = heureFin * 60 + minuteFin - service.duree; // Soustraire la durée du service

    while (currentMinutes <= endMinutes) {
      const heure = Math.floor(currentMinutes / 60);
      const minute = currentMinutes % 60;
      const heureStr = `${String(heure).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const dateHeureStr = `${date} ${heureStr}:00`;

      // Vérifier si ce créneau est déjà pris
      const rdvExistant = db.prepare(`
        SELECT COUNT(*) as count FROM rendez_vous 
        WHERE date_heure = ? AND statut != 'annulé' AND statut != 'refusé'
      `).get(dateHeureStr);

      if (rdvExistant.count === 0) {
        creneaux.push({
          heure: heureStr,
          datetime: dateHeureStr,
          disponible: true
        });
      }

      currentMinutes += dureeCreneau;
    }

    res.json({ creneaux });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Client prend un rendez-vous (PUBLIC)
app.post('/api/public/rendez-vous', (req, res) => {
  try {
    const { nom, prenom, telephone, email, service_id, date_heure, notes, moyen_confirmation } = req.body;

    // Validation
    if (!nom || !prenom || !telephone || !service_id || !date_heure) {
      return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
    }

    // Vérifier que le créneau est toujours disponible
    const conflits = db.prepare(`
      SELECT * FROM rendez_vous 
      WHERE date_heure = ? AND statut != 'annulé' AND statut != 'refusé'
    `).all(date_heure);

    if (conflits.length > 0) {
      return res.status(400).json({ error: 'Ce créneau vient d\'être réservé. Veuillez en choisir un autre.' });
    }

    // Récupérer ou créer le client
    let client = db.prepare('SELECT * FROM clients WHERE telephone = ?').get(telephone);
    
    if (!client) {
      const insertClient = db.prepare('INSERT INTO clients (nom, prenom, telephone, email, moyen_confirmation) VALUES (?, ?, ?, ?, ?)');
      const result = insertClient.run(nom, prenom, telephone, email, moyen_confirmation || 'email');
      client = { id: result.lastInsertRowid };
    } else {
      // Mettre à jour le moyen de confirmation si le client existe
      db.prepare('UPDATE clients SET moyen_confirmation = ? WHERE id = ?').run(moyen_confirmation || 'email', client.id);
    }

    // Déterminer le statut (en_attente ou confirmé selon config)
    const validationAuto = db.prepare('SELECT valeur FROM configuration WHERE cle = ?').get('validation_auto')?.valeur === 'true';
    const statut = validationAuto ? 'confirmé' : 'en_attente';

    // Créer le rendez-vous
    const insertRdv = db.prepare(`
      INSERT INTO rendez_vous (client_id, service_id, date_heure, notes, statut, pris_par) 
      VALUES (?, ?, ?, ?, ?, 'client')
    `);
    const result = insertRdv.run(client.id, service_id, date_heure, notes, statut);

    // Récupérer le RDV créé avec les détails
    const rendezVous = db.prepare(`
      SELECT 
        rv.*,
        c.nom as client_nom,
        c.prenom as client_prenom,
        c.telephone as client_telephone,
        c.email as client_email,
        c.moyen_confirmation,
        s.nom as service_nom,
        s.duree as service_duree,
        s.prix as service_prix
      FROM rendez_vous rv
      JOIN clients c ON rv.client_id = c.id
      JOIN services s ON rv.service_id = s.id
      WHERE rv.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      rendez_vous: rendezVous,
      message: statut === 'en_attente' 
        ? `Votre rendez-vous a été enregistré et est en attente de validation. Vous recevrez une confirmation par ${moyen_confirmation === 'sms' ? 'SMS' : moyen_confirmation === 'whatsapp' ? 'WhatsApp' : 'email'}.`
        : 'Votre rendez-vous est confirmé !'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ROUTES ADMIN (INTERFACE PRESTATAIRE) =====

// Login admin
app.post('/api/admin/login', (req, res) => {
  try {
    const { password } = req.body;
    const adminPassword = db.prepare('SELECT valeur FROM configuration WHERE cle = ?').get('admin_password');
    const managerPassword = db.prepare('SELECT valeur FROM configuration WHERE cle = ?').get('manager_password');
    
    if (password === adminPassword?.valeur) {
      res.json({ success: true, message: 'Connexion réussie', role: 'admin' });
    } else if (password === managerPassword?.valeur) {
      res.json({ success: true, message: 'Connexion réussie', role: 'manager' });
    } else {
      res.status(401).json({ success: false, error: 'Mot de passe incorrect' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir tous les services (admin)
app.get('/api/admin/services', checkAdminAuth, (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM services ORDER BY nom').all();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un service
app.post('/api/admin/services', checkAdminAuth, (req, res) => {
  try {
    const { nom, description, duree, prix } = req.body;
    const stmt = db.prepare('INSERT INTO services (nom, description, duree, prix) VALUES (?, ?, ?, ?)');
    const result = stmt.run(nom, description, duree, prix);
    res.status(201).json({ id: result.lastInsertRowid, nom, description, duree, prix });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Modifier un service
app.put('/api/admin/services/:id', checkAdminAuth, (req, res) => {
  try {
    const { nom, description, duree, prix, actif } = req.body;
    const stmt = db.prepare('UPDATE services SET nom = ?, description = ?, duree = ?, prix = ?, actif = ? WHERE id = ?');
    const result = stmt.run(nom, description, duree, prix, actif, req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Service non trouvé' });
    }
    
    res.json({ id: req.params.id, nom, description, duree, prix, actif });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un service
app.delete('/api/admin/services/:id', checkAdminAuth, (req, res) => {
  try {
    // Vérifier qu'il n'y a pas de RDV actifs avec ce service
    const rdvsActifs = db.prepare(`
      SELECT COUNT(*) as count 
      FROM rendez_vous 
      WHERE service_id = ? 
      AND statut NOT IN ('annulé', 'refusé', 'terminé')
      AND date_heure >= datetime('now')
    `).get(req.params.id);

    if (rdvsActifs.count > 0) {
      return res.status(400).json({ 
        error: `Impossible de supprimer ce service : ${rdvsActifs.count} rendez-vous actif(s) utilisent ce service.` 
      });
    }

    const stmt = db.prepare('DELETE FROM services WHERE id = ?');
    const result = stmt.run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Service non trouvé' });
    }
    
    res.json({ success: true, message: 'Service supprimé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir tous les rendez-vous (admin)
app.get('/api/admin/rendez-vous', checkAdminAuth, (req, res) => {
  try {
    const { date, statut } = req.query;
    let query = `
      SELECT 
        rv.*,
        c.nom as client_nom,
        c.prenom as client_prenom,
        c.telephone as client_telephone,
        c.email as client_email,
        c.moyen_confirmation,
        s.nom as service_nom,
        s.duree as service_duree,
        s.prix as service_prix
      FROM rendez_vous rv
      JOIN clients c ON rv.client_id = c.id
      JOIN services s ON rv.service_id = s.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (date) {
      query += ' AND DATE(rv.date_heure) = DATE(?)';
      params.push(date);
    }
    
    if (statut) {
      query += ' AND rv.statut = ?';
      params.push(statut);
    }
    
    query += ' ORDER BY rv.date_heure';
    
    const rendezVous = db.prepare(query).all(...params);
    res.json(rendezVous);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir les RDV en attente de validation
app.get('/api/admin/rendez-vous/en-attente', checkAdminAuth, (req, res) => {
  try {
    const rendezVous = db.prepare(`
      SELECT 
        rv.*,
        c.nom as client_nom,
        c.prenom as client_prenom,
        c.telephone as client_telephone,
        c.email as client_email,
        c.moyen_confirmation,
        s.nom as service_nom,
        s.duree as service_duree,
        s.prix as service_prix
      FROM rendez_vous rv
      JOIN clients c ON rv.client_id = c.id
      JOIN services s ON rv.service_id = s.id
      WHERE rv.statut = 'en_attente'
      ORDER BY rv.date_heure
    `).all();
    
    res.json(rendezVous);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour le statut d'un rendez-vous
app.patch('/api/admin/rendez-vous/:id/statut', checkAdminAuth, (req, res) => {
  try {
    const { statut } = req.body;
    const validStatuts = ['en_attente', 'confirmé', 'en_cours', 'terminé', 'annulé', 'refusé'];
    
    if (!validStatuts.includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }
    
    const stmt = db.prepare('UPDATE rendez_vous SET statut = ? WHERE id = ?');
    const result = stmt.run(statut, req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }
    
    res.json({ id: req.params.id, statut });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un rendez-vous (par l'admin)
app.post('/api/admin/rendez-vous', checkAdminAuth, (req, res) => {
  try {
    const { client_id, service_id, date_heure, notes } = req.body;
    
    const conflits = db.prepare(`
      SELECT * FROM rendez_vous 
      WHERE date_heure = ? AND statut != 'annulé' AND statut != 'refusé'
    `).all(date_heure);
    
    if (conflits.length > 0) {
      return res.status(400).json({ error: 'Ce créneau horaire est déjà réservé' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO rendez_vous (client_id, service_id, date_heure, notes, statut, pris_par) 
      VALUES (?, ?, ?, ?, 'confirmé', 'admin')
    `);
    const result = stmt.run(client_id, service_id, date_heure, notes);
    
    const rendezVous = db.prepare(`
      SELECT 
        rv.*,
        c.nom as client_nom,
        c.prenom as client_prenom,
        c.telephone as client_telephone,
        s.nom as service_nom,
        s.duree as service_duree,
        s.prix as service_prix
      FROM rendez_vous rv
      JOIN clients c ON rv.client_id = c.id
      JOIN services s ON rv.service_id = s.id
      WHERE rv.id = ?
    `).get(result.lastInsertRowid);
    
    res.status(201).json(rendezVous);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un rendez-vous
app.delete('/api/admin/rendez-vous/:id', checkAdminAuth, (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM rendez_vous WHERE id = ?');
    const result = stmt.run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }
    
    res.json({ message: 'Rendez-vous supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir tous les clients
app.get('/api/admin/clients', checkAdminAuth, (req, res) => {
  try {
    const clients = db.prepare('SELECT * FROM clients ORDER BY nom, prenom').all();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Gérer les horaires
app.get('/api/admin/horaires', checkAdminAuth, (req, res) => {
  try {
    const horaires = db.prepare('SELECT * FROM horaires ORDER BY jour_semaine').all();
    res.json(horaires);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/horaires/:jour', checkAdminAuth, (req, res) => {
  try {
    const { heure_debut, heure_fin, actif } = req.body;
    const stmt = db.prepare('UPDATE horaires SET heure_debut = ?, heure_fin = ?, actif = ? WHERE jour_semaine = ?');
    const result = stmt.run(heure_debut, heure_fin, actif, req.params.jour);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Horaire non trouvé' });
    }
    
    res.json({ jour_semaine: req.params.jour, heure_debut, heure_fin, actif });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Jours fermés
app.get('/api/admin/jours-fermes', checkAdminAuth, (req, res) => {
  try {
    const jours = db.prepare('SELECT * FROM jours_fermes ORDER BY date').all();
    res.json(jours);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/jours-fermes', checkAdminAuth, (req, res) => {
  try {
    const { date, raison } = req.body;
    const stmt = db.prepare('INSERT INTO jours_fermes (date, raison) VALUES (?, ?)');
    const result = stmt.run(date, raison);
    res.status(201).json({ id: result.lastInsertRowid, date, raison });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/jours-fermes/:id', checkAdminAuth, (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM jours_fermes WHERE id = ?');
    const result = stmt.run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Jour fermé non trouvé' });
    }
    
    res.json({ message: 'Supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Configuration
app.get('/api/admin/configuration', checkAdminAuth, (req, res) => {
  try {
    const config = db.prepare('SELECT * FROM configuration').all();
    const configObj = {};
    config.forEach(item => {
      configObj[item.cle] = item.valeur;
    });
    res.json(configObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/configuration', checkAdminAuth, (req, res) => {
  try {
    const updates = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO configuration (cle, valeur) VALUES (?, ?)');
    
    const updateMany = db.transaction((updates) => {
      for (const [cle, valeur] of Object.entries(updates)) {
        if (cle !== 'admin_password') { // Ne pas permettre de changer le MDP via cette route
          stmt.run(cle, valeur);
        }
      }
    });

    updateMany(updates);
    res.json({ success: true, message: 'Configuration mise à jour' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Statistiques
app.get('/api/admin/stats', checkAdminAuth, (req, res) => {
  try {
    const stats = {
      en_attente: db.prepare(`
        SELECT COUNT(*) as total FROM rendez_vous WHERE statut = 'en_attente'
      `).get(),
      
      aujourd_hui: db.prepare(`
        SELECT COUNT(*) as total FROM rendez_vous 
        WHERE DATE(date_heure) = DATE('now', 'localtime') 
        AND statut NOT IN ('annulé', 'refusé')
      `).get(),
      
      cette_semaine: db.prepare(`
        SELECT COUNT(*) as total FROM rendez_vous 
        WHERE date_heure >= DATE('now', 'localtime', 'weekday 0', '-6 days')
        AND date_heure < DATE('now', 'localtime', 'weekday 0', '+1 day')
        AND statut NOT IN ('annulé', 'refusé')
      `).get(),
      
      total_clients: db.prepare('SELECT COUNT(*) as total FROM clients').get(),
      
      revenu_mois: db.prepare(`
        SELECT COALESCE(SUM(s.prix), 0) as total
        FROM rendez_vous rv
        JOIN services s ON rv.service_id = s.id
        WHERE strftime('%Y-%m', rv.date_heure) = strftime('%Y-%m', 'now', 'localtime')
        AND rv.statut = 'terminé'
      `).get()
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Statistiques avancées (admin uniquement)
app.get('/api/admin/stats/avancees', checkAdminAuth, (req, res) => {
  try {
    // Revenu du mois
    const revenuMois = db.prepare(`
      SELECT COALESCE(SUM(s.prix), 0) as total
      FROM rendez_vous rv
      JOIN services s ON rv.service_id = s.id
      WHERE strftime('%Y-%m', rv.date_heure) = strftime('%Y-%m', 'now', 'localtime')
      AND rv.statut = 'terminé'
    `).get();

    // Service le plus populaire du mois
    const servicePopulaire = db.prepare(`
      SELECT s.nom, COUNT(*) as count
      FROM rendez_vous rv
      JOIN services s ON rv.service_id = s.id
      WHERE strftime('%Y-%m', rv.date_heure) = strftime('%Y-%m', 'now', 'localtime')
      AND rv.statut IN ('confirmé', 'en_cours', 'terminé')
      GROUP BY s.id
      ORDER BY count DESC
      LIMIT 1
    `).get();

    // Taux de validation (RDV acceptés vs refusés)
    const tauxValidation = db.prepare(`
      SELECT 
        COUNT(CASE WHEN statut IN ('confirmé', 'en_cours', 'terminé') THEN 1 END) * 100.0 / 
        NULLIF(COUNT(*), 0) as taux
      FROM rendez_vous
      WHERE pris_par = 'client'
      AND statut NOT IN ('en_attente', 'annulé')
    `).get();

    // Moyenne de RDV par jour (sur les 30 derniers jours)
    const rdvParJour = db.prepare(`
      SELECT CAST(COUNT(*) AS REAL) / 30 as moyenne
      FROM rendez_vous
      WHERE date_heure >= DATE('now', 'localtime', '-30 days')
      AND statut NOT IN ('annulé', 'refusé')
    `).get();

    const stats = {
      revenu_mois: Math.round(revenuMois.total),
      service_populaire: servicePopulaire || { nom: 'N/A', count: 0 },
      taux_validation: Math.round(tauxValidation?.taux || 0),
      rdv_par_jour: Math.round((rdvParJour?.moyenne || 0) * 10) / 10
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Serveur opérationnel' });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📊 API disponible sur http://localhost:${PORT}/api`);
  console.log(`👥 Interface CLIENT : Routes /api/public/*`);
  console.log(`🔐 Interface ADMIN : Routes /api/admin/* (mot de passe requis)`);
});
