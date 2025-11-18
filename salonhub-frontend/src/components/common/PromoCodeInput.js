/**
 * Composant PromoCodeInput
 * Champ de saisie et validation de code promo
 */

import { useState } from 'react';
import { TagIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const PromoCodeInput = ({ onValidate, currentAmount, clientId }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [promoData, setPromoData] = useState(null);
  const [error, setError] = useState(null);

  const handleValidate = async () => {
    if (!code.trim()) {
      setError('Veuillez saisir un code promo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await onValidate(code.trim().toUpperCase());

      if (response.success) {
        setPromoData(response.data);
        setError(null);
      } else {
        setError(response.error || 'Code promo invalide');
        setPromoData(null);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la validation');
      setPromoData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCode('');
    setPromoData(null);
    setError(null);
    onValidate(null); // Retirer la promo
  };

  return (
    <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
      <div className="flex items-center mb-3">
        <TagIcon className="h-5 w-5 text-purple-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Code promo</h3>
      </div>

      {!promoData ? (
        <div className="flex space-x-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && handleValidate()}
            placeholder="Entrez votre code"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 uppercase"
            disabled={loading}
          />
          <button
            onClick={handleValidate}
            disabled={loading || !code.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? 'Vérification...' : 'Appliquer'}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-4 border-2 border-green-300">
          <div className="flex items-start justify-between">
            <div className="flex items-start flex-1">
              <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="text-lg font-bold text-gray-900 mr-2">
                    {promoData.code}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    Appliqué
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{promoData.title}</p>
                <div className="mt-2 text-sm">
                  <span className="text-gray-600">Réduction : </span>
                  <span className="font-bold text-green-600">
                    -{(promoData.discount_amount || 0).toFixed(2)} €
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Nouveau total : </span>
                  <span className="font-bold text-purple-600">
                    {(promoData.final_amount || 0).toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="ml-4 p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Retirer le code promo"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {error && !promoData && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
          <XCircleIcon className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
};

export default PromoCodeInput;
