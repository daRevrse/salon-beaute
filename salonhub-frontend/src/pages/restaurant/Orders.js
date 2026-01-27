/**
 * Restaurant Orders Management
 * Bistro Chic Edition - Elegant Order Management
 */

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import { useAuth } from "../../contexts/AuthContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import api from "../../services/api";
import Toast from "../../components/common/Toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
  PlusIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon,
  PrinterIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  FireIcon,
  TruckIcon,
  ShoppingBagIcon,
  UserIcon,
  ReceiptPercentIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

// Statuts de commande
const ORDER_STATUSES = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800", icon: ClockIcon },
  confirmed: { label: "Confirmée", color: "bg-blue-100 text-blue-800", icon: CheckCircleIcon },
  preparing: { label: "En préparation", color: "bg-orange-100 text-orange-800", icon: FireIcon },
  ready: { label: "Prête", color: "bg-purple-100 text-purple-800", icon: ShoppingBagIcon },
  served: { label: "Servie", color: "bg-green-100 text-green-800", icon: CheckCircleIcon },
  completed: { label: "Terminée", color: "bg-slate-100 text-slate-800", icon: CheckCircleIcon },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-800", icon: XCircleIcon },
};

// Statuts de paiement
const PAYMENT_STATUSES = {
  unpaid: { label: "Non payé", color: "text-red-600 bg-red-50" },
  partial: { label: "Partiel", color: "text-orange-600 bg-orange-50" },
  paid: { label: "Payé", color: "text-green-600 bg-green-50" },
  refunded: { label: "Remboursé", color: "text-purple-600 bg-purple-50" },
};

// Types de commande (icons are handled via Heroicons in JSX)
const ORDER_TYPES = {
  dine_in: { label: "Sur place", iconType: "dine_in" },
  takeaway: { label: "À emporter", iconType: "takeaway" },
  delivery: { label: "Livraison", iconType: "delivery" },
};

// Order type icon component
const OrderTypeIcon = ({ type, className = "h-5 w-5" }) => {
  switch (type) {
    case "delivery":
      return <TruckIcon className={className} />;
    case "takeaway":
      return <ShoppingBagIcon className={className} />;
    default:
      return <SparklesIcon className={className} />;
  }
};

