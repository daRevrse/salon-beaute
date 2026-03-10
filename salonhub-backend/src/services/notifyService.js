/**
 * Service de notification unifiée
 * Combine Socket.io (temps réel) + Expo Push (mobile) + Web Push (PWA)
 * Point d'entrée unique pour notifier le staff d'un salon
 */

const expoPushService = require("./expoPushService");

class NotifyService {
  /**
   * Notifie le staff d'un salon via tous les canaux disponibles
   * - Socket.io : notification temps réel (si l'app est ouverte)
   * - Expo Push : notification push mobile (même si l'app est fermée)
   *
   * @param {Object} io - Instance Socket.io (req.io)
   * @param {number} tenantId - ID du salon
   * @param {string} event - Nom de l'événement socket (ex: 'new_appointment')
   * @param {Object} socketData - Données pour Socket.io
   * @param {Object} pushPayload - Payload pour la notification push Expo
   */
  async notifyTenant(io, tenantId, event, socketData, pushPayload) {
    // 1. Socket.io — temps réel (pour ceux connectés)
    try {
      if (io) {
        io.to(`tenant_${tenantId}`).emit(event, socketData);
      }
    } catch (err) {
      console.error(`⚠️  Erreur socket ${event}:`, err.message);
    }

    // 2. Expo Push — notification mobile (pour ceux pas connectés)
    if (pushPayload) {
      try {
        await expoPushService.sendToTenant(tenantId, pushPayload);
      } catch (err) {
        console.error(`⚠️  Erreur Expo push ${event}:`, err.message);
      }
    }
  }

  /**
   * Notifie un utilisateur spécifique
   */
  async notifyUser(io, tenantId, userId, event, socketData, pushPayload) {
    // Socket.io — la room est par tenant, donc l'événement sera reçu par tous
    // Mais les données contiennent l'info pour filtrer côté client si nécessaire
    try {
      if (io) {
        io.to(`tenant_${tenantId}`).emit(event, socketData);
      }
    } catch (err) {
      console.error(`⚠️  Erreur socket ${event}:`, err.message);
    }

    // Expo Push — ciblé sur l'utilisateur
    if (pushPayload && userId) {
      try {
        await expoPushService.sendToUser(userId, pushPayload);
      } catch (err) {
        console.error(`⚠️  Erreur Expo push user ${userId}:`, err.message);
      }
    }
  }
}

module.exports = new NotifyService();
