/**
 * RestaurantQRCode.js - Scanner QR Code et commander depuis la table
 * Affiche le menu de la table scannée et permet de commander
 */

import React, { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  PlusIcon,
  MinusIcon,
  ShoppingCartIcon,
  XMarkIcon,
  CheckCircleIcon,
  TableCellsIcon,
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

export default function RestaurantQRCode() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const tableCode = searchParams.get("table");

  const [restaurant, setRestaurant] = useState(null);
  const [tableInfo, setTableInfo] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [step, setStep] = useState(1); // 1: menu, 2: confirm, 3: success
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState(null);
  const [manualTableCode, setManualTableCode] = useState("");

  const [formData, setFormData] = useState({
    customer_name: "",
    notes: "",
  });

  useEffect(() => {
    if (tableCode) {
      fetchTableData(tableCode);
    } else {
      setLoading(false);
    }
  }, [tableCode, slug]);

  const fetchTableData = async (code) => {
    try {
      setLoading(true);
      setError(null);

      // Format: SLUG-TABLE or direct QR code
      const qrCode = code.includes("-") ? code : `${slug}-${code}`;

      const res = await fetch(`${API_URL}/api/public/restaurant/qr/${qrCode}`);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Table non trouvée");
      }

      const data = await res.json();
      setRestaurant(data.data.restaurant);
      setTableInfo(data.data.table);
      setMenu(data.data.menu || []);

      if (data.data.menu && data.data.menu.length > 0) {
        setActiveCategory(data.data.menu[0].category_id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = (e) => {
    e.preventDefault();
    if (manualTableCode.trim()) {
      fetchTableData(manualTableCode.trim());
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Use table ID as the most reliable identifier
      const tableIdentifier = tableInfo?.id || tableInfo?.qr_code || (tableCode && tableCode.includes("-") ? tableCode : `${slug}-${tableCode}`);

      const orderData = {
        customer_name: formData.customer_name || `Table ${tableInfo?.table_number}`,
        notes: formData.notes,
        items: cart.map((item) => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          notes: item.notes || "",
        })),
      };

      console.log("Submitting order with tableIdentifier:", tableIdentifier, "orderData:", orderData);

      const res = await fetch(`${API_URL}/api/public/restaurant/qr/${tableIdentifier}/order`, {
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

  // No table code - show entry form
  if (!tableCode && !tableInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <Link to={`/r/${slug}`} className="text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="w-6 h-6" />
            </Link>
            <h1 className="font-bold text-gray-900">Scanner QR Code</h1>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <QrCodeIcon className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Scannez le QR code de votre table
            </h2>
            <p className="text-gray-500 mb-6">
              Ou entrez manuellement le numéro de table
            </p>

            <form onSubmit={handleManualEntry} className="space-y-4">
              <input
                type="text"
                value={manualTableCode}
                onChange={(e) => setManualTableCode(e.target.value)}
                placeholder="Numéro de table (ex: 5)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center text-lg"
              />
              <button
                type="submit"
                disabled={!manualTableCode.trim()}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300"
              >
                Accéder au menu
              </button>
            </form>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !tableInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XMarkIcon className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Table non trouvée</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to={`/r/${slug}/qr`}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
          >
            Réessayer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={`/r/${slug}`} className="text-white/80 hover:text-white">
                <ArrowLeftIcon className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="font-bold">{restaurant?.business_name || restaurant?.name}</h1>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <TableCellsIcon className="w-4 h-4" />
                  <span>Table {tableInfo?.table_number}</span>
                  {tableInfo?.location_description && (
                    <span className="px-2 py-0.5 bg-white/20 rounded text-xs">
                      {tableInfo.location_description}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {step === 1 && cart.length > 0 && (
              <button
                onClick={() => setShowCart(true)}
                className="relative p-2"
              >
                <ShoppingCartIcon className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-blue-600 text-xs rounded-full flex items-center justify-center font-bold">
                  {getCartItemsCount()}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Step 1: Menu */}
      {step === 1 && (
        <>
          {/* Category Tabs */}
          {menu.length > 0 && (
            <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
              <div className="max-w-4xl mx-auto overflow-x-auto">
                <div className="flex gap-1 p-2 min-w-max">
                  {menu.map((category) => (
                    <button
                      key={category.category_id}
                      onClick={() => setActiveCategory(category.category_id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        activeCategory === category.category_id
                          ? "bg-blue-100 text-blue-700"
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
            {menu.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Le menu sera bientôt disponible
              </div>
            ) : (
              menu
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
                              <span className="font-bold text-blue-600">
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
                                    className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
                                  >
                                    <PlusIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(item)}
                                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                >
                                  Ajouter
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ))
            )}
          </div>
        </>
      )}

      {/* Step 2: Confirmation */}
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
                <span className="font-bold text-lg text-blue-600">
                  {getCartTotal().toFixed(2)} {restaurant?.currency || "€"}
                </span>
              </div>
            </div>

            {/* Optional Info */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <h2 className="font-bold text-gray-900 mb-4">Informations (optionnel)</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Votre nom
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={`Table ${tableInfo?.table_number}`}
                  />
                </div>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Allergies, préférences..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                <strong>Table {tableInfo?.table_number}</strong> - Votre commande sera préparée et servie à votre table.
              </p>
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
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300"
              >
                {submitting ? "Envoi..." : "Envoyer en cuisine"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && confirmation && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Commande envoyée !
            </h2>
            <p className="text-gray-600 mb-6">
              La cuisine a bien reçu votre commande
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Numéro de commande</p>
              <p className="text-2xl font-bold text-blue-600">
                {confirmation.order_number}
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-blue-800">
                Votre commande sera servie à la <strong>Table {tableInfo?.table_number}</strong>
              </p>
            </div>

            <button
              onClick={() => {
                setStep(1);
                setCart([]);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
            >
              Commander autre chose
            </button>
          </div>
        </div>
      )}

      {/* Floating Cart Button (Step 1) */}
      {step === 1 && cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-30">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setStep(2)}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center justify-center gap-3"
            >
              <ShoppingCartIcon className="w-5 h-5" />
              <span>Commander</span>
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
              <h2 className="font-bold text-lg">Votre commande</h2>
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
                        className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"
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
                <span className="font-bold text-blue-600">
                  {getCartTotal().toFixed(2)} {restaurant?.currency || "€"}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowCart(false);
                  setStep(2);
                }}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
              >
                Envoyer en cuisine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
