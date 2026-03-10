/**
 * Restaurant Kitchen View
 * Bistro Chic Edition - Professional Kitchen Dashboard
 */

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import Toast from "../../components/common/Toast";
import {
  ClockIcon,
  CheckCircleIcon,
  FireIcon,
  BellAlertIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  UserIcon,
  PlayIcon,
  DocumentTextIcon,
  TruckIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { FireIcon as FireSolid, BellAlertIcon as BellSolid, CheckCircleIcon as CheckSolid } from "@heroicons/react/24/solid";

const Kitchen = () => {
  const { tenant } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await api.get("/restaurant/orders");
      // Filter only kitchen-relevant orders
      const kitchenOrders = (response.data.data || []).filter((order) =>
        ["confirmed", "preparing", "ready"].includes(order.status)
      );
      setOrders(kitchenOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchOrders]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.patch(`/restaurant/orders/${orderId}/status`, { status });
      showToast(
        status === "preparing"
          ? "Commande en préparation"
          : status === "ready"
          ? "Commande prête!"
          : "Statut mis à jour"
      );
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      showToast("Erreur lors de la mise à jour", "error");
    }
  };

  // Calculate time elapsed
  const getTimeElapsed = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} min`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  // Get urgency level
  const getUrgency = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMins = Math.floor((now - created) / 60000);

    if (diffMins < 10) return "normal";
    if (diffMins < 20) return "warning";
    return "urgent";
  };

  const urgencyStyles = {
    normal: "border-slate-200",
    warning: "border-yellow-400 bg-yellow-50",
    urgent: "border-red-400 bg-red-50 animate-pulse",
  };

  // Group orders by status
  const confirmedOrders = orders.filter((o) => o.status === "confirmed");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");

  return (
    <DashboardLayout>
      <div className="relative min-h-screen p-4 md:p-6">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200/20 to-red-300/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 -left-20 w-60 h-60 bg-gradient-to-br from-amber-200/15 to-orange-200/15 rounded-full blur-3xl"></div>
        </div>

        <div className="relative space-y-6">
          {/* Kitchen Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative p-2 bg-orange-500/20 rounded-xl">
                    <FireSolid className="h-8 w-8 text-orange-500" />
                    {orders.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white animate-pulse">
                        {orders.length}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                    Vue Cuisine
                  </h1>
                </div>
                <p className="text-slate-300">
                  {orders.length} commande{orders.length > 1 ? "s" : ""} en cours •{" "}
                  <span className="text-orange-400">{preparingOrders.length} au feu</span>
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Auto-refresh toggle */}
                <label className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                  autoRefresh ? "bg-emerald-500/20 border-2 border-emerald-500/50" : "bg-white/10 border-2 border-white/20"
                }`}>
                  <div className={`w-10 h-6 rounded-full relative transition-colors ${autoRefresh ? "bg-emerald-500" : "bg-slate-600"}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${autoRefresh ? "left-5" : "left-1"}`}></div>
                  </div>
                  <span className="text-white font-medium">Auto-refresh</span>
                  {autoRefresh && <span className="text-emerald-400 text-xs">(30s)</span>}
                </label>
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="hidden"
                />

                <button
                  onClick={fetchOrders}
                  className="group flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur text-white rounded-xl hover:bg-white/20 transition-all border border-white/20"
                >
                  <ArrowPathIcon className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                  <span className="font-medium">Actualiser</span>
                </button>
              </div>
            </div>
          </div>

          {/* Kitchen Kanban Board */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="animate-spin rounded-full h-14 w-14 border-4 border-orange-200 border-t-orange-600"></div>
                <FireIcon className="absolute inset-0 m-auto h-6 w-6 text-orange-500" />
              </div>
              <p className="mt-4 text-orange-700 font-medium">Chargement des commandes...</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Column 1: À préparer */}
              <div className="bg-gradient-to-b from-blue-50 to-slate-50 rounded-2xl p-4 border border-blue-100 shadow-soft">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-blue-200">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow">
                    <ClockIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">À préparer</h2>
                    <p className="text-slate-500 text-sm">En attente de préparation</p>
                  </div>
                  <span className="ml-auto bg-blue-500 text-white font-bold w-8 h-8 rounded-lg flex items-center justify-center text-sm">
                    {confirmedOrders.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {confirmedOrders.map((order) => {
                    const urgency = getUrgency(order.created_at);
                    return (
                      <div
                        key={order.id}
                        className={`bg-white rounded-xl border p-4 shadow-soft transition-all hover:shadow-md ${
                          urgency === "urgent" ? "border-red-400 bg-red-50/50 ring-1 ring-red-200" :
                          urgency === "warning" ? "border-yellow-400 bg-yellow-50/50" : "border-blue-200"
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-slate-800">
                              {order.order_number}
                            </span>
                            {order.table_number && (
                              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                                T{order.table_number}
                              </span>
                            )}
                          </div>
                          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                            urgency === "urgent" ? "bg-red-100 text-red-700" :
                            urgency === "warning" ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-600"
                          }`}>
                            {urgency === "urgent" && <ExclamationTriangleIcon className="h-3.5 w-3.5" />}
                            <ClockIcon className="h-3.5 w-3.5" />
                            {getTimeElapsed(order.created_at)}
                          </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-2 mb-3">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-2 bg-slate-50 rounded-lg p-2">
                              <span className="bg-amber-500 text-white font-bold text-xs w-6 h-6 rounded flex items-center justify-center">
                                {item.quantity}x
                              </span>
                              <div className="flex-1">
                                <p className="font-medium text-slate-800 text-sm">
                                  {item.menu_name || item.name}
                                </p>
                                {item.special_requests && (
                                  <p className="text-xs text-red-600 mt-1 font-medium bg-red-50 px-2 py-1 rounded flex items-center gap-1">
                                    <ExclamationTriangleIcon className="h-3 w-3" />
                                    {item.special_requests}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Notes */}
                        {order.notes && (
                          <div className="bg-amber-50 text-amber-900 text-sm p-2 rounded-lg mb-3 border border-amber-200 flex items-start gap-2">
                            <DocumentTextIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{order.notes}</span>
                          </div>
                        )}

                        {/* Action */}
                        <button
                          onClick={() => updateOrderStatus(order.id, "preparing")}
                          className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <PlayIcon className="h-4 w-4" />
                          Commencer la préparation
                        </button>
                      </div>
                    );
                  })}

                  {confirmedOrders.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <ClockIcon className="h-8 w-8 text-blue-400" />
                      </div>
                      <p className="font-medium">Aucune commande en attente</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: En préparation */}
              <div className="bg-gradient-to-b from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-200 shadow-soft">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-orange-200">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow animate-pulse">
                    <FireSolid className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">En préparation</h2>
                    <p className="text-slate-500 text-sm">Au feu!</p>
                  </div>
                  <span className="ml-auto bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold w-8 h-8 rounded-lg flex items-center justify-center text-sm">
                    {preparingOrders.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {preparingOrders.map((order) => {
                    const urgency = getUrgency(order.created_at);
                    return (
                      <div
                        key={order.id}
                        className={`bg-white rounded-xl border p-4 shadow-soft transition-all hover:shadow-md ${
                          urgency === "urgent" ? "border-red-400 ring-1 ring-red-200" : "border-orange-300"
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-slate-800">
                              {order.order_number}
                            </span>
                            {order.table_number && (
                              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                                T{order.table_number}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 bg-orange-100 text-orange-700 font-bold text-xs px-2 py-1 rounded-full">
                            <FireIcon className="h-3.5 w-3.5 animate-pulse" />
                            {getTimeElapsed(order.created_at)}
                          </div>
                        </div>

                        {/* Items with checkboxes */}
                        <div className="space-y-2 mb-3">
                          {order.items?.map((item, idx) => (
                            <label
                              key={idx}
                              className="flex items-center gap-2 bg-orange-50 rounded-lg p-2 cursor-pointer hover:bg-orange-100 transition-colors group"
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-orange-600 rounded focus:ring-orange-500 border border-orange-300"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-slate-800 text-sm group-hover:text-orange-700 transition-colors">
                                  <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded font-bold mr-1.5">
                                    {item.quantity}x
                                  </span>
                                  {item.menu_name || item.name}
                                </p>
                                {item.special_requests && (
                                  <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                                    <ExclamationTriangleIcon className="h-3 w-3" />
                                    {item.special_requests}
                                  </p>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>

                        {/* Notes */}
                        {order.notes && (
                          <div className="bg-amber-50 text-amber-900 text-sm p-2 rounded-lg mb-3 border border-amber-200 flex items-start gap-2">
                            <DocumentTextIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{order.notes}</span>
                          </div>
                        )}

                        {/* Action */}
                        <button
                          onClick={() => updateOrderStatus(order.id, "ready")}
                          className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <BellAlertIcon className="h-4 w-4" />
                          Commande Prête!
                        </button>
                      </div>
                    );
                  })}

                  {preparingOrders.length === 0 && (
                    <div className="text-center py-10 text-slate-400">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <FireIcon className="h-6 w-6 text-orange-400" />
                      </div>
                      <p className="font-medium text-sm">Aucune commande en préparation</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Column 3: Prêtes */}
              <div className="bg-gradient-to-b from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-200 shadow-soft">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-emerald-200">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow">
                    <BellSolid className="h-5 w-5 text-white animate-bounce" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">Prêtes à servir</h2>
                    <p className="text-slate-500 text-sm">En attente de service</p>
                  </div>
                  <span className="ml-auto bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold w-8 h-8 rounded-lg flex items-center justify-center text-sm">
                    {readyOrders.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {readyOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-xl border border-emerald-300 p-4 shadow-soft ring-1 ring-emerald-100"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-slate-800">
                            {order.order_number}
                          </span>
                          {order.table_number && (
                            <span className="text-xs bg-emerald-500 text-white px-2.5 py-1 rounded-full font-bold animate-pulse">
                              Table {order.table_number}
                            </span>
                          )}
                        </div>
                        <BellSolid className="h-6 w-6 text-emerald-500 animate-bounce" />
                      </div>

                      {/* Order type indicator */}
                      {order.order_type && order.order_type !== "dine_in" && (
                        <div className="bg-purple-100 text-purple-800 text-sm font-bold px-3 py-2 rounded-lg mb-3 text-center flex items-center justify-center gap-2">
                          {order.order_type === "takeaway" && <ShoppingBagIcon className="h-5 w-5" />}
                          {order.order_type === "delivery" && <TruckIcon className="h-5 w-5" />}
                          {order.order_type === "takeaway" ? "À emporter" : "Livraison"}
                          {order.customer_name && (
                            <span className="ml-2 flex items-center gap-1">
                              <UserIcon className="h-4 w-4" />
                              {order.customer_name}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Items summary */}
                      <div className="bg-emerald-50 rounded-lg p-2 mb-3">
                        {order.items?.map((item, idx) => (
                          <p key={idx} className="text-slate-700 font-medium text-sm py-0.5">
                            <span className="text-emerald-600 font-bold">{item.quantity}x</span> {item.menu_name || item.name}
                          </p>
                        ))}
                      </div>

                      {/* Time waiting */}
                      <div className="text-center bg-emerald-100 text-emerald-700 font-semibold py-2 rounded-lg text-sm flex items-center justify-center gap-1">
                        <CheckSolid className="h-4 w-4" />
                        Prête depuis {getTimeElapsed(order.updated_at || order.created_at)}
                      </div>
                    </div>
                  ))}

                  {readyOrders.length === 0 && (
                    <div className="text-center py-10 text-slate-400">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <CheckCircleIcon className="h-6 w-6 text-emerald-400" />
                      </div>
                      <p className="font-medium text-sm">Aucune commande prête</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Toast */}
          {toast.show && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast({ show: false, message: "", type: "" })}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Kitchen;
