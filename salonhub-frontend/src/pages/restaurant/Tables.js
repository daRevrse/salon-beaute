/**
 * Restaurant Tables Management
 * Bistro Chic Edition - Elegant Table Management
 */

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import Toast from "../../components/common/Toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  MapPinIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  QrCodeIcon,
  EyeIcon,
  TableCellsIcon,
  SparklesIcon,
  SunIcon,
  HomeIcon,
  StarIcon,
  BuildingStorefrontIcon,
  Square3Stack3DIcon,
  CalendarDaysIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

// Section icons for visual enhancement - using Heroicons
const SectionIcon = ({ section, className = "h-5 w-5" }) => {
  const icons = {
    "Terrasse": <SunIcon className={className} />,
    "Intérieur": <HomeIcon className={className} />,
    "VIP": <StarIcon className={className} />,
    "Bar": <BuildingStorefrontIcon className={className} />,
    "Jardin": <SparklesIcon className={className} />,
    "Étage": <Square3Stack3DIcon className={className} />,
    "Sans section": <TableCellsIcon className={className} />,
  };
  return icons[section] || <TableCellsIcon className={className} />;
};

const Tables = () => {
  const { tenant } = useAuth();
  const [tables, setTables] = useState([]);
  const [tableOrders, setTableOrders] = useState({});
  const [tableReservations, setTableReservations] = useState({});
  const [reservationStats, setReservationStats] = useState({ today: 0, byStatus: {} });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedTableOrders, setSelectedTableOrders] = useState(null);
  const [selectedTableReservations, setSelectedTableReservations] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    table_number: "",
    capacity: 2,
    section: "",
    position_description: "",
    is_active: true,
  });

  // Sections prédéfinies
  const sections = ["Terrasse", "Intérieur", "VIP", "Bar", "Jardin", "Étage"];

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Fetch tables and orders first
      const [tablesRes, ordersRes] = await Promise.all([
        api.get("/restaurant/tables"),
        api.get("/restaurant/orders?status=pending,preparing,ready")
      ]);
      setTables(tablesRes.data.data || []);

      // Group orders by table_id
      const orders = ordersRes.data.data || [];
      const ordersByTable = {};
      orders.forEach(order => {
        if (order.table_id) {
          if (!ordersByTable[order.table_id]) {
            ordersByTable[order.table_id] = [];
          }
          ordersByTable[order.table_id].push(order);
        }
      });
      setTableOrders(ordersByTable);

      // Try to fetch reservations separately to handle errors gracefully
      try {
        // Fetch all reservations (remove date filter to see all)
        const reservationsRes = await api.get(`/restaurant/reservations`);
        console.log("Reservations response:", reservationsRes.data);
        console.log("Today's date for reference:", today);

        // Group reservations by table_id
        const reservations = reservationsRes.data.data || [];
        const reservationsByTable = {};
        reservations.forEach(res => {
          if (res.table_id) {
            if (!reservationsByTable[res.table_id]) {
              reservationsByTable[res.table_id] = [];
            }
            reservationsByTable[res.table_id].push(res);
          }
        });
        setTableReservations(reservationsByTable);
        setReservationStats(reservationsRes.data.stats || { today: 0, byStatus: {} });
      } catch (resError) {
        console.error("Error fetching reservations:", resError);
        // Don't show error toast for reservations, just log it
        setTableReservations({});
        setReservationStats({ today: 0, byStatus: {} });
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
      showToast("Erreur lors du chargement des tables", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTable) {
        await api.put(`/restaurant/tables/${editingTable.id}`, formData);
        showToast("Table mise à jour avec succès");
      } else {
        await api.post("/restaurant/tables", formData);
        showToast("Table créée avec succès");
      }
      setShowModal(false);
      resetForm();
      fetchTables();
    } catch (error) {
      console.error("Error saving table:", error);
      showToast(error.response?.data?.error || "Erreur lors de l'enregistrement", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/restaurant/tables/${confirmDelete.id}`);
      showToast("Table supprimée avec succès");
      setConfirmDelete(null);
      fetchTables();
    } catch (error) {
      console.error("Error deleting table:", error);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const toggleStatus = async (table) => {
    try {
      await api.patch(`/restaurant/tables/${table.id}/status`, {
        is_active: !table.is_active,
      });
      showToast(`Table ${table.is_active ? "désactivée" : "activée"}`);
      fetchTables();
    } catch (error) {
      console.error("Error toggling status:", error);
      showToast("Erreur lors du changement de statut", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      table_number: "",
      capacity: 2,
      section: "",
      position_description: "",
      is_active: true,
    });
    setEditingTable(null);
  };

  const openEditModal = (table) => {
    setEditingTable(table);
    setFormData({
      table_number: table.table_number,
      capacity: table.capacity,
      section: table.section || "",
      position_description: table.position_description || "",
      is_active: table.is_active,
    });
    setShowModal(true);
  };

  // Filtered tables
  const filteredTables = tables.filter((table) => {
    const matchesSearch =
      table.table_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (table.section && table.section.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSection = !filterSection || table.section === filterSection;
    const matchesStatus =
      filterStatus === "" ||
      (filterStatus === "active" && table.is_active) ||
      (filterStatus === "inactive" && !table.is_active);
    return matchesSearch && matchesSection && matchesStatus;
  });

  // Group tables by section
  const tablesBySection = filteredTables.reduce((acc, table) => {
    const section = table.section || "Sans section";
    if (!acc[section]) acc[section] = [];
    acc[section].push(table);
    return acc;
  }, {});

  const uniqueSections = [...new Set(tables.map((t) => t.section).filter(Boolean))];

  return (
    <DashboardLayout>
      <div className="relative min-h-screen p-4 md:p-6">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-amber-200/20 to-orange-300/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 -left-20 w-60 h-60 bg-gradient-to-br from-rose-200/15 to-amber-200/15 rounded-full blur-3xl"></div>
        </div>

        <div className="relative space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-orange-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <TableCellsIcon className="h-7 w-7 text-amber-200" />
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                    Plan de Salle
                  </h1>
                </div>
                <p className="text-amber-100/80">
                  {tables.length} table{tables.length > 1 ? "s" : ""} •{" "}
                  <span className="text-emerald-300">{tables.filter((t) => t.is_active).length} active{tables.filter((t) => t.is_active).length > 1 ? "s" : ""}</span>
                </p>
                {/* Quick stats */}
                <div className="flex flex-wrap gap-3 mt-3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <UsersIcon className="h-4 w-4 text-amber-300" />
                    <span className="text-white text-sm font-medium">{tables.reduce((sum, t) => sum + t.capacity, 0)} couverts max</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-amber-300" />
                    <span className="text-white text-sm font-medium">{uniqueSections.length} section{uniqueSections.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4 text-amber-300" />
                    <span className="text-white text-sm font-medium">{reservationStats.today} résa{reservationStats.today > 1 ? "s" : ""} aujourd'hui</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-amber-900 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Nouvelle Table</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-soft border border-amber-100 p-4">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative group">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-400 group-focus-within:text-amber-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Rechercher une table..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-amber-50/50 border border-amber-100 rounded-lg focus:ring-2 focus:ring-amber-100 focus:border-amber-400 focus:bg-white transition-all placeholder:text-amber-300"
                />
              </div>

              {/* Section filter */}
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <FunnelIcon className="h-4 w-4 text-amber-700" />
                </div>
                <select
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                  className="px-3 py-2.5 bg-amber-50/50 border border-amber-100 rounded-lg focus:ring-2 focus:ring-amber-100 focus:border-amber-400 focus:bg-white transition-all min-w-[160px] font-medium text-slate-700"
                >
                  <option value="">Toutes les sections</option>
                  {uniqueSections.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2.5 bg-amber-50/50 border border-amber-100 rounded-lg focus:ring-2 focus:ring-amber-100 focus:border-amber-400 focus:bg-white transition-all min-w-[140px] font-medium text-slate-700"
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actives</option>
                <option value="inactive">Inactives</option>
              </select>
            </div>
          </div>

          {/* Tables Grid by Section */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="animate-spin rounded-full h-14 w-14 border-4 border-amber-200 border-t-amber-600"></div>
                <TableCellsIcon className="absolute inset-0 m-auto h-6 w-6 text-amber-500" />
              </div>
              <p className="mt-4 text-amber-700 font-medium">Chargement des tables...</p>
            </div>
          ) : Object.keys(tablesBySection).length === 0 ? (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-12 text-center border border-dashed border-amber-200">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <TableCellsIcon className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-amber-900 mb-2">
                Aucune table
              </h3>
              <p className="text-amber-600 mb-4 max-w-md mx-auto">
                Commencez à créer votre plan de salle
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Créer ma première table
              </button>
            </div>
          ) : (
            Object.entries(tablesBySection).map(([section, sectionTables]) => (
              <div key={section} className="space-y-4">
                {/* Section Header */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-100 rounded-lg">
                      <SectionIcon section={section} className="h-5 w-5 text-amber-700" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">
                      {section}
                    </h2>
                    <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {sectionTables.length} table{sectionTables.length > 1 ? "s" : ""}
                    </span>
                    <span className="text-slate-400 text-sm">
                      ({sectionTables.reduce((sum, t) => sum + t.capacity, 0)} couverts)
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent"></div>
                </div>

                {/* Tables Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {sectionTables.map((table) => {
                    const orders = tableOrders[table.id] || [];
                    const reservations = tableReservations[table.id] || [];
                    const hasOrders = orders.length > 0;
                    const hasReservations = reservations.length > 0;
                    const totalOrderAmount = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

                    return (
                    <div
                      key={table.id}
                      className={`group relative bg-white rounded-xl shadow-soft border overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 ${
                        hasOrders
                          ? "border-blue-300 ring-2 ring-blue-100"
                          : hasReservations
                          ? "border-purple-300 ring-2 ring-purple-100"
                          : table.is_active
                          ? "border-amber-200 hover:border-amber-400"
                          : "border-slate-200 opacity-60"
                      }`}
                    >
                      {/* Status ribbon */}
                      <div className={`absolute top-0 right-0 ${
                        hasOrders ? "bg-blue-500" :
                        hasReservations ? "bg-purple-500" :
                        table.is_active ? "bg-emerald-500" : "bg-slate-400"
                      } text-white text-xs font-bold px-2 py-0.5 rounded-bl-lg`}>
                        {hasOrders ? `${orders.length} cmd` :
                         hasReservations ? `${reservations.length} résa` :
                         table.is_active ? "Active" : "Inactive"}
                      </div>

                      {/* Table Visual */}
                      <div className="pt-6 pb-3 px-3">
                        <div className={`w-16 h-16 mx-auto rounded-xl flex items-center justify-center shadow transition-transform group-hover:scale-105 ${
                          hasOrders
                            ? "bg-gradient-to-br from-blue-400 to-blue-600"
                            : hasReservations
                            ? "bg-gradient-to-br from-purple-400 to-purple-600"
                            : table.is_active
                            ? "bg-gradient-to-br from-amber-400 to-orange-500"
                            : "bg-gradient-to-br from-slate-300 to-slate-400"
                        }`}>
                          <span className="text-2xl font-bold text-white">
                            {table.table_number}
                          </span>
                        </div>
                      </div>

                      {/* Table Info */}
                      <div className="px-3 pb-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-slate-700 mb-1">
                          <UsersIcon className="h-4 w-4 text-amber-500" />
                          <span className="font-bold">{table.capacity}</span>
                          <span className="text-slate-400 text-sm">places</span>
                        </div>

                        {hasOrders && (
                          <div className="mb-1">
                            <span className="text-xs font-bold text-blue-600">
                              {totalOrderAmount.toFixed(2)} {tenant?.currency || "EUR"}
                            </span>
                          </div>
                        )}

                        {hasReservations && !hasOrders && (
                          <div className="mb-1">
                            <span className="text-xs font-bold text-purple-600 flex items-center justify-center gap-1">
                              <ClockIcon className="h-3 w-3" />
                              {reservations[0].reservation_time?.substring(0, 5)}
                            </span>
                          </div>
                        )}

                        {table.position_description && (
                          <p className="text-xs text-slate-400 truncate px-1 flex items-center justify-center gap-1" title={table.position_description}>
                            <MapPinIcon className="h-3 w-3" />
                            {table.position_description}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="px-2 py-2 bg-gradient-to-r from-slate-50 to-amber-50/50 border-t border-slate-100 flex justify-center gap-0.5">
                        {hasOrders && (
                          <button
                            onClick={() => setSelectedTableOrders({ table, orders })}
                            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-all"
                            title="Voir commandes"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        )}
                        {hasReservations && (
                          <button
                            onClick={() => setSelectedTableReservations({ table, reservations })}
                            className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-all"
                            title="Voir réservations"
                          >
                            <CalendarDaysIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const qrCode = table.qr_code || `${tenant?.slug}-${table.table_number}`;
                            window.open(`/r/${tenant?.slug}/qr?table=${encodeURIComponent(qrCode)}`, '_blank');
                          }}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                          title="QR Code"
                        >
                          <QrCodeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(table)}
                          className="p-2 text-slate-500 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-all"
                          title="Modifier"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(table)}
                          className={`p-2 rounded-lg transition-all ${
                            table.is_active
                              ? "text-slate-500 hover:text-red-600 hover:bg-red-100"
                              : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-100"
                          }`}
                          title={table.is_active ? "Désactiver" : "Activer"}
                        >
                          {table.is_active ? (
                            <XCircleIcon className="h-4 w-4" />
                          ) : (
                            <CheckCircleIcon className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(table)}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all"
                          title="Supprimer"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {/* Modal Create/Edit */}
          {showModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="relative bg-gradient-to-r from-amber-700 to-amber-800 p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      {editingTable ? (
                        <PencilSquareIcon className="h-6 w-6 text-amber-200" />
                      ) : (
                        <TableCellsIcon className="h-6 w-6 text-amber-200" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {editingTable ? "Modifier la table" : "Nouvelle table"}
                      </h2>
                      <p className="text-amber-200 text-sm">
                        {editingTable ? "Apportez vos modifications" : "Ajoutez une table à votre plan de salle"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="absolute top-4 right-4 p-1.5 text-amber-200 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  {/* Table number */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Numéro de table <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.table_number}
                      onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                      placeholder="Ex: T1, A1, 01..."
                      className="w-full px-3 py-2.5 bg-amber-50/50 border border-amber-100 rounded-lg focus:ring-2 focus:ring-amber-100 focus:border-amber-400 focus:bg-white transition-all font-semibold"
                    />
                  </div>

                  {/* Capacity */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Capacité <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="1"
                        max="20"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 2 })}
                        className="w-full px-3 py-2.5 bg-amber-50/50 border border-amber-100 rounded-lg focus:ring-2 focus:ring-amber-100 focus:border-amber-400 focus:bg-white transition-all pr-20"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-600 font-medium flex items-center gap-1 text-sm">
                        <UsersIcon className="h-4 w-4" /> places
                      </span>
                    </div>
                  </div>

                  {/* Section */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Section
                    </label>
                    <select
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      className="w-full px-3 py-2.5 bg-amber-50/50 border border-amber-100 rounded-lg focus:ring-2 focus:ring-amber-100 focus:border-amber-400 focus:bg-white transition-all"
                    >
                      <option value="">Sélectionner une section</option>
                      {sections.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Position description */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                      <MapPinIcon className="h-4 w-4" /> Description de la position
                    </label>
                    <input
                      type="text"
                      value={formData.position_description}
                      onChange={(e) => setFormData({ ...formData, position_description: e.target.value })}
                      placeholder="Ex: Près de la fenêtre, Vue mer..."
                      className="w-full px-3 py-2.5 bg-amber-50/50 border border-amber-100 rounded-lg focus:ring-2 focus:ring-amber-100 focus:border-amber-400 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Active status */}
                  <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all ${
                    formData.is_active
                      ? "bg-emerald-50 border-emerald-300"
                      : "bg-red-50 border-red-200"
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                        {formData.is_active ? (
                          <><CheckCircleSolid className="h-4 w-4 text-emerald-600" /> Table active</>
                        ) : (
                          <><XCircleIcon className="h-4 w-4 text-red-500" /> Table inactive</>
                        )}
                      </span>
                      <span className="block text-xs text-slate-400">Disponible pour les réservations</span>
                    </div>
                  </label>
                </form>

                {/* Actions Footer */}
                <div className="p-4 bg-gradient-to-r from-slate-50 to-amber-50 border-t border-amber-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 font-semibold transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:shadow-lg font-semibold transition-all flex items-center justify-center gap-1"
                  >
                    <CheckCircleSolid className="h-4 w-4" />
                    {editingTable ? "Mettre à jour" : "Créer la table"}
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* Confirm Delete Modal */}
        <ConfirmModal
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
          title="Supprimer la table"
          message={`Êtes-vous sûr de vouloir supprimer la table "${confirmDelete?.table_number}" ? Cette action est irréversible.`}
          confirmText="Supprimer"
          confirmStyle="danger"
        />

        {/* Table Orders Modal */}
        {selectedTableOrders && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <TableCellsIcon className="h-6 w-6 text-blue-200" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Table {selectedTableOrders.table.table_number}
                    </h2>
                    <p className="text-blue-200 text-sm">
                      {selectedTableOrders.orders.length} commande{selectedTableOrders.orders.length > 1 ? "s" : ""} en cours
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTableOrders(null)}
                  className="absolute top-4 right-4 p-1.5 text-blue-200 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Orders List */}
              <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                {selectedTableOrders.orders.map((order) => (
                  <div key={order.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800">{order.order_number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'ready' ? 'bg-green-100 text-green-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {order.status === 'pending' ? 'En attente' :
                         order.status === 'preparing' ? 'En préparation' :
                         order.status === 'ready' ? 'Prêt' : order.status}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 mb-2">
                      {order.customer_name && <p>Client: {order.customer_name}</p>}
                      <p>Heure: {order.order_time?.substring(0, 5) || new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    {order.items && order.items.length > 0 && (
                      <div className="border-t border-slate-200 pt-2 mt-2">
                        <p className="text-xs text-slate-500 mb-1">Articles:</p>
                        <ul className="text-sm text-slate-700 space-y-1">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="flex justify-between">
                              <span>{item.quantity}x {item.menu_item_name || item.name}</span>
                              <span className="text-slate-500">{parseFloat(item.subtotal || 0).toFixed(2)} {tenant?.currency || "EUR"}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between items-center">
                      <span className="font-semibold text-slate-700">Total</span>
                      <span className="font-bold text-blue-600">{parseFloat(order.total_amount || 0).toFixed(2)} {tenant?.currency || "EUR"}</span>
                    </div>
                    {order.notes && (
                      <div className="mt-2 p-2 bg-amber-50 rounded-lg text-sm text-amber-800">
                        <span className="font-medium">Note:</span> {order.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="p-4 bg-slate-100 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">Total table</span>
                  <span className="text-xl font-bold text-blue-600">
                    {selectedTableOrders.orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0).toFixed(2)} {tenant?.currency || "EUR"}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedTableOrders(null)}
                  className="mt-3 w-full py-2.5 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table Reservations Modal */}
        {selectedTableReservations && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-purple-600 to-purple-700 p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <CalendarDaysIcon className="h-6 w-6 text-purple-200" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Table {selectedTableReservations.table.table_number}
                    </h2>
                    <p className="text-purple-200 text-sm">
                      {selectedTableReservations.reservations.length} réservation{selectedTableReservations.reservations.length > 1 ? "s" : ""} aujourd'hui
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTableReservations(null)}
                  className="absolute top-4 right-4 p-1.5 text-purple-200 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Reservations List */}
              <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                {selectedTableReservations.reservations.map((reservation) => (
                  <div key={reservation.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800">{reservation.customer_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        reservation.status === 'seated' ? 'bg-blue-100 text-blue-800' :
                        reservation.status === 'completed' ? 'bg-slate-100 text-slate-800' :
                        reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {reservation.status === 'pending' ? 'En attente' :
                         reservation.status === 'confirmed' ? 'Confirmée' :
                         reservation.status === 'seated' ? 'Installé' :
                         reservation.status === 'completed' ? 'Terminée' :
                         reservation.status === 'cancelled' ? 'Annulée' :
                         reservation.status === 'no_show' ? 'Absent' : reservation.status}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-purple-500" />
                        <span className="font-semibold">{reservation.reservation_time?.substring(0, 5)}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <UsersIcon className="h-4 w-4 text-purple-500" />
                        {reservation.party_size} personne{reservation.party_size > 1 ? "s" : ""}
                      </p>
                      {reservation.customer_phone && (
                        <p>Tél: <a href={`tel:${reservation.customer_phone}`} className="text-purple-600">{reservation.customer_phone}</a></p>
                      )}
                      {reservation.customer_email && (
                        <p>Email: {reservation.customer_email}</p>
                      )}
                    </div>
                    {reservation.special_requests && (
                      <div className="mt-2 p-2 bg-purple-50 rounded-lg text-sm text-purple-800">
                        <span className="font-medium">Note:</span> {reservation.special_requests}
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      {reservation.status === 'pending' && (
                        <button
                          onClick={async () => {
                            try {
                              await api.patch(`/restaurant/reservations/${reservation.id}/status`, { status: 'confirmed' });
                              showToast("Réservation confirmée");
                              fetchTables();
                              setSelectedTableReservations(null);
                            } catch (error) {
                              showToast("Erreur lors de la confirmation", "error");
                            }
                          }}
                          className="flex-1 py-1.5 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700"
                        >
                          Confirmer
                        </button>
                      )}
                      {['pending', 'confirmed'].includes(reservation.status) && (
                        <button
                          onClick={async () => {
                            try {
                              await api.patch(`/restaurant/reservations/${reservation.id}/status`, { status: 'seated' });
                              showToast("Client marqué comme installé");
                              fetchTables();
                              setSelectedTableReservations(null);
                            } catch (error) {
                              showToast("Erreur lors de la mise à jour", "error");
                            }
                          }}
                          className="flex-1 py-1.5 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700"
                        >
                          Installer
                        </button>
                      )}
                      {reservation.status === 'seated' && (
                        <button
                          onClick={async () => {
                            try {
                              await api.patch(`/restaurant/reservations/${reservation.id}/status`, { status: 'completed' });
                              showToast("Réservation terminée");
                              fetchTables();
                              setSelectedTableReservations(null);
                            } catch (error) {
                              showToast("Erreur lors de la mise à jour", "error");
                            }
                          }}
                          className="flex-1 py-1.5 bg-slate-600 text-white text-sm rounded-lg font-medium hover:bg-slate-700"
                        >
                          Terminer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-100 border-t border-slate-200">
                <button
                  onClick={() => setSelectedTableReservations(null)}
                  className="w-full py-2.5 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
                >
                  Fermer
                </button>
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

export default Tables;
