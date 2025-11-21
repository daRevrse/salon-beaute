const nodemailer = require("nodemailer");

/**
 * Service d'envoi d'emails pour SalonHub
 * Utilise Nodemailer avec support SMTP
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  /**
   * Initialise le transporteur email
   */
  async initialize() {
    try {
      // Configuration SMTP depuis les variables d'environnement
      const config = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true", // true pour port 465, false pour les autres
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      };

      // Vérifier que la configuration existe
      if (!config.host || !config.auth.user || !config.auth.pass) {
        console.warn(
          "⚠️  Configuration SMTP manquante - Les emails ne seront pas envoyés"
        );
        this.initialized = false;
        return false;
      }

      this.transporter = nodemailer.createTransport(config);

      // Vérifier la connexion
      await this.transporter.verify();
      console.log("✓ Service email initialisé avec succès");
      this.initialized = true;
      return true;
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'initialisation du service email:",
        error.message
      );
      this.initialized = false;
      return false;
    }
  }

  /**
   * Envoie un email
   * @param {Object} options - Options d'envoi
   * @param {string} options.to - Destinataire
   * @param {string} options.subject - Sujet
   * @param {string} options.html - Contenu HTML
   * @param {string} options.text - Contenu texte (optionnel)
   * @param {string} options.from - Expéditeur (optionnel)
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  async sendEmail({ to, subject, html, text, from }) {
    // Si le service n'est pas initialisé, essayer de l'initialiser
    if (!this.initialized) {
      await this.initialize();
    }

    // Si toujours pas initialisé, simuler l'envoi
    if (!this.initialized) {
      console.log("📧 [SIMULATION] Email:", {
        from: from || process.env.SMTP_FROM || "noreply@salonhub.com",
        to,
        subject,
      });
      return { simulated: true, messageId: "simulated-" + Date.now() };
    }

    try {
      const mailOptions = {
        from:
          from || process.env.SMTP_FROM || '"SalonHub" <noreply@salonhub.com>',
        to,
        subject,
        html,
        text: text || this.stripHtml(html), // Convertir HTML en texte si non fourni
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("✓ Email envoyé:", info.messageId, "à", to);
      return info;
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi de l'email:", error.message);
      throw error;
    }
  }

  /**
   * Convertit HTML en texte brut (basique)
   * @param {string} html - Contenu HTML
   * @returns {string} Texte brut
   */
  stripHtml(html) {
    return html
      .replace(/<style[^>]*>.*<\/style>/gm, "")
      .replace(/<script[^>]*>.*<\/script>/gm, "")
      .replace(/<[^>]+>/gm, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Email de bienvenue pour nouvel utilisateur (essai 14 jours)
   */
  async sendWelcomeEmail({ to, firstName, tenantSlug }) {
    const platformUrl =
      process.env.FRONTEND_URL || "https://app.salonhub.flowkraftagency.com";
    const supportEmail =
      process.env.SUPPORT_EMAIL || "support@flowkraftagency.com";

    const subject =
      "🎉 Bienvenue sur SalonHub – Votre essai gratuit de 14 jours est activé !";

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur SalonHub</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Container principal -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

          <!-- Header avec gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                Bienvenue sur SalonHub
              </h1>
              <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                Votre plateforme professionnelle de gestion de salon
              </p>
            </td>
          </tr>

          <!-- Corps du message -->
          <tr>
            <td style="padding: 40px;">

              <!-- Salutation -->
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Bonjour <strong>${firstName}</strong>,
              </p>

              <p style="margin: 0 0 20px; color: #555555; font-size: 15px; line-height: 1.6;">
                Merci pour votre inscription sur <strong>SalonHub</strong>, la plateforme professionnelle de gestion et de réservation pour salons de beauté.
                Nous sommes ravis de vous compter parmi nos nouveaux utilisateurs !
              </p>

              <!-- Badge essai gratuit -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); padding: 15px 30px; border-radius: 50px;">
                      <p style="margin: 0; color: #1a1a1a; font-size: 16px; font-weight: 600;">
                        ✨ Essai gratuit de 14 jours activé
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 25px; color: #555555; font-size: 15px; line-height: 1.6;">
                Vous pouvez dès maintenant accéder à votre espace salon et commencer à configurer vos services, employés et rendez-vous.
              </p>

              <!-- Bouton CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${platformUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      🚀 Accéder à la plateforme
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Section: Ce que vous pouvez faire -->
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h2 style="margin: 0 0 20px; color: #333333; font-size: 18px; font-weight: 600;">
                  🎯 Ce que vous pouvez faire dès aujourd'hui
                </h2>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #555555; font-size: 15px; line-height: 1.8;">
                  <li style="margin-bottom: 10px;">Créer vos services et tarifs</li>
                  <li style="margin-bottom: 10px;">Ajouter vos collaborateurs</li>
                  <li style="margin-bottom: 10px;">Ouvrir votre agenda de réservation</li>
                  <li style="margin-bottom: 10px;">Recevoir vos premiers rendez-vous en ligne</li>
                  <li style="margin-bottom: 0;">Personnaliser votre profil salon</li>
                </ul>
              </div>

              <!-- Section: Feedback -->
              <div style="border-left: 4px solid #667eea; padding-left: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 12px; color: #333333; font-size: 16px; font-weight: 600;">
                  💡 Votre avis compte énormément
                </h3>
                <p style="margin: 0; color: #555555; font-size: 14px; line-height: 1.6;">
                  Notre objectif est d'offrir la meilleure expérience possible aux professionnels de la beauté.
                  N'hésitez pas à nous faire un retour à tout moment : vos suggestions et remarques nous aident à améliorer continuellement le produit.
                </p>
              </div>

              <!-- Besoin d'aide -->
              <p style="margin: 30px 0 10px; color: #333333; font-size: 15px; font-weight: 600;">
                📞 Besoin d'aide ?
              </p>
              <p style="margin: 0 0 5px; color: #555555; font-size: 14px; line-height: 1.6;">
                Support & assistance : <a href="mailto:${supportEmail}" style="color: #667eea; text-decoration: none;">${supportEmail}</a>
              </p>
              <p style="margin: 0; color: #555555; font-size: 14px; line-height: 1.6;">
                Site web : <a href="https://www.flowkraftagency.com" style="color: #667eea; text-decoration: none;">www.flowkraftagency.com</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 8px; color: #333333; font-size: 14px; font-weight: 600;">
                Merci pour votre confiance ✨
              </p>
              <p style="margin: 0 0 20px; color: #666666; font-size: 13px;">
                Nous vous souhaitons une excellente découverte de SalonHub !
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                L'équipe SalonHub – FlowKraft Agency<br>
                Créateurs d'expériences digitales professionnelles
              </p>
            </td>
          </tr>

        </table>

        <!-- Note légale -->
        <p style="margin: 20px 0 0; color: #999999; font-size: 11px; text-align: center; line-height: 1.5;">
          Vous recevez cet email car vous vous êtes inscrit sur SalonHub.<br>
          © ${new Date().getFullYear()} FlowKraft Agency. Tous droits réservés.
        </p>

      </td>
    </tr>
  </table>
</body>
</html>
    `;

    return await this.sendEmail({ to, subject, html });
  }

  /**
   * Email de rappel de rendez-vous
   */
  async sendAppointmentReminder({
    to,
    firstName,
    appointmentDate,
    appointmentTime,
    serviceName,
    salonName,
    salonPhone,
    salonAddress,
    hoursBeforeText = "bientôt",
  }) {
    const subject = `⏰ Rappel: Votre rendez-vous chez ${salonName}`;

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <tr>
            <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                ⏰ Rappel de rendez-vous
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px;">
                Bonjour <strong>${firstName}</strong>,
              </p>

              <p style="margin: 0 0 25px; color: #555555; font-size: 15px; line-height: 1.6;">
                Nous vous rappelons que vous avez un rendez-vous prévu <strong>${hoursBeforeText}</strong> :
              </p>

              <div style="background-color: #f8f9fa; border-left: 4px solid #f5576c; padding: 20px; margin: 25px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; color: #333333; font-size: 15px;">
                  <strong>📅 Date :</strong> ${appointmentDate}
                </p>
                <p style="margin: 0 0 10px; color: #333333; font-size: 15px;">
                  <strong>🕐 Heure :</strong> ${appointmentTime}
                </p>
                <p style="margin: 0 0 10px; color: #333333; font-size: 15px;">
                  <strong>💇 Service :</strong> ${serviceName}
                </p>
                <p style="margin: 0 0 10px; color: #333333; font-size: 15px;">
                  <strong>🏢 Salon :</strong> ${salonName}
                </p>
                ${
                  salonAddress
                    ? `<p style="margin: 0 0 10px; color: #333333; font-size: 15px;">
                  <strong>📍 Adresse :</strong> ${salonAddress}
                </p>`
                    : ""
                }
                ${
                  salonPhone
                    ? `<p style="margin: 0; color: #333333; font-size: 15px;">
                  <strong>📞 Téléphone :</strong> ${salonPhone}
                </p>`
                    : ""
                }
              </div>

              <p style="margin: 25px 0 0; color: #555555; font-size: 14px; line-height: 1.6;">
                En cas d'empêchement, merci de nous prévenir au plus tôt${
                  salonPhone ? ` au ${salonPhone}` : ""
                }.
              </p>

              <p style="margin: 25px 0 0; color: #555555; font-size: 14px;">
                À très bientôt ! 💫
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                ${salonName}<br>
                Propulsé par SalonHub
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    return await this.sendEmail({ to, subject, html });
  }

  /**
   * Email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail({
    to,
    firstName,
    resetLink,
    tenantName,
    expiresInMinutes = 60,
  }) {
    const subject = `🔒 Réinitialisation de votre mot de passe - ${tenantName}`;

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                🔒 Réinitialisation de mot de passe
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px;">
                Bonjour <strong>${firstName}</strong>,
              </p>

              <p style="margin: 0 0 25px; color: #555555; font-size: 15px; line-height: 1.6;">
                Vous avez demandé la réinitialisation de votre mot de passe pour votre compte <strong>${tenantName}</strong> sur SalonHub.
              </p>

              <p style="margin: 0 0 25px; color: #555555; font-size: 15px; line-height: 1.6;">
                Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
              </p>

              <!-- Bouton CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      🔑 Réinitialiser mon mot de passe
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Avertissement de sécurité -->
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; color: #856404; font-size: 14px; font-weight: 600;">
                  ⚠️ Important
                </p>
                <p style="margin: 0; color: #856404; font-size: 13px; line-height: 1.6;">
                  Ce lien est valide pendant <strong>${expiresInMinutes} minutes</strong> et ne peut être utilisé qu'une seule fois.
                </p>
              </div>

              <p style="margin: 25px 0 0; color: #555555; font-size: 14px; line-height: 1.6;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
              </p>
              <p style="margin: 10px 0 0; color: #667eea; font-size: 13px; word-break: break-all; line-height: 1.6;">
                ${resetLink}
              </p>

              <div style="background-color: #f8f9fa; padding: 20px; margin: 30px 0; border-radius: 8px; border: 1px solid #e9ecef;">
                <p style="margin: 0 0 10px; color: #333333; font-size: 14px; font-weight: 600;">
                  Vous n'avez pas demandé cette réinitialisation ?
                </p>
                <p style="margin: 0; color: #555555; font-size: 13px; line-height: 1.6;">
                  Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email. Votre mot de passe restera inchangé et ce lien expirera automatiquement.
                </p>
              </div>

            </td>
          </tr>

          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                ${tenantName}<br>
                Propulsé par SalonHub
              </p>
            </td>
          </tr>

        </table>

        <!-- Note légale -->
        <p style="margin: 20px 0 0; color: #999999; font-size: 11px; text-align: center; line-height: 1.5;">
          Cet email a été envoyé automatiquement, merci de ne pas y répondre.<br>
          © ${new Date().getFullYear()} SalonHub. Tous droits réservés.
        </p>

      </td>
    </tr>
  </table>
</body>
</html>
    `;

    return await this.sendEmail({ to, subject, html });
  }

  /**
   * Email de confirmation de rendez-vous
   */
  async sendAppointmentConfirmation({
    to,
    firstName,
    appointmentDate,
    appointmentTime,
    serviceName,
    salonName,
    price,
  }) {
    const subject = `✅ Confirmation: Votre rendez-vous chez ${salonName}`;

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <tr>
            <td style="background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 700;">
                ✅ Rendez-vous confirmé
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px;">
                Bonjour <strong>${firstName}</strong>,
              </p>

              <p style="margin: 0 0 25px; color: #555555; font-size: 15px; line-height: 1.6;">
                Votre rendez-vous a bien été confirmé ! Nous avons hâte de vous accueillir.
              </p>

              <div style="background-color: #f8f9fa; padding: 25px; margin: 25px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 15px; color: #333333; font-size: 17px; font-weight: 600;">
                  Détails de votre réservation
                </h3>
                <p style="margin: 0 0 10px; color: #333333; font-size: 15px;">
                  <strong>📅 Date :</strong> ${appointmentDate}
                </p>
                <p style="margin: 0 0 10px; color: #333333; font-size: 15px;">
                  <strong>🕐 Heure :</strong> ${appointmentTime}
                </p>
                <p style="margin: 0 0 10px; color: #333333; font-size: 15px;">
                  <strong>💇 Service :</strong> ${serviceName}
                </p>
                <p style="margin: 0 0 10px; color: #333333; font-size: 15px;">
                  <strong>🏢 Salon :</strong> ${salonName}
                </p>
                ${
                  price
                    ? `<p style="margin: 0; color: #333333; font-size: 15px;">
                  <strong>💰 Prix :</strong> ${price}
                </p>`
                    : ""
                }
              </div>

              <p style="margin: 25px 0 0; color: #555555; font-size: 14px; line-height: 1.6;">
                Un rappel vous sera envoyé avant votre rendez-vous.
              </p>

              <p style="margin: 25px 0 0; color: #555555; font-size: 14px;">
                À très bientôt ! ✨
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                ${salonName}<br>
                Propulsé par SalonHub
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    return await this.sendEmail({ to, subject, html });
  }

  /**
   * Email d'accusé de réception de demande de RDV (avant validation)
   */
  async sendBookingRequestReceived({
    to,
    firstName,
    appointmentDate,
    appointmentTime,
    serviceName,
    salonName,
  }) {
    const subject = `⏳ Demande reçue : Votre rendez-vous chez ${salonName}`;

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <tr>
            <td style="background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                ⏳ Demande reçue
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px;">
                Bonjour <strong>${firstName}</strong>,
              </p>

              <p style="margin: 0 0 25px; color: #555555; font-size: 15px; line-height: 1.6;">
                Nous avons bien reçu votre demande de rendez-vous ! L'équipe du salon va vérifier la disponibilité et valider votre créneau très prochainement.
              </p>

              <div style="background-color: #fffaf0; border: 1px solid #feebc8; padding: 25px; margin: 25px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 15px; color: #c05621; font-size: 17px; font-weight: 600;">
                  Détails de la demande
                </h3>
                <p style="margin: 0 0 10px; color: #333333; font-size: 15px;">
                  <strong>📅 Date :</strong> ${appointmentDate}
                </p>
                <p style="margin: 0 0 10px; color: #333333; font-size: 15px;">
                  <strong>🕐 Heure :</strong> ${appointmentTime}
                </p>
                <p style="margin: 0 0 10px; color: #333333; font-size: 15px;">
                  <strong>💇 Service :</strong> ${serviceName}
                </p>
                <p style="margin: 0; color: #333333; font-size: 15px;">
                  <strong>🏢 Salon :</strong> ${salonName}
                </p>
              </div>

              <p style="margin: 25px 0 0; color: #555555; font-size: 14px; line-height: 1.6;">
                Vous recevrez un nouvel email dès que le rendez-vous sera confirmé ✅.
              </p>

              <p style="margin: 25px 0 0; color: #555555; font-size: 14px;">
                À très vite !
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                ${salonName}<br>
                Propulsé par SalonHub
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    return await this.sendEmail({ to, subject, html });
  }
}

// Export une instance unique (singleton)
module.exports = new EmailService();
