/**
 * GalleryUploader Component
 * Manages multiple image uploads for service galleries
 */
import { useState, useRef } from "react";
import api from "../../services/api";
import { PhotoIcon, TrashIcon, PlusIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { getImageUrl } from "../../utils/imageUtils";

const GalleryUploader = ({
  images = [],
  onImagesChange,
  maxImages = 6,
  label = "Galerie photos"
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check max limit
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images autorisees`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const uploadedUrls = [];

      for (const file of files) {
        // Skip files larger than 5MB
        if (file.size > 5 * 1024 * 1024) {
          console.warn(`Fichier ${file.name} ignore (> 5MB)`);
          continue;
        }

        const formData = new FormData();
        formData.append("image", file);

        const response = await api.post("/uploads/service-gallery", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (response.data.success) {
          uploadedUrls.push(response.data.data.url);
        }
      }

      if (uploadedUrls.length > 0) {
        onImagesChange([...images, ...uploadedUrls]);
      }
    } catch (err) {
      console.error("Erreur upload galerie:", err);
      setError("Erreur lors de l'upload des images");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {/* Existing images */}
        {images.map((url, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-xl overflow-hidden border-2 border-slate-200 group"
          >
            <img
              src={getImageUrl(url)}
              alt={`Galerie ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))}

        {/* Add button */}
        {images.length < maxImages && (
          <div
            onClick={() => !loading && fileInputRef.current?.click()}
            className={`aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
              loading
                ? "bg-slate-100 cursor-not-allowed"
                : "hover:bg-slate-50 hover:border-violet-400"
            }`}
          >
            {loading ? (
              <ArrowPathIcon className="h-8 w-8 animate-spin text-slate-400" />
            ) : (
              <>
                <PlusIcon className="h-8 w-8 text-slate-400" />
                <span className="text-xs text-slate-500 mt-1">Ajouter</span>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <p className="text-xs text-slate-500">
        {images.length}/{maxImages} images (max 5MB par image)
      </p>
    </div>
  );
};

export default GalleryUploader;
