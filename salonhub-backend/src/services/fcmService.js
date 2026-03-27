const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

class FCMService {
  constructor() {
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return true;

    try {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      if (!serviceAccountPath) {
        console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_PATH non défini");
        return false;
      }

      // Chemin absolu vers le fichier JSON
      const absolutePath = path.isAbsolute(serviceAccountPath)
        ? serviceAccountPath
        : path.join(process.cwd(), serviceAccountPath);

      if (!fs.existsSync(absolutePath)) {
        console.error(`❌ Fichier service account Firebase introuvable : ${absolutePath}`);
        return false;
      }

      const serviceAccount = require(absolutePath);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
      });

      this.initialized = true;
      console.log("✓ Service Firebase Admin (FCM) initialisé");
      return true;
    } catch (error) {
      console.error("❌ Erreur initialisation Firebase Admin:", error.message);
      return false;
    }
  }

  /**
   * Envoie une notification à un ou plusieurs tokens FCM
   */
  async sendNotification(tokens, payload) {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.initialized) {
      console.warn("⚠️ FCM non initialisé, notification ignorée");
      return { success: false, reason: "not_initialized" };
    }

    if (!tokens || (Array.isArray(tokens) && tokens.length === 0)) {
       return { success: true, sent: 0 };
    }

    try {
      const messagePayload = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
        webpush: {
          notification: {
            title: payload.title,
            body: payload.body,
            icon: payload.icon || "/logo192.png",
            badge: payload.badge || "/logo192.png",
          },
          fcmOptions: {
            link: payload.data?.url || "/"
          }
        }
      };

      if (Array.isArray(tokens)) {
        // Envoi à plusieurs tokens
        const response = await admin.messaging().sendEachForMulticast({
          tokens,
          ...messagePayload
        });
        console.log(`📊 FCM: ${response.successCount} succès, ${response.failureCount} échecs`);
        return { success: true, sent: response.successCount, failed: response.failureCount };
      } else {
        // Envoi à un seul token
        const response = await admin.messaging().send({
          token: tokens,
          ...messagePayload
        });
        return { success: true, messageId: response };
      }
    } catch (error) {
      console.error("❌ Erreur envoi FCM:", error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new FCMService();
