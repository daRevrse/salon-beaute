import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle, CreditCard, Banknote } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import { getBusinessTypeConfig } from '../../utils/businessTypeConfig';
// import Button removed
const Wallet = () => {
    const { user, tenant } = useAuth();
    const isPro = ['pro', 'professional', 'custom', 'enterprise', 'PRO', 'CUSTOM'].includes(tenant?.subscription_plan);
    const businessType = tenant?.business_type || "beauty";
    const config = getBusinessTypeConfig(businessType);
    
    const [wallet, setWallet] = useState({ balance: 0, pendingBalance: 0 });
    const [transactions, setTransactions] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Withdrawal Modal State
    const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
    const [withdrawalForm, setWithdrawalForm] = useState({ amount: 0, payoutMethod: 'T-Money', payoutDetails: '' });

    useEffect(() => {
        if(isPro) {
            // Fetch data
            fetchWalletData();
        }
    }, [isPro]);

    const fetchWalletData = async () => {
        try {
            setLoading(true);
            const [walletRes, txRes] = await Promise.all([
                api.get('/wallet'),
                api.get('/wallet/transactions')
            ]);
            setWallet(walletRes.data || { balance: 0, pendingBalance: 0 });
            setTransactions(txRes.data || []);
            setLoading(false);
        } catch(err) { 
            console.error('Failed to fetch wallet details:', err); 
            setLoading(false);
        }
    };

    const handleRequestWithdrawal = async () => {
        try {
            await api.post('/wallet/withdrawals', withdrawalForm);
            setIsWithdrawalModalOpen(false);
            setWithdrawalForm({ amount: 0, payoutMethod: 'T-Money', payoutDetails: '' });
            fetchWalletData();
        } catch(err) { 
            console.error('Failed to request withdrawal:', err);
            alert(err.response?.data?.error || "Erreur lors de la demande de retrait");
        }
    };

    if (!isPro) {
        return (
            <DashboardLayout>
                <div className="p-6 max-w-5xl mx-auto">
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                        <WalletIcon className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Portefeuille Numérique</h2>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">Encaissez les paiements de vos clients par Mobile Money et Carte Bancaire. Disponible uniquement sur le plan PRO.</p>
                     <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 font-semibold">Découvrir le Plan Pro</button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(amount);
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'SUCCESS': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3"/> Réussi</span>;
            case 'PENDING': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3"/> En attente</span>;
            case 'FAILED': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3"/> Échoué</span>;
            default: return null;
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 max-w-5xl mx-auto">
                 <div className="mb-8 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                           <div className={`p-3 rounded-2xl bg-gradient-to-br ${config.gradient} shadow-soft-lg`}>
                              <WalletIcon className="h-7 w-7 text-white" />
                           </div>
                           <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-800">
                               Mon Portefeuille
                           </h1>
                        </div>
                        <p className="text-slate-500 mt-2">Gérez vos revenus et demandez vos virements.</p>
                    </div>
                <button 
                    onClick={() => setIsWithdrawalModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium transition-colors cursor-pointer">
                    <ArrowUpRight className="w-4 h-4" /> Demander un retrait
                </button>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10"></div>
                    <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white opacity-10"></div>
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                         <div>
                            <p className="text-indigo-100 font-medium mb-1">Solde Disponible</p>
                            <h2 className="text-4xl font-bold">{formatCurrency(wallet.balance)}</h2>
                         </div>
                         <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                             <WalletIcon className="w-6 h-6 text-white" />
                         </div>
                    </div>
                    <p className="text-sm text-indigo-100 relative z-10 opacity-80 mt-6">Prêt à être retiré vers votre compte Mobile Money.</p>
                </div>

                 <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                     <div className="flex justify-between items-start mb-4">
                         <div>
                            <p className="text-gray-500 font-medium mb-1">En cours d'acquisition</p>
                            <h2 className="text-3xl font-bold text-gray-900">{formatCurrency(wallet.pendingBalance)}</h2>
                         </div>
                         <div className="p-3 bg-gray-50 rounded-xl">
                             <Clock className="w-6 h-6 text-gray-400" />
                         </div>
                    </div>
                     <p className="text-sm text-gray-500">Fonds provenant de transactions récentes en attente de validation (24-48h).</p>
                </div>
            </div>

            {/* Transactions History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Historique des transactions</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {transactions.map(tx => (
                        <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${
                                    tx.type === 'COMMISSION' ? 'bg-red-50 text-red-600' :
                                    tx.type === 'WITHDRAWAL' ? 'bg-orange-50 text-orange-600' :
                                    'bg-green-50 text-green-600'
                                }`}>
                                     {tx.type === 'COMMISSION' ? <Banknote className="w-5 h-5"/> :
                                      tx.type === 'WITHDRAWAL' ? <ArrowUpRight className="w-5 h-5"/> :
                                      <ArrowDownLeft className="w-5 h-5"/>}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {tx.type === 'PAYMENT' ? 'Paiement Client (Boutique/Rdv)' : 
                                         tx.type === 'COMMISSION' ? 'Frais de plateforme SalonHub' : 
                                         'Retrait vers Mobile Money'}
                                    </p>
                                    <p className="text-sm text-gray-500">{new Date(tx.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit' })}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                </span>
                                {getStatusBadge(tx.status)}
                            </div>
                        </div>
                    ))}
                    {transactions.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            Aucune transaction pour le moment.
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        {/* Withdrawal Modal */}
        {isWithdrawalModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Demander un retrait</h3>
                    <p className="text-sm text-gray-500 mb-6">Transférez votre solde disponible vers votre compte Mobile Money.</p>
                    
                    <div className="space-y-4">
                        <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex justify-between items-center">
                            <span className="text-indigo-900 font-medium">Solde disponible</span>
                            <span className="text-xl font-bold text-indigo-700">{formatCurrency(wallet.balance || 0)}</span>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Montant à retirer (FCFA)</label>
                            <input
                                type="number"
                                min="0"
                                max={wallet.balance || 0}
                                value={withdrawalForm.amount}
                                onChange={e => setWithdrawalForm({...withdrawalForm, amount: Number(e.target.value)})}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Méthode de réception</label>
                            <select
                                value={withdrawalForm.payoutMethod}
                                onChange={e => setWithdrawalForm({...withdrawalForm, payoutMethod: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            >
                                <option value="T-Money">T-Money</option>
                                <option value="Moov">Moov Africa</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de réception</label>
                            <input
                                type="tel"
                                placeholder="Numéro de téléphone"
                                value={withdrawalForm.payoutDetails}
                                onChange={e => setWithdrawalForm({...withdrawalForm, payoutDetails: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                    
                    <div className="mt-8 flex justify-end gap-3">
                        <button 
                            onClick={() => setIsWithdrawalModalOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">
                            Annuler
                        </button>
                        <button 
                            onClick={handleRequestWithdrawal}
                            disabled={withdrawalForm.amount <= 0 || withdrawalForm.amount > (wallet.balance || 0) || !withdrawalForm.payoutDetails.trim()}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors">
                            Confirmer le retrait
                        </button>
                    </div>
                </div>
            </div>
        )}
        </DashboardLayout>
    );
};

export default Wallet;
