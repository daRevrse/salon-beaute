import React from 'react';
import { Wallet as WalletIcon, Clock, Sparkles, Landmark, CreditCard, Smartphone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import { getBusinessTypeConfig } from '../../utils/businessTypeConfig';

const Wallet = () => {
    const { tenant } = useAuth();
    const businessType = tenant?.business_type || "beauty";
    const config = getBusinessTypeConfig(businessType);

    return (
        <DashboardLayout>
            <div className="p-6 max-w-5xl mx-auto min-h-[80vh] flex flex-col items-center justify-center text-center">
                <div className="relative mb-8 text-center flex justify-center">
                     <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse rounded-full"></div>
                     <div className={`relative p-8 rounded-3xl bg-gradient-to-br ${config.gradient} shadow-soft-xl inline-flex items-center justify-center`}>
                        <WalletIcon className="h-16 w-16 text-white" />
                     </div>
                     <div className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-soft border border-indigo-100 animate-bounce">
                         <Clock className="w-5 h-5 text-indigo-600" />
                     </div>
                </div>
                
                <h1 className="font-display text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">
                    Le Portefeuille Arrive <span className="text-indigo-600 italic">Bientôt</span>
                </h1>
                
                <p className="max-w-xl text-lg text-slate-500 leading-relaxed mb-10">
                    Encaissez vos paiements par <span className="font-semibold text-slate-700">Mobile Money</span> et <span className="font-semibold text-slate-700">Carte Bancaire</span> directement depuis SalonHub. 
                    Nous finalisons les derniers détails avec nos partenaires de paiement pour vous offrir une expérience sécurisée et fluide.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl mb-12">
                     <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-soft-sm">
                         <div className="flex justify-center mb-3">
                             <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                 <Landmark className="w-6 h-6" />
                             </div>
                         </div>
                         <h3 className="font-bold text-slate-800">Retraits Faciles</h3>
                         <p className="text-xs text-slate-500">Vers T-Money ou Moov</p>
                     </div>
                     <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-soft-sm">
                         <div className="flex justify-center mb-3">
                             <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                 <CreditCard className="w-6 h-6" />
                             </div>
                         </div>
                         <h3 className="font-bold text-slate-800">Paiements Carte</h3>
                         <p className="text-xs text-slate-500">Visa & Mastercard</p>
                     </div>
                     <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-soft-sm">
                         <div className="flex justify-center mb-3">
                             <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                 <Smartphone className="w-6 h-6" />
                             </div>
                         </div>
                         <h3 className="font-bold text-slate-800">Mobile Money</h3>
                         <p className="text-xs text-slate-500">Intégration locale</p>
                     </div>
                </div>

                <div className="flex justify-center">
                    <button 
                        onClick={() => window.history.back()}
                        className="px-10 py-4 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold shadow-soft hover:shadow-soft-lg hover:bg-slate-50 transition-all transform hover:-translate-y-0.5 active:translate-y-0">
                        Retourner au Tableau de Bord
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Wallet;
