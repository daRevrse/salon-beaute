/**
 * SALONHUB - Service Webhooks
 * Dispatch d'événements vers les endpoints configurés par les tenants
 * Inclut la signature HMAC-SHA256 pour la sécurité
 */

const crypto = require("crypto");
const { query } = require("../config/database");

// Timeout pour les appels webhook (10 secondes)
const WEBHOOK_TIMEOUT = 10000;

// Nombre max de tentatives
const MAX_RETRIES = 3;

// Délais de retry (en ms) : immédiat, 5min, 30min
const RETRY_DELAYS = [0, 5 * 60 * 1000, 30 * 60 * 1000];

// Nombre d'échecs consécutifs avant désactivation automatique
const MAX_CONSECUTIVE_FAILURES = 10;

/**
 * Événements webhook supportés
 */
const WEBHOOK_EVENTS = [
  "appointment.created",
  "appointment.updated",
  "appointment.cancelled",
  "appointment.completed",
  "appointment.deleted",
  "client.created",
  "client.updated",
  "client.deleted",
  "service.created",
  "service.updated",
  "service.deleted",
];

/**
 * Générer un secret pour un nouveau webhook
 * @returns {string} Secret au format whsec_...
 */
const generateSecret = () => {
  const secret = crypto.randomBytes(32).toString("hex");
  return `whsec_${secret}`;
};

/**
 * Signer un payload avec HMAC-SHA256
 * @param {string} payload - Le payload JSON stringifié
 * @param {string} secret - Le secret du webhook
 * @returns {string} La signature au format sha256=...
 */
const signPayload = (payload, secret) => {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload, "utf8");
  return `sha256=${hmac.digest("hex")}`;
};

/**
 * Dispatch un événement webhook à tous les endpoints abonnés d'un tenant
 * Appel non-bloquant : ne retourne pas d'erreur si l'envoi échoue
 *
 * @param {number} tenantId - ID du tenant
 * @param {string} event - Type d'événement (ex: "appointment.created")
 * @param {object} data - Données de l'événement
 */
const dispatch = async (tenantId, event, data) => {
  try {
    // Récupérer les webhooks actifs qui écoutent cet événement
    const webhooks = await query(
      `SELECT id, url, secret, events, failure_count
       FROM webhooks
       WHERE tenant_id = ? AND is_active = TRUE`,
      [tenantId]
    );

    if (webhooks.length === 0) return;

    // Filtrer ceux qui écoutent cet événement
    const matchingWebhooks = webhooks.filter((wh) => {
      const events =
        typeof wh.events === "string" ? JSON.parse(wh.events) : wh.events;
      return events.includes(event);
    });

    if (matchingWebhooks.length === 0) return;

    // Construire le payload
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const payloadString = JSON.stringify(payload);

    // Envoyer à chaque webhook en parallèle (non-bloquant)
    for (const webhook of matchingWebhooks) {
      deliverWebhook(webhook, event, payloadString, tenantId).catch((err) => {
        console.error(
          `[Webhook] Erreur dispatch webhook ${webhook.id}:`,
          err.message
        );
      });
    }
  } catch (error) {
    // Ne jamais bloquer le flux principal
    console.error("[Webhook] Erreur dispatch:", error.message);
  }
};

/**
 * Livrer un webhook à un endpoint
 * Gère les retries et la journalisation
 *
 * @param {object} webhook - L'objet webhook de la DB
 * @param {string} event - Type d'événement
 * @param {string} payloadString - Payload JSON stringifié
 * @param {number} tenantId - ID du tenant
 * @param {number} attempt - Numéro de tentative (1, 2, 3)
 */
