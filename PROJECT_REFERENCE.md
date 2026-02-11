# SalonHub - Référence Complète du Projet

> **Dernière mise à jour**: 2026-02-09
> **Branche active**: v2
> **Ce fichier doit être lu en premier avant toute intervention sur le projet.**

---

## 1. VUE D'ENSEMBLE

**SalonHub** est une plateforme SaaS multi-tenant de gestion d'entreprises de services (salons de beauté, restaurants, centres de formation, cabinets médicaux). Elle se compose de 4 sous-projets :

| Sous-projet | Stack | Rôle |
|---|---|---|
| `salonhub-backend` | Express.js + MySQL + Socket.io | API REST + temps réel |
| `salonhub-frontend` | React 18 + Tailwind | Dashboard admin (web) |
| `salonhub-mobile` | React Native (Expo 54) | App mobile de gestion |
| `landing-page` | HTML/CSS/JS | Page marketing |

**Types de business supportés** : `beauty`, `restaurant`, `training`, `medical`

---

## 2. ARCHITECTURE TECHNIQUE

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  Mobile   │  │  Frontend    │  │  Public Booking Pages  │ │
│  │  Expo 54  │  │  React 18   │  │  (non authentifié)     │ │
│  └─────┬─────┘  └──────┬──────┘  └───────────┬────────────┘ │
└────────┼───────────────┼─────────────────────┼──────────────┘
         │               │                     │
         ▼               ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express.js)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐ │
│  │   Auth   │  │  Routes  │  │ Socket.io│  │  Middleware  │ │
│  │   JWT    │  │  REST    │  │ Realtime │  │  Tenant/Auth │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬──────┘ │
└───────┼──────────────┼─────────────┼───────────────┼────────┘
        │              │             │               │
        ▼              ▼             ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                      MySQL (multi-tenant)                     │
│  tenants | users | clients | services | appointments | ...   │
└─────────────────────────────────────────────────────────────┘
        │
        ├── Stripe (Paiements)
        ├── Nodemailer (Emails SMTP)
        ├── Web Push (Notifications)
        └── WhatsApp (Twilio/Meta)
```

---

## 3. BACKEND (`salonhub-backend`)

### 3.1 Structure des fichiers

```
salonhub-backend/
├── src/
│   ├── server.js                    # Point d'entrée Express + Socket.io
│   ├── config/
│   │   ├── database.js              # Pool MySQL + helper query()
│   │   └── stripe.js                # Config Stripe
│   ├── middleware/
│   │   ├── auth.js                  # JWT validation + generateToken()
│   │   ├── tenant.js                # Isolation multi-tenant + vérif abonnement
│   │   ├── businessType.js          # Détection type business + restrictions
│   │   └── superadmin.js            # Auth SuperAdmin + permissions
│   ├── routes/
│   │   ├── auth.js                  # Register, Login, Staff CRUD
│   │   ├── public.js                # Booking public (sans auth)
│   │   ├── appointments.js          # CRUD RDV + détection conflits
│   │   ├── clients.js               # CRUD clients
│   │   ├── services.js              # CRUD services + catégories
│   │   ├── settings.js              # Paramètres salon + horaires
│   │   ├── promotions.js            # Codes promo
│   │   ├── notifications.js         # Email/SMS/WhatsApp
│   │   ├── uploads.js               # Upload fichiers (Multer)
│   │   ├── password-reset.js        # Réinitialisation mot de passe
│   │   ├── stripe.js                # Checkout + webhooks
│   │   ├── billing.js               # Facturation + métriques
│   │   ├── admin.js                 # SuperAdmin
│   │   ├── restaurant/              # Routes restaurant
│   │   ├── training/                # Routes formation
│   │   └── medical/                 # Routes médical
│   └── services/
│       ├── emailService.js          # SMTP via Nodemailer
│       ├── pushService.js           # Web Push VAPID
│       ├── whatsappService.js       # WhatsApp (Twilio/Meta)
│       ├── reminderService.js       # Rappels automatiques
│       ├── currencyService.js       # Conversion devises
│       └── scheduler.js             # Cron jobs (node-cron)
├── database/
│   ├── dev.sql                      # Schéma complet (~2627 lignes)
│   ├── prod.sql                     # Schéma production
│   └── migrations/                  # Migrations incrémentales
└── package.json
```

### 3.2 Endpoints API complets

#### Auth (`/api/auth`)
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/auth/register` | Non | Créer salon + propriétaire |
| POST | `/api/auth/login` | Non | Connexion |
| GET | `/api/auth/me` | Oui | Utilisateur courant |
| PUT | `/api/auth/me` | Oui | Modifier profil |
| PUT | `/api/auth/change-password` | Oui | Changer mot de passe |
| GET | `/api/auth/staff` | Oui | Liste staff |
| POST | `/api/auth/staff` | Oui | Créer staff |
| PUT | `/api/auth/staff/:id` | Oui | Modifier staff |
| DELETE | `/api/auth/staff/:id` | Oui | Supprimer staff |

