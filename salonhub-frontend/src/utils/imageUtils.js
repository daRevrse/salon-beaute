/**
 * Utilitaires pour la gestion des images
 */

const API_BASE_URL = process.env.REACT_APP_API_URL;
const BACKEND_URL = API_BASE_URL.replace("api/", "");

/**
 * Construire l'URL complète d'une image
 * @param {string} imageUrl - L'URL relative de l'image (ex: /uploads/tenants/1-123456.jpg)
 * @returns {string} - L'URL complète de l'image
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;

  // Si c'est déjà une URL complète, la retourner telle quelle
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // Construire l'URL complète
  return `${BACKEND_URL}${imageUrl}`;
};

/**
 * Obtenir une image par défaut selon le type
 * @param {string} type - Le type d'image (avatar, logo, service)
 * @returns {string} - L'URL de l'image par défaut
 */
export const getDefaultImage = (type) => {
  const defaults = {
    avatar: "https://ui-avatars.com/api/?name=User&background=6366f1&color=fff",
    logo: "https://ui-avatars.com/api/?name=Salon&background=6366f1&color=fff&size=200",
    service:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
  };

  return defaults[type] || defaults.avatar;
};

/**
 * Composant Image avec fallback
 */
export const ImageWithFallback = ({
  src,
  alt,
  fallbackType = "avatar",
  className = "",
  ...props
}) => {
  const handleError = (e) => {
    e.target.src = getDefaultImage(fallbackType);
  };

  const imageUrl = getImageUrl(src) || getDefaultImage(fallbackType);

  return (
    <img
      src={imageUrl}
      alt={alt}
      onError={handleError}
      className={className}
      {...props}
    />
  );
};
