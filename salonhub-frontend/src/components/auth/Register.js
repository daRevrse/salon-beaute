/**
 * Page Register
 * Inscription multi-étapes (salon + owner)
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';

const Register = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const { formatPrice } = useCurrency();
  
  const [formData, setFormData] = useState({
    // Salon
    salon_name: '',
    salon_email: '',
    salon_phone: '',
    salon_address: '',
    salon_city: '',
    salon_postal_code: '',
    
    // Owner
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirm: '',
    
    // Plan
    subscription_plan: 'professional',
  });
  
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.salon_name || !formData.salon_email || !formData.first_name || 
        !formData.last_name || !formData.email || !formData.password) {
      setError('Tous les champs obligatoires doivent être remplis');
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email) || !emailRegex.test(formData.salon_email)) {
      setError('Format email invalide');
      return;
    }

    // Validation password
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (formData.password !== formData.password_confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    // Préparation données
    const { password_confirm, ...registerData } = formData;
    
    // Tentative inscription
    const result = await register(registerData);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Créer votre compte SalonHub
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            14 jours d'essai gratuit, sans carte bancaire
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white shadow rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Section Salon */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Informations du salon
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nom du salon *
                  </label>
                  <input
                    type="text"
                    name="salon_name"
                    required
                    value={formData.salon_name}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Salon Beauté Paris"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email du salon *
                    </label>
                    <input
                      type="email"
                      name="salon_email"
                      required
                      value={formData.salon_email}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="contact@salon.fr"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      name="salon_phone"
                      value={formData.salon_phone}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="01 23 45 67 89"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Adresse
                  </label>
                  <input
                    type="text"
                    name="salon_address"
                    value={formData.salon_address}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123 Rue de la Paix"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Ville
                    </label>
                    <input
                      type="text"
                      name="salon_city"
                      value={formData.salon_city}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Paris"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Code postal
                    </label>
                    <input
                      type="text"
                      name="salon_postal_code"
                      value={formData.salon_postal_code}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="75001"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section Propriétaire */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Vos informations (propriétaire)
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      required
                      value={formData.first_name}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nom *
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      required
                      value={formData.last_name}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Votre email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="vous@exemple.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Mot de passe *
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Min. 8 caractères"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Confirmer mot de passe *
                    </label>
                    <input
                      type="password"
                      name="password_confirm"
                      required
                      value={formData.password_confirm}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Plan */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Choisir votre plan
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <label className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer ${
                  formData.subscription_plan === 'starter' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="subscription_plan"
                    value="starter"
                    checked={formData.subscription_plan === 'starter'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="text-lg font-semibold">Starter</span>
                  <span className="text-2xl font-bold mt-2">{formatPrice(29)}<span className="text-sm">/mois</span></span>
                  <span className="text-sm text-gray-600 mt-1">100 clients max</span>
                </label>

                <label className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer ${
                  formData.subscription_plan === 'professional' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="subscription_plan"
                    value="professional"
                    checked={formData.subscription_plan === 'professional'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="text-lg font-semibold">Professional</span>
                  <span className="text-2xl font-bold mt-2">{formatPrice(59)}<span className="text-sm">/mois</span></span>
                  <span className="text-sm text-gray-600 mt-1">Recommandé</span>
                </label>

                <label className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer ${
                  formData.subscription_plan === 'business' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="subscription_plan"
                    value="business"
                    checked={formData.subscription_plan === 'business'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="text-lg font-semibold">Business</span>
                  <span className="text-2xl font-bold mt-2">{formatPrice(99)}<span className="text-sm">/mois</span></span>
                  <span className="text-sm text-gray-600 mt-1">Multi-salons</span>
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="border-t pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Création du compte...' : 'Créer mon compte gratuitement'}
              </button>

              <p className="mt-4 text-center text-sm text-gray-600">
                Vous avez déjà un compte ?{' '}
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Se connecter
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
