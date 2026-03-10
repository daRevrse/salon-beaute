/**
 * Business Type Configuration Utility
 * Centralized configuration for multi-sector platform
 * Provides terminology, colors, icons, and labels for each business type
 */

import {
  ScissorsIcon,
  BuildingStorefrontIcon,
  AcademicCapIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";

// Business Type Configuration
export const BUSINESS_TYPE_CONFIG = {
  beauty: {
    // Identity
    id: "beauty",
    label: "Beauté & Bien-être",
    shortLabel: "Beauté",
    description: "Salons de coiffure, instituts, spa, barbershops",
    icon: ScissorsIcon,

    // Colors (Violet)
    primaryColor: "violet",
    gradient: "from-violet-500 to-indigo-600",
    cardGradient: "from-violet-500 to-violet-600",
    lightBg: "bg-violet-50",
    mediumBg: "bg-violet-100",
    textColor: "text-violet-600",
    darkTextColor: "text-violet-700",
    borderColor: "border-violet-500",
    lightBorderColor: "border-violet-200",
    hoverBg: "hover:bg-violet-50",
    activeBg: "bg-violet-50",
    activeText: "text-violet-700",
    activeBorder: "border-violet-600",
    ringColor: "ring-violet-500",
    focusRing: "focus:ring-violet-500",

    // Terminology
    terminology: {
      // Services
      service: "Service",
      services: "Services",
      servicesActive: "Services actifs",
      serviceAdd: "Ajouter un service",
      serviceEdit: "Modifier le service",
      serviceDelete: "Supprimer le service",
      serviceDuration: "Durée",
      servicePrice: "Tarif",
      serviceCategory: "Catégorie",
      noServices: "Aucun service",

      // Appointments
      appointment: "Rendez-vous",
      appointments: "Rendez-vous",
      appointmentToday: "RDV aujourd'hui",
      appointmentNew: "Nouveau rendez-vous",
      appointmentEdit: "Modifier le rendez-vous",
      appointmentCancel: "Annuler le rendez-vous",
      appointmentConfirm: "Confirmer le rendez-vous",
      appointmentComplete: "Marquer comme terminé",
      noAppointments: "Aucun rendez-vous",
      pendingAppointments: "En attente",

      // Clients
      client: "Client",
      clients: "Clients",
      clientAdd: "Ajouter un client",
      clientEdit: "Modifier le client",
      clientHistory: "Historique",
      noClients: "Aucun client",

      // Staff
      staff: "Personnel",
      staffMember: "Employé",
      staffAdd: "Ajouter un employé",

      // Establishment
      establishment: "Salon",
      establishmentName: "Nom du salon",

      // Actions
      book: "Réserver",
      bookOnline: "Réserver en ligne",
      viewPlanning: "Voir le planning",
      manageServices: "Gérer les services",
      manageClients: "Gérer les clients",
    },

    // Welcome message
    welcomeMessage: "Voici un aperçu de votre salon.",
    bookingWelcome: "Réservez votre rendez-vous beauté",
    bookingSubtitle: "Prenez soin de vous avec nos professionnels",
  },

  restaurant: {
    // Identity
    id: "restaurant",
    label: "Restauration",
    shortLabel: "Restaurant",
    description: "Restaurants, cafés, bars, traiteurs",
    icon: BuildingStorefrontIcon,

    // Colors (Amber/Orange)
    primaryColor: "amber",
    gradient: "from-amber-500 to-orange-600",
    cardGradient: "from-amber-500 to-amber-600",
    lightBg: "bg-amber-50",
    mediumBg: "bg-amber-100",
    textColor: "text-amber-600",
    darkTextColor: "text-amber-700",
    borderColor: "border-amber-500",
    lightBorderColor: "border-amber-200",
    hoverBg: "hover:bg-amber-50",
    activeBg: "bg-amber-50",
    activeText: "text-amber-700",
    activeBorder: "border-amber-600",
    ringColor: "ring-amber-500",
    focusRing: "focus:ring-amber-500",

    // Terminology
    terminology: {
      // Services (Menu items)
      service: "Plat",
      services: "Menu",
      servicesActive: "Plats au menu",
      serviceAdd: "Ajouter un plat",
      serviceEdit: "Modifier le plat",
      serviceDelete: "Supprimer le plat",
      serviceDuration: "Temps de préparation",
      servicePrice: "Prix",
      serviceCategory: "Catégorie",
      noServices: "Aucun plat au menu",

      // Appointments (Reservations)
      appointment: "Réservation",
      appointments: "Réservations",
      appointmentToday: "Réservations du jour",
      appointmentNew: "Nouvelle réservation",
      appointmentEdit: "Modifier la réservation",
      appointmentCancel: "Annuler la réservation",
      appointmentConfirm: "Confirmer la réservation",
      appointmentComplete: "Marquer comme terminée",
      noAppointments: "Aucune réservation",
      pendingAppointments: "À confirmer",

      // Clients
      client: "Client",
      clients: "Clients",
      clientAdd: "Ajouter un client",
      clientEdit: "Modifier le client",
      clientHistory: "Historique des visites",
      noClients: "Aucun client",

      // Staff
      staff: "Personnel",
      staffMember: "Employé",
      staffAdd: "Ajouter un employé",

      // Establishment
      establishment: "Restaurant",
      establishmentName: "Nom du restaurant",

      // Actions
      book: "Réserver",
      bookOnline: "Réserver une table",
      viewPlanning: "Voir les réservations",
      manageServices: "Gérer le menu",
      manageClients: "Gérer les clients",
    },

    // Welcome message
    welcomeMessage: "Voici un aperçu de votre restaurant.",
    bookingWelcome: "Réservez votre table",
    bookingSubtitle: "Une expérience culinaire vous attend",
  },

  training: {
    // Identity
    id: "training",
    label: "Formation",
    shortLabel: "Formation",
    description: "Centres de formation, écoles, coaching",
    icon: AcademicCapIcon,

    // Colors (Emerald/Green)
    primaryColor: "emerald",
    gradient: "from-emerald-500 to-green-600",
    cardGradient: "from-emerald-500 to-emerald-600",
    lightBg: "bg-emerald-50",
    mediumBg: "bg-emerald-100",
    textColor: "text-emerald-600",
    darkTextColor: "text-emerald-700",
    borderColor: "border-emerald-500",
    lightBorderColor: "border-emerald-200",
    hoverBg: "hover:bg-emerald-50",
    activeBg: "bg-emerald-50",
    activeText: "text-emerald-700",
    activeBorder: "border-emerald-600",
    ringColor: "ring-emerald-500",
    focusRing: "focus:ring-emerald-500",

    // Terminology
    terminology: {
      // Services (Formations)
      service: "Formation",
      services: "Formations",
      servicesActive: "Formations actives",
      serviceAdd: "Ajouter une formation",
      serviceEdit: "Modifier la formation",
      serviceDelete: "Supprimer la formation",
      serviceDuration: "Durée",
      servicePrice: "Tarif",
      serviceCategory: "Catégorie",
      noServices: "Aucune formation",

      // Appointments (Sessions)
      appointment: "Session",
      appointments: "Sessions",
      appointmentToday: "Sessions du jour",
      appointmentNew: "Nouvelle session",
      appointmentEdit: "Modifier la session",
      appointmentCancel: "Annuler la session",
      appointmentConfirm: "Confirmer l'inscription",
      appointmentComplete: "Marquer comme terminée",
      noAppointments: "Aucune session",
      pendingAppointments: "À valider",

      // Clients (Participants)
      client: "Participant",
      clients: "Participants",
      clientAdd: "Ajouter un participant",
      clientEdit: "Modifier le participant",
      clientHistory: "Historique des formations",
      noClients: "Aucun participant",

      // Staff (Formateurs)
      staff: "Formateurs",
      staffMember: "Formateur",
      staffAdd: "Ajouter un formateur",

      // Establishment
      establishment: "Centre de formation",
      establishmentName: "Nom du centre",

      // Actions
      book: "S'inscrire",
      bookOnline: "S'inscrire en ligne",
      viewPlanning: "Voir le planning",
      manageServices: "Gérer les formations",
      manageClients: "Gérer les participants",
    },

    // Welcome message
    welcomeMessage: "Voici un aperçu de votre centre de formation.",
    bookingWelcome: "Inscrivez-vous à nos formations",
    bookingSubtitle: "Développez vos compétences avec nos experts",
  },

  medical: {
    // Identity
    id: "medical",
    label: "Santé & Médical",
    shortLabel: "Médical",
    description: "Cabinets médicaux, cliniques, praticiens",
    icon: HeartIcon,

    // Colors (Cyan/Teal)
    primaryColor: "cyan",
    gradient: "from-cyan-500 to-teal-600",
    cardGradient: "from-cyan-500 to-cyan-600",
    lightBg: "bg-cyan-50",
    mediumBg: "bg-cyan-100",
    textColor: "text-cyan-600",
    darkTextColor: "text-cyan-700",
    borderColor: "border-cyan-500",
    lightBorderColor: "border-cyan-200",
    hoverBg: "hover:bg-cyan-50",
    activeBg: "bg-cyan-50",
    activeText: "text-cyan-700",
    activeBorder: "border-cyan-600",
    ringColor: "ring-cyan-500",
    focusRing: "focus:ring-cyan-500",

    // Terminology
    terminology: {
      // Services (Prestations)
      service: "Prestation",
      services: "Prestations",
      servicesActive: "Prestations disponibles",
      serviceAdd: "Ajouter une prestation",
      serviceEdit: "Modifier la prestation",
      serviceDelete: "Supprimer la prestation",
      serviceDuration: "Durée",
      servicePrice: "Tarif",
      serviceCategory: "Spécialité",
      noServices: "Aucune prestation",

      // Appointments (Consultations)
      appointment: "Consultation",
      appointments: "Consultations",
      appointmentToday: "Consultations du jour",
      appointmentNew: "Nouvelle consultation",
      appointmentEdit: "Modifier la consultation",
      appointmentCancel: "Annuler la consultation",
      appointmentConfirm: "Confirmer la consultation",
      appointmentComplete: "Marquer comme terminée",
      noAppointments: "Aucune consultation",
      pendingAppointments: "En attente",

      // Clients (Patients)
      client: "Patient",
      clients: "Patients",
      clientAdd: "Ajouter un patient",
      clientEdit: "Modifier le dossier",
      clientHistory: "Historique médical",
      noClients: "Aucun patient",

      // Staff (Praticiens)
      staff: "Praticiens",
      staffMember: "Praticien",
      staffAdd: "Ajouter un praticien",

      // Establishment
      establishment: "Cabinet",
      establishmentName: "Nom du cabinet",

      // Actions
      book: "Prendre RDV",
      bookOnline: "Prendre rendez-vous",
      viewPlanning: "Voir les consultations",
      manageServices: "Gérer les prestations",
      manageClients: "Gérer les patients",
    },

    // Welcome message
    welcomeMessage: "Voici un aperçu de votre cabinet.",
    bookingWelcome: "Prenez rendez-vous",
    bookingSubtitle: "Votre santé est notre priorité",
  },
};

/**
 * Get business type configuration
 * @param {string} businessType - The business type (beauty, restaurant, training, medical)
 * @returns {object} The configuration object for the business type
 */
export const getBusinessTypeConfig = (businessType) => {
  return BUSINESS_TYPE_CONFIG[businessType] || BUSINESS_TYPE_CONFIG.beauty;
};

/**
 * Get terminology for a specific business type
 * @param {string} businessType - The business type
 * @param {string} key - The terminology key
 * @returns {string} The terminology value
 */
export const getTerm = (businessType, key) => {
  const config = getBusinessTypeConfig(businessType);
  return config.terminology[key] || key;
};

/**
 * Get the icon component for a business type
 * @param {string} businessType - The business type
 * @returns {React.Component} The icon component
 */
export const getBusinessTypeIcon = (businessType) => {
  const config = getBusinessTypeConfig(businessType);
  return config.icon;
};

/**
 * Get color classes for a business type
 * @param {string} businessType - The business type
 * @returns {object} Object with color class properties
 */
export const getBusinessTypeColors = (businessType) => {
  const config = getBusinessTypeConfig(businessType);
  return {
    gradient: config.gradient,
    cardGradient: config.cardGradient,
    lightBg: config.lightBg,
    mediumBg: config.mediumBg,
    textColor: config.textColor,
    darkTextColor: config.darkTextColor,
    borderColor: config.borderColor,
    lightBorderColor: config.lightBorderColor,
    hoverBg: config.hoverBg,
    activeBg: config.activeBg,
    activeText: config.activeText,
    activeBorder: config.activeBorder,
    ringColor: config.ringColor,
    focusRing: config.focusRing,
  };
};

// Export default for easy import
export default BUSINESS_TYPE_CONFIG;