const deliverWebhook = async (
  webhook,
  event,
  payloadString,
  tenantId,
  attempt = 1
) => {
  const signature = signPayload(payloadString, webhook.secret);
  const startTime = Date.now();

  // Créer le log avant l'envoi
  const logResult = await query(
    `INSERT INTO webhook_logs (webhook_id, tenant_id, event, payload, attempt, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [webhook.id, tenantId, event, payloadString, attempt]
  );
  const logId = logResult.insertId;

  try {
    // Appel HTTP avec timeout via AbortController
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT);

    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SalonHub-Signature": signature,
        "X-SalonHub-Event": event,
        "X-SalonHub-Delivery": logId.toString(),
        "X-SalonHub-Timestamp": new Date().toISOString(),
        "User-Agent": "SalonHub-Webhook/1.0",
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseTime = Date.now() - startTime;
    let responseBody = "";
    try {
      responseBody = await response.text();
      // Limiter la taille du body stocké
      if (responseBody.length > 1000) {
        responseBody = responseBody.substring(0, 1000) + "...(truncated)";
      }
    } catch {
      // Ignorer erreur de lecture du body
    }

    if (response.ok) {
      // Succès !
      await query(
        `UPDATE webhook_logs
         SET status = 'success', response_status = ?, response_body = ?, response_time_ms = ?, delivered_at = NOW()
         WHERE id = ?`,
        [response.status, responseBody, responseTime, logId]
      );

      // Reset le compteur d'échecs
      await query(
        `UPDATE webhooks SET failure_count = 0, last_triggered_at = NOW() WHERE id = ?`,
        [webhook.id]
      );

      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Webhook] ✅ ${event} → ${webhook.url} (${response.status}, ${responseTime}ms)`
        );
      }
    } else {
      // Échec HTTP (4xx, 5xx)
      throw new Error(`HTTP ${response.status}: ${responseBody}`);
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage =
      error.name === "AbortError"
        ? `Timeout après ${WEBHOOK_TIMEOUT}ms`
        : error.message;

    // Mettre à jour le log
    await query(
      `UPDATE webhook_logs
       SET status = 'failed', error_message = ?, response_time_ms = ?, delivered_at = NOW()
       WHERE id = ?`,
      [errorMessage, responseTime, logId]
    );

    // Incrémenter le compteur d'échecs
    await query(
      `UPDATE webhooks SET failure_count = failure_count + 1, last_triggered_at = NOW() WHERE id = ?`,
      [webhook.id]
    );

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Webhook] ❌ ${event} → ${webhook.url} (tentative ${attempt}/${MAX_RETRIES}): ${errorMessage}`
      );
    }

    // Désactiver automatiquement après trop d'échecs consécutifs
    if (webhook.failure_count + 1 >= MAX_CONSECUTIVE_FAILURES) {
      await query(`UPDATE webhooks SET is_active = FALSE WHERE id = ?`, [
        webhook.id,
      ]);
      console.log(
        `[Webhook] ⚠️ Webhook ${webhook.id} désactivé automatiquement après ${MAX_CONSECUTIVE_FAILURES} échecs consécutifs`
      );
      return;
    }

    // Retry si pas la dernière tentative
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_DELAYS[attempt] || 0;
      if (delay > 0) {
        setTimeout(() => {
          deliverWebhook(
            webhook,
            event,
            payloadString,
            tenantId,
            attempt + 1
          ).catch(() => {});
        }, delay);
      } else {
        // Retry immédiat
        await deliverWebhook(
          webhook,
          event,
          payloadString,
          tenantId,
          attempt + 1
        );
      }
    }
  }
};

/**
 * Envoyer un événement de test à un webhook
 *
 * @param {number} webhookId - ID du webhook
 * @param {number} tenantId - ID du tenant
 * @returns {object} Résultat du test
 */
const sendTestEvent = async (webhookId, tenantId) => {
  const [webhook] = await query(
    `SELECT id, url, secret, events FROM webhooks WHERE id = ? AND tenant_id = ?`,
    [webhookId, tenantId]
  );

  if (!webhook) {
    throw new Error("Webhook introuvable");
  }

  const testPayload = {
    event: "webhook.test",
    timestamp: new Date().toISOString(),
    data: {
      message: "Ceci est un événement de test envoyé depuis SalonHub",
      webhook_id: webhookId,
      tenant_id: tenantId,
    },
  };

  const payloadString = JSON.stringify(testPayload);
  const signature = signPayload(payloadString, webhook.secret);
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT);

    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SalonHub-Signature": signature,
        "X-SalonHub-Event": "webhook.test",
        "X-SalonHub-Timestamp": new Date().toISOString(),
        "User-Agent": "SalonHub-Webhook/1.0",
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseTime = Date.now() - startTime;
    let responseBody = "";
    try {
      responseBody = await response.text();
    } catch {
      // ignore
    }

    return {
      success: response.ok,
      status: response.status,
      response_time_ms: responseTime,
      response_body: responseBody.substring(0, 500),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      status: null,
      response_time_ms: responseTime,
      error:
        error.name === "AbortError"
          ? `Timeout après ${WEBHOOK_TIMEOUT}ms`
          : error.message,
    };
  }
};

module.exports = {
  dispatch,
  sendTestEvent,
  generateSecret,
  signPayload,
  WEBHOOK_EVENTS,
  MAX_RETRIES,
};