#### Password Reset (`/api/password`)
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/password/forgot` | Non | Demande reset (tenant_slug + email) |
| POST | `/api/password/verify-token` | Non | Vérifier token |
| POST | `/api/password/reset` | Non | Réinitialiser |

#### Appointments (`/api/appointments`)
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/appointments` | Oui | Liste RDV |
| GET | `/api/appointments/today` | Oui | RDV du jour |
| GET | `/api/appointments/:id` | Oui | Détail RDV |
| GET | `/api/appointments/availability/slots` | Oui | Créneaux dispo |
| POST | `/api/appointments` | Oui | Créer RDV |
| PUT | `/api/appointments/:id` | Oui | Modifier RDV |
| PATCH | `/api/appointments/:id/status` | Oui | Changer statut |
| DELETE | `/api/appointments/:id` | Oui | Supprimer RDV |

#### Clients (`/api/clients`)
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/clients` | Oui | Liste clients |
| GET | `/api/clients/:id` | Oui | Détail client |
| GET | `/api/clients/:id/appointments` | Oui | Historique client |
| POST | `/api/clients` | Oui | Créer client |
| PUT | `/api/clients/:id` | Oui | Modifier client |
| DELETE | `/api/clients/:id` | Oui | Supprimer client |

#### Services (`/api/services`)
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/services` | Oui | Liste services |
| GET | `/api/services/:id` | Oui | Détail service |
| GET | `/api/services/meta/categories` | Oui | Catégories |
| POST | `/api/services` | Oui | Créer service |
| PUT | `/api/services/:id` | Oui | Modifier service |
| PATCH | `/api/services/:id/toggle` | Oui | Activer/désactiver |
| DELETE | `/api/services/:id` | Oui | Supprimer service |

#### Settings (`/api/settings`)
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/settings` | Oui | Tous les paramètres |
| GET | `/api/settings/salon` | Oui | Info salon |
| PUT | `/api/settings` | Oui | Modifier paramètres |
| GET | `/api/settings/subscription` | Oui | Info abonnement |
| PUT | `/api/settings/business-hours` | Oui | Modifier horaires |

#### Public Booking (`/api/public`)
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/public/tenant/:slug` | Non | Info salon |
| GET | `/api/public/services/:slug` | Non | Services du salon |
| GET | `/api/public/salon/:slug` | Non | Détails salon |
| GET | `/api/public/availability/:slug` | Non | Disponibilités |
| POST | `/api/public/appointments` | Non | Réserver RDV |
| GET | `/api/public/validate-promo` | Non | Valider code promo |

#### Stripe (`/api/stripe`)
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/stripe/plans` | Non | Plans disponibles |
| POST | `/api/stripe/create-checkout-session` | Oui | Créer session paiement |
| POST | `/api/stripe/portal` | Oui | Portail client |
| POST | `/api/stripe/webhook` | Non* | Webhook Stripe |
| GET | `/api/stripe/subscription` | Oui | Info abonnement |
| POST | `/api/stripe/cancel` | Oui | Annuler abonnement |
| POST | `/api/stripe/reactivate` | Oui | Réactiver |

#### Promotions (`/api/promotions`)
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET/POST | `/api/promotions` | Oui | Liste / Créer |
| GET/PUT/DELETE | `/api/promotions/:id` | Oui | CRUD unitaire |
| GET | `/api/promotions/:code/validate` | Oui | Valider code |

#### Uploads (`/api/uploads`)
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/uploads/:target` | Oui | Upload fichier (max 5MB, JPEG/PNG/GIF/WebP) |
| DELETE | `/api/uploads` | Oui | Supprimer fichier |

