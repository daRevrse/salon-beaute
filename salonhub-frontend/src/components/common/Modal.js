/**
 * Modal - Fenêtre modale commune (accessible)
 *
 *  - role="dialog" + aria-modal, reliée à son titre (aria-labelledby)
 *  - Échap ou clic sur le fond pour fermer
 *  - le focus entre dans la fenêtre à l'ouverture, reste piégé au clavier
 *    (Tab / Maj+Tab) et revient à l'élément d'origine à la fermeture
 *  - défilement de la page bloqué pendant l'ouverture
 *  - sur mobile, la fenêtre s'ouvre en bas de l'écran (bottom sheet)
 *
 * Le focus initial va à l'élément marqué data-autofocus (ou initialFocusRef),
 * sinon à la fenêtre elle-même : le clavier virtuel ne s'ouvre pas d'office.
 */

import { useEffect, useId, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const SIZES = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

// Modales ouvertes (la dernière est au premier plan)
const stack = [];

/**
 * Comportement d'une fenêtre modale, réutilisable par les fenêtres à mise en
 * page spécifique (ex. reçu imprimable) : Échap, focus piégé puis restitué,
 * défilement de la page bloqué. panelRef pointe sur l'élément role="dialog"
 * (avec tabIndex={-1}).
 */
export const useModalBehavior = (panelRef, { open = true, onClose, initialFocusRef = null } = {}) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open || !panelRef.current) return undefined;
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement;
    stack.push(panel);
    if (stack.length === 1) {
      document.body.dataset.modalOverflow = document.body.style.overflow || "";
      document.body.style.overflow = "hidden";
    }

    const target =
      initialFocusRef?.current || panel.querySelector("[data-autofocus]") || panel;
    target.focus({ preventScroll: true });

    const onKeyDown = (event) => {
      if (stack[stack.length - 1] !== panel) return;
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...panel.querySelectorAll(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const index = stack.indexOf(panel);
      if (index !== -1) stack.splice(index, 1);
      if (stack.length === 0) {
        document.body.style.overflow = document.body.dataset.modalOverflow || "";
        delete document.body.dataset.modalOverflow;
      }
      if (previouslyFocused && typeof previouslyFocused.focus === "function" && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
    // Le focus initial ne se fait qu'à l'ouverture
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
};

const Modal = ({
  open = true,
  onClose,
  title,
  description,
  icon = null,
  size = "md",
  footer = null,
  children,
  role = "dialog",
  closeOnBackdrop = true,
  hideCloseButton = false,
  initialFocusRef = null,
  panelClassName = "",
  bodyClassName = "px-5 sm:px-6 py-5",
}) => {
  const panelRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  useModalBehavior(panelRef, { open, onClose, initialFocusRef });

  if (!open) return null;

  const handleBackdrop = (event) => {
    if (closeOnBackdrop && event.target === event.currentTarget) onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm">
      <div
        className="flex min-h-full items-end sm:items-center justify-center sm:p-4"
        onMouseDown={handleBackdrop}
      >
        <div
          ref={panelRef}
          role={role}
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          tabIndex={-1}
          className={`relative w-full ${SIZES[size] || SIZES.md} bg-white rounded-t-2xl sm:rounded-2xl shadow-soft-xl animate-scale-in focus:outline-none ${panelClassName}`}
        >
          {title && (
            <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-3 min-w-0">
                {icon && <div className="flex-shrink-0">{icon}</div>}
                <div className="min-w-0">
                  <h2 id={titleId} className="text-lg font-semibold text-slate-900 leading-snug">
                    {title}
                  </h2>
                  {description && (
                    <p id={descriptionId} className="mt-1 text-sm text-slate-500">
                      {description}
                    </p>
                  )}
                </div>
              </div>
              {!hideCloseButton && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fermer"
                  className="p-2 -m-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          <div className={bodyClassName}>{children}</div>

          {footer && (
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/70 sm:rounded-b-2xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
