/**
 * ImageUploader Component
 * Gère la sélection et l'upload réel d'une image avec FormData
 */

import { useState, useRef } from "react";
import api from "../../services/api";
import {
  PhotoIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const API_URL = process.env.REACT_APP_API_URL;

const ImageUploader = ({
  target,
  imageUrl,
  onImageUpload,
  label,
  onDelete,
  aspectRatio = "aspect-[4/3]",
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadFile(file);
    }
  };

  const uploadFile = async (file) => {
    // Validation taille
    if (file.size > 5 * 1024 * 1024) {
      // Max 5MB
      setError("L'image est trop volumineuse (max 5MB)");
      return;
    }

    // Validation type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("Seules les images JPEG, PNG, GIF et WebP sont autorisées");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Créer FormData
      const formData = new FormData();
      formData.append("image", file);

      // Upload avec FormData
      const response = await api.post(`/uploads/${target}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        // Construire l'URL complète
        const fullImageUrl = `${API_URL}${response.data.data.url}`;
        onImageUpload(fullImageUrl);
      } else {
        setError(response.data.error || "Erreur d'upload");
      }
    } catch (err) {
      console.error("Erreur upload:", err);
      setError(err.response?.data?.error || "Erreur lors de l'upload");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!imageUrl) return;

    try {
      setLoading(true);
      setError(null);

      // Extraire l'URL relative
      const relativeUrl = imageUrl.replace(API_URL, "");

      await api.delete("/uploads", {
        data: { url: relativeUrl },
      });

      onDelete();
    } catch (err) {
      console.error("Erreur suppression:", err);
      setError("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div
        className={`relative w-full overflow-hidden rounded-lg border-2 ${
          imageUrl ? "border-gray-200" : "border-dashed border-gray-300"
        }`}
      >
        {/* Input File caché */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          className="hidden"
          disabled={loading}
        />

        {/* Image Display / Placeholder */}
        <div
          className={`w-full ${aspectRatio} flex items-center justify-center bg-gray-50`}
        >
          {imageUrl && !loading ? (
            <img
              src={imageUrl}
              alt="Uploaded"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src =
                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
              }}
            />
          ) : loading ? (
            <div className="flex flex-col items-center justify-center p-6">
              <ArrowPathIcon className="h-6 w-6 animate-spin text-indigo-500" />
              <p className="mt-2 text-sm text-indigo-600">Upload en cours...</p>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-gray-100 transition-colors w-full h-full"
              onClick={() => fileInputRef.current.click()}
            >
              <PhotoIcon className="h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Cliquez pour ajouter une image
              </p>
              <p className="text-xs text-gray-400 mt-1">
                (Max 5MB - JPEG, PNG, GIF, WebP)
              </p>
            </div>
          )}
        </div>

        {/* Overlay / Actions */}
        {imageUrl && !loading && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 mx-2 shadow-lg"
              title="Changer l'image"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 mx-2 shadow-lg"
              title="Supprimer l'image"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
