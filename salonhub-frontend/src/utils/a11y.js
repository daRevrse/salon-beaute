/**
 * Accessibilité clavier des éléments cliquables qui ne sont pas des boutons
 * (zone de dépôt d'image, élément de liste...) :
 *   <div {...clickableProps(handler, "Ajouter une image")}>
 * → focusable au clavier, activable avec Entrée ou Espace, annoncé comme bouton.
 */
export const clickableProps = (handler, label) => ({
  role: "button",
  tabIndex: 0,
  onClick: handler,
  onKeyDown: (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handler(event);
    }
  },
  ...(label ? { "aria-label": label } : {}),
});
