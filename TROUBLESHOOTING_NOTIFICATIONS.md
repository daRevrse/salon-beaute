# Diagnostic des Notifications en Temps Réel

## Problèmes identifiés

1. **La cloche de notifications reste vide**
2. **Les notifications temps réel ne passent pas**

## Vérifications à faire

### 1. Vérifier que le serveur backend est bien démarré

```bash
cd salonhub-backend
npm start
```

Vous devez voir dans les logs :
```
⏰ Démarrage du scheduler...
✅ Scheduler démarré avec succès
🚀 SalonHub Backend démarré !
```

### 2. Vérifier la connexion WebSocket côté frontend

Ouvrez la console du navigateur (F12) et cherchez :
```
🟢 Connecté au serveur WebSocket
🔌 Socket xyz a rejoint le salon 123
```

Si vous ne voyez pas ces messages :
- Vérifiez que le backend tourne sur le bon port (5000 par défaut)
- Vérifiez que `REACT_APP_API_URL` est bien configuré dans le `.env` du frontend

### 3. Tester manuellement les WebSockets

Dans la console du navigateur, tapez :
```javascript
// Vérifier que le socket est connecté
window.socket = io('http://localhost:5000');
window.socket.on('connect', () => console.log('✅ Socket connecté'));
window.socket.on('new_appointment', (data) => console.log('🔔 Nouveau RDV:', data));
```

### 4. Tester la création d'un rendez-vous

1. Allez sur la page de booking public :
   ```
   http://localhost:3000/book/votre-slug
   ```

2. Créez un rendez-vous

3. Vérifiez dans les logs du backend :
   ```
   📡 Notification temps réel envoyée au salon X
   ```

4. Vérifiez dans la console frontend :
   ```
   🔔 Nouveau RDV reçu via WebSocket: {...}
   ```

### 5. Vérifier que la cloche charge les rendez-vous

Ouvrez la console et regardez les requêtes réseau (onglet Network) :
```
GET /api/appointments?date=2025-11-21
```

Si cette requête échoue, vérifiez :
- Que vous êtes bien connecté (token JWT valide)
- Que le middleware d'authentification fonctionne

## Solutions

### Problème: WebSocket ne se connecte pas

**Cause possible** : Le SocketProvider ne reçoit pas `user` ou `tenant_id`

**Solution** :
1. Vérifiez que l'utilisateur est bien connecté dans AuthContext
2. Vérifiez que `user.tenant_id` est bien défini

Ajoutez ce code dans [SocketContext.js](salonhub-frontend/src/contexts/SocketContext.js:13-30) :

```javascript
useEffect(() => {
  console.log("🔍 Debug Socket - user:", user);
  console.log("🔍 Debug Socket - isAuthenticated:", isAuthenticated);

  if (isAuthenticated && user && user.tenant_id) {
    // ... reste du code
  }
}, [isAuthenticated, user]);
```

### Problème: La cloche est vide mais il y a des RDV

**Cause possible** : La requête `/api/appointments?date=` ne retourne pas les bons résultats

**Solution** :
1. Testez la requête manuellement avec curl :

```bash
curl -H "Authorization: Bearer VOTRE_TOKEN" \
  "http://localhost:5000/api/appointments?date=2025-11-21"
```

2. Vérifiez le format de la date dans [NotificationBell.js](salonhub-frontend/src/components/common/NotificationBell.js:46-48) :

```javascript
const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
console.log("📅 Fetching appointments for date:", today);
```

### Problème: Les notifications en temps réel ne s'affichent pas

**Cause possible** : Le socket n'écoute pas l'événement `new_appointment`

**Solution** :

1. Vérifiez que le composant importe bien useSocket :
```javascript
import { useSocket } from "../../contexts/SocketContext";
```

2. Vérifiez que l'événement est bien écouté :
```javascript
useEffect(() => {
  if (!socket) {
    console.warn("⚠️  Socket non disponible");
    return;
  }

  const handleNewAppointment = (data) => {
    console.log("🔔 Nouveau RDV reçu:", data);
    fetchNotifications();
  };

  socket.on("new_appointment", handleNewAppointment);

  return () => {
    socket.off("new_appointment", handleNewAppointment);
  };
}, [socket]);
```

### Problème: L'événement est émis côté serveur mais pas reçu côté client

**Cause possible** : Le salon n'a pas rejoint la bonne "room"

**Solution** :

1. Vérifiez dans les logs backend que le socket rejoint bien la room :
```
🔌 Socket xyz a rejoint le salon 123
```

2. Vérifiez que l'émission utilise bien la room :
```javascript
req.io.to(`tenant_${tenantId}`).emit("new_appointment", {...});
```

3. Testez manuellement dans la console backend (Node REPL) :
```javascript
const io = require('./src/server').io; // Si exporté
io.to('tenant_1').emit('test', { message: 'Hello' });
```

