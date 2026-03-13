import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingBag, ChevronLeft, Plus, Minus, Search, Trash2 } from 'lucide-react';
import { usePublicTheme } from '../../contexts/PublicThemeContext';
import { getImageUrl, ImageWithFallback } from '../../utils/imageUtils';

const SalonShop = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { salon } = usePublicTheme();
    
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if(salon?.id) {
            fetchShopData(salon.id);
        }
    }, [salon]);

    const fetchShopData = async (tenantId) => {
        try {
            setLoading(true);
            const [productsRes, categoriesRes] = await Promise.all([
                 axios.get(`/api/shop/${tenantId}/products`),
                 axios.get(`/api/shop/${tenantId}/categories`)
            ]);
            
            // Temporary Mock for demonstration until backend has data
            if(productsRes.data.length === 0) {
                 setProducts([
                     { _id: '1', name: 'Shampoing Réparateur Argan', price: 15000, categoryId: { _id: 'c1', name: 'Soins' }, stock: 10, images: [] },
                     { _id: '2', name: 'Sérum Éclat Visage', price: 25000, categoryId: { _id: 'c2', name: 'Cosmétiques' }, stock: 5, images: [] },
                     { _id: '3', name: 'Brosse Démêlante Pro', price: 8000, categoryId: { _id: 'c3', name: 'Accessoires' }, stock: 20, images: [] }
                 ]);
                 setCategories([
                     { _id: 'c1', name: 'Soins' },
                     { _id: 'c2', name: 'Cosmétiques' },
                     { _id: 'c3', name: 'Accessoires' }
                 ]);
            } else {
                 setProducts(productsRes.data);
                 setCategories(categoriesRes.data);
            }
        } catch(err) {
            console.error("Error fetching shop data", err);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const updateQuantity = (productId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQuantity = Math.max(0, item.quantity + delta);
                return newQuantity === 0 ? null : { ...item, quantity: newQuantity };
            }
            return item;
        }).filter(Boolean));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const filteredProducts = products.filter(p => {
        const matchesCategory = activeCategory === 'all' || p.category_id === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (loading) {
         return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                     <button 
                        onClick={() => navigate(`/book/${slug}`)}
                        className="flex items-center text-gray-600 hover:text-gray-900"
                    >
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        <span className="hidden sm:inline">Retour au salon</span>
                    </button>
                    
                    <h1 className="text-xl font-bold text-gray-900 truncate px-4">Boutique {salon?.name}</h1>

                    <button 
                        onClick={() => setIsCartOpen(true)}
                        className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                        <ShoppingBag className="w-6 h-6" />
                        {cartItemCount > 0 && (
                            <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-indigo-600 rounded-full">
                                {cartItemCount}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 {/* Filters */}
                 <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <input 
                            type="text" 
                            placeholder="Rechercher un produit..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                        />
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 w-full sm:w-auto hide-scrollbar">
                        <button 
                            onClick={() => setActiveCategory('all')}
                            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${activeCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                        >
                            Tous
                        </button>
                         {categories.map(cat => (
                             <button 
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${activeCategory === cat.id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                 </div>

                 {/* Product Grid */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                     {filteredProducts.map(product => (
                         <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex flex-col">
                             <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                                {product.images?.length > 0 ? (
                                    <ImageWithFallback src={getImageUrl(product.images[0])} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <ShoppingBag className="w-12 h-12" />
                                    </div>
                                )}
                                {product.stock === 0 && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                                        <span className="bg-gray-900 text-white px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider">Rupture de stock</span>
                                    </div>
                                )}
                             </div>
                             <div className="p-5 flex flex-col flex-1">
                                 <div className="text-xs text-indigo-600 font-medium mb-1">
                                     {product.category_name || 'Catégorie'}
                                 </div>
                                 <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2 line-clamp-2">{product.name}</h3>
                                 <p className="text-2xl font-black text-gray-900 mt-auto pt-4 flex items-center justify-between">
                                     {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: salon?.currency || 'XOF', minimumFractionDigits: 0 }).format(product.price)}
                                     
                                     <button 
                                        onClick={() => addToCart(product)}
                                        disabled={product.stock === 0}
                                        className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                     >
                                         <Plus className="w-5 h-5" />
                                     </button>
                                 </p>
                             </div>
                         </div>
                     ))}
                 </div>
                 
                 {filteredProducts.length === 0 && (
                     <div className="text-center py-20 text-gray-500">
                         Aucun produit ne correspond à votre recherche.
                     </div>
                 )}
            </main>

            {/* Cart Sidebar / Drawer */}
            {isCartOpen && (
                <>
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsCartOpen(false)}></div>
                    <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-2xl z-50 transform transition-transform flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-indigo-600"/> Mon Panier
                            </h2>
                            <button onClick={() => setIsCartOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                                 <Minus className="w-5 h-5 rotate-45 transform" />
                             </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                                    <ShoppingBag className="w-16 h-16 text-gray-200" />
                                    <p>Votre panier est vide</p>
                                    <button onClick={() => setIsCartOpen(false)} className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full font-medium">Continuer mes achats</button>
                                </div>
                            ) : (
                                <ul className="space-y-6">
                                    {cart.map(item => (
                                        <li key={item.id} className="flex gap-4">
                                            <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 flex-shrink-0">
                                                 {item.images?.length > 0 && <ImageWithFallback src={getImageUrl(item.images[0])} alt={item.name} className="w-full h-full object-cover rounded-xl" />}
                                            </div>
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-semibold text-gray-900 line-clamp-2 text-sm pr-4">{item.name}</h4>
                                                    <button onClick={() => updateQuantity(item.id, -item.quantity)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                     <div className="flex items-center border border-gray-200 rounded-lg">
                                                         <button onClick={() => updateQuantity(item.id, -1)} className="p-1 px-2 text-gray-600 hover:bg-gray-50 rounded-l-lg"><Minus className="w-3 h-3"/></button>
                                                         <span className="px-3 text-sm font-medium w-8 text-center">{item.quantity}</span>
                                                         <button onClick={() => updateQuantity(item.id, 1)} className="p-1 px-2 text-gray-600 hover:bg-gray-50 rounded-r-lg"><Plus className="w-3 h-3"/></button>
                                                     </div>
                                                     <div className="font-bold text-gray-900">
                                                         {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: salon?.currency || 'XOF', minimumFractionDigits: 0 }).format(item.price * item.quantity)}
                                                     </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="border-t border-gray-100 p-6 bg-gray-50 pb-8 sm:pb-6">
                                <div className="flex justify-between text-base font-medium text-gray-900 mb-6">
                                    <p>Total estimé</p>
                                    <p className="text-2xl font-black text-indigo-600">{new Intl.NumberFormat('fr-TN', { style: 'currency', currency: salon?.currency || 'XOF', minimumFractionDigits: 0 }).format(cartTotal)}</p>
                                </div>
                                <button 
                                    onClick={() => navigate(`/book/${slug}/checkout`, { state: { cart, total: cartTotal } })}
                                    className="w-full bg-indigo-600 border border-transparent rounded-xl shadow-sm py-4 px-4 text-base font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                >
                                    Valider la commande
                                </button>
                                <div className="mt-4 flex justify-center text-sm text-center text-gray-500">
                                    <p>
                                        ou <button onClick={() => setIsCartOpen(false)} className="text-indigo-600 font-medium hover:text-indigo-500">Continuer mes achats</button>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default SalonShop;
