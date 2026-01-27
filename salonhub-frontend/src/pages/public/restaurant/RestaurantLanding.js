/**
 * RestaurantLanding.js - Page publique du restaurant
 * Affiche menu, infos, horaires + liens réservation/commande
 */

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  StarIcon,
  ShoppingBagIcon,
  CalendarDaysIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";

// Get base API URL - remove trailing /api if present for proper path construction
const RAW_API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const API_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL.slice(0, -4) : RAW_API_URL;

// Helper pour construire les URLs d'images (gère les URLs absolues et relatives)
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function RestaurantLanding() {
  const { slug } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    fetchRestaurantData();
  }, [slug]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);

      // Fetch restaurant info and menu in parallel
      const [infoRes, menuRes] = await Promise.all([
        fetch(`${API_URL}/api/public/restaurant/${slug}`),
        fetch(`${API_URL}/api/public/restaurant/${slug}/menu`)
      ]);

      if (!infoRes.ok) {
        throw new Error("Restaurant non trouvé");
      }

      const infoData = await infoRes.json();
      const menuData = await menuRes.json();

      setRestaurant(infoData.data);
      setMenu(menuData.data || []);

      if (menuData.data && menuData.data.length > 0) {
        setActiveCategory(menuData.data[0].category_id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Restaurant non trouvé</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 bg-gradient-to-r from-orange-600 to-red-600">
        {restaurant?.banner_url && (
          <img
            src={getImageUrl(restaurant.banner_url)}
            alt={restaurant.business_name || restaurant.name}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative h-full max-w-7xl mx-auto px-4 flex items-end pb-6">
          <div className="flex items-end gap-4">
            {restaurant?.logo_url && (
              <img
                src={getImageUrl(restaurant.logo_url)}
                alt={restaurant.business_name || restaurant.name}
                className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-white shadow-lg object-cover"
              />
            )}
            <div className="text-white pb-1">
              <h1 className="text-2xl md:text-3xl font-bold">{restaurant?.business_name || restaurant?.name}</h1>
              <p className="text-white/80 text-sm md:text-base">{restaurant?.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-3 gap-3">
          <Link
            to={`/r/${slug}/reserve`}
            className="bg-white rounded-xl shadow-md p-4 text-center hover:shadow-lg transition-shadow"
          >
            <CalendarDaysIcon className="w-8 h-8 mx-auto text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Réserver</span>
          </Link>
          <Link
            to={`/r/${slug}/order`}
            className="bg-white rounded-xl shadow-md p-4 text-center hover:shadow-lg transition-shadow"
          >
            <ShoppingBagIcon className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Commander</span>
          </Link>
          <Link
            to={`/r/${slug}/qr`}
            className="bg-white rounded-xl shadow-md p-4 text-center hover:shadow-lg transition-shadow"
          >
            <QrCodeIcon className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Scanner QR</span>
          </Link>
        </div>
      </div>

      {/* Info Section */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {restaurant?.address && (
              <div className="flex items-start gap-3">
                <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Adresse</p>
                  <p className="text-sm text-gray-600">{restaurant.address}</p>
                </div>
              </div>
            )}
            {restaurant?.phone && (
              <div className="flex items-start gap-3">
                <PhoneIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Téléphone</p>
                  <a href={`tel:${restaurant.phone}`} className="text-sm text-orange-600">
                    {restaurant.phone}
                  </a>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <ClockIcon className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Horaires</p>
                <p className="text-sm text-gray-600">
                  {restaurant?.opening_time || "11:00"} - {restaurant?.closing_time || "23:00"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Notre Menu</h2>
          </div>

          {/* Category Tabs */}
          {menu.length > 0 && (
            <div className="border-b border-gray-100 overflow-x-auto">
              <div className="flex gap-1 p-2 min-w-max">
                {menu.map((category) => (
                  <button
                    key={category.category_id}
                    onClick={() => setActiveCategory(category.category_id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      activeCategory === category.category_id
                        ? "bg-orange-100 text-orange-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {category.category_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="p-4">
            {menu.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Le menu sera bientôt disponible
              </p>
            ) : (
              menu
                .filter((cat) => cat.category_id === activeCategory)
                .map((category) => (
                  <div key={category.category_id}>
                    {category.description && (
                      <p className="text-sm text-gray-500 mb-4">{category.description}</p>
                    )}
                    <div className="space-y-4">
                      {category.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {item.image_url && (
                            <img
                              src={getImageUrl(item.image_url)}
                              alt={item.name}
                              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-medium text-gray-900">{item.name}</h3>
                              <span className="font-bold text-orange-600 whitespace-nowrap">
                                {parseFloat(item.price).toFixed(2)} {restaurant?.currency || "€"}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            <div className="flex gap-2 mt-2">
                              {item.is_vegetarian && (
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                  Végétarien
                                </span>
                              )}
                              {item.is_vegan && (
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                  Vegan
                                </span>
                              )}
                              {item.is_gluten_free && (
                                <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                                  Sans gluten
                                </span>
                              )}
                              {item.spicy_level > 0 && (
                                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                                  {"🌶️".repeat(item.spicy_level)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-4 py-6 text-center">
        <p className="text-sm text-gray-500">
          Powered by <span className="font-medium text-gray-700">SalonHub</span>
        </p>
      </div>
    </div>
  );
}