#### Notifications (`/api/notifications`)
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/notifications/send` | Oui | Envoyer notification |
| GET | `/api/notifications` | Oui | Liste notifications |
| GET/POST | `/api/notifications/reminders` | Oui | Rappels |

#### SuperAdmin (`/api/admin`)
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/admin/auth/login` | Non | Login SuperAdmin |
| GET | `/api/admin/tenants` | SA | Liste tenants |
| GET/PUT | `/api/admin/tenants/:id` | SA | Détail/Modifier tenant |
| POST | `/api/admin/impersonate` | SA | Impersonation |
| GET | `/api/admin/billing/overview` | SA | Vue facturation |
| GET | `/api/admin/analytics` | SA | Analytiques |
| GET | `/api/admin/system` | SA | Santé système |

#### Routes sectorielles
- Restaurant : `/api/restaurant/menus`, `/orders`, `/reservations`, `/tables`
- Formation : `/api/training/courses`, `/sessions`, `/enrollments`, `/certificates`
- Médical : `/api/medical/patients`, `/records`, `/prescriptions`

### 3.3 Base de données - Tables principales

**Core :**
- `tenants` (id, name, slug, email, phone, address, city, postal_code, logo_url, banner_url, business_type, subscription_status, trial_ends_at, subscription_plan, stripe_customer_id, stripe_subscription_id, mrr, is_active)
- `users` (id, tenant_id, first_name, last_name, email, password_hash, role [owner/admin/staff], is_active)
- `clients` (id, tenant_id, first_name, last_name, email, phone, preferred_contact_method, date_of_birth, gender, notes, total_appointments, total_spent, last_visit_date)
- `services` (id, tenant_id, name, description, duration, slot_duration, price, category, is_active, image_url, gallery, booking_count)
- `appointments` (id, tenant_id, client_id, service_id, staff_id, appointment_date, start_time, end_time, status [pending/confirmed/completed/cancelled], booking_source, notes, payment_status, amount_paid)

**Abonnements/Facturation :**
- `billing_transactions` (id, tenant_id, amount, currency, status, stripe_payment_id, invoice_number)
- `promotions` (id, tenant_id, code, discount_type, discount_value, valid_from, valid_until, usage_limit, times_used, is_active)

**Admin :**
- `super_admins` (id, email, password_hash, is_super, permissions)
- `admin_activity_logs` (id, super_admin_id, action, resource_type, description, ip_address)

**Restaurant :** `restaurant_tables`, `restaurant_reservations`, `restaurant_menus`, `restaurant_orders`
**Formation :** `training_courses`, `training_sessions`, `training_enrollments`, `training_certificates`, `training_attendance`
**Médical :** `medical_patients`, `medical_records`, `medical_prescriptions`, `medical_lab_results`, `medical_allergies`

### 3.4 Middleware Chain

```
Request → CORS → JSON Parser → Auth Middleware → Tenant Middleware → Business Type → Route Handler
```

- **auth.js** : Valide JWT (`Authorization: Bearer TOKEN`), extrait `{id, tenant_id, email, role}`
- **tenant.js** : Injecte `req.tenantId`, vérifie abonnement actif
- **businessType.js** : Injecte type business, restreint routes sectorielles
- **superadmin.js** : Auth séparée pour SuperAdmin avec tokens `type: "superadmin"`

### 3.5 Socket.io (Temps réel)

```javascript
// Connexion client → rejoint room du tenant
socket.on("join_tenant", (tenantId) => socket.join(`tenant_${tenantId}`));

// Events émis :
// - "new_appointment" / "appointment_updated" / "appointment_created"
// - Broadcast vers room : req.io.to(`tenant_${tenantId}`).emit(event, data)
```

### 3.6 Services externes

| Service | Technologie | Usage |
|---------|-------------|-------|
| Email | Nodemailer (SMTP flowkraftagency.com) | Confirmations, rappels, reset |
| Paiement | Stripe (live keys) | Abonnements, checkout |
| Push | web-push (VAPID) | Notifications navigateur |
| WhatsApp | Twilio/Meta (désactivé) | Messages clients |
| Cron | node-cron | Rappels quotidiens, nettoyage |

### 3.7 Plans d'abonnement

| Plan | Prix | Stripe Price ID |
|------|------|-----------------|
| Essential | 9,99€/mois | `price_1SgDhd05Xn1CE243TBS1E8Nl` |
| Professional | 29,99€/mois | `price_1SgDiR05Xn1CE243l4c5w89U` |
| Enterprise | 69,99€/mois | `price_1SgDje05Xn1CE243Cz5uJBrB` |

