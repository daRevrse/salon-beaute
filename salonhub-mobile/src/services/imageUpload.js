/**
 * Service d'upload d'images
 */
import api from './api';

/**
 * Upload une image vers le serveur
 * @param {string} imageUri - URI locale de l'image
 * @param {string} target - Type d'upload: 'tenant-logo', 'tenant-banner', 'user-avatar', 'service-image'
 * @returns {Promise<string>} URL de l'image uploadée
 */
export const uploadImage = async (imageUri, target) => {
  try {
    // Créer un FormData
    const formData = new FormData();

    // Extraire le nom et le type du fichier
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // Ajouter l'image au FormData
    formData.append('image', {
      uri: imageUri,
      name: filename,
      type: type,
    });

    // Envoyer la requête
    const response = await api.post(`/uploads/${target}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success && response.data.data.url) {
      return response.data.data.url;
    } else {
      throw new Error('Échec de l\'upload');
    }
  } catch (error) {
    console.error('Erreur upload image:', error);
    throw error;
  }
};
