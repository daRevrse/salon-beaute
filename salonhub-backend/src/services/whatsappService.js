/**
 * SALONHUB - Service WhatsApp
 * Mode par défaut: Liens wa.me (gratuit, sans API)
 * Mode avancé: Intégration API via Twilio ou Meta (optionnel)
 */

class WhatsAppService {
  constructor() {
    // Configuration via variables d'environnement
    this.provider = process.env.WHATSAPP_PROVIDER || 'twilio'; // 'twilio' ou 'meta'
    this.enabled = process.env.WHATSAPP_ENABLED === 'true';

    // Charger axios seulement si le mode API est activé
    if (this.enabled) {
      this.axios = require('axios');
    }

    // Configuration Twilio
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER; // Ex: whatsapp:+14155238886

    // Configuration Meta (WhatsApp Business API)
    this.metaAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.metaPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.metaBusinessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  }

  /**
   * Formater le numéro de téléphone au format international
   * @param {string} phone - Numéro de téléphone
   * @returns {string} - Numéro formaté
   */
  formatPhoneNumber(phone) {
    // Retirer tous les caractères non numériques sauf le +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // Si le numéro commence par 0, remplacer par +33 (France)
    if (cleaned.startsWith('0')) {
      cleaned = '+33' + cleaned.substring(1);
    }

    // Si le numéro ne commence pas par +, ajouter +33
    if (!cleaned.startsWith('+')) {
      cleaned = '+33' + cleaned;
    }

    return cleaned;
  }

  /**
   * Envoyer un message WhatsApp via Twilio
   * @param {string} to - Numéro du destinataire
   * @param {string} message - Message à envoyer
   * @returns {Promise<Object>}
   */
  async sendViaTwilio(to, message) {
    if (!this.twilioAccountSid || !this.twilioAuthToken || !this.twilioWhatsAppNumber) {
      throw new Error('Configuration Twilio incomplète');
    }

    const formattedTo = this.formatPhoneNumber(to);

    try {
      const response = await this.axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
        new URLSearchParams({
          From: this.twilioWhatsAppNumber,
          To: `whatsapp:${formattedTo}`,
          Body: message
        }),
        {
          auth: {
            username: this.twilioAccountSid,
            password: this.twilioAuthToken
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.sid,
        status: response.data.status
      };
    } catch (error) {
      console.error('Erreur Twilio WhatsApp:', error.response?.data || error.message);
      throw new Error(`Erreur Twilio: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Envoyer un message WhatsApp via Meta (WhatsApp Business API)
   * @param {string} to - Numéro du destinataire
   * @param {string} message - Message à envoyer
   * @returns {Promise<Object>}
   */
  async sendViaMeta(to, message) {
    if (!this.metaAccessToken || !this.metaPhoneNumberId) {
      throw new Error('Configuration Meta WhatsApp incomplète');
    }

    const formattedTo = this.formatPhoneNumber(to).replace('+', '');

    try {
      const response = await this.axios.post(
        `https://graph.facebook.com/v18.0/${this.metaPhoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedTo,
          type: 'text',
          text: {
            preview_url: false,
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.metaAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0].id,
        status: 'sent'
      };
    } catch (error) {
      console.error('Erreur Meta WhatsApp:', error.response?.data || error.message);
      throw new Error(`Erreur Meta WhatsApp: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Envoyer un message WhatsApp avec template (Meta uniquement)
   * @param {string} to - Numéro du destinataire
   * @param {string} templateName - Nom du template approuvé
   * @param {Array} components - Composants du template
   * @returns {Promise<Object>}
   */
  async sendTemplate(to, templateName, components = []) {
    if (!this.metaAccessToken || !this.metaPhoneNumberId) {
      throw new Error('Configuration Meta WhatsApp incomplète');
    }

    const formattedTo = this.formatPhoneNumber(to).replace('+', '');

    try {
      const response = await this.axios.post(
        `https://graph.facebook.com/v18.0/${this.metaPhoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formattedTo,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: 'fr'
            },
            components: components
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.metaAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0].id,
        status: 'sent'
      };
    } catch (error) {
      console.error('Erreur template Meta WhatsApp:', error.response?.data || error.message);
      throw new Error(`Erreur template: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Générer un lien WhatsApp avec message pré-rempli
   * @param {string} to - Numéro du destinataire
   * @param {string} message - Message à envoyer
   * @returns {string} - Lien wa.me
   */
  generateWhatsAppLink(to, message) {
    const formattedPhone = this.formatPhoneNumber(to);
    const encodedMessage = encodeURIComponent(message);
    // Retirer le + du numéro pour le lien wa.me
    const phoneForLink = formattedPhone.replace('+', '');
    return `https://wa.me/${phoneForLink}?text=${encodedMessage}`;
  }

  /**
   * Envoyer un message WhatsApp (méthode principale)
   * @param {Object} options
   * @param {string} options.to - Numéro du destinataire
   * @param {string} options.message - Message à envoyer
   * @returns {Promise<Object>}
   */
  async sendMessage({ to, message }) {
    // Générer le lien WhatsApp (mode par défaut - pas d'API)
    const whatsappLink = this.generateWhatsAppLink(to, message);

    console.log(`📱 [WhatsApp Link] To: ${to}`);
    console.log(`🔗 Lien: ${whatsappLink}`);

    return {
      success: true,
      link: whatsappLink,
      message: 'Lien WhatsApp généré'
    };
  }

  /**
   * Envoyer une confirmation de rendez-vous via WhatsApp
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async sendAppointmentConfirmation(options) {
    const { to, firstName, serviceName, date, time, salonName } = options;

    const message = `Bonjour ${firstName},

Votre rendez-vous a été confirmé ✓

📅 Service: ${serviceName}
📆 Date: ${date}
🕐 Heure: ${time}
📍 Salon: ${salonName}

À bientôt !`;

    return await this.sendMessage({ to, message });
  }

  /**
   * Envoyer un rappel de rendez-vous via WhatsApp
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async sendAppointmentReminder(options) {
    const { to, firstName, serviceName, date, time, salonName } = options;

    const message = `Bonjour ${firstName},

⏰ Rappel de votre rendez-vous demain

📅 Service: ${serviceName}
📆 Date: ${date}
🕐 Heure: ${time}
📍 Salon: ${salonName}

À très bientôt !`;

    return await this.sendMessage({ to, message });
  }

  /**
   * Envoyer un message personnalisé via WhatsApp
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async sendCustomMessage(options) {
    const { to, firstName, lastName, message } = options;

    const fullMessage = `Bonjour ${firstName} ${lastName},

${message}

Cordialement,
Votre salon`;

    return await this.sendMessage({ to, message: fullMessage });
  }
}

module.exports = new WhatsAppService();