Essai gratuit : 14 jours à l'inscription.

---

## 4. FRONTEND (`salonhub-frontend`)

### 4.1 Structure des fichiers

```
salonhub-frontend/
├── src/
│   ├── App.js                       # Router principal + providers
│   ├── index.js                     # Entry point + PWA registration
│   ├── services/
│   │   ├── api.js                   # Axios + intercepteurs JWT
│   │   └── pwaService.js            # Service Worker
│   ├── contexts/
│   │   ├── AuthContext.js           # Auth (user, tenant, token)
│   │   ├── PermissionContext.js     # Permissions par rôle
│   │   ├── CurrencyContext.js       # Multi-devises (EUR, USD, MAD, XOF...)
│   │   ├── SocketContext.js         # WebSocket temps réel
│   │   └── PublicThemeContext.js     # Thème dynamique pages publiques
│   ├── hooks/
│   │   ├── useAppointments.js       # CRUD RDV
│   │   ├── useClients.js            # CRUD clients
│   │   ├── useServices.js           # CRUD services
│   │   ├── usePublicBooking.js      # Flow réservation publique
│   │   ├── useToast.js              # Notifications toast
│   │   └── usePushNotifications.js  # Push notifications
│   ├── components/
│   │   ├── auth/ (Login, Register)
│   │   ├── common/ (DashboardLayout, ProtectedRoute, Navbar, NotificationBell, PermissionGate, Toast, ConfirmModal, ImageUploader, GalleryUploader, GalleryLightbox, PromoCodeInput)
│   │   ├── appointments/ (AppointmentCalendar, AppointmentDetails)
│   │   └── clients/ (ClientHistory)
│   ├── pages/
│   │   ├── Dashboard.js             # Tableau de bord multi-secteur
│   │   ├── Appointments.js          # Gestion RDV (calendrier + liste)
│   │   ├── Clients.js               # Gestion clients
│   │   ├── Services.js              # Gestion services
│   │   ├── Promotions.js            # Codes promo
│   │   ├── Billing.js               # Facturation
│   │   ├── Settings.js              # Paramètres
│   │   ├── Profile.js               # Profil utilisateur
│   │   ├── ForgotPassword.js        # Mot de passe oublié
│   │   ├── ResetPassword.js         # Reset via lien
│   │   ├── public/                  # PAGES PUBLIQUES
│   │   │   ├── PublicRouter.js      # Router dynamique par business_type
│   │   │   ├── BookingLanding.js    # Sélection service
│   │   │   ├── BookingDateTime.js   # Choix date/heure
│   │   │   ├── BookingClientInfo.js # Infos client + code promo
│   │   │   ├── BookingConfirmation.js
│   │   │   ├── restaurant/          # Landing, Reservation, Order, QRCode
│   │   │   ├── training/            # TrainingLanding
│   │   │   └── medical/             # MedicalLanding
│   │   ├── restaurant/              # Admin: Tables, Menus, Orders, Kitchen
│   │   ├── training/                # Admin: Courses, Sessions, Enrollments, Certificates
│   │   ├── medical/                 # Admin: Patients, Records, Prescriptions
│   │   └── admin/                   # SuperAdmin: Dashboard, Tenants, Users, Logs, Billing, Analytics
│   └── utils/
│       ├── businessTypeConfig.js    # Config multi-secteur (terminologie, couleurs, icônes)
│       └── imageUtils.js            # Construction URLs images + fallbacks
├── public/                          # Assets statiques, manifest PWA
└── package.json
```

### 4.2 Routes frontend

**Auth (publiques) :**
- `/login`, `/register`, `/forgot-password`, `/reset-password`
- `/:tenant/login`, `/:tenant/register`

**Booking public (sans auth) :**
- `/book/:slug` → PublicRouter (adaptatif par business_type)
- `/book/:slug/datetime` → Sélection date/heure
- `/book/:slug/info` → Infos client
- `/book/:slug/confirmation` → Confirmation
- `/r/:slug` → Restaurant | `/t/:slug` → Formation | `/m/:slug` → Médical

**Admin (protégées) :**
- `/dashboard`, `/appointments`, `/clients`, `/services`
- `/promotions`, `/billing`, `/settings`, `/profile`
- `/restaurant/*`, `/training/*`, `/medical/*`

