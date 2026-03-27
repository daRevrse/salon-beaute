import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Edit2, Trash2, Package, Tag, ShoppingBag, LayoutDashboard, Camera, X } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import { getBusinessTypeConfig } from '../../utils/businessTypeConfig';

const ProBanner = () => (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-8 text-white mb-8 text-center shadow-lg">
        <h2 className="text-3xl font-bold mb-4">Passez au niveau supérieur avec SalonHub PRO</h2>
        <p className="text-lg mb-6 max-w-2xl mx-auto opacity-90">Débloquez votre propre boutique en ligne, acceptez les paiements mobiles, gérez vos stocks et augmentez votre chiffre d'affaires directement depuis votre application.</p>
        <button className="bg-white text-indigo-600 hover:bg-gray-50 font-semibold px-8 py-3 rounded-full shadow-md">
            Découvrir le Plan Pro
        </button>
    </div>
);

const ShopManagement = () => {
    const { user, tenant, hasFeature } = useAuth();
    const isPro = hasFeature('shop');
    const businessType = tenant?.business_type || "beauty";
    const config = getBusinessTypeConfig(businessType);
    
    const [activeTab, setActiveTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal States
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState({ name: '' });
    
    // Product States
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState({ name: '', price: 0, stock: 0, categoryId: '', description: '', images: [] });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        if(isPro) {
            fetchCategories();
            fetchProducts();
            fetchOrders();
        }
    }, [isPro]);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/shop/admin/products');
            setProducts(res.data);
        } catch(err) { console.error('Error fetching products:', err); }
    };

    const fetchCategories = async () => {
         try {
            const res = await api.get('/shop/admin/categories');
             setCategories(res.data);
        } catch(err) { console.error('Error fetching categories:', err); }
    };

    const fetchOrders = async () => {
         try {
            const res = await api.get('/shop/admin/orders');
            setOrders(res.data);
         } catch(err) { console.error('Error fetching orders:', err); }
    };

    // Category Handlers
    const handleSaveCategory = async () => {
        try {
            if (currentCategory.id) {
                await api.put(`/shop/admin/categories/${currentCategory.id}`, currentCategory);
            } else {
                await api.post('/shop/admin/categories', currentCategory);
            }
            fetchCategories();
            setIsCategoryModalOpen(false);
            setCurrentCategory({ name: '' });
        } catch(err) { console.error('Failed to save category:', err); }
    };

    const handleDeleteCategory = async (id) => {
        if(!window.confirm('Voulez-vous vraiment supprimer cette catégorie ?')) return;
        try {
            await api.delete(`/shop/admin/categories/${id}`);
            setCategories(categories.filter(c => c.id !== id));
        } catch(err) { console.error('Failed to delete category:', err); }
    };

    // Product Handlers
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProduct = async () => {
        try {
            setLoading(true);
            let imageUrls = currentProduct.images || [];

            // 1. Upload image if selected
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                const uploadRes = await api.post('/uploads/product-image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (uploadRes.data.success) {
                    // Replace or add to images array
                    imageUrls = [uploadRes.data.data.url];
                }
            }

            const productData = { 
                ...currentProduct, 
                images: imageUrls 
            };

            if (currentProduct.id) {
                await api.put(`/shop/admin/products/${currentProduct.id}`, productData);
            } else {
                await api.post('/shop/admin/products', productData);
            }
            fetchProducts();
            setIsProductModalOpen(false);
            setCurrentProduct({ name: '', price: 0, stock: 0, categoryId: '', description: '', images: [] });
            setImageFile(null);
            setImagePreview(null);
        } catch(err) { 
            console.error('Failed to save product:', err); 
            alert('Erreur lors de l\'enregistrement du produit');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (id) => {
        if(!window.confirm('Voulez-vous vraiment supprimer ce produit ?')) return;
        try {
            await api.delete(`/shop/admin/products/${id}`);
            setProducts(products.filter(p => p.id !== id));
        } catch(err) { console.error('Failed to delete product:', err); }
    };

    // Order Handlers
    const handleUpdateOrderStatus = async (id, status) => {
        try {
            await api.put(`/shop/admin/orders/${id}/status`, { status });
            fetchOrders();
        } catch(err) { console.error('Failed to update order status:', err); }
    };

    if (!isPro) {
        return (
            <DashboardLayout>
                <div className="p-6 max-w-6xl mx-auto">
                    <div className="mb-8">
                        <div className="flex items-center gap-4 mb-2">
                           <div className={`p-3 rounded-2xl bg-gradient-to-br ${config.gradient} shadow-soft-lg`}>
                              <ShoppingBag className="h-7 w-7 text-white" />
                           </div>
                           <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-800">
                               Boutique & E-commerce
                           </h1>
                        </div>
                        <p className="text-slate-500 mt-2">Gérez vos produits, commandes et stocks en ligne.</p>
                    </div>
                <ProBanner />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-50 pointer-events-none filter blur-[1px]">
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center h-48">
                        <ShoppingBag className="w-10 h-10 text-gray-400 mb-3" />
                         <span className="font-semibold text-gray-600">0 Commandes</span>
                     </div>
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center h-48">
                        <Package className="w-10 h-10 text-gray-400 mb-3" />
                         <span className="font-semibold text-gray-600">0 Produits</span>
                     </div>
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center h-48">
                        <Tag className="w-10 h-10 text-gray-400 mb-3" />
                         <span className="font-semibold text-gray-600">0 Catégories</span>
                     </div>
                </div>
            </div>
        </DashboardLayout>
    );
    }

    // --- PRO VIEW ---
    return (
        <DashboardLayout>
            <div className="p-6 max-w-6xl mx-auto">
                 <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                           <div className={`p-3 rounded-2xl bg-gradient-to-br ${config.gradient} shadow-soft-lg`}>
                              <ShoppingBag className="h-7 w-7 text-white" />
                           </div>
                           <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-800">
                               Ma Boutique App
                           </h1>
                        </div>
                        <p className="text-slate-500 mt-2">Gérez votre catalogue de produits et suivez vos ventes.</p>
                    </div>
                {activeTab === 'products' && (
                    <button 
                        onClick={() => { 
                            setCurrentProduct({ name: '', price: 0, stock: 0, categoryId: '', description: '', images: [] }); 
                            setImageFile(null);
                            setImagePreview(null);
                            setIsProductModalOpen(true); 
                        }}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium">
                        <Plus className="w-4 h-4" /> Nouveau Produit
                    </button>
                )}
                {activeTab === 'categories' && (
                    <button 
                         onClick={() => { setCurrentCategory({ name: '' }); setIsCategoryModalOpen(true); }}
                         className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium">
                        <Plus className="w-4 h-4" /> Nouvelle Catégorie
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-xl mb-6 border border-gray-200/60 max-w-fit">
                <button
                    onClick={() => setActiveTab('products')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === 'products' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                    <Package className="w-4 h-4" /> Produits
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === 'categories' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                    <Tag className="w-4 h-4" /> Catégories
                </button>
                 <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === 'orders' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                    <ShoppingBag className="w-4 h-4" /> Commandes
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'products' && (
                            <div className="p-6">
                                {products.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                                        <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
                                            <Package className="w-8 h-8" />
                                        </div>
                                        <p className="text-lg font-medium text-gray-900 mb-1">Aucun produit</p>
                                        <p className="text-sm">Commencez par ajouter votre premier produit à vendre.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-gray-100 text-gray-500 text-sm">
                                                    <th className="py-3 px-4 font-semibold">Produit</th>
                                                    <th className="py-3 px-4 font-semibold">Catégorie</th>
                                                    <th className="py-3 px-4 font-semibold">Prix</th>
                                                    <th className="py-3 px-4 font-semibold">Stock</th>
                                                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {products.map(prod => (
                                                    <tr key={prod.id} className="border-b border-gray-50 hover:bg-gray-50">
                                                        <td className="py-4 px-4 font-medium text-gray-900">{prod.name}</td>
                                                        <td className="py-4 px-4 text-gray-600">{prod.category_name || '---'}</td>
                                                        <td className="py-4 px-4 text-gray-900 font-medium">{new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(prod.price)}</td>
                                                        <td className="py-4 px-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${prod.stock > 10 ? 'bg-green-100 text-green-800' : prod.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                                {prod.stock} en stock
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button 
                                                                    onClick={() => { 
                                                                        setCurrentProduct({...prod, categoryId: prod.category_id || ''}); 
                                                                        setImageFile(null);
                                                                        setImagePreview(prod.images?.[0] ? getImageUrl(prod.images[0]) : null);
                                                                        setIsProductModalOpen(true); 
                                                                    }}
                                                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeleteProduct(prod.id)}
                                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'categories' && (
                            <div className="p-6">
                                {categories.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                                       <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
                                            <Tag className="w-8 h-8" />
                                        </div>
                                        <p className="text-lg font-medium text-gray-900 mb-1">Aucune catégorie</p>
                                        <p className="text-sm">Organisez vos produits en créant des catégories (Ex: Shampoings, Accessoires).</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-gray-100 text-gray-500 text-sm">
                                                    <th className="py-3 px-4 font-semibold">Nom de la catégorie</th>
                                                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {categories.map(cat => (
                                                    <tr key={cat.id} className="border-b border-gray-50 hover:bg-gray-50">
                                                        <td className="py-4 px-4 font-medium text-gray-900">{cat.name}</td>
                                                        <td className="py-4 px-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button 
                                                                    onClick={() => { setCurrentCategory(cat); setIsCategoryModalOpen(true); }}
                                                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeleteCategory(cat.id)}
                                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'orders' && (
                            <div className="p-6">
                                 {orders.length === 0 ? (
                                     <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                                        <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
                                            <ShoppingBag className="w-8 h-8" />
                                        </div>
                                        <p className="text-lg font-medium text-gray-900 mb-1">Aucune commande</p>
                                        <p className="text-sm">Les commandes de vos clients apparaîtront ici.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-gray-100 text-gray-500 text-sm">
                                                    <th className="py-3 px-4 font-semibold">ID & Date</th>
                                                    <th className="py-3 px-4 font-semibold">Client</th>
                                                    <th className="py-3 px-4 font-semibold">Produits</th>
                                                    <th className="py-3 px-4 font-semibold">Total</th>
                                                    <th className="py-3 px-4 text-right font-semibold">Statut</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orders.map(order => (
                                                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                                                        <td className="py-4 px-4">
                                                            <div className="font-medium text-gray-900">#{String(order.id).padStart(6, '0')}</div>
                                                            <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('fr-FR')}</div>
                                                        </td>
                                                        <td className="py-4 px-4 text-gray-700">
                                                            <div className="font-medium">{order.client_name || 'Client anonyme'}</div>
                                                            {order.client_phone && <div className="text-xs text-gray-500">{order.client_phone}</div>}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="text-sm text-gray-600">
                                                                {order.items?.map((item, idx) => (
                                                                    <div key={idx}>
                                                                        {item.quantity}x {item.product_name || 'Produit supprimé'}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 font-medium text-gray-900">
                                                            {new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF' }).format(order.total_amount)}
                                                        </td>
                                                        <td className="py-4 px-4 text-right">
                                                            <select 
                                                                value={order.status}
                                                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 outline-none cursor-pointer
                                                                    ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                                      order.status === 'PREPARING' ? 'bg-blue-100 text-blue-800' :
                                                                      order.status === 'READY' ? 'bg-indigo-100 text-indigo-800' :
                                                                      order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                                      'bg-gray-100 text-gray-800'}`}
                                                            >
                                                                <option value="PENDING">En attente</option>
                                                                <option value="PREPARING">En préparation</option>
                                                                <option value="READY">Prête</option>
                                                                <option value="COMPLETED">Donnée</option>
                                                                <option value="CANCELLED">Annulée</option>
                                                            </select>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>

        {/* Category Modal */}
        {isCategoryModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{currentCategory.id ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la catégorie</label>
                            <input
                                type="text"
                                value={currentCategory.name}
                                onChange={e => setCurrentCategory({...currentCategory, name: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                placeholder="ex: Accessoires"
                            />
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end gap-3">
                        <button 
                            onClick={() => setIsCategoryModalOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">
                            Annuler
                        </button>
                        <button 
                            onClick={handleSaveCategory}
                            disabled={!currentCategory.name?.trim()}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors">
                            Enregistrer
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Product Modal */}
        {isProductModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{currentProduct.id ? 'Modifier le produit' : 'Nouveau produit'}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={currentProduct.name}
                                onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                placeholder="ex: Shampoing Hydratant"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Prix (FCFA) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    min="0"
                                    value={currentProduct.price}
                                    onChange={e => setCurrentProduct({...currentProduct, price: Number(e.target.value)})}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stock disponible</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={currentProduct.stock}
                                    onChange={e => setCurrentProduct({...currentProduct, stock: Number(e.target.value)})}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                            <select
                                value={currentProduct.categoryId}
                                onChange={e => setCurrentProduct({...currentProduct, categoryId: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            >
                                <option value="">-- Sans catégorie --</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optionnelle)</label>
                            <textarea
                                rows="3"
                                value={currentProduct.description || ''}
                                onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                                placeholder="Détails du produit..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Image du produit</label>
                            <div className="flex items-start gap-4">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 group-hover:border-indigo-300 transition-colors">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <Camera className="w-8 h-8 text-gray-300" />
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    {imagePreview && (
                                        <button 
                                            onClick={() => { setImageFile(null); setImagePreview(null); setCurrentProduct({...currentProduct, images: []}); }}
                                            className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full hover:bg-red-200 transition-colors shadow-sm"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 max-w-[200px]">
                                    <p className="font-medium text-gray-700 mb-1">Conseil :</p>
                                    <p>Utilisez une image carrée de haute qualité (PNG, JPG, max 5Mo). L'image apparaîtra sur votre boutique publique.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end gap-3">
                        <button 
                            onClick={() => setIsProductModalOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">
                            Annuler
                        </button>
                        <button 
                            onClick={handleSaveProduct}
                            disabled={!currentProduct.name?.trim() || currentProduct.price <= 0}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors">
                            Enregistrer
                        </button>
                    </div>
                </div>
            </div>
        )}
        </DashboardLayout>
    );
};

export default ShopManagement;
