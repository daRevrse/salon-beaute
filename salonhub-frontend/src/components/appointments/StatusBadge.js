/**
 * StatusBadge - Pastille de statut d'un rendez-vous (libellés et couleurs communs)
 */

import { STATUS_LABELS, STATUS_BADGE_STYLES } from "../../utils/appointmentUtils";

const SIZES = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
};

const StatusBadge = ({ status, size = "sm", className = "" }) => (
  <span
    className={`inline-flex items-center rounded-full font-medium whitespace-nowrap ${SIZES[size] || SIZES.sm} ${
      STATUS_BADGE_STYLES[status] || STATUS_BADGE_STYLES.no_show
    } ${className}`}
  >
    {STATUS_LABELS[status] || status}
  </span>
);

export default StatusBadge;
