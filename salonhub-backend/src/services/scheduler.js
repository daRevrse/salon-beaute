/**
 * Scheduler principal pour les tâches automatisées
 * Utilise node-cron pour planifier les rappels et autres tâches récurrentes
 */

const cron = require("node-cron");
const reminderService = require("./reminderService");

class Scheduler {
  constructor() {
    this.tasks = [];
    this.isRunning = false;
  }

  /**
   * Démarre tous les schedulers
   */
  start() {
    if (this.isRunning) {
      console.log("⚠️  Scheduler déjà démarré");
      return;
    }

    console.log("⏰ Démarrage du scheduler...");

    // === RAPPELS 24H AVANT ===
    // Tous les jours à 9h00
    const task24h = cron.schedule("0 9 * * *", async () => {
      console.log("\n🔔 [Cron] Exécution des rappels 24h (9h00)");
      try {
        await reminderService.send24HourReminders();
      } catch (error) {
        console.error("❌ Erreur dans le cron 24h:", error);
      }
    });
    this.tasks.push({ name: "Rappels 24h", task: task24h });

    // === RAPPELS 2H AVANT ===
    // Toutes les 30 minutes pendant les heures d'ouverture (8h-20h)
    const task2h = cron.schedule("*/30 8-20 * * *", async () => {
      console.log("\n🔔 [Cron] Vérification des rappels 2h (toutes les 30min)");
      try {
        await reminderService.send2HourReminders();
      } catch (error) {
        console.error("❌ Erreur dans le cron 2h:", error);
      }
    });
    this.tasks.push({ name: "Rappels 2h", task: task2h });

    // === NETTOYAGE DES ANCIENS LOGS ===
    // Tous les dimanches à 2h00
    const taskCleanup = cron.schedule("0 2 * * 0", async () => {
      console.log("\n🧹 [Cron] Nettoyage des anciens logs (dimanche 2h00)");
      try {
        await reminderService.cleanOldLogs();
      } catch (error) {
        console.error("❌ Erreur dans le nettoyage:", error);
      }
    });
    this.tasks.push({ name: "Nettoyage logs", task: taskCleanup });

    this.isRunning = true;
    console.log("✅ Scheduler démarré avec succès");
    console.log(`📋 ${this.tasks.length} tâches planifiées:`);
    console.log("   - Rappels 24h: Tous les jours à 9h00");
    console.log("   - Rappels 2h: Toutes les 30min (8h-20h)");
    console.log("   - Nettoyage logs: Dimanches à 2h00");
    console.log("");
  }

  /**
   * Arrête tous les schedulers
   */
  stop() {
    if (!this.isRunning) {
      console.log("⚠️  Scheduler non démarré");
      return;
    }

    console.log("🛑 Arrêt du scheduler...");
    this.tasks.forEach((t) => {
      t.task.stop();
    });
    this.tasks = [];
    this.isRunning = false;
    console.log("✅ Scheduler arrêté");
  }

  /**
   * Redémarre tous les schedulers
   */
  restart() {
    this.stop();
    this.start();
  }

  /**
   * Exécute manuellement les rappels 24h (pour tests)
   */
  async triggerManual24h() {
    console.log("🧪 [Test Manuel] Exécution des rappels 24h...");
    try {
      const result = await reminderService.send24HourReminders();
      console.log("✅ Rappels 24h terminés:", result);
      return result;
    } catch (error) {
      console.error("❌ Erreur rappels 24h:", error);
      throw error;
    }
  }

  /**
   * Exécute manuellement les rappels 2h (pour tests)
   */
  async triggerManual2h() {
    console.log("🧪 [Test Manuel] Exécution des rappels 2h...");
    try {
      const result = await reminderService.send2HourReminders();
      console.log("✅ Rappels 2h terminés:", result);
      return result;
    } catch (error) {
      console.error("❌ Erreur rappels 2h:", error);
      throw error;
    }
  }

  /**
   * Affiche l'état du scheduler
   */
  status() {
    return {
      isRunning: this.isRunning,
      tasksCount: this.tasks.length,
      tasks: this.tasks.map((t) => t.name),
    };
  }
}

// Export une instance unique (singleton)
module.exports = new Scheduler();
