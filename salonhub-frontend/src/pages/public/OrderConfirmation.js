import React from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, ShoppingBag } from 'lucide-react';

const OrderConfirmation = () => {
    const { slug } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const orderId = searchParams.get('order_id');
    const cancelled = searchParams.get('cancelled');

    if (cancelled) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Paiement annulé</h2>
                <p className="text-gray-500 max-w-sm mx-auto mb-8">
                    Le paiement a été annulé. Votre commande est en attente.
                </p>
                <button
                    onClick={() => navigate(`/book/${slug}/shop`)}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
                >
                    Retour à la boutique
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Commande confirmée !</h2>
            <p className="text-gray-500 max-w-sm mx-auto mb-2">
                Votre paiement par carte a été traité avec succès.
            </p>
            {orderId && (
                <p className="text-sm text-gray-400 mb-8">
                    Commande #{orderId}
                </p>
            )}
            <button
                onClick={() => navigate(`/book/${slug}/shop`)}
                className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-xl transition-colors"
            >
                Retour à la boutique
            </button>
        </div>
    );
};

export default OrderConfirmation;
