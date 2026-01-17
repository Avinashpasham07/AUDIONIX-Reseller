import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import { FaHeart, FaTrash } from 'react-icons/fa';

const Wishlist = () => {
    const { user } = useContext(AuthContext);
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchWishlist = async () => {
        try {
            const { data } = await api.get('/users/wishlist');
            setWishlist(data);
        } catch (error) {
            console.error("Failed to fetch wishlist", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, []);

    const removeFromWishlist = async (id) => {
        try {
            await api.delete(`/users/wishlist/${id}`);
            setWishlist(prev => prev.filter(item => item._id !== id));
        } catch (error) {
            console.error("Failed to remove item", error);
        }
    };

    return (
        <MainLayout>
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <h1 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3 text-white">
                    <FaHeart className="text-red-600" /> My Wishlist
                </h1>

                {loading ? (
                    <div className="text-center py-20 text-zinc-400">Loading your favorites...</div>
                ) : wishlist.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900 rounded-2xl border border-zinc-800">
                        <FaHeart className="mx-auto text-4xl text-zinc-800 mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Your wishlist is empty</h2>
                        <p className="text-zinc-400 mb-6">Save items you love to buy later!</p>
                        <Link to="/products" className="inline-block px-6 py-2 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition">
                            Explore Products
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {wishlist.map((product, index) => (
                            <div
                                key={product._id}
                                className="group relative bg-zinc-900/40 backdrop-blur-md rounded-3xl border border-zinc-800/50 hover:border-red-500/30 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-red-900/10"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <Link to={`/products/${product._id}`} className="block relative aspect-[4/5] overflow-hidden bg-zinc-800/50">
                                    <img
                                        src={product.images?.[0] || 'https://via.placeholder.com/300'}
                                        alt={product.title}
                                        className="w-full h-full object-cover transform"
                                    />
                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                                </Link>

                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        removeFromWishlist(product._id);
                                    }}
                                    className="absolute top-3 right-3 p-2.5 bg-zinc-900/80 backdrop-blur-md text-white rounded-full shadow-lg border border-zinc-700 hover:bg-red-600 hover:border-red-500 hover:scale-110 transition-all z-10 group/btn"
                                    title="Remove from Wishlist"
                                >
                                    <FaTrash size={12} className="group-hover/btn:animate-bounce" />
                                </button>

                                <div className="p-4 flex-1 flex flex-col relative">
                                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-red-500">{product.category}</div>

                                    <Link to={`/products/${product._id}`} className="block mb-3">
                                        <h3 className="text-white font-bold text-base leading-snug line-clamp-2 group-hover:text-red-400 transition-colors">
                                            {product.title}
                                        </h3>
                                    </Link>

                                    <div className="mt-auto">
                                        <div className="flex flex-wrap items-end gap-1 md:gap-2 mb-3 md:mb-4">
                                            <div>
                                                <div className="text-zinc-500 text-[10px] md:text-xs line-through font-medium">₹{product.price}</div>
                                                <div className="text-white font-black text-lg md:text-2xl">
                                                    ₹{user?.subscriptionPlan === 'paid'
                                                        ? (product.resellerPricePaid || product.resellerPrice)
                                                        : (product.resellerPrice || product.price)}
                                                </div>
                                            </div>
                                            <div className="ml-auto mb-0.5">
                                                <span className="text-[8px] md:text-[10px] font-black bg-green-500/20 text-green-400 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md border border-green-500/10">
                                                    {product.price > (user?.subscriptionPlan === 'paid' ? (product.resellerPricePaid || product.resellerPrice) : (product.resellerPrice || product.price))
                                                        ? `${Math.round(((product.price - (user?.subscriptionPlan === 'paid' ? (product.resellerPricePaid || product.resellerPrice) : (product.resellerPrice || product.price))) / product.price) * 100)}%`
                                                        : 'BEST'
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout >
    );
};

export default Wishlist;