const Orders = () => {
  const { tenant } = useAuth();
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterType, setFilterType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Form state for new order
  const [formData, setFormData] = useState({
    table_id: "",
    order_type: "dine_in",
    customer_name: "",
    customer_phone: "",
    notes: "",
    items: [],
  });

  // Cart for adding items
  const [cart, setCart] = useState([]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/restaurant/orders");
      setOrders(response.data.data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      showToast("Erreur lors du chargement des commandes", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTables = useCallback(async () => {
    try {
      const response = await api.get("/restaurant/tables");
      setTables(response.data.data || []);
    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  }, []);

  const fetchMenuItems = useCallback(async () => {
    try {
      const response = await api.get("/restaurant/menus");
      setMenuItems((response.data.data || []).filter((item) => item.is_available));
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchTables();
    fetchMenuItems();
  }, [fetchOrders, fetchTables, fetchMenuItems]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast("Ajoutez au moins un article à la commande", "error");
      return;
    }

    try {
      const payload = {
        ...formData,
        table_id: formData.table_id || null,
        items: cart.map((item) => ({
          menu_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          special_requests: item.special_requests || "",
        })),
      };

      await api.post("/restaurant/orders", payload);
      showToast("Commande créée avec succès");
      setShowModal(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      console.error("Error creating order:", error);
      showToast(error.response?.data?.error || "Erreur lors de la création", "error");
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.patch(`/restaurant/orders/${orderId}/status`, { status });
      showToast(`Statut mis à jour: ${ORDER_STATUSES[status].label}`);
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      showToast("Erreur lors de la mise à jour", "error");
    }
  };

  const updatePaymentStatus = async (orderId, payment_status) => {
    try {
      await api.patch(`/restaurant/orders/${orderId}/payment`, { payment_status });
      showToast(`Paiement: ${PAYMENT_STATUSES[payment_status].label}`);
      fetchOrders();
    } catch (error) {
      console.error("Error updating payment:", error);
      showToast("Erreur lors de la mise à jour du paiement", "error");
    }
  };

  const cancelOrder = async () => {
    if (!confirmCancel) return;
    try {
      await api.patch(`/restaurant/orders/${confirmCancel.id}/status`, { status: "cancelled" });
      showToast("Commande annulée");
      setConfirmCancel(null);
      fetchOrders();
    } catch (error) {
      console.error("Error cancelling order:", error);
      showToast("Erreur lors de l'annulation", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      table_id: "",
      order_type: "dine_in",
      customer_name: "",
      customer_phone: "",
      notes: "",
      items: [],
    });
    setCart([]);
  };

  const addToCart = (item) => {
    const existingIndex = cart.findIndex((c) => c.id === item.id);
    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateCartQuantity = (index, quantity) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    const newCart = [...cart];
    newCart[index].quantity = quantity;
    setCart(newCart);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !filterStatus || order.status === filterStatus;
    const matchesPayment = !filterPayment || order.payment_status === filterPayment;
    const matchesType = !filterType || order.order_type === filterType;
    return matchesSearch && matchesStatus && matchesPayment && matchesType;
  });

  // Group menu items by category
  const menuByCategory = menuItems.reduce((acc, item) => {
    const category = item.category || "Autres";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  // Get next valid statuses
  const getNextStatuses = (currentStatus) => {
    const flow = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["preparing", "cancelled"],
      preparing: ["ready"],
      ready: ["served"],
      served: ["completed"],
    };
    return flow[currentStatus] || [];
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-orange-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <ReceiptPercentIcon className="h-8 w-8 text-amber-200" />
                <h1 className="text-2xl font-bold text-white">Commandes</h1>
              </div>
              <p className="text-amber-100/80">
                {orders.length} commande{orders.length > 1 ? "s" : ""} •{" "}
                <span className="text-orange-300">{orders.filter((o) => o.status === "preparing").length} en cuisine</span>
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-5 py-3 bg-white text-amber-800 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <PlusIcon className="h-5 w-5" />
              Nouvelle Commande
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-soft p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <ClockIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {orders.filter((o) => o.status === "pending").length}
                </p>
                <p className="text-xs text-slate-500">En attente</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <FireIcon className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {orders.filter((o) => o.status === "preparing").length}
                </p>
                <p className="text-xs text-slate-500">En cuisine</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <ShoppingBagIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {orders.filter((o) => o.status === "ready").length}
                </p>
                <p className="text-xs text-slate-500">Prêtes</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <BanknotesIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {formatPrice(
                    orders
                      .filter((o) => o.status === "completed" && o.payment_status === "paid")
                      .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
                  )}
                </p>
                <p className="text-xs text-slate-500">Aujourd'hui</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-soft p-4 border border-slate-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher une commande..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              />
            </div>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(ORDER_STATUSES).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {/* Payment filter */}
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">Tous les paiements</option>
              {Object.entries(PAYMENT_STATUSES).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {/* Type filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">Tous les types</option>
              {Object.entries(ORDER_TYPES).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {/* Refresh */}
            <button
              onClick={fetchOrders}
              className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              title="Actualiser"
            >
              <ArrowPathIcon className="h-5 w-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-soft p-12 text-center border border-slate-200">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBagIcon className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Aucune commande trouvée</h3>
            <p className="text-slate-500 mb-4">Créez votre première commande</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
            >
              Nouvelle commande
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => {
              const StatusIcon = ORDER_STATUSES[order.status]?.icon || ClockIcon;
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-soft border border-slate-200 p-4 hover:shadow-soft-lg transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Order info */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center">
                        {order.table_number ? (
                          <span className="text-lg font-bold text-amber-700">T{order.table_number}</span>
                        ) : order.order_type === "delivery" ? (
                          <TruckIcon className="h-6 w-6 text-blue-600" />
                        ) : order.order_type === "takeaway" ? (
                          <ShoppingBagIcon className="h-6 w-6 text-purple-600" />
                        ) : (
                          <SparklesIcon className="h-6 w-6 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-800">{order.order_number}</span>
                          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${ORDER_STATUSES[order.status]?.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {ORDER_STATUSES[order.status]?.label}
                          </span>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${PAYMENT_STATUSES[order.payment_status]?.color}`}>
                            {PAYMENT_STATUSES[order.payment_status]?.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                          <span>{ORDER_TYPES[order.order_type]?.label || "Sur place"}</span>
                          {order.table_number && <span>Table {order.table_number}</span>}
                          {order.customer_name && (
                            <span className="flex items-center gap-1">
                              <UserIcon className="h-3 w-3" />
                              {order.customer_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Amount & time */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-bold text-amber-600">{formatPrice(order.total_amount || 0)}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(order.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowDetailsModal(order)}
                          className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Voir détails"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>

                        {getNextStatuses(order.status).map((status) => (
                          <button
                            key={status}
                            onClick={() => updateOrderStatus(order.id, status)}
                            className={`p-2 rounded-lg transition-colors ${
                              status === "cancelled" ? "text-red-500 hover:bg-red-50" : "text-emerald-500 hover:bg-emerald-50"
                            }`}
                            title={ORDER_STATUSES[status]?.label}
                          >
                            {status === "cancelled" ? <XCircleIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
                          </button>
                        ))}

                        {order.payment_status !== "paid" && order.status !== "cancelled" && (
                          <button
                            onClick={() => updatePaymentStatus(order.id, "paid")}
                            className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                            title="Marquer payé"
                          >
                            <BanknotesIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items preview */}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex flex-wrap gap-2">
                        {order.items.slice(0, 5).map((item, idx) => (
                          <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                            {item.quantity}x {item.menu_name || item.name}
                          </span>
                        ))}
                        {order.items.length > 5 && (
                          <span className="text-xs text-slate-400">+{order.items.length - 5} autres</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal New Order */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scale-in flex flex-col">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-display font-semibold text-slate-800">
                  Nouvelle Commande
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left: Order info */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-700">Informations</h3>

                      {/* Order type */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Type de commande
                        </label>
                        <div className="flex gap-2">
                          {Object.entries(ORDER_TYPES).map(([key, { label }]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setFormData({ ...formData, order_type: key })}
                              className={`flex-1 py-2 px-3 rounded-lg border transition-all flex flex-col items-center ${
                                formData.order_type === key
                                  ? "border-amber-500 bg-amber-50"
                                  : "border-slate-200 hover:border-amber-300"
                              }`}
                            >
                              <OrderTypeIcon type={key} className="h-5 w-5 text-amber-600" />
                              <span className="block text-xs mt-1">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Table selection (only for dine_in) */}
                      {formData.order_type === "dine_in" && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Table
                          </label>
                          <select
                            value={formData.table_id}
                            onChange={(e) =>
                              setFormData({ ...formData, table_id: e.target.value })
                            }
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          >
                            <option value="">Sélectionner une table</option>
                            {tables
                              .filter((t) => t.is_active)
                              .map((table) => (
                                <option key={table.id} value={table.id}>
                                  Table {table.table_number} ({table.capacity} places)
                                  {table.section && ` - ${table.section}`}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}

                      {/* Customer info (for takeaway/delivery) */}
                      {formData.order_type !== "dine_in" && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Nom du client
                            </label>
                            <input
                              type="text"
                              value={formData.customer_name}
                              onChange={(e) =>
                                setFormData({ ...formData, customer_name: e.target.value })
                              }
                              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Téléphone
                            </label>
                            <input
                              type="tel"
                              value={formData.customer_phone}
                              onChange={(e) =>
                                setFormData({ ...formData, customer_phone: e.target.value })
                              }
                              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            />
                          </div>
                        </>
                      )}

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Notes
                        </label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          rows={2}
                          placeholder="Instructions spéciales..."
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>

                      {/* Cart */}
                      <div className="mt-4">
                        <h3 className="font-semibold text-slate-700 mb-3">
                          Panier ({cart.length} article{cart.length > 1 ? "s" : ""})
                        </h3>
                        {cart.length === 0 ? (
                          <p className="text-sm text-slate-400 text-center py-4">
                            Sélectionnez des articles dans le menu
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {cart.map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-slate-50 rounded-xl p-3"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-slate-800 text-sm">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {formatPrice(item.price)} x {item.quantity}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => updateCartQuantity(index, item.quantity - 1)}
                                    className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-100"
                                  >
                                    -
                                  </button>
                                  <span className="w-8 text-center font-medium">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateCartQuantity(index, item.quantity + 1)}
                                    className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-100"
                                  >
                                    +
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeFromCart(index)}
                                    className="w-7 h-7 text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-center"
                                  >
                                    <XCircleIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between">
                          <span className="font-semibold text-slate-700">Total</span>
                          <span className="text-xl font-bold text-amber-600">
                            {formatPrice(cartTotal)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Menu items */}
                    <div className="border-l border-slate-200 pl-6">
                      <h3 className="font-semibold text-slate-700 mb-3">Menu</h3>
                      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                        {Object.entries(menuByCategory).map(([category, items]) => (
                          <div key={category}>
                            <h4 className="text-sm font-medium text-slate-500 mb-2">
                              {category}
                            </h4>
                            <div className="space-y-2">
                              {items.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => addToCart(item)}
                                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-amber-50 rounded-xl transition-colors text-left"
                                >
                                  <div>
                                    <p className="font-medium text-slate-800 text-sm">
                                      {item.name}
                                    </p>
                                    {item.description && (
                                      <p className="text-xs text-slate-400 truncate max-w-[200px]">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-amber-600 text-sm">
                                      {formatPrice(item.price)}
                                    </span>
                                    <PlusIcon className="h-4 w-4 text-amber-500" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-white transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={cart.length === 0}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Créer la commande ({formatPrice(cartTotal)})
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {showDetailsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xl font-display font-semibold text-slate-800">
                  Commande {showDetailsModal.order_number}
                </h2>
                <button
                  onClick={() => setShowDetailsModal(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <XCircleIcon className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Status badges */}
                <div className="flex gap-2">
                  <span
                    className={`flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full ${
                      ORDER_STATUSES[showDetailsModal.status]?.color
                    }`}
                  >
                    {ORDER_STATUSES[showDetailsModal.status]?.label}
                  </span>
                  <span
                    className={`text-sm font-medium px-3 py-1 rounded-full ${
                      PAYMENT_STATUSES[showDetailsModal.payment_status]?.color
                    }`}
                  >
                    {PAYMENT_STATUSES[showDetailsModal.payment_status]?.label}
                  </span>
                </div>

                {/* Order info */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <p className="text-sm flex items-center gap-2">
                    <span className="text-slate-500">Type:</span>{" "}
                    <span className="font-medium flex items-center gap-1">
                      <OrderTypeIcon type={showDetailsModal.order_type} className="h-4 w-4" />
                      {ORDER_TYPES[showDetailsModal.order_type]?.label}
                    </span>
                  </p>
                  {showDetailsModal.table_number && (
                    <p className="text-sm">
                      <span className="text-slate-500">Table:</span>{" "}
                      <span className="font-medium">{showDetailsModal.table_number}</span>
                    </p>
                  )}
                  {showDetailsModal.customer_name && (
                    <p className="text-sm">
                      <span className="text-slate-500">Client:</span>{" "}
                      <span className="font-medium">{showDetailsModal.customer_name}</span>
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="text-slate-500">Date:</span>{" "}
                    <span className="font-medium">
                      {new Date(showDetailsModal.created_at).toLocaleString("fr-FR")}
                    </span>
                  </p>
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-semibold text-slate-700 mb-3">Articles</h3>
                  <div className="space-y-2">
                    {showDetailsModal.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-slate-800">
                            {item.quantity}x {item.menu_name || item.name}
                          </p>
                          {item.special_requests && (
                            <p className="text-xs text-slate-400">{item.special_requests}</p>
                          )}
                        </div>
                        <span className="font-medium text-slate-600">
                          {formatPrice(item.line_total || item.unit_price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-amber-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Sous-total</span>
                    <span>{formatPrice(showDetailsModal.subtotal || 0)}</span>
                  </div>
                  {parseFloat(showDetailsModal.tax_amount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Taxes</span>
                      <span>{formatPrice(showDetailsModal.tax_amount)}</span>
                    </div>
                  )}
                  {parseFloat(showDetailsModal.tip_amount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Pourboire</span>
                      <span>{formatPrice(showDetailsModal.tip_amount)}</span>
                    </div>
                  )}
                  {parseFloat(showDetailsModal.discount_amount) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Remise</span>
                      <span>-{formatPrice(showDetailsModal.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-amber-200">
                    <span className="font-semibold text-slate-800">Total</span>
                    <span className="text-xl font-bold text-amber-600">
                      {formatPrice(showDetailsModal.total_amount || 0)}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {showDetailsModal.notes && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-500">Notes:</p>
                    <p className="text-slate-700">{showDetailsModal.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirm Cancel Modal */}
        <ConfirmModal
          isOpen={!!confirmCancel}
          onClose={() => setConfirmCancel(null)}
          onConfirm={cancelOrder}
          title="Annuler la commande"
          message={`Êtes-vous sûr de vouloir annuler la commande "${confirmCancel?.order_number}" ?`}
          confirmText="Annuler la commande"
          confirmStyle="danger"
        />

        {/* Toast */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ show: false, message: "", type: "" })}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Orders;