## Tests Complets

### Test 1 : Vérification Backend

```bash
# Dans le terminal backend
cd salonhub-backend
npm start
```

Logs attendus :
```
✓ Service email initialisé avec succès
⏰ Démarrage du scheduler...
✅ Scheduler démarré avec succès
🚀 SalonHub Backend démarré !
```

### Test 2 : Vérification Frontend

```bash
# Dans le terminal frontend
cd salonhub-frontend
npm start
```

Ouvrez F12 → Console, logs attendus :
```
🟢 Connecté au serveur WebSocket
🔌 Socket abc123 a rejoint le salon 1
```

### Test 3 : Test End-to-End

1. **Créer un RDV depuis le booking public** :
   - URL : `http://localhost:3000/book/votre-slug`
   - Remplir le formulaire
   - Soumettre

2. **Vérifier logs backend** :
   ```
   POST /api/public/appointments
   ✅ Nouvel abonnement push créé (optionnel)
   ✉️ Accusé de réception envoyé à email@client.com
   📡 Notification temps réel envoyée au salon 1
   ```

3. **Vérifier console frontend** :
   ```
   🔔 Nouveau RDV reçu via WebSocket: {appointment: {...}}
   📅 Fetching appointments for date: 2025-11-21
   ```

4. **Vérifier la cloche** :
   - Le badge rouge doit afficher "1"
   - Cliquer sur la cloche → Le RDV doit apparaître

## Logs de Débogage Recommandés

Ajoutez temporairement ces logs pour diagnostiquer :

### Dans SocketContext.js

```javascript
useEffect(() => {
  console.log("=== SOCKET DEBUG ===");
  console.log("isAuthenticated:", isAuthenticated);
  console.log("user:", user);
  console.log("tenant_id:", user?.tenant_id);

  if (isAuthenticated && user && user.tenant_id) {
    const newSocket = io(process.env.REACT_APP_API_URL || "http://localhost:5000");

    newSocket.on("connect", () => {
      console.log("🟢 Socket connecté - ID:", newSocket.id);
      newSocket.emit("join_tenant", user.tenant_id);
      console.log("📤 Demande de rejoindre tenant:", user.tenant_id);
    });

    setSocket(newSocket);

    return () => {
      console.log("🔴 Déconnexion socket");
      newSocket.close();
    };
  }
}, [isAuthenticated, user]);
```

### Dans NotificationBell.js

```javascript
const fetchNotifications = async () => {
  try {
    const today = new Date().toISOString().split("T")[0];
    console.log("📅 Fetching appointments for:", today);

    const response = await api.get(`/appointments?date=${today}`);
    console.log("📊 Response:", response.data);

    if (response.data.success) {
      const todayAppointments = response.data.data || [];
      console.log("📋 Today's appointments:", todayAppointments.length);

      const upcoming = todayAppointments.filter(
        (apt) =>
          (apt.status === "pending" || apt.status === "confirmed") &&
          new Date(`${apt.appointment_date} ${apt.start_time}`) > new Date()
      );

      console.log("⏰ Upcoming appointments:", upcoming.length);
      setNotifications(upcoming);
      setUnreadCount(upcoming.length);
    }
  } catch (err) {
    console.error("❌ Erreur chargement notifications:", err);
  }
};
```

### Dans le backend (server.js)

```javascript
io.on("connection", (socket) => {
  console.log(`⚡ Client connecté: ${socket.id}`);

  socket.on("join_tenant", (tenantId) => {
    if (tenantId) {
      socket.join(`tenant_${tenantId}`);
      console.log(`🔌 Socket ${socket.id} a rejoint le salon ${tenantId}`);

      // Confirmer au client
      socket.emit("joined", { tenantId, socketId: socket.id });
    } else {
      console.warn(`⚠️  Socket ${socket.id} a essayé de rejoindre sans tenantId`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client déconnecté: ${socket.id}`);
  });
});
```

## Checklist Rapide

- [ ] Backend démarré et logs OK
- [ ] Frontend démarré
- [ ] Console : "🟢 Connecté au serveur WebSocket"
- [ ] Console : "🔌 Socket xyz a rejoint le salon N"
- [ ] Créer un RDV de test
- [ ] Backend : "📡 Notification temps réel envoyée"
- [ ] Frontend : "🔔 Nouveau RDV reçu via WebSocket"
- [ ] Cloche : Badge rouge affiché
- [ ] Cloche : RDV visible dans la liste

## Besoin d'aide ?

Si après toutes ces vérifications le problème persiste :

1. Copiez tous les logs (backend + frontend)
2. Faites une capture d'écran de la console Network (F12 → Network)
3. Vérifiez la version de Socket.io (doit être identique backend/frontend)

---

**Dernière mise à jour** : 2025-11-21
