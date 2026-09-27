/**
 * SALONHUB - Modal de confirmation
 * Modal réutilisable pour les actions sensibles (suppression, annulation...)
 * Le bouton "Annuler" reçoit le focus : Entrée ne déclenche pas l'action par mégarde.
 */

import React from "react";
import Modal from "./Modal";
import Spinner from "./Spinner";
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const TYPES = {
  danger: {
    button: "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    Icon: ExclamationTriangleIcon,
  },
  warning: {
    button: "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    Icon: ExclamationTriangleIcon,
  },
  info: {
    button: "bg-violet-600 hover:bg-violet-700 focus-visible:ring-violet-500",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    Icon: InformationCircleIcon,
  },
};

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  type = "danger",
  loading = false,
  children = null,
}) {
  const style = TYPES[type] || TYPES.danger;
  const { Icon } = style;

  return (
    <Modal
      open={isOpen}
      onClose={loading ? undefined : onClose}
      role="alertdialog"
      size="sm"
      title={title}
      description={message}
      hideCloseButton
      icon={
        <span className={`w-10 h-10 ${style.iconBg} rounded-full flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${style.iconColor}`} aria-hidden="true" />
        </span>
      }
      bodyClassName={children ? "px-5 sm:px-6 py-4" : "hidden"}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            data-autofocus
            className="btn-secondary w-full sm:w-auto"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`btn w-full sm:w-auto text-white ${style.button}`}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="text-white" label={null} />
                Chargement...
              </>
            ) : (
              confirmText
            )}
          </button>
        </>
      }
    >
      {children}
    </Modal>
  );
}

export default ConfirmModal;
