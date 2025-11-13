/**
 * SALONHUB - Routes Stripe
 * Gestion paiements et abonnements
 */

const express = require("express");
const router = express.Router();
const { query } = require("../config/database");
const { authMiddleware } = require("../middleware/auth");
const { tenantMiddleware } = require("../middleware/tenant");
const {
  stripe,
  PLANS,
  createCheckoutSession,
  createCustomerPortalSession,
  cancelSubscription,
  reactivateSubscription,
  getSubscriptionInfo,
} = require("../config/stripe");

// Appliquer auth sur toutes les routes sauf webhook
router.use((req, res, next) => {
  if (req.path === "/webhook") {
    return next();
  }
  authMiddleware(req, res, next);
});

router.use((req, res, next) => {
  if (req.path === "/webhook") {
    return next();
  }
  tenantMiddleware(req, res, next);
});

// ==========================================
// GET - Plans disponibles
// ==========================================
router.get("/plans", (req, res) => {
  res.json({
    success: true,
    data: PLANS,
  });
});

// ==========================================
// POST - Créer session de paiement
// ==========================================
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { plan } = req.body;

    // Validation
    if (!PLANS[plan]) {
      return res.status(400).json({
        success: false,
        error: "Plan invalide",
      });
    }

    // Vérifier que le tenant n'a pas déjà un abonnement actif
    const [tenant] = await query(
      "SELECT subscription_status, stripe_subscription_id FROM tenants WHERE id = ?",
      [req.tenantId]
    );

    if (
      tenant.subscription_status === "active" &&
      tenant.stripe_subscription_id
    ) {
      return res.status(400).json({
        success: false,
        error: "Vous avez déjà un abonnement actif",
        message: "Utilisez le portail client pour modifier votre abonnement",
      });
    }

    // Créer session Stripe
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const result = await createCheckoutSession(
      req.tenantId,
      plan,
      `${baseUrl}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      `${baseUrl}/billing?cancelled=true`
    );

    if (result.success) {
      res.json({
        success: true,
        sessionId: result.sessionId,
        url: result.url,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Erreur création checkout:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// POST - Créer portail client
// ==========================================
router.post("/create-portal-session", async (req, res) => {
  try {
    const [tenant] = await query(
      "SELECT stripe_customer_id FROM tenants WHERE id = ?",
      [req.tenantId]
    );

    if (!tenant.stripe_customer_id) {
      return res.status(400).json({
        success: false,
        error: "Aucun compte Stripe trouvé",
      });
    }

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const result = await createCustomerPortalSession(
      tenant.stripe_customer_id,
      `${baseUrl}/billing`
    );

    if (result.success) {
      res.json({
        success: true,
        url: result.url,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Erreur création portal:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// POST - Vérifier et compléter le paiement après checkout
// ==========================================
router.post("/verify-session", async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "Session ID manquant",
      });
    }

    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Vérifier que la session appartient bien à ce tenant
    if (parseInt(session.metadata.tenant_id) !== req.tenantId) {
      return res.status(403).json({
        success: false,
        error: "Session non autorisée",
      });
    }

    // Si le paiement est complété, mettre à jour la BDD
    if (session.payment_status === "paid" && session.subscription) {
      const plan = session.metadata.plan;

      await query(
        `UPDATE tenants SET
          subscription_plan = ?,
          subscription_status = 'active',
          subscription_started_at = NOW(),
          stripe_customer_id = ?,
          stripe_subscription_id = ?
        WHERE id = ?`,
        [plan, session.customer, session.subscription, req.tenantId]
      );

      console.log(`✅ Paiement vérifié et complété pour tenant ${req.tenantId}, plan: ${plan}`);

      return res.json({
        success: true,
        message: "Abonnement activé avec succès",
        plan: plan,
      });
    }

    res.json({
      success: false,
      message: "Paiement non complété",
      paymentStatus: session.payment_status,
    });
  } catch (error) {
    console.error("Erreur vérification session:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// GET - Infos abonnement actuel
// ==========================================
router.get("/subscription", async (req, res) => {
  try {
    const [tenant] = await query(
      `SELECT 
        subscription_plan,
        subscription_status,
        stripe_subscription_id,
        stripe_customer_id,
        trial_ends_at,
        subscription_started_at
      FROM tenants 
      WHERE id = ?`,
      [req.tenantId]
    );

    let subscriptionInfo = null;

    // Si abonnement Stripe actif, récupérer les détails
    if (tenant.stripe_subscription_id) {
      const result = await getSubscriptionInfo(tenant.stripe_subscription_id);
      if (result.success) {
        subscriptionInfo = result.data;
      }
    }

    res.json({
      success: true,
      data: {
        plan: tenant.subscription_plan,
        status: tenant.subscription_status,
        hasStripeSubscription: !!tenant.stripe_subscription_id,
        trialEndsAt: tenant.trial_ends_at,
        subscriptionStartedAt: tenant.subscription_started_at,
        stripeInfo: subscriptionInfo,
      },
    });
  } catch (error) {
    console.error("Erreur récupération abonnement:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// POST - Annuler abonnement
// ==========================================
router.post("/cancel-subscription", async (req, res) => {
  try {
    const [tenant] = await query(
      "SELECT stripe_subscription_id FROM tenants WHERE id = ?",
      [req.tenantId]
    );

    if (!tenant.stripe_subscription_id) {
      return res.status(400).json({
        success: false,
        error: "Aucun abonnement actif",
      });
    }

    const result = await cancelSubscription(tenant.stripe_subscription_id);

    if (result.success) {
      res.json({
        success: true,
        message:
          "Abonnement annulé. Vous gardez l'accès jusqu'à la fin de la période en cours.",
        cancelAt: result.cancelAt,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Erreur annulation:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// POST - Webhook Stripe
// ==========================================
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Gérer les événements
    try {
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutSessionCompleted(event.data.object);
          break;

        case "customer.subscription.updated":
          await handleSubscriptionUpdated(event.data.object);
          break;

        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(event.data.object);
          break;

        case "invoice.payment_succeeded":
          await handleInvoicePaymentSucceeded(event.data.object);
          break;

        case "invoice.payment_failed":
          await handleInvoicePaymentFailed(event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Error handling webhook:", error);
      res.status(500).json({ error: "Webhook handler failed" });
    }
  }
);

// ==========================================
// HANDLERS WEBHOOK
// ==========================================

async function handleCheckoutSessionCompleted(session) {
  const tenantId = parseInt(session.metadata.tenant_id);
  const plan = session.metadata.plan;

  await query(
    `UPDATE tenants SET
      subscription_plan = ?,
      subscription_status = 'active',
      subscription_started_at = NOW(),
      stripe_customer_id = ?,
      stripe_subscription_id = ?
    WHERE id = ?`,
    [plan, session.customer, session.subscription, tenantId]
  );

  console.log(`✅ Checkout complété pour tenant ${tenantId}, plan: ${plan}`);
}

async function handleSubscriptionUpdated(subscription) {
  const customerId = subscription.customer;

  const [tenant] = await query(
    "SELECT id FROM tenants WHERE stripe_customer_id = ?",
    [customerId]
  );

  if (tenant) {
    let status = "active";
    if (subscription.status === "canceled") status = "cancelled";
    if (subscription.status === "past_due") status = "suspended";

    await query("UPDATE tenants SET subscription_status = ? WHERE id = ?", [
      status,
      tenant.id,
    ]);

    console.log(`✅ Abonnement mis à jour pour tenant ${tenant.id}: ${status}`);
  }
}

async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;

  const [tenant] = await query(
    "SELECT id FROM tenants WHERE stripe_customer_id = ?",
    [customerId]
  );

  if (tenant) {
    await query(
      `UPDATE tenants SET
        subscription_status = 'cancelled',
        stripe_subscription_id = NULL
      WHERE id = ?`,
      [tenant.id]
    );

    console.log(`✅ Abonnement annulé pour tenant ${tenant.id}`);
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  console.log(`✅ Paiement réussi: ${invoice.id}`);
  // Ici: Envoyer email de confirmation, mettre à jour stats, etc.
}

async function handleInvoicePaymentFailed(invoice) {
  console.log(`❌ Paiement échoué: ${invoice.id}`);
  // Ici: Suspendre le compte, envoyer email d'alerte, etc.

  const customerId = invoice.customer;

  const [tenant] = await query(
    "SELECT id FROM tenants WHERE stripe_customer_id = ?",
    [customerId]
  );

  if (tenant) {
    await query(
      'UPDATE tenants SET subscription_status = "suspended" WHERE id = ?',
      [tenant.id]
    );
  }
}

module.exports = router;
