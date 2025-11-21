/**
 * Service de notifications push (Web Push / VAPID)
 * Permet d'envoyer des notifications aux clients même si l'app est fermée
 */

const webPush = require("web-push");
const db = require("../config/database");

class PushService {
  constructor() {
    this.initialized = false;
    this.vapidDetails = null;
  }

  /**
   * Initialise le service Web Push avec les clés VAPID
   */
  initialize() {
    try {
      const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
      const vapidSubject = process.env.VAPID_SUBJECT || "mailto:support@salonhub.com";

      if (!vapidPublicKey || !vapidPrivateKey) {
        console.warn(
          "⚠️  Clés VAPID manquantes - Les notifications push ne seront pas disponibles"
        );
        console.log(
          "💡 Générez des clés VAPID avec: npx web-push generate-vapid-keys"
        );
        this.initialized = false;
        return false;
      }

      webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

      this.vapidDetails = {
        subject: vapidSubject,
        publicKey: vapidPublicKey,
        privateKey: vapidPrivateKey,
      };

      this.initialized = true;
      console.log("✓ Service de notifications push initialisé");
      return true;
    } catch (error) {
      console.error("❌ Erreur initialisation push service:", error.message);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Récupère la clé publique VAPID (pour le frontend)
   */
  getPublicKey() {
    if (!this.initialized) {
      this.initialize();
    }
    return this.vapidDetails?.publicKey || null;
  }

  /**
   * Enregistre un nouvel abonnement push
   */
  async saveSubscription({
    tenantId,
    clientId = null,
    userId = null,
    subscription,
    userAgent = null,
    ipAddress = null,
  }) {
    try {
      // Vérifier que l'abonnement a le bon format
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        throw new Error("Format d'abonnement invalide");
      }

      const { endpoint, keys } = subscription;
      const { p256dh, auth } = keys;

      if (!p256dh || !auth) {
        throw new Error("Clés de chiffrement manquantes");
      }

      // Vérifier si cet endpoint existe déjà
      const existing = await db.query(
        "SELECT id FROM push_subscriptions WHERE endpoint = ?",
        [endpoint]
      );

      if (existing.length > 0) {
        // Mettre à jour la date de dernière utilisation
        await db.query(
          "UPDATE push_subscriptions SET last_used_at = NOW() WHERE id = ?",
          [existing[0].id]
        );
        return { subscriptionId: existing[0].id, updated: true };
      }

      // Créer un nouvel abonnement
      const result = await db.query(
        `INSERT INTO push_subscriptions
         (tenant_id, client_id, user_id, endpoint, p256dh_key, auth_key, user_agent, ip_address, created_at, last_used_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [tenantId, clientId, userId, endpoint, p256dh, auth, userAgent, ipAddress]
      );

      console.log(
        `✅ Nouvel abonnement push enregistré (ID: ${result.insertId})`
      );
      return { subscriptionId: result.insertId, updated: false };
    } catch (error) {
      console.error("❌ Erreur enregistrement abonnement push:", error);
      throw error;
    }
  }

  /**
   * Supprime un abonnement push
   */
  async removeSubscription(endpoint) {
    try {
      await db.query("DELETE FROM push_subscriptions WHERE endpoint = ?", [
        endpoint,
      ]);
      console.log("✅ Abonnement push supprimé");
      return true;
    } catch (error) {
      console.error("❌ Erreur suppression abonnement:", error);
      throw error;
    }
  }

  /**
   * Récupère tous les abonnements d'un client
   */
  async getClientSubscriptions(clientId) {
    try {
      const subscriptions = await db.query(
        `SELECT id, endpoint, p256dh_key, auth_key
         FROM push_subscriptions
         WHERE client_id = ?`,
        [clientId]
      );
      return subscriptions;
    } catch (error) {
      console.error("❌ Erreur récupération abonnements:", error);
      throw error;
    }
  }

  /**
   * Récupère tous les abonnements d'un salon
   */
  async getTenantSubscriptions(tenantId) {
    try {
      const subscriptions = await db.query(
        `SELECT id, endpoint, p256dh_key, auth_key, client_id, user_id
         FROM push_subscriptions
         WHERE tenant_id = ?`,
        [tenantId]
      );
      return subscriptions;
    } catch (error) {
      console.error("❌ Erreur récupération abonnements tenant:", error);
      throw error;
    }
  }

  /**
   * Envoie une notification push à un abonnement spécifique
   */
  async sendNotification(subscription, payload) {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.initialized) {
      console.warn("⚠️  Service push non initialisé, notification ignorée");
      return { success: false, reason: "not_initialized" };
    }

    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh_key,
          auth: subscription.auth_key,
        },
      };

      const payloadString = JSON.stringify(payload);

      await webPush.sendNotification(pushSubscription, payloadString);

      // Mettre à jour last_used_at
      await db.query(
        "UPDATE push_subscriptions SET last_used_at = NOW() WHERE id = ?",
        [subscription.id]
      );

      return { success: true };
    } catch (error) {
      console.error("❌ Erreur envoi notification push:", error.message);

      // Si l'abonnement est expiré ou invalide, le supprimer
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log("🗑️  Abonnement expiré, suppression...");
        await this.removeSubscription(subscription.endpoint);
        return { success: false, reason: "subscription_expired" };
      }

      return { success: false, reason: error.message };
    }
  }

  /**
   * Envoie une notification à tous les abonnements d'un client
   */
  async sendToClient(clientId, payload) {
    try {
      const subscriptions = await this.getClientSubscriptions(clientId);

      if (subscriptions.length === 0) {
        console.log(`ℹ️  Aucun abonnement push pour le client ${clientId}`);
        return { sent: 0, failed: 0 };
      }

      let sent = 0;
      let failed = 0;

      for (const sub of subscriptions) {
        const result = await this.sendNotification(sub, payload);
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      }

      console.log(
        `📊 Notifications push client ${clientId}: ${sent} envoyées, ${failed} échecs`
      );
      return { sent, failed };
    } catch (error) {
      console.error("❌ Erreur envoi notifications client:", error);
      throw error;
    }
  }

  /**
   * Envoie une notification à tous les abonnements d'un salon (staff)
   */
  async sendToTenant(tenantId, payload, onlyStaff = true) {
    try {
      let subscriptions;

      if (onlyStaff) {
        // Uniquement le staff (user_id NOT NULL)
        subscriptions = await db.query(
          `SELECT id, endpoint, p256dh_key, auth_key
           FROM push_subscriptions
           WHERE tenant_id = ? AND user_id IS NOT NULL`,
          [tenantId]
        );
      } else {
        // Tous les abonnements du tenant
        subscriptions = await this.getTenantSubscriptions(tenantId);
      }

      if (subscriptions.length === 0) {
        console.log(`ℹ️  Aucun abonnement push pour le salon ${tenantId}`);
        return { sent: 0, failed: 0 };
      }

      let sent = 0;
      let failed = 0;

      for (const sub of subscriptions) {
        const result = await this.sendNotification(sub, payload);
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      }

      console.log(
        `📊 Notifications push salon ${tenantId}: ${sent} envoyées, ${failed} échecs`
      );
      return { sent, failed };
    } catch (error) {
      console.error("❌ Erreur envoi notifications salon:", error);
      throw error;
    }
  }

  /**
   * Nettoie les abonnements obsolètes (> 90 jours sans utilisation)
   */
  async cleanOldSubscriptions() {
    try {
      const result = await db.query(
        `DELETE FROM push_subscriptions
         WHERE last_used_at < DATE_SUB(NOW(), INTERVAL 90 DAY)`
      );

      console.log(`🧹 ${result.affectedRows} abonnements push obsolètes supprimés`);
      return result.affectedRows;
    } catch (error) {
      console.error("❌ Erreur nettoyage abonnements:", error);
      throw error;
    }
  }
}

// Export une instance unique (singleton)
module.exports = new PushService();
