# 👥 Récapitulatif : Permissions des Employés - SalonHub

## 🎯 Clarification importante

Un **employé (staff)** doit avoir des permissions suffisantes pour faire son travail au quotidien. Voici ce qu'il peut et ne peut pas faire.

---

## ✅ Ce qu'un employé PEUT faire

### 📅 Rendez-vous
- ✅ **Voir ses propres rendez-vous** (ceux où il est assigné)
- ✅ **Créer des rendez-vous** pour ses clients
- ✅ **Modifier ses rendez-vous** (changer l'heure, le service, etc.)
- ✅ **Annuler ses rendez-vous** (avec raison)
- ❌ **Voir les RDV des autres employés** (sauf owner/admin)
- ❌ **Modifier/annuler les RDV d'autres employés** (sauf owner/admin)

### 👤 Clients
- ✅ **Voir la liste de tous les clients** du salon
- ✅ **Ajouter un nouveau client**
- ❌ **Modifier les informations d'un client**
- ❌ **Supprimer un client**
- ❌ **Voir les statistiques détaillées** (dépenses, historique complet)

### 💇 Services
- ✅ **Voir la liste des services** (lecture seule)
- ❌ **Ajouter un service**
- ❌ **Modifier un service**
- ❌ **Supprimer un service**

### 👥 Équipe
- ✅ **Voir la liste des employés**
- ❌ **Ajouter un employé**
- ❌ **Modifier un employé**
- ❌ **Supprimer un employé**

### ⚙️ Autres
- ✅ **Modifier son propre profil** (nom, photo, téléphone)
- ✅ **Changer son mot de passe**
- ✅ **Supprimer son propre compte** (quitter le salon)
- ❌ **Accéder aux paramètres du salon**
- ❌ **Voir la facturation**
- ❌ **Envoyer des notifications marketing**

---

## 🔍 Logique de filtrage des rendez-vous

### Backend - Route API

**Endpoint pour les employés** : `GET /api/appointments/staff/:staff_id`

```javascript
// Dans src/routes/appointments.js

// Route pour récupérer les RDV d'un employé spécifique
router.get("/staff/:staff_id", authMiddleware, tenantMiddleware, async (req, res) => {
  try {
    const { staff_id } = req.params;

    // Vérifier que l'utilisateur ne peut voir que ses propres RDV (sauf admin/owner)
    if (req.user.role === 'staff' && parseInt(staff_id) !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Vous ne pouvez voir que vos propres rendez-vous"
      });
    }

    const appointments = await query(
      `SELECT
        a.*,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.phone as client_phone,
        s.name as service_name,
        s.duration as service_duration,
        s.price as service_price
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      JOIN services s ON a.service_id = s.id
      WHERE a.tenant_id = ? AND a.staff_id = ?
      ORDER BY a.appointment_date DESC, a.start_time DESC`,
      [req.tenantId, staff_id]
    );

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error("Erreur récupération RDV employé:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur"
    });
  }
});
```

### Frontend - Logique de chargement

```javascript
// Dans AppointmentsPage.js

import { usePermissions } from '../contexts/PermissionContext';
import { useAuth } from '../contexts/AuthContext';

function AppointmentsPage() {
  const { can } = usePermissions();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);

  const loadAppointments = async () => {
    try {
      let endpoint;

      if (can.viewAllAppointments) {
        // Owner/Admin : tous les RDV du salon
        endpoint = '/api/appointments';
      } else {
        // Staff : seulement ses RDV
        endpoint = `/api/appointments/staff/${user.id}`;
      }

      const response = await api.get(endpoint);
      setAppointments(response.data);
    } catch (error) {
      console.error('Erreur chargement RDV:', error);
    }
  };

  return (
    <div>
      <h1>
        {can.viewAllAppointments ? 'Tous les rendez-vous' : 'Mes rendez-vous'}
      </h1>

      {/* Filtre par employé (seulement pour owner/admin) */}
      {can.viewAllAppointments && (
        <StaffFilter onChange={filterByStaff} />
      )}

      {/* Liste des RDV */}
      <AppointmentList appointments={appointments} />
    </div>
  );
}
```

---

## 📱 Interface utilisateur par rôle

### Dashboard - Owner/Admin

```
┌─────────────────────────────────────┐
│ 📊 Dashboard SalonHub               │
├─────────────────────────────────────┤
│                                     │
│ 💰 Revenus du mois      2 450 €    │
│ 👥 Nouveaux clients     12          │
│ 📅 Rendez-vous          87          │
│ 📈 Taux remplissage     78%         │
│                                     │
├─────────────────────────────────────┤
│ 📅 Calendrier (tous les employés)  │
│                                     │
│  Lundi 18/11                        │
│  09:00 - Marie - Coupe (Sophie)     │
│  10:30 - Jean - Couleur (Julie)     │
│  14:00 - Laura - Brushing (Sophie)  │
│  ...                                │
│                                     │
│  [Filtrer par employé: Tous ▼]     │
└─────────────────────────────────────┘
```

### Dashboard - Staff

```
┌─────────────────────────────────────┐
│ 📊 Mon planning - SalonHub          │
├─────────────────────────────────────┤
│                                     │
│ 📅 Mes RDV aujourd'hui  5           │
│ 📅 Mes RDV cette semaine 23         │
│                                     │
├─────────────────────────────────────┤
│ 📅 Mon calendrier                   │
│                                     │
│  Lundi 18/11                        │
│  09:00 - Marie Dupont - Coupe       │
│  14:00 - Laura Martin - Brushing    │
│  16:00 - Sophie Durand - Couleur    │
│  ...                                │
│                                     │
│  [Uniquement mes rendez-vous]       │
└─────────────────────────────────────┘
```

---

## 🔐 Contrôles de sécurité Backend

### 1. Vérification au niveau de la route

```javascript
// Middleware de vérification des permissions
const requireRole = (roles) => {
  return (req, res, next) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Permission refusée"
      });
    }

    next();
  };
};

// Exemple d'utilisation
router.post("/services", authMiddleware, tenantMiddleware, requireRole(['owner', 'admin']), async (req, res) => {
  // Seuls owner et admin peuvent créer des services
});
```

### 2. Vérification au niveau des données

```javascript
// Route de modification de RDV
router.put("/appointments/:id", authMiddleware, tenantMiddleware, async (req, res) => {
  const { id } = req.params;

  // Récupérer le RDV
  const [appointment] = await query(
    "SELECT * FROM appointments WHERE id = ? AND tenant_id = ?",
    [id, req.tenantId]
  );

  if (!appointment) {
    return res.status(404).json({ error: "Rendez-vous introuvable" });
  }

  // Vérifier les permissions
  if (req.user.role === 'staff' && appointment.staff_id !== req.user.id) {
    return res.status(403).json({
      error: "Vous ne pouvez modifier que vos propres rendez-vous"
    });
  }

  // Continuer avec la modification...
});
```

---

## 📊 Tableau récapitulatif final

| Action | Owner | Admin | Staff | Note |
|--------|-------|-------|-------|------|
| **Voir tous les RDV** | ✅ | ✅ | ❌ | Staff = seulement les siens |
| **Voir ses RDV** | ✅ | ✅ | ✅ | Essentiel pour travailler |
| **Créer un RDV** | ✅ | ✅ | ✅ | Pour tous ses clients |
| **Modifier ses RDV** | ✅ | ✅ | ✅ | Seulement les siens |
| **Modifier RDV d'autres** | ✅ | ✅ | ❌ | Owner/Admin seulement |
| **Voir tous les clients** | ✅ | ✅ | ✅ | Pour prendre RDV |
| **Modifier clients** | ✅ | ✅ | ❌ | Protection des données |
| **Gérer services** | ✅ | ✅ | ❌ | Voir seulement |
| **Gérer équipe** | ✅ | ✅ | ❌ | Voir seulement |
| **Paramètres salon** | ✅ | ✅ Limité | ❌ | Configuration |
| **Facturation** | ✅ | ❌ | ❌ | Owner uniquement |

---

## 🚀 Prochaines étapes d'implémentation

### Backend

1. **Créer la route pour les RDV d'un employé** :
   - `GET /api/appointments/staff/:staff_id`
   - Vérifier que staff ne peut voir que ses RDV

2. **Ajouter les vérifications de permissions** :
   - Middleware `requireRole(['owner', 'admin'])`
   - Vérifications dans les routes de modification

3. **Protéger les routes sensibles** :
   - Services : owner/admin seulement
   - Équipe : owner/admin seulement
   - Facturation : owner seulement

### Frontend

1. **Implémenter le PermissionContext** :
   - Créer le context avec les permissions
   - Wrapper l'app avec le provider

2. **Créer les composants de contrôle** :
   - `PermissionGate`
   - `RoleGate`
   - Hook `useAccessControl`

3. **Adapter les pages** :
   - Dashboard selon le rôle
   - Rendez-vous avec filtre conditionnel
   - Cacher les boutons non autorisés

4. **Tester avec tous les rôles** :
   - Compte owner
   - Compte admin
   - Compte staff

---

## ✅ Points clés à retenir

1. **Staff DOIT voir ses rendez-vous** - C'est essentiel pour travailler
2. **Filtrage automatique** - Backend filtre par `staff_id` pour les staff
3. **Sécurité multicouche** - Vérifications frontend ET backend
4. **UX adaptée** - Interface différente selon le rôle
5. **Protection des données** - Staff ne peut pas modifier les infos sensibles

---

**FlowKraft Agency - SalonHub**
Documentation mise à jour : 2025-11-18