**SuperAdmin :**
- `/superadmin/login`, `/superadmin/dashboard`, `/superadmin/tenants/:id`
- `/superadmin/admins`, `/superadmin/users`, `/superadmin/logs`
- `/superadmin/billing`, `/superadmin/analytics`

### 4.3 Contexts & State

| Context | State | Méthodes |
|---------|-------|----------|
| AuthContext | user, tenant, loading | register, login, logout, updateProfile, changePassword, refreshTenant, refreshSubscription |
| PermissionContext | permissions par rôle | Flags granulaires (view/create/edit/delete par entité) |
| CurrencyContext | currency | formatPrice, getCurrencySymbol, changeCurrency (EUR, USD, GBP, CAD, CHF, MAD, XOF, XAF, TND, DZD) |
| SocketContext | socket | Connexion temps réel par tenant |
| PublicThemeContext | theme | primaryColor, secondaryColor, fontFamily, footerColors |

### 4.4 Stack technique

- React 18.2, React Router DOM 6.20
- Axios (HTTP), Socket.io-client (temps réel)
- React Big Calendar + Moment (calendrier RDV)
- Recharts (graphiques dashboard)
- Heroicons (icônes)
- Tailwind CSS (styling)
- PWA (service worker, manifest)

---

## 5. MOBILE (`salonhub-mobile`)

### 5.1 Structure des fichiers

```
salonhub-mobile/
├── App.js                           # Providers: SafeArea > Auth > Socket > Notification > Navigator
├── app.json                         # Config Expo 54, newArchEnabled
├── package.json
├── src/
│   ├── navigation/
│   │   └── AppNavigator.js          # Auth flow + Tab/Stack navigation
│   ├── contexts/
│   │   ├── AuthContext.js           # JWT + SecureStore
│   │   ├── SocketContext.js         # WebSocket (192.168.1.77:5000)
│   │   └── NotificationContext.js   # Expo push notifications
│   ├── services/
│   │   ├── api.js                   # Axios (192.168.1.97:5000/api)
│   │   ├── pushNotificationService.js # Expo notifications
│   │   ├── stripeService.js         # Paiements
│   │   └── imageUpload.js           # Upload images
│   ├── hooks/
│   │   └── useNotifications.js      # State notifications local (SecureStore, max 100)
│   ├── components/
│   │   ├── ActionButton.js          # Bouton configurable (primary/success/danger/outline)
│   │   ├── EmptyState.js            # État vide
│   │   ├── StatusBadge.js           # Badge statut RDV
│   │   ├── FilterButton.js          # Filtre avec compteur
│   │   ├── SearchBar.js             # Barre de recherche
│   │   └── AlertBanner.js           # Bannière info/warning
│   └── screens/                     # ~35 écrans
│       ├── LoginScreen.js
│       ├── OnboardingScreen.js      # Showcase + inscription multi-phase
│       ├── ForgotPasswordScreen.js
│       ├── PasswordResetSuccessScreen.js
│       ├── DashboardScreen.js       # Stats, RDV du jour, services populaires
│       ├── AppointmentsScreen.js    # Liste/calendrier, filtres par statut
│       ├── AppointmentFormScreen.js
│       ├── AppointmentDetailScreen.js
│       ├── ClientsScreen.js         # Cards expansibles, contact (Call/WhatsApp/Email)
│       ├── ClientFormScreen.js
│       ├── ClientHistoryScreen.js
│       ├── ServicesScreen.js        # Grille 2 colonnes avec images
│       ├── ServiceFormScreen.js
│       ├── SettingsScreen.js        # Menu paramètres
│       ├── ProfileScreen.js
│       ├── BusinessSettingsScreen.js
│       ├── BusinessHoursScreen.js
│       ├── BillingScreen.js
│       ├── StaffScreen.js
│       ├── StaffFormScreen.js
│       ├── PromotionsScreen.js
│       ├── PromotionFormScreen.js
│       ├── NotificationsScreen.js   # Préférences
│       └── NotificationListScreen.js # Historique
```

### 5.2 Navigation

