import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { usePixel } from '../context/PixelContext';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import api from '../services/api';
import CartContext from '../context/CartContext';
import { FaShoppingCart, FaBolt, FaArrowLeft, FaTags, FaStar, FaStarHalfAlt, FaExchangeAlt, FaShieldAlt, FaMapMarkerAlt, FaGift, FaHeart, FaRegHeart, FaWhatsapp } from 'react-icons/fa';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useContext(CartContext);
    const { trackEvent } = usePixel();
    const { user } = useContext(AuthContext); // Get user for pricing logic
    const [product, setProduct] = useState(null);
    const [activeImage, setActiveImage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [settings, setSettings] = useState({});

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/admin/settings');
                setSettings(data);
            } catch (error) {
                console.error("Failed to fetch settings", error);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data } = await api.get(`/products/${id}`);
                setProduct(data);
                if (data.images && data.images.length > 0) setActiveImage(data.images[0]);

                // Track ViewContent
                trackEvent('ViewContent', {
                    content_name: data.title,
                    content_ids: [data._id],
                    content_type: 'product',
                    value: data.price,
                    currency: 'INR'
                });
            } catch (error) {
                console.error("Failed to fetch product details", error);
            } finally {
                setLoading(false);
            }
        };

        const checkWishlist = async () => {
            try {
                const { data } = await api.get('/users/wishlist');
                if (data.some(item => item._id === id)) {
                    setIsInWishlist(true);
                }
            } catch (err) {
                console.error("Failed to fetch wishlist", err);
            }
        };

        fetchProduct();
        checkWishlist();
    }, [id]);

    const handleWishlistToggle = async () => {
        try {
            if (isInWishlist) {
                await api.delete(`/users/wishlist/${id}`);
                setIsInWishlist(false);
                toast.success("Removed from Wishlist");
            } else {
                await api.post(`/users/wishlist/${id}`);
                setIsInWishlist(true);
                toast.success("Added to Wishlist");
            }
        } catch (err) {
            toast.error("Failed to update wishlist");
        }
    };

    const handleDirectBuy = () => {
        // Determine price based on user plan
        const priceToUse = user?.subscriptionPlan === 'paid'
            ? (product.resellerPricePaid || product.resellerPrice)
            : (product.resellerPrice || product.price);

        // Direct Buy: Skip adding to global cart, pass item directly to checkout with correct price
        navigate('/checkout', { state: { directBuyItem: { ...product, price: priceToUse } } });
    };

    const handleAddToCart = () => {
        const priceToUse = user?.subscriptionPlan === 'paid'
            ? (product.resellerPricePaid || product.resellerPrice)
            : (product.resellerPrice || product.price);

        addToCart({ ...product, price: priceToUse });
        trackEvent('AddToCart', {
            content_name: product.title,
            content_ids: [product._id],
            content_type: 'product',
            value: priceToUse,
            currency: 'INR'
        });
        toast.success(`${product.title} added to cart! 🛒`);
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading details...</div>;
    if (!product) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Product not found.</div>;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 mb-6 text-zinc-400 hover:text-white transition font-medium"
            >
                <div className="p-2 rounded-full bg-zinc-800 border border-zinc-700 shadow-sm"><FaArrowLeft size={12} /></div> Back
            </button>

            {/* NEW: Mobile Header (Title, Ratings, Category) */}
            <div className="md:hidden mb-4">
                <h1 className="text-2xl font-black text-white leading-tight mb-2 tracking-tight">{product.title}</h1>
                <div className="flex items-center gap-3 text-sm text-zinc-400 mb-2">
                    <div className="flex items-center gap-1 bg-green-900/30 text-green-400 border border-green-800 px-2 py-0.5 rounded-md font-bold text-xs">
                        <span>{product.rating || '4.5'}</span> <FaStar size={10} />
                    </div>
                    <span>{product.numReviews || 0} reviews</span>
                    <span className="text-zinc-600">|</span>
                    <span>{product.category}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: Image Gallery + Buy Box */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* Main Image */}
                    <div className="glass-panel p-1 rounded-3xl flex items-center justify-center bg-zinc-900 relative overflow-hidden">
                        <img
                            src={activeImage || product.images?.[0] || 'https://via.placeholder.com/500'}
                            alt={product.title}
                            className="w-full h-auto object-contain max-h-[600px]"
                        />
                    </div>

                    {/* Thumbnails */}
                    {product.images?.length > 1 && (
                        <div className="flex gap-4 overflow-x-auto pb-2 justify-center">
                            {product.images.map((img, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setActiveImage(img)}
                                    className={`w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-xl cursor-pointer border-2 p-1 bg-zinc-900 transition-all ${activeImage === img ? 'border-red-600 scale-105 shadow-md' : 'border-zinc-800 opacity-70 hover:opacity-100'}`}
                                >
                                    <img src={img} className="w-full h-full object-contain" alt={`Thumbnail ${idx + 1}`} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* BUY BOX (Moved below images) */}
                    <div className="glass-panel p-6 rounded-3xl shadow-lg border border-zinc-800 bg-zinc-900/90">
                        <div className="mb-4">
                            {user ? (
                                <>
                                    <div className="text-sm text-zinc-400 mb-1">Your Price {user.subscriptionPlan === 'paid' && <span className="text-green-500 font-bold">(Premium)</span>}</div>
                                    <div className={`text-4xl font-black mb-2 ${user.subscriptionPlan === 'paid' ? 'text-green-500' : 'text-white'}`}>
                                        ₹{user.subscriptionPlan === 'paid' ? (product.resellerPricePaid || product.resellerPrice) : (product.resellerPrice || product.price)}
                                    </div>
                                    <div className="text-sm text-zinc-400 mb-4 font-medium">
                                        MRP: <span className="line-through text-zinc-500">₹{product.price}</span>
                                        <span className="ml-2 text-green-500">
                                            Save ₹{product.price - (user.subscriptionPlan === 'paid' ? (product.resellerPricePaid || product.resellerPrice) : (product.resellerPrice || product.price))}
                                            ({Math.round(((product.price - (user?.subscriptionPlan === 'paid' ? (product.resellerPricePaid || product.resellerPrice) : (product.resellerPrice || product.price))) / product.price) * 100)}%)
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-sm text-zinc-400 mb-1">Selling Price (MRP)</div>
                                    <div className="text-3xl font-black text-white mb-4">₹{product.price}</div>
                                </>
                            )}
                        </div>

                        <div className="text-sm text-zinc-400 mb-6 flex flex-col gap-2">
                            <div className="flex items-center gap-2">

                                <span className="font-medium text-zinc-300">Standard Shipping</span>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-500">
                                <FaShieldAlt /> Secure transaction
                            </div>
                            <div className="text-green-500 font-bold flex items-center gap-2">
                                <FaBolt size={12} /> In Stock
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAddToCart}
                                    className="flex-1 bg-zinc-800 border-2 border-zinc-700 text-white py-3 rounded-xl font-bold hover:bg-zinc-700 transition text-sm flex justify-center items-center gap-2 shadow-sm"
                                >
                                    <FaShoppingCart size={16} /> Add to Cart
                                </button>
                                <button
                                    onClick={handleWishlistToggle}
                                    className="w-14 h-14 flex items-center justify-center border-2 border-zinc-700 rounded-xl hover:bg-zinc-800 transition"
                                >
                                    {isInWishlist ? <FaHeart className="text-red-500 text-xl" /> : <FaRegHeart className="text-zinc-400 text-xl" />}
                                </button>
                            </div>
                            <button
                                onClick={handleDirectBuy}
                                className="w-full bg-red-600 text-white border-none py-3.5 rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-600/20 text-base flex justify-center items-center gap-2"
                            >
                                <FaBolt size={16} /> Buy Now
                            </button>
                            <a
                                href={`https://wa.me/${settings.whatsapp_number}?text=Hi, I am interested in buying "${product.title}" in bulk.`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex justify-center items-center gap-2 w-full bg-green-600 border border-green-500 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-600/20 text-base"
                            >
                                <FaWhatsapp size={20} /> Contact for Bulk Orders
                            </a>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Product Info & Description */}
                <div className="lg:col-span-7 flex flex-col gap-8">
                    <div className="hidden md:block"> {/* Added hidden md:block here */}
                        <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4 tracking-tight">{product.title}</h1>

                        {/* Ratings */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center gap-1 bg-green-900/30 text-green-400 border border-green-800 px-2 py-1 rounded-lg font-bold text-sm">
                                <span>{product.rating || '4.5'}</span> <FaStar size={12} />
                            </div>
                            <span className="text-zinc-400 text-sm font-medium hover:underline cursor-pointer">{product.numReviews || 0} reviews</span>
                            <span className="text-zinc-600">|</span>
                            <div className="text-sm font-medium text-zinc-400">{product.category}</div>
                        </div>

                        <div className="border-t border-b border-zinc-800 py-6 mb-6">
                            <div className="flex items-center gap-4 mb-2">
                                <span className="text-red-500 font-bold bg-red-900/10 border border-red-900/30 px-2 py-1 rounded">
                                    -{Math.round(((product.price - (user?.subscriptionPlan === 'paid' ? (product.resellerPricePaid || product.resellerPrice) : (product.resellerPrice || product.price))) / product.price) * 100)}%
                                </span>
                                <span className={`text-4xl font-bold ${user?.subscriptionPlan === 'paid' ? 'text-green-500' : 'text-white'}`}>
                                    ₹{user?.subscriptionPlan === 'paid' ? (product.resellerPricePaid || product.resellerPrice) : (product.resellerPrice || product.price)}
                                </span>
                            </div>
                            <div className="text-sm text-zinc-500">
                                M.R.P.: <span className="line-through">₹{product.price}</span>
                                <span className='ml-2'>Inclusive of all taxes</span>
                            </div>
                            {user?.subscriptionPlan === 'paid' && (
                                <div className="text-sm font-bold text-green-500 mt-1">
                                    <FaBolt className="inline mr-1" /> Premium Price Applied
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="glass-panel p-8 rounded-3xl border border-zinc-800">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            Product Description
                        </h3>
                        <div className="text-zinc-400 leading-relaxed text-lg space-y-6">
                            {(() => {
                                const paragraphs = product.description ? product.description.split('\n').filter(p => p.trim()) : [];
                                const extraImages = product.images && product.images.length > 1 ? product.images.slice(1) : [];

                                if (paragraphs.length === 0) return <p>No description available.</p>;

                                const combined = [];
                                let imgIdx = 0;
                                const insertionRate = Math.ceil(paragraphs.length / (extraImages.length + 1));

                                paragraphs.forEach((para, idx) => {
                                    combined.push(<p key={`p-${idx}`}>{para}</p>);

                                    if ((idx + 1) % insertionRate === 0 && imgIdx < extraImages.length) {
                                        combined.push(
                                            <div key={`img-${imgIdx}`} className="my-8 rounded-2xl overflow-hidden shadow-sm border border-zinc-800 max-w-4xl mx-auto">
                                                <img
                                                    src={extraImages[imgIdx]}
                                                    className="w-full h-[400px] object-cover"
                                                    alt="Detail View"
                                                />
                                            </div>
                                        );
                                        imgIdx++;
                                    }
                                });

                                if (imgIdx < extraImages.length) {
                                    combined.push(
                                        <div key="gallery-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-8 border-t border-zinc-800">
                                            {extraImages.slice(imgIdx).map((img, i) => (
                                                <div key={`rem-${i}`} className="rounded-xl overflow-hidden border border-zinc-800 shadow-sm">
                                                    <img src={img} className="w-full h-[300px] object-cover" alt="Detail" />
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }

                                return combined;
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* REVIEWS SECTION (Moved) */}
            <div className="mt-8 md:mt-12 glass-panel rounded-3xl border border-zinc-800 p-6 md:p-8 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-white">Customer Reviews</h2>
                    <button className="text-red-500 font-bold text-sm hover:underline">View All</button>
                </div>

                {/* Reviews List */}
                <div className="space-y-8 mb-8">
                    {product.reviews && product.reviews.length === 0 ? (
                        <p className="text-zinc-500 italic text-center py-4 bg-zinc-900 rounded-xl">No reviews yet. Be the first to share your thoughts!</p>
                    ) : (
                        product.reviews && product.reviews.map((review) => (
                            <div key={review._id} className="border-b border-zinc-800 pb-6 last:border-0">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center font-bold text-zinc-300">
                                        {review.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">{review.name}</div>
                                        <div className="text-xs text-zinc-500">{new Date(review.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className="flex text-yellow-400 text-sm mb-3">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar key={i} className={i < review.rating ? "fill-current" : "text-zinc-700"} />
                                    ))}
                                </div>
                                <p className="text-zinc-300 leading-relaxed bg-zinc-900/50 p-4 rounded-xl rounded-tl-none">{review.comment}</p>
                            </div>
                        ))
                    )}
                </div>

                {/* Write Review Form */}
                <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                    <h3 className="text-lg font-bold text-white mb-4">Write a Product Review</h3>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const rating = e.target.rating.value;
                        const comment = e.target.comment.value;
                        const submitReview = async () => {
                            try {
                                await api.post(`/products/${product._id}/reviews`, { rating, comment });
                                toast.success("Review Submitted!");
                                const { data } = await api.get(`/products/${product._id}`);
                                setProduct(data);
                                e.target.reset();
                            } catch (error) {
                                toast.error(error.response?.data?.message || "Failed to submit review");
                            }
                        };
                        submitReview();
                    }}>
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-zinc-400 mb-2">Rating</label>
                            <select name="rating" className="w-full px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800 text-white focus:border-red-500 outline-none" required>
                                <option value="5">⭐⭐⭐⭐⭐</option>
                                <option value="4">⭐⭐⭐⭐</option>
                                <option value="3">⭐⭐⭐</option>
                                <option value="2">⭐⭐</option>
                                <option value="1">⭐</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-zinc-400 mb-2">Review</label>
                            <textarea name="comment" rows="3" className="w-full px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800 text-white placeholder-zinc-500 focus:border-red-500 outline-none" placeholder="Share your thoughts..." required></textarea>
                        </div>
                        <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition">Submit Review</button>
                    </form>
                </div>
            </div>
            {/* Sticky Mobile Buy Button (Visible on Desktop too per request) */}
            <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-2xl bg-zinc-900/95 backdrop-blur-md border border-zinc-800 p-4 z-50 rounded-2xl flex items-center justify-between shadow-2xl ring-1 ring-white/10">
                <div className="flex flex-col">
                    <span className="text-xs text-zinc-400">Total Price</span>
                    <span className={`text-xl font-black ${user?.subscriptionPlan === 'paid' ? 'text-green-500' : 'text-white'}`}>
                        ₹{user?.subscriptionPlan === 'paid' ? (product.resellerPricePaid || product.resellerPrice) : (product.resellerPrice || product.price)}
                    </span>
                </div>
                <button
                    onClick={handleDirectBuy}
                    className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-600/20 flex items-center gap-2"
                >
                    <FaBolt size={14} /> Buy Now
                </button>
            </div>
        </div>
    );
};

export default ProductDetails;
