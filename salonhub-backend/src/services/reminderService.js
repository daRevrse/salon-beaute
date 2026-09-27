/**
 * Service de rappels automatiques
 * Envoie des rappels par email avant les rendez-vous
 */

const db = require("../config/database");
const emailService = require("./emailService");
const pushService = require("./pushService");
const bookingLinks = require("./bookingLinks");

/**
 * Réservations de plusieurs prestations : un seul rappel, envoyé pour la
 * première prestation du groupe, avec la liste de toutes les prestations.
 */
const groupSqlFragments = async () => {
  if (!(await bookingLinks.hasBookingGroupColumn())) return { select: "", filter: "" };
  return {
    select: `,
          (SELECT GROUP_CONCAT(gs.name ORDER BY ga.start_time, ga.id SEPARATOR ' + ')
           FROM appointments ga JOIN services gs ON gs.id = ga.service_id
           WHERE a.booking_group IS NOT NULL AND ga.tenant_id = a.tenant_id
             AND ga.booking_group = a.booking_group
             AND ga.status IN ('pending', 'confirmed')) AS group_service_names`,
    filter: `
          AND (a.booking_group IS NULL OR NOT EXISTS (
            SELECT 1 FROM appointments gf
            WHERE gf.tenant_id = a.tenant_id AND gf.booking_group = a.booking_group
              AND gf.status IN ('pending', 'confirmed')
              AND gf.appointment_date = a.appointment_date
              AND (gf.start_time < a.start_time OR (gf.start_time = a.start_time AND gf.id < a.id))
          ))`,
  };
};

class ReminderService {
  /**
   * Vérifie si un rappel a déjà été envoyé
   */
  async hasReminderBeenSent(appointmentId, reminderType, channel = "email") {
    const result = await db.query(
      `SELECT id FROM reminder_logs
       WHERE appointment_id = ? AND reminder_type = ? AND channel = ? AND status = 'sent'`,
      [appointmentId, reminderType, channel]
    );
    return result.length > 0;
  }

