import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { usePublicTheme } from '../../contexts/PublicThemeContext';
import { ChevronLeft, Lock, CheckCircle2, CreditCard, Smartphone } from 'lucide-react';

const Checkout = () => {
    const { slug } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { salon } = usePublicTheme();

    const cart = location.state?.cart || [];
    const totalAmount = location.state?.total || 0;

    const [guestInfo, setGuestInfo] = useState({ name: '', phone: '', address: '' });
    const [paymentMethod, setPaymentMethod] = useState('mobile_money');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: salon?.currency || 'XOF', minimumFractionDigits: 0 }).format(amount);
    };

    if (cart.length === 0 && !success) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                 <h2 className="text-2xl font-bold mb-4">Votre panier est vide</h2>
                 <button onClick={() => navigate(`/book/${slug}/shop`)} className="text-indigo-600 font-medium hover:underline">
                     Retourner à la boutique
                 </button>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Create Order
            const orderRes = await axios.post(`/api/shop/${salon.id}/orders`, {
                items: cart.map(item => ({ productId: item.id, quantity: item.quantity })),
                guestInfo,
                paymentMethod: paymentMethod === 'card' ? 'STRIPE' : 'PAYGATE'
            });

            const order = orderRes.data;

            if (paymentMethod === 'mobile_money') {
                // 2a. Mobile Money flow (Paygate)
                const paygateRes = await axios.post('/api/payments/paygate/init', {
                    orderId: order.id,
                    phone: guestInfo.phone,
                    amount: totalAmount
                });

                if (paygateRes.data.success) {
                    setSuccess(true);
                }
            } else if (paymentMethod === 'card') {
                // 2b. Card payment flow (Stripe Checkout)
                const stripeRes = await axios.post('/api/payments/stripe/init-order', {
                    orderId: order.id,
                    amount: totalAmount,
                    tenantSlug: slug
                });

                if (stripeRes.data.success && stripeRes.data.url) {
                    window.location.href = stripeRes.data.url;
                    return;
                }
            }

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || "Une erreur est survenue lors du paiement. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
         return (
             <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                 <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                     <CheckCircle2 className="w-10 h-10" />
                 </div>
                 <h2 className="text-3xl font-black text-gray-900 mb-2">Commande confirmée !</h2>
                 <p className="text-gray-500 max-w-sm mx-auto mb-8">
                     Une demande de paiement a été envoyée sur votre téléphone ({guestInfo.phone}).
                     Veuillez composer le code USSD pour valider.
                 </p>
                 <button onClick={() => navigate(`/book/${slug}/shop`)} className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-xl transition-colors">
                     Retour à la boutique
                 </button>
            </div>
         );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
             <div className="max-w-3xl mx-auto">
                  <div className="mb-8 flex items-center">
                     <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-200 transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                     </button>
                     <h1 className="text-2xl font-bold text-gray-900 ml-2">Finaliser la commande</h1>
                 </div>

                 <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
                     {/* Left: Form */}
                     <div className="flex-1 p-8 md:p-10 border-b md:border-b-0 md:border-r border-gray-100">
                         <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                             Vos informations
                         </h2>

                         {error && (
                             <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                                 {error}
                             </div>
                         )}

                         <form onSubmit={handleSubmit} className="space-y-5">
                             <div>
                                 <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom complet</label>
                                 <input
                                     required
                                     type="text"
                                     placeholder="Ex: Jean Dupont"
                                     value={guestInfo.name}
                                     onChange={(e) => setGuestInfo({...guestInfo, name: e.target.value})}
                                     className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                 />
                             </div>

                             {/* Payment Method Selection */}
                             <div className="pt-2">
                                 <label className="block text-sm font-semibold text-gray-700 mb-3">Mode de paiement</label>
                                 <div className="grid grid-cols-2 gap-3">
                                     <button
                                         type="button"
                                         onClick={() => setPaymentMethod('mobile_money')}
                                         className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                                             paymentMethod === 'mobile_money'
                                                 ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                 : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                         }`}
                                     >
                                         <Smartphone className="w-6 h-6 mb-2" />
                                         <span className="font-bold text-sm">Mobile Money</span>
                                         <span className="text-xs text-gray-500 mt-0.5">T-Money, Moov Africa</span>
                                     </button>
                                     <button
                                         type="button"
                                         onClick={() => setPaymentMethod('card')}
                                         className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                                             paymentMethod === 'card'
                                                 ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                 : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                         }`}
                                     >
                                         <CreditCard className="w-6 h-6 mb-2" />
                                         <span className="font-bold text-sm">Carte bancaire</span>
                                         <span className="text-xs text-gray-500 mt-0.5">Visa, Mastercard</span>
                                     </button>
                                 </div>
                             </div>

                             {/* Phone input - only for Mobile Money */}
                             {paymentMethod === 'mobile_money' && (
                                 <div>
                                     <label className="block text-sm font-semibold text-gray-700 mb-1.5">Numéro Mobile Money</label>
                                     <input
                                         required
                                         type="tel"
                                         placeholder="Ex: 90 00 00 00"
                                         value={guestInfo.phone}
                                         onChange={(e) => setGuestInfo({...guestInfo, phone: e.target.value})}
                                         className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                     />
                                     <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                         <Lock className="w-3 h-3" /> Paiement sécurisé via Paygate Global
                                     </p>
                                 </div>
                             )}

                             {/* Card info notice */}
                             {paymentMethod === 'card' && (
                                 <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                                     <p className="text-sm text-indigo-800 flex items-center gap-2">
                                         <Lock className="w-4 h-4 flex-shrink-0" />
                                         Vous serez redirigé vers une page de paiement sécurisée Stripe pour saisir vos informations de carte.
                                     </p>
                                 </div>
                             )}

                             {/* Phone for contact (when card) */}
                             {paymentMethod === 'card' && (
                                 <div>
                                     <label className="block text-sm font-semibold text-gray-700 mb-1.5">Téléphone (contact)</label>
                                     <input
                                         required
                                         type="tel"
                                         placeholder="Ex: 90 00 00 00"
                                         value={guestInfo.phone}
                                         onChange={(e) => setGuestInfo({...guestInfo, phone: e.target.value})}
                                         className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                     />
                                 </div>
                             )}

                              <div>
                                 <label className="block text-sm font-semibold text-gray-700 mb-1.5">Adresse de livraison (Optionnel)</label>
                                 <textarea
                                     rows={3}
                                     placeholder="Si vous souhaitez être livré..."
                                     value={guestInfo.address}
                                     onChange={(e) => setGuestInfo({...guestInfo, address: e.target.value})}
                                     className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                 />
                             </div>

                             <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center py-4 px-8 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                                >
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                    ) : paymentMethod === 'card' ? (
                                        <>Payer par carte {formatAmount(totalAmount)}</>
                                    ) : (
                                        <>Payer {formatAmount(totalAmount)}</>
                                    )}
                                </button>
                             </div>
                         </form>
                     </div>

                     {/* Right: Summary */}
                     <div className="w-full md:w-80 bg-gray-50 p-8 md:p-10 flex flex-col">
                         <h3 className="text-lg font-bold text-gray-900 mb-6">Récapitulatif</h3>

                         <ul className="space-y-4 mb-8 flex-1">
                             {cart.map((item, idx) => (
                                 <li key={idx} className="flex justify-between items-start text-sm">
                                     <div className="flex-1 pr-4">
                                         <p className="font-semibold text-gray-900 line-clamp-2">{item.name}</p>
                                         <p className="text-gray-500">Qté: {item.quantity}</p>
                                     </div>
                                     <p className="font-bold text-gray-900 whitespace-nowrap">
                                        {formatAmount(item.price * item.quantity)}
                                     </p>
                                 </li>
                             ))}
                         </ul>

                         <div className="border-t border-gray-200 pt-6 mt-auto">
                              <div className="flex justify-between items-center text-lg font-black text-gray-900">
                                  <span>Total</span>
                                  <span className="text-indigo-600">
                                      {formatAmount(totalAmount)}
                                  </span>
                              </div>
                         </div>
                     </div>
                 </div>
             </div>
        </div>
    );
};

export default Checkout;
