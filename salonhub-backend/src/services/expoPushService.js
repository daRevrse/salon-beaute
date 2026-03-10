/**
 * Service de notifications push Expo (Mobile)
 * Envoie des notifications push aux appareils mobiles via l'API Expo Push
 * Complémentaire au pushService.js (VAPID) qui gère le Web Push (navigateurs)
 */

const { Expo } = require("expo-server-sdk");
const db = require("../config/database");

class ExpoPushService {
  constructor() {
    this.expo = new Expo();
  }

  // =============================================
  // GESTION DES TOKENS
  // =============================================

  /**
   * Enregistre ou met à jour un token Expo push
   */
  async registerToken({ tenantId, userId, token, deviceName = null, platform = null }) {
    try {
      if (!Expo.isExpoPushToken(token)) {
        throw new Error(`Token Expo invalide : ${token}`);
      }

      // Upsert : si le token existe déjà, mettre à jour
      const [existing] = await db.query(
        "SELECT id, user_id, tenant_id FROM expo_push_tokens WHERE token = ?",
        [token]
      );

      if (existing) {
        await db.query(
          `UPDATE expo_push_tokens
           SET tenant_id = ?, user_id = ?, device_name = ?, platform = ?,
               is_active = TRUE, last_used_at = NOW()
           WHERE token = ?`,
          [tenantId, userId, deviceName, platform, token]
        );
        console.log(`✅ Token Expo mis à jour (ID: ${existing.id})`);
        return { tokenId: existing.id, updated: true };
      }

      // Nouveau token
      const result = await db.query(
        `INSERT INTO expo_push_tokens
         (tenant_id, user_id, token, device_name, platform, is_active)
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [tenantId, userId, token, deviceName, platform]
      );

      console.log(`✅ Nouveau token Expo enregistré (ID: ${result.insertId})`);
      return { tokenId: result.insertId, updated: false };
    } catch (error) {
      // Duplicate token (race condition) — juste mettre à jour
      if (error.code === "ER_DUP_ENTRY") {
        await db.query(
          `UPDATE expo_push_tokens
           SET tenant_id = ?, user_id = ?, device_name = ?, platform = ?,
               is_active = TRUE, last_used_at = NOW()
           WHERE token = ?`,
          [tenantId, userId, deviceName, platform, token]
        );
        return { tokenId: null, updated: true };
      }
      console.error("❌ Erreur enregistrement token Expo:", error);
      throw error;
    }
  }

  /**
   * Supprime un token Expo
   */
  async removeToken(token) {
    try {
      await db.query("DELETE FROM expo_push_tokens WHERE token = ?", [token]);
      console.log("✅ Token Expo supprimé");
      return true;
    } catch (error) {
      console.error("❌ Erreur suppression token Expo:", error);
      throw error;
    }
  }

  /**
   * Désactive un token (au lieu de le supprimer)
   */
  async deactivateToken(token) {
    try {
      await db.query(
        "UPDATE expo_push_tokens SET is_active = FALSE WHERE token = ?",
        [token]
      );
      return true;
    } catch (error) {
      console.error("❌ Erreur désactivation token Expo:", error);
      throw error;
    }
  }

  /**
   * Désactive tous les tokens d'un utilisateur (logout)
   */
  async deactivateUserTokens(userId) {
    try {
      const result = await db.query(
        "UPDATE expo_push_tokens SET is_active = FALSE WHERE user_id = ?",
        [userId]
      );
      console.log(`✅ ${result.affectedRows} token(s) Expo désactivés pour user ${userId}`);
      return result.affectedRows;
    } catch (error) {
      console.error("❌ Erreur désactivation tokens user:", error);
      throw error;
    }
  }

  // =============================================
  // RÉCUPÉRATION DES TOKENS
  // =============================================

  /**
   * Récupère tous les tokens actifs d'un utilisateur
   */
  async getUserTokens(userId) {
    return db.query(
      "SELECT * FROM expo_push_tokens WHERE user_id = ? AND is_active = TRUE",
      [userId]
    );
  }

  /**
   * Récupère tous les tokens actifs d'un salon (staff)
   */
  async getTenantTokens(tenantId) {
    return db.query(
      "SELECT * FROM expo_push_tokens WHERE tenant_id = ? AND is_active = TRUE",
      [tenantId]
    );
  }

  // =============================================
  // ENVOI DE NOTIFICATIONS
  // =============================================

  /**
   * Envoie des notifications push à une liste de tokens Expo
   * Utilise le batching natif d'expo-server-sdk pour l'efficacité
   */
  async sendNotifications(tokens, payload) {
    if (!tokens || tokens.length === 0) {
      return { sent: 0, failed: 0 };
    }

    // Filtrer les tokens valides
    const validTokens = tokens.filter((t) => {
      const tokenStr = typeof t === "string" ? t : t.token;
      return Expo.isExpoPushToken(tokenStr);
    });

    if (validTokens.length === 0) {
      console.warn("⚠️  Aucun token Expo valide");
      return { sent: 0, failed: 0 };
    }

    // Construire les messages
    const messages = validTokens.map((t) => {
      const tokenStr = typeof t === "string" ? t : t.token;
      return {
        to: tokenStr,
        sound: payload.sound || "default",
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        badge: payload.badge,
        channelId: payload.channelId || "default",
        priority: payload.priority || "high",
        ...(payload.categoryId && { categoryId: payload.categoryId }),
      };
    });

    // Envoyer par chunks (expo-server-sdk gère le batching)
    const chunks = this.expo.chunkPushNotifications(messages);
    let sent = 0;
    let failed = 0;
    const invalidTokens = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);

        for (let i = 0; i < ticketChunk.length; i++) {
          const ticket = ticketChunk[i];
          const tokenStr = typeof validTokens[i] === "string"
            ? validTokens[i]
            : validTokens[i].token;

          if (ticket.status === "ok") {
            sent++;
          } else {
            failed++;
            console.error(
              `❌ Erreur push Expo pour ${tokenStr}:`,
              ticket.message
            );

            // Token invalide — le désactiver
            if (
              ticket.details?.error === "DeviceNotRegistered" ||
              ticket.details?.error === "InvalidCredentials"
            ) {
              invalidTokens.push(tokenStr);
            }
          }
        }
      } catch (error) {
        console.error("❌ Erreur envoi chunk Expo:", error.message);
        failed += chunk.length;
      }
    }

    // Désactiver les tokens invalides
    if (invalidTokens.length > 0) {
      for (const token of invalidTokens) {
        await this.deactivateToken(token).catch(() => {});
      }
      console.log(
        `🗑️  ${invalidTokens.length} token(s) Expo désactivés (DeviceNotRegistered)`
      );
    }

    // Mettre à jour last_used_at pour les tokens envoyés avec succès
    if (sent > 0) {
      const successTokens = validTokens
        .map((t) => (typeof t === "string" ? t : t.token))
        .filter((t) => !invalidTokens.includes(t));

      if (successTokens.length > 0) {
        const placeholders = successTokens.map(() => "?").join(",");
        await db.query(
          `UPDATE expo_push_tokens SET last_used_at = NOW()
           WHERE token IN (${placeholders})`,
          successTokens
        ).catch(() => {});
      }
    }

    console.log(`📱 Push Expo: ${sent} envoyés, ${failed} échecs`);
    return { sent, failed };
  }

  /**
   * Envoie une notification à un utilisateur spécifique (tous ses appareils)
   */
  async sendToUser(userId, payload) {
    const tokens = await this.getUserTokens(userId);
    if (tokens.length === 0) {
      console.log(`ℹ️  Aucun token Expo actif pour user ${userId}`);
      return { sent: 0, failed: 0 };
    }
    return this.sendNotifications(tokens, payload);
  }

  /**
   * Envoie une notification à tout le staff d'un salon
   */
  async sendToTenant(tenantId, payload) {
    const tokens = await this.getTenantTokens(tenantId);
    if (tokens.length === 0) {
      console.log(`ℹ️  Aucun token Expo actif pour salon ${tenantId}`);
      return { sent: 0, failed: 0 };
    }
    return this.sendNotifications(tokens, payload);
  }

  // =============================================
  // MAINTENANCE
  // =============================================

  /**
   * Nettoie les tokens inactifs ou obsolètes (> 90 jours)
   */
  async cleanOldTokens() {
    try {
      const result = await db.query(
        `DELETE FROM expo_push_tokens
         WHERE is_active = FALSE
            OR last_used_at < DATE_SUB(NOW(), INTERVAL 90 DAY)`
      );
      console.log(`🧹 ${result.affectedRows} token(s) Expo obsolètes supprimés`);
      return result.affectedRows;
    } catch (error) {
      console.error("❌ Erreur nettoyage tokens Expo:", error);
      throw error;
    }
  }
}

// Export singleton
module.exports = new ExpoPushService();
