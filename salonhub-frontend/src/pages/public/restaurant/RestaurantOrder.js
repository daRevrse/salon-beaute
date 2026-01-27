/**
 * RestaurantOrder.js - Commande en ligne (Takeaway/Delivery)
 * Panier, checkout, suivi commande
 */

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  PlusIcon,
  MinusIcon,
  ShoppingCartIcon,
  XMarkIcon,
  CheckCircleIcon,
  TruckIcon,
  ShoppingBagIcon,
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

export default function RestaurantOrder() {
  const { slug } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [step, setStep] = useState(1); // 1: menu, 2: checkout, 3: confirmation
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    order_type: "takeaway", // takeaway or delivery
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    delivery_address: "",
    pickup_time: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    try {
      const [infoRes, menuRes] = await Promise.all([
        fetch(`${API_URL}/api/public/restaurant/${slug}`),
        fetch(`${API_URL}/api/public/restaurant/${slug}/menu`),
      ]);

      if (!infoRes.ok) throw new Error("Restaurant non trouvé");

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

  const addToCart = (item) => {
    const existingIndex = cart.findIndex((c) => c.id === item.id);
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    const existingIndex = cart.findIndex((c) => c.id === itemId);
    if (existingIndex > -1) {
      const newCart = [...cart];
      if (newCart[existingIndex].quantity > 1) {
        newCart[existingIndex].quantity -= 1;
        setCart(newCart);
      } else {
        setCart(cart.filter((c) => c.id !== itemId));
      }
    }
  };

  const getCartQuantity = (itemId) => {
    const item = cart.find((c) => c.id === itemId);
    return item ? item.quantity : 0;
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Generate pickup time options
  const getPickupTimeOptions = () => {
    const options = [];
    const now = new Date();
    const startMinutes = Math.ceil((now.getMinutes() + 30) / 15) * 15;
    now.setMinutes(startMinutes, 0, 0);

    for (let i = 0; i < 12; i++) {
      const time = new Date(now.getTime() + i * 15 * 60000);
      options.push(
        time.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      );
    }
    return options;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const orderData = {
        ...formData,
        items: cart.map((item) => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          notes: item.notes || "",
        })),
      };

      const res = await fetch(`${API_URL}/api/public/restaurant/${slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la commande");
      }

      setConfirmation(data.data);
      setStep(3);
      setCart([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error && !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/r/${slug}`} className="text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="font-bold text-gray-900">Commander</h1>
              <p className="text-sm text-gray-500">{restaurant?.business_name || restaurant?.name}</p>
            </div>
          </div>
          {step === 1 && cart.length > 0 && (
            <button
              onClick={() => setShowCart(true)}
              className="relative p-2 text-gray-600 hover:text-gray-900"
            >
              <ShoppingCartIcon className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-600 text-white text-xs rounded-full flex items-center justify-center">
                {getCartItemsCount()}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Step 1: Menu */}
      {step === 1 && (
        <>
          {/* Order Type Selection */}
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="bg-white rounded-xl shadow-md p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Mode de commande</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setFormData({ ...formData, order_type: "takeaway" })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-colors ${
                    formData.order_type === "takeaway"
                      ? "border-orange-600 bg-orange-50 text-orange-600"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <ShoppingBagIcon className="w-5 h-5" />
                  <span className="font-medium">À emporter</span>
                </button>
                <button
                  onClick={() => setFormData({ ...formData, order_type: "delivery" })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-colors ${
                    formData.order_type === "delivery"
                      ? "border-orange-600 bg-orange-50 text-orange-600"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <TruckIcon className="w-5 h-5" />
                  <span className="font-medium">Livraison</span>
                </button>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          {menu.length > 0 && (
            <div className="bg-white border-b border-gray-100 sticky top-16 z-10">
              <div className="max-w-4xl mx-auto overflow-x-auto">
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
            </div>
          )}

          {/* Menu Items */}
          <div className="max-w-4xl mx-auto px-4 py-4">
            {menu
              .filter((cat) => cat.category_id === activeCategory)
              .map((category) => (
                <div key={category.category_id} className="space-y-3">
                  {category.items
                    .filter((item) => item.is_available)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl shadow-md p-4 flex gap-4"
                      >
                        {item.image_url && (
                          <img
                            src={getImageUrl(item.image_url)}
                            alt={item.name}
                            className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-3">
                            <span className="font-bold text-orange-600">
                              {parseFloat(item.price).toFixed(2)} {restaurant?.currency || "€"}
                            </span>
                            {getCartQuantity(item.id) > 0 ? (
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                                >
                                  <MinusIcon className="w-4 h-4" />
                                </button>
                                <span className="font-medium w-6 text-center">
                                  {getCartQuantity(item.id)}
                                </span>
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center hover:bg-orange-700"
                                >
                                  <PlusIcon className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                              >
                                Ajouter
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
          </div>
        </>
      )}

      {/* Step 2: Checkout */}
      {step === 2 && (
        <div className="max-w-2xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <h2 className="font-bold text-gray-900 mb-4">Votre commande</h2>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{item.quantity}x</span>{" "}
                      <span>{item.name}</span>
                    </div>
                    <span className="font-medium">
                      {(parseFloat(item.price) * item.quantity).toFixed(2)} {restaurant?.currency || "€"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between items-center">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-lg text-orange-600">
                  {getCartTotal().toFixed(2)} {restaurant?.currency || "€"}
                </span>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <h2 className="font-bold text-gray-900 mb-4">Vos coordonnées</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.customer_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {formData.order_type === "delivery" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse de livraison *
                    </label>
                    <textarea
                      required
                      value={formData.delivery_address}
                      onChange={(e) =>
                        setFormData({ ...formData, delivery_address: e.target.value })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                )}

                {formData.order_type === "takeaway" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Heure de retrait *
                    </label>
                    <select
                      required
                      value={formData.pickup_time}
                      onChange={(e) =>
                        setFormData({ ...formData, pickup_time: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Sélectionner une heure</option>
                      {getPickupTimeOptions().map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructions spéciales
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Allergies, préférences..."
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 disabled:bg-gray-300"
              >
                {submitting ? "Envoi..." : "Confirmer la commande"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && confirmation && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Commande confirmée !
            </h2>

            <div className="bg-gray-50 rounded-lg p-4 my-6">
              <p className="text-sm text-gray-500 mb-1">Numéro de commande</p>
              <p className="text-2xl font-bold text-orange-600">
                {confirmation.order_number}
              </p>
            </div>

            <div className="text-left space-y-2 text-sm">
              <p>
                <strong>Type:</strong>{" "}
                {formData.order_type === "delivery" ? "Livraison" : "À emporter"}
              </p>
              <p>
                <strong>Total:</strong> {confirmation.total?.toFixed(2)} {restaurant?.currency || "€"}
              </p>
              {formData.order_type === "takeaway" && formData.pickup_time && (
                <p>
                  <strong>Retrait à:</strong> {formData.pickup_time}
                </p>
              )}
            </div>

            <p className="text-gray-500 mt-6 text-sm">
              Vous recevrez un SMS/Email de confirmation avec les détails de votre commande.
            </p>

            <Link
              to={`/r/${slug}`}
              className="mt-6 inline-block px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700"
            >
              Retour au restaurant
            </Link>
          </div>
        </div>
      )}

      {/* Floating Cart Button (Step 1) */}
      {step === 1 && cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-30">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setStep(2)}
              className="w-full py-4 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 flex items-center justify-center gap-3"
            >
              <ShoppingCartIcon className="w-5 h-5" />
              <span>Voir le panier</span>
              <span className="px-2 py-1 bg-white/20 rounded">
                {getCartTotal().toFixed(2)} {restaurant?.currency || "€"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowCart(false)}>
          <div
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-lg">Votre panier</h2>
              <button onClick={() => setShowCart(false)}>
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"
                      >
                        <MinusIcon className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"
                      >
                        <PlusIcon className="w-3 h-3" />
                      </button>
                    </div>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">
                    {(parseFloat(item.price) * item.quantity).toFixed(2)} €
                  </span>
                </div>
              ))}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
              <div className="flex justify-between mb-4">
                <span className="font-bold">Total</span>
                <span className="font-bold text-orange-600">
                  {getCartTotal().toFixed(2)} {restaurant?.currency || "€"}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowCart(false);
                  setStep(2);
                }}
                className="w-full py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700"
              >
                Commander
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