```
AppNavigator
├── NON AUTHENTIFIÉ
│   ├── OnboardingScreen (si !onboardingSeen)
│   ├── LoginScreen
│   ├── ForgotPasswordScreen
│   └── PasswordResetSuccessScreen
│
└── AUTHENTIFIÉ
    ├── TabNavigator (headerShown: false)
    │   ├── Dashboard (home)
    │   ├── Appointments (calendar)
    │   ├── Clients (people)
    │   ├── Services (cut)
    │   └── Settings (settings)
    │
    └── Modal Stack
        ├── AppointmentForm, AppointmentDetail
        ├── ClientForm, ClientHistory
        ├── ServiceForm
        ├── Profile, BusinessSettings, BusinessHours
        ├── Staff, StaffForm
        ├── Billing
        ├── Promotions, PromotionForm
        └── Notifications, NotificationList
```

### 5.3 Auth Flow mobile

1. App lance → vérifie SecureStore pour token existant
2. Si token → GET `/auth/me` → auto-login
3. Si pas de token → vérifie `onboardingSeen`
   - Non → OnboardingScreen (showcase 3 slides → infos salon → compte + plan)
   - Oui → LoginScreen
4. Après inscription → auto-login via `AuthContext.signIn()`
5. JWT stocké dans `expo-secure-store`
6. Intercepteur Axios injecte `Authorization: Bearer {token}`
7. 401 → déconnexion automatique

### 5.4 Stack technique mobile

- React Native 0.81.5, React 19.1.0
- Expo 54 (newArchEnabled)
- React Navigation 7 (native-stack + bottom-tabs)
- Axios, Socket.io-client
- expo-secure-store (persistance)
- expo-notifications (push)
- react-native-calendars (calendrier)
- @stripe/stripe-react-native (paiements)
- @expo/vector-icons (Ionicons)

---

## 6. DESIGN SYSTEM

### 6.1 Couleurs (unifiées mobile + frontend)

| Rôle | Couleur | Hex |
|------|---------|-----|
| **Primary** | Indigo | `#6366F1` |
| Success | Vert | `#10B981` |
| Warning | Ambre | `#F59E0B` |
| Danger | Rouge | `#EF4444` |
| Info/Blue | Bleu | `#3B82F6` |
| Dark text | Gris foncé | `#1F2937` |
| Medium text | Gris | `#6B7280` |
| Light text | Gris clair | `#9CA3AF` |
| Background | Gris très clair | `#F9FAFB` |
| Dividers | Gris | `#E5E7EB` |
| Light BG | Gris | `#F3F4F6` |

> **INTERDIT** : `#8B5CF6` et `#4F46E5` (anciennement utilisés, remplacés par `#6366F1`)

### 6.2 Couleurs par type de business (frontend)

| Type | Couleur |
|------|---------|
| Beauty | `#6366F1` (Indigo) |
| Restaurant | `#F59E0B` (Ambre) |
| Training | `#10B981` (Émeraude) |
| Medical | `#06B6D4` (Cyan) |

### 6.3 Safe Area Pattern (mobile)

- **Tab screens** : Custom headers avec `paddingTop: 48-60`
- **Stack screens** : Custom headers avec `paddingTop: 48`
- **TabNavigator** : `headerShown: false` au niveau screenOptions

### 6.4 Icônes

- Mobile : **Ionicons** (@expo/vector-icons)
- Frontend : **Heroicons** (@heroicons/react)

---

## 7. AUTHENTIFICATION ACTUELLE

### 7.1 Inscription (`POST /api/auth/register`)

```json
{
  "salon_name": "Mon Salon",
  "salon_email": "salon@email.com",
  "first_name": "Jean",
  "last_name": "Dupont",
  "email": "jean@email.com",
  "password": "MonMotDePasse123",
  "business_type": "beauty"
}
```

→ Crée tenant (essai 14j) + user (role: owner) + retourne JWT

### 7.2 Connexion (`POST /api/auth/login`)

```json
{ "email": "jean@email.com", "password": "MonMotDePasse123" }
```

→ Vérifie bcrypt → retourne `{ token, user, tenant }`

### 7.3 JWT Token

- Payload : `{ id, tenant_id, email, role }`
- Expiration : 7 jours
- Stockage : `localStorage` (web) / `expo-secure-store` (mobile)
- Hash : bcrypt 10 rounds

### 7.4 Password Reset

1. `POST /api/password/forgot` (tenant_slug + email) → email avec lien
2. `GET /api/password/verify-token/:token` → validation
3. `POST /api/password/reset` (token + nouveau mot de passe)

---

## 8. FONCTIONNALITÉS TEMPS RÉEL