  /**
   * Enregistre l'envoi d'un rappel
   */
  async logReminder(
    tenantId,
    appointmentId,
    clientId,
    reminderType,
    channel = "email",
    status = "sent",
    errorMessage = null
  ) {
    try {
      await db.query(
        `INSERT INTO reminder_logs
         (tenant_id, appointment_id, client_id, reminder_type, channel, status, error_message, sent_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          tenantId,
          appointmentId,
          clientId,
          reminderType,
          channel,
          status,
          errorMessage,
        ]
      );
    } catch (error) {
      console.error("❌ Erreur lors de l'enregistrement du rappel:", error);
    }
  }

  /**
   * Envoie les rappels 24h avant le rendez-vous
   */
  async send24HourReminders() {
    try {
      console.log("🔔 Vérification des rappels 24h...");
      const group = await groupSqlFragments();

      // Récupérer tous les RDV confirmés dans 24h (+/- 30 minutes)
      const appointments = await db.query(
        `SELECT
          a.id as appointment_id,
          a.tenant_id,
          a.appointment_date,
          a.start_time,
          a.end_time,
          c.id as client_id,
          c.first_name as client_first_name,
          c.last_name as client_last_name,
          c.email as client_email,
          c.phone as client_phone,
          s.name as service_name,
          s.duration as service_duration,
          t.name as salon_name,
          t.phone as salon_phone,
          t.address as salon_address,
          t.slug as salon_slug${group.select}
        FROM appointments a
        JOIN clients c ON a.client_id = c.id
        JOIN services s ON a.service_id = s.id
        JOIN tenants t ON a.tenant_id = t.id
        WHERE a.status IN ('pending', 'confirmed')
          AND a.appointment_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
          AND a.start_time BETWEEN
            TIME(DATE_ADD(NOW(), INTERVAL 1410 MINUTE)) 
            AND TIME(DATE_ADD(NOW(), INTERVAL 1470 MINUTE))${group.filter}
        ORDER BY a.appointment_date, a.start_time`
      );

      console.log(
        `📊 ${appointments.length} rendez-vous trouvés pour rappels 24h`
      );

      let sent = 0;
      let skipped = 0;
      let failed = 0;

      for (const apt of appointments) {
        // Vérifier si le rappel a déjà été envoyé
        const alreadySent = await this.hasReminderBeenSent(
          apt.appointment_id,
          "24h_before",
          "email"
        );

        if (alreadySent) {
          skipped++;
          continue;
        }

        // Envoyer le rappel si le client a un email
        if (apt.client_email) {
          try {
            const formattedDate = new Date(
              apt.appointment_date
            ).toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            const formattedTime = apt.start_time.substring(0, 5);

            // Lien pour déplacer / annuler en ligne (la veille, c'est encore possible)
            let manageUrl = null;
            try {
              const token = await bookingLinks.ensureManageToken(apt.appointment_id);
              manageUrl = bookingLinks.getManageUrl(apt.salon_slug, token);
            } catch (linkError) {
              console.error("Lien de gestion indisponible:", linkError.message);
            }

            // Envoyer l'email
            await emailService.sendAppointmentReminder({
              to: apt.client_email,
              firstName: apt.client_first_name,
              appointmentDate: formattedDate,
              appointmentTime: formattedTime,
              serviceName: apt.group_service_names || apt.service_name,
              salonName: apt.salon_name,
              salonPhone: apt.salon_phone,
              salonAddress: apt.salon_address,
              hoursBeforeText: "demain à la même heure",
              manageUrl,
            });

            // Enregistrer l'envoi email
            await this.logReminder(
              apt.tenant_id,
              apt.appointment_id,
              apt.client_id,
              "24h_before",
              "email",
              "sent"
            );

            // Envoyer la notification push
            try {
              await pushService.sendToClient(apt.client_id, {
                title: "Rappel de rendez-vous demain",
                body: `${apt.group_service_names || apt.service_name} chez ${apt.salon_name} à ${formattedTime}`,
                icon: "/logo192.png",
                badge: "/logo192.png",
                tag: `reminder-24h-${apt.appointment_id}`,
                data: {
                  url: `/appointments/${apt.appointment_id}`,
                  appointmentId: apt.appointment_id,
                },
              });

              // Enregistrer l'envoi push
              await this.logReminder(
                apt.tenant_id,
                apt.appointment_id,
                apt.client_id,
                "24h_before",
                "push",
                "sent"
              );
            } catch (pushError) {
              console.error(
                `⚠️  Erreur push 24h pour RDV ${apt.appointment_id}:`,
                pushError.message
              );
              // Ne pas bloquer si le push échoue
            }

            sent++;
            console.log(
              `✅ Rappel 24h envoyé à ${apt.client_first_name} ${apt.client_last_name}`
            );
          } catch (error) {
            failed++;
            console.error(
              `❌ Erreur envoi rappel 24h pour RDV ${apt.appointment_id}:`,
              error.message
            );

            // Enregistrer l'échec
            await this.logReminder(
              apt.tenant_id,
              apt.appointment_id,
              apt.client_id,
              "24h_before",
              "email",
              "failed",
              error.message
            );
          }
        }
      }

      console.log(
        `📊 Rappels 24h : ${sent} envoyés, ${skipped} déjà envoyés, ${failed} échecs`
      );

      return { sent, skipped, failed };
    } catch (error) {
      console.error("❌ Erreur dans send24HourReminders:", error);
      throw error;
    }
  }

  /**
   * Envoie les rappels 2h avant le rendez-vous
   */
  async send2HourReminders() {
    try {
      console.log("🔔 Vérification des rappels 2h...");
      const group = await groupSqlFragments();

      // Récupérer tous les RDV confirmés dans 2h (+/- 15 minutes)
      const appointments = await db.query(
        `SELECT
          a.id as appointment_id,
          a.tenant_id,
          a.appointment_date,
          a.start_time,
          a.end_time,
          c.id as client_id,
          c.first_name as client_first_name,
          c.last_name as client_last_name,
          c.email as client_email,
          c.phone as client_phone,
          s.name as service_name,
          s.duration as service_duration,
          t.name as salon_name,
          t.phone as salon_phone,
          t.address as salon_address${group.select}
        FROM appointments a
        JOIN clients c ON a.client_id = c.id
        JOIN services s ON a.service_id = s.id
        JOIN tenants t ON a.tenant_id = t.id
        WHERE a.status IN ('pending', 'confirmed')
          AND a.appointment_date = CURDATE()
          AND a.start_time BETWEEN
            TIME(DATE_ADD(NOW(), INTERVAL 105 MINUTE))
            AND TIME(DATE_ADD(NOW(), INTERVAL 135 MINUTE))${group.filter}
        ORDER BY a.appointment_date, a.start_time`
      );

      console.log(
        `📊 ${appointments.length} rendez-vous trouvés pour rappels 2h`
      );

      let sent = 0;
      let skipped = 0;
      let failed = 0;

      for (const apt of appointments) {
        const alreadySent = await this.hasReminderBeenSent(
          apt.appointment_id,
          "2h_before",
          "email"
        );

        if (alreadySent) {
          skipped++;
          continue;
        }

        if (apt.client_email) {
          try {
            const formattedDate = new Date(
              apt.appointment_date
            ).toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            const formattedTime = apt.start_time.substring(0, 5);

            // Envoyer l'email
            await emailService.sendAppointmentReminder({
              to: apt.client_email,
              firstName: apt.client_first_name,
              appointmentDate: formattedDate,
              appointmentTime: formattedTime,
              serviceName: apt.group_service_names || apt.service_name,
              salonName: apt.salon_name,
              salonPhone: apt.salon_phone,
              salonAddress: apt.salon_address,
              hoursBeforeText: "dans 2 heures",
            });

            // Enregistrer l'envoi email
            await this.logReminder(
              apt.tenant_id,
              apt.appointment_id,
              apt.client_id,
              "2h_before",
              "email",
              "sent"
            );

            // Envoyer la notification push
            try {
              await pushService.sendToClient(apt.client_id, {
                title: "Rappel de rendez-vous dans 2h",
                body: `${apt.group_service_names || apt.service_name} chez ${apt.salon_name} à ${formattedTime}`,
                icon: "/logo192.png",
                badge: "/logo192.png",
                tag: `reminder-2h-${apt.appointment_id}`,
                requireInteraction: true,
                data: {
                  url: `/appointments/${apt.appointment_id}`,
                  appointmentId: apt.appointment_id,
                },
              });

              // Enregistrer l'envoi push
              await this.logReminder(
                apt.tenant_id,
                apt.appointment_id,
                apt.client_id,
                "2h_before",
                "push",
                "sent"
              );
            } catch (pushError) {
              console.error(
                `⚠️  Erreur push 2h pour RDV ${apt.appointment_id}:`,
                pushError.message
              );
              // Ne pas bloquer si le push échoue
            }

            sent++;
            console.log(
              `✅ Rappel 2h envoyé à ${apt.client_first_name} ${apt.client_last_name}`
            );
          } catch (error) {
            failed++;
            console.error(
              `❌ Erreur envoi rappel 2h pour RDV ${apt.appointment_id}:`,
              error.message
            );

            await this.logReminder(
              apt.tenant_id,
              apt.appointment_id,
              apt.client_id,
              "2h_before",
              "email",
              "failed",
              error.message
            );
          }
        }
      }

      console.log(
        `📊 Rappels 2h : ${sent} envoyés, ${skipped} déjà envoyés, ${failed} échecs`
      );

      return { sent, skipped, failed };
    } catch (error) {
      console.error("❌ Erreur dans send2HourReminders:", error);
      throw error;
    }
  }

  /**
   * Nettoie les anciens logs de rappels (> 90 jours)
   */
  async cleanOldLogs() {
    try {
      const result = await db.query(
        `DELETE FROM reminder_logs
         WHERE sent_at < DATE_SUB(NOW(), INTERVAL 90 DAY)`
      );

      console.log(
        `🧹 ${result.affectedRows} anciens logs de rappels supprimés`
      );
      return result.affectedRows;
    } catch (error) {
      console.error("❌ Erreur lors du nettoyage des logs:", error);
      throw error;
    }
  }
}

module.exports = new ReminderService();
