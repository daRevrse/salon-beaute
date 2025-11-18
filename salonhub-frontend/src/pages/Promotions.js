/**
 * Page Promotions
 * Gestion des codes promo et offres spéciales
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../components/common/DashboardLayout';
import { usePermissions } from '../contexts/PermissionContext';
import { useCurrency } from '../contexts/CurrencyContext';
import api from '../services/api';
import {
  TagIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  CalendarIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const Promotions = () => {
  const { can } = usePermissions();
  const { formatPrice } = useCurrency();
  const [promotions, setPromotions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [filterActive, setFilterActive] = useState('all'); // 'all', 'active', 'expired'

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    applies_to: 'all_services',
    service_ids: [],
    min_purchase_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    usage_per_client: 1,
    valid_from: '',
    valid_until: '',
    is_active: true,
    is_public: true,
  });

  useEffect(() => {
    loadPromotions();
    loadStats();
  }, []);

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/promotions');
      setPromotions(response.data.data);
    } catch (error) {
      console.error('Erreur chargement promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/promotions/stats/summary');
      setStats(response.data.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleOpenModal = (promotion = null) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData({
        code: promotion.code,
        title: promotion.title,
        description: promotion.description || '',
        discount_type: promotion.discount_type,
        discount_value: promotion.discount_value,
        applies_to: promotion.applies_to,
        service_ids: promotion.service_ids ? JSON.parse(promotion.service_ids) : [],
        min_purchase_amount: promotion.min_purchase_amount || '',
        max_discount_amount: promotion.max_discount_amount || '',
        usage_limit: promotion.usage_limit || '',
        usage_per_client: promotion.usage_per_client,
        valid_from: promotion.valid_from?.split('T')[0] || '',
        valid_until: promotion.valid_until?.split('T')[0] || '',
        is_active: promotion.is_active,
        is_public: promotion.is_public,
      });
    } else {
      setEditingPromotion(null);
      setFormData({
        code: '',
        title: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        applies_to: 'all_services',
        service_ids: [],
        min_purchase_amount: '',
        max_discount_amount: '',
        usage_limit: '',
        usage_per_client: 1,
        valid_from: '',
        valid_until: '',
        is_active: true,
        is_public: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPromotion(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingPromotion) {
        await api.put(`/promotions/${editingPromotion.id}`, formData);
        alert('Promotion modifiée avec succès !');
      } else {
        await api.post('/promotions', formData);
        alert('Promotion créée avec succès !');
      }

      handleCloseModal();
      loadPromotions();
      loadStats();
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette promotion ?')) {
      return;
    }

    try {
      await api.delete(`/promotions/${id}`);
      alert('Promotion supprimée avec succès !');
      loadPromotions();
      loadStats();
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const handleToggleActive = async (promotion) => {
    try {
      await api.put(`/promotions/${promotion.id}`, {
        is_active: !promotion.is_active,
      });
      loadPromotions();
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur lors de la modification');
    }
  };

  const getFilteredPromotions = () => {
    const now = new Date();

    return promotions.filter((promo) => {
      if (filterActive === 'active') {
        return promo.is_active && new Date(promo.valid_until) >= now;
      } else if (filterActive === 'expired') {
        return new Date(promo.valid_until) < now;
      }
      return true; // 'all'
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const getDiscountLabel = (promo) => {
    if (promo.discount_type === 'percentage') {
      return `-${promo.discount_value}%`;
    } else {
      return `-${formatPrice(promo.discount_value)}`;
    }
  };

  const filteredPromotions = getFilteredPromotions();

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <TagIcon className="h-8 w-8 mr-3 text-purple-600" />
              Promotions
            </h1>
            <p className="mt-2 text-gray-600">
              Gérez vos codes promo et offres spéciales
            </p>
          </div>
          {can.createService && (
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center shadow-md"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nouvelle promotion
            </button>
          )}
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Promotions</p>
                  <p className="text-3xl font-bold mt-1">{stats.total_promotions || 0}</p>
                </div>
                <TagIcon className="h-12 w-12 text-purple-200 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Actives</p>
                  <p className="text-3xl font-bold mt-1">{stats.active_promotions || 0}</p>
                </div>
                <CheckCircleIcon className="h-12 w-12 text-green-200 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Utilisations</p>
                  <p className="text-3xl font-bold mt-1">{stats.total_usages || 0}</p>
                </div>
                <UsersIcon className="h-12 w-12 text-blue-200 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Réductions</p>
                  <p className="text-3xl font-bold mt-1">
                    {formatPrice(stats.total_discounts_given || 0)}
                  </p>
                </div>
                <ChartBarIcon className="h-12 w-12 text-orange-200 opacity-80" />
              </div>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="mb-6 flex items-center space-x-2">
          <button
            onClick={() => setFilterActive('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterActive === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => setFilterActive('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterActive === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Actives
          </button>
          <button
            onClick={() => setFilterActive('expired')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterActive === 'expired'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Expirées
          </button>
        </div>

        {/* Liste des promotions */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border">
            <TagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune promotion
            </h3>
            <p className="text-gray-500 mb-6">
              Créez votre première promotion pour attirer plus de clients
            </p>
            {can.createService && (
              <button
                onClick={() => handleOpenModal()}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Créer une promotion
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPromotions.map((promo) => {
              const isExpired = new Date(promo.valid_until) < new Date();

              return (
                <div
                  key={promo.id}
                  className={`bg-white rounded-xl shadow-md border-2 overflow-hidden transition-all hover:shadow-xl ${
                    isExpired ? 'border-gray-300 opacity-75' : 'border-purple-200'
                  }`}
                >
                  {/* Badge de réduction */}
                  <div
                    className={`p-6 text-center ${
                      isExpired
                        ? 'bg-gray-100'
                        : 'bg-gradient-to-r from-purple-500 to-purple-600'
                    } text-white`}
                  >
                    <div className="text-4xl font-bold">{getDiscountLabel(promo)}</div>
                    <div className="text-sm mt-1 uppercase tracking-wide font-semibold">
                      {promo.code}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{promo.title}</h3>
                    {promo.description && (
                      <p className="text-gray-600 text-sm mb-4">{promo.description}</p>
                    )}

                    {/* Détails */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm">
                        <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">
                          Du {formatDate(promo.valid_from)} au {formatDate(promo.valid_until)}
                        </span>
                      </div>

                      {promo.usage_limit && (
                        <div className="flex items-center text-sm">
                          <UsersIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-gray-600">
                            {promo.total_usages || 0} / {promo.usage_limit} utilisations
                          </span>
                        </div>
                      )}

                      {promo.min_purchase_amount && (
                        <div className="text-sm text-gray-600">
                          Minimum : {formatPrice(promo.min_purchase_amount)}
                        </div>
                      )}
                    </div>

                    {/* Statut */}
                    <div className="flex items-center space-x-2 mb-4">
                      {promo.is_active && !isExpired ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Active
                        </span>
                      ) : isExpired ? (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          Expirée
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          Inactive
                        </span>
                      )}

                      {promo.is_public && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          Publique
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    {can.editService && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleActive(promo)}
                          className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                            promo.is_active
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {promo.is_active ? 'Désactiver' : 'Activer'}
                        </button>

                        <button
                          onClick={() => handleOpenModal(promo)}
                          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium transition-colors"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>

                        {can.deleteService && (
                          <button
                            onClick={() => handleDelete(promo.id)}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de création/édition */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl max-w-2xl w-full mx-4 shadow-2xl my-8">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
                <h3 className="text-xl font-bold">
                  {editingPromotion ? 'Modifier la promotion' : 'Nouvelle promotion'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Code et Titre */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code promo *
                    </label>
                    <input
                      type="text"
                      name="code"
                      required
                      value={formData.code}
                      onChange={handleChange}
                      placeholder="NOEL2024"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titre *
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Offre de Noël"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Profitez de 20% de réduction sur tous nos services..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  ></textarea>
                </div>

                {/* Type et Valeur de réduction */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de réduction *
                    </label>
                    <select
                      name="discount_type"
                      required
                      value={formData.discount_type}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="percentage">Pourcentage (%)</option>
                      <option value="fixed_amount">Montant fixe (€)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valeur *
                    </label>
                    <input
                      type="number"
                      name="discount_value"
                      required
                      min="0"
                      step="0.01"
                      value={formData.discount_value}
                      onChange={handleChange}
                      placeholder={formData.discount_type === 'percentage' ? '20' : '10.00'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Conditions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Montant minimum (€)
                    </label>
                    <input
                      type="number"
                      name="min_purchase_amount"
                      min="0"
                      step="0.01"
                      value={formData.min_purchase_amount}
                      onChange={handleChange}
                      placeholder="Ex: 30"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Réduction maximum (€)
                    </label>
                    <input
                      type="number"
                      name="max_discount_amount"
                      min="0"
                      step="0.01"
                      value={formData.max_discount_amount}
                      onChange={handleChange}
                      placeholder="Ex: 50"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Limites d'utilisation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Limite d'utilisation totale
                    </label>
                    <input
                      type="number"
                      name="usage_limit"
                      min="0"
                      value={formData.usage_limit}
                      onChange={handleChange}
                      placeholder="Illimité"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Par client *
                    </label>
                    <input
                      type="number"
                      name="usage_per_client"
                      required
                      min="1"
                      value={formData.usage_per_client}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Période de validité */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Début de validité *
                    </label>
                    <input
                      type="date"
                      name="valid_from"
                      required
                      value={formData.valid_from}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fin de validité *
                    </label>
                    <input
                      type="date"
                      name="valid_until"
                      required
                      value={formData.valid_until}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Promotion active</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_public"
                      checked={formData.is_public}
                      onChange={handleChange}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Visible sur la page de réservation publique
                    </span>
                  </label>
                </div>

                {/* Boutons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium shadow-md"
                  >
                    {editingPromotion ? 'Modifier' : 'Créer la promotion'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Promotions;