- **Socket.io** connecté après login
- **Room** : `tenant_{tenantId}` (isolation multi-tenant)
- **Events** : `new_appointment`, `appointment_updated`, `appointment_created`
- **Mobile** : reconnexion auto (10 tentatives, 2s interval)
- **Push** : Expo notifications (mobile) + Web Push VAPID (web)

---

## 9. MULTI-TENANCY

- Chaque table a une colonne `tenant_id`
- Chaque requête protégée filtre par `req.tenantId` (extrait du JWT)
- Les tenants ont un `slug` unique pour les URLs publiques
- Vérification abonnement sur les routes publiques
- Isolation totale des données entre tenants

---

## 10. VARIABLES D'ENVIRONNEMENT

```env
# Database
DB_HOST=localhost | DB_PORT=3306 | DB_USER=root | DB_NAME=salonhub_dev

# Server
NODE_ENV=development | PORT=5000
FRONTEND_URL=http://localhost:3000

# Auth
JWT_SECRET=<long_secret> | JWT_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=mail.flowkraftagency.com | SMTP_PORT=587
SMTP_USER=salonhub@flowkraftagency.com

# Stripe
STRIPE_SECRET_KEY=sk_live_... | STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ESSENTIAL=price_... | STRIPE_PRICE_PROFESSIONAL=price_... | STRIPE_PRICE_ENTERPRISE=price_...

# Push (VAPID)
VAPID_PUBLIC_KEY=... | VAPID_PRIVATE_KEY=...

# URLs API (mobile)
API_BASE: http://192.168.1.97:5000/api (mobile)
SOCKET_URL: http://192.168.1.77:5000 (mobile socket)
FRONTEND_URL: https://app.salonhub.flowkraftagency.com
```

---

## 11. DÉPLOIEMENT & URLS

| Service | URL |
|---------|-----|
| Frontend (prod) | `https://app.salonhub.flowkraftagency.com` |
| Backend (dev) | `http://localhost:5000` |
| Backend API | `http://localhost:5000/api` |
| Health check | `GET /health` → `{ status: "OK" }` |
| Mobile API | `http://192.168.1.97:5000/api` |
| Mobile Socket | `http://192.168.1.77:5000` |

---

## 12. CONVENTIONS & PATTERNS

### Code
- **Backend** : CommonJS (`require/module.exports`), async/await, SQL paramétré
- **Frontend** : ES Modules, hooks fonctionnels, Tailwind classes
- **Mobile** : ES Modules, StyleSheet.create, hooks fonctionnels

### Réponses API
```json
// Succès
{ "success": true, "data": {...} }

// Erreur
{ "success": false, "error": "Type", "message": "Détail" }
```

### Status HTTP
- 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized)
- 403 (Forbidden), 404 (Not Found), 409 (Conflict), 500 (Server Error)

---

## 13. DÉPENDANCES CLÉS

### Backend
```
express ^4.18.2 | mysql2 ^3.6.5 | jsonwebtoken ^9.0.2 | bcrypt ^5.1.1
socket.io ^4.8.1 | multer ^2.0.2 | nodemailer ^7.0.10 | stripe ^14.25.0
web-push ^3.6.7 | node-cron ^4.2.1 | cors ^2.8.5 | dotenv ^16.3.1
```

### Frontend
```
react ^18.2.0 | react-router-dom ^6.20.0 | axios ^1.6.2
socket.io-client ^4.8.1 | react-big-calendar ^1.19.4 | recharts ^3.4.1
moment ^2.30.1 | @heroicons/react ^2.2.0 | react-joyride ^2.9.3
```

### Mobile
```
react-native 0.81.5 | react 19.1.0 | expo ~54.0.30
@react-navigation/native 7.1.26 | axios 1.13.2 | socket.io-client 4.8.3
expo-secure-store 15.0.8 | expo-notifications ~0.32.16
@stripe/stripe-react-native 0.57.2 | react-native-calendars 1.1313.0
```

---

## 14. HISTORIQUE DES ÉVOLUTIONS

| Date | Branche | Description |
|------|---------|-------------|
| - | main | Version initiale |
| - | v2 | Multi-secteur (restaurant, training, medical), onboarding refondu, design system unifié, notifications push, socket.io, promotions |

---

*Ce fichier est la source de vérité du projet. Le consulter avant toute intervention.*
