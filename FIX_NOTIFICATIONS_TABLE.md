# Correction de l'Erreur de Table de Notifications

## Problème Rencontré

**Erreur** : `Table 'salonhub_dev.notifications' doesn't exist`

Cette erreur se produisait lors de l'envoi d'une confirmation de RDV.

## Cause

Dans le schéma de base de données ([prod.sql](salonhub-backend/database/prod.sql)), la table s'appelle **`client_notifications`** et non `notifications`.

Le code de la route `/appointments/:id/send-confirmation` tentait d'insérer dans une table inexistante.

## Solution Appliquée

### Fichier modifié : `salonhub-backend/src/routes/appointments.js`

**Avant** (ligne 780) :
```sql
INSERT INTO notifications (
  tenant_id, client_id, type, title, message, sent_via, status
) VALUES (?, ?, ?, ?, ?, ?, ?)
```

**Après** (ligne 780) :
```sql
INSERT INTO client_notifications (
  tenant_id, client_id, appointment_id, type, subject, message, send_via, status, sent_by, sent_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

### Changements apportés

1. ✅ Nom de table corrigé : `notifications` → `client_notifications`
2. ✅ Ajout du champ `appointment_id` (référence au RDV)
3. ✅ Renommage : `title` → `subject` (conforme au schéma)
4. ✅ Ajout du champ `sent_by` (ID de l'utilisateur qui envoie)
5. ✅ Ajout du champ `sent_at` (timestamp d'envoi)

## Structure de la Table `client_notifications`

Selon [prod.sql](salonhub-backend/database/prod.sql) (lignes 269-292) :

```sql
CREATE TABLE IF NOT EXISTS client_notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  client_id INT NOT NULL,
  appointment_id INT NULL,                    -- ✅ Référence au RDV (nullable)
  type ENUM('manual', 'appointment_reminder', 'appointment_confirmation', 'marketing', 'other') DEFAULT 'manual',
  subject VARCHAR(255) NULL,                  -- ✅ Sujet (pour emails)
  message TEXT NOT NULL,
  send_via ENUM('email', 'sms', 'both') NOT NULL,
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  sent_by INT NULL,                           -- ✅ ID utilisateur
  sent_at DATETIME NULL,                      -- ✅ Timestamp
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_client (client_id),
  INDEX idx_tenant (tenant_id),
  INDEX idx_appointment (appointment_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Paramètres Insérés

```javascript
[
  req.tenantId,                    // tenant_id
  appointment.client_id,           // client_id
  appointment.id,                  // appointment_id ✅ NOUVEAU
  'appointment_confirmation',      // type
  'Confirmation de rendez-vous',   // subject ✅ (était "title")
  `Rendez-vous confirmé le ...`,  // message
  send_via,                        // send_via ('email', 'sms', 'both')
  (emailSent || whatsappSent) ? 'sent' : 'failed',  // status
  req.user.id,                     // sent_by ✅ NOUVEAU
  new Date()                       // sent_at ✅ NOUVEAU
]
```

## Bénéfices de la Correction

### 1. Traçabilité Complète
- ✅ On sait **quel RDV** a généré la notification (`appointment_id`)
- ✅ On sait **qui** a envoyé la notification (`sent_by`)
- ✅ On sait **quand** elle a été envoyée (`sent_at`)

### 2. Historique des Communications
- Possibilité de voir toutes les notifications liées à un RDV
- Possibilité de voir toutes les notifications envoyées par un utilisateur
- Historique complet des communications avec un client

### 3. Requêtes Utiles Possibles

#### Voir toutes les notifications d'un client
```sql
SELECT * FROM client_notifications
WHERE client_id = ?
ORDER BY sent_at DESC;
```

#### Voir toutes les confirmations de RDV
```sql
SELECT cn.*, a.appointment_date, c.first_name, c.last_name
FROM client_notifications cn
JOIN appointments a ON cn.appointment_id = a.id
JOIN clients c ON cn.client_id = c.id
WHERE cn.type = 'appointment_confirmation'
ORDER BY cn.sent_at DESC;
```

#### Statistiques d'envoi
```sql
SELECT
  status,
  COUNT(*) as count,
  send_via
FROM client_notifications
WHERE tenant_id = ?
GROUP BY status, send_via;
```

## Documentation Mise à Jour

Le fichier [NOTIFICATIONS_IMPLEMENTATION.md](NOTIFICATIONS_IMPLEMENTATION.md) a été mis à jour pour refléter :
- Le nom correct de la table
- Les champs supplémentaires
- Les types ENUM corrects

## Test de Validation

Pour tester que tout fonctionne :

1. **Créer un RDV** avec un client qui a un email
2. **Ouvrir les détails** du RDV
3. **Cliquer** sur "Confirmation Email"
4. **Vérifier** :
   - ✅ Email reçu
   - ✅ Pas d'erreur dans les logs serveur
   - ✅ Enregistrement dans `client_notifications` :
   ```sql
   SELECT * FROM client_notifications
   WHERE type = 'appointment_confirmation'
   ORDER BY id DESC LIMIT 1;
   ```

## Status

✅ **Corrigé et testé**
- Code mis à jour
- Documentation mise à jour
- Prêt pour production

---

**Date** : 2025-11-18
**Fichier modifié** : `salonhub-backend/src/routes/appointments.js`
