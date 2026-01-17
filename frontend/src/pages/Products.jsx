import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import CartContext from '../context/CartContext';
import api, { FILE_BASE_URL } from '../services/api';
import MainLayout from '../components/MainLayout';
import { FaShoppingCart, FaBolt } from 'react-icons/fa';

const Products = () => {
    const { addToCart } = useContext(CartContext);
    const { user } = useContext(AuthContext); // Get user for pricing logic
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const navigate = useNavigate();

    // Constant Categories (since we paginate, dynamic list from current page is invalid)
    const [categories, setCategories] = useState(['All']);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await api.get('/products/categories');
                // Ensure 'All' is first, then rest
                const uniqueCats = Array.from(new Set(['All', ...data]));
                setCategories(uniqueCats);
            } catch (err) {
                console.error("Failed to fetch categories");
            }
        };
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            let url = `/products?page=${page}&limit=12`; // 12 fits grid better (2, 3, 4 cols)
            if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
            if (selectedCategory !== 'All') url += `&category=${encodeURIComponent(selectedCategory)}`;

            const { data } = await api.get(url);
            setProducts(data.products || []);
            setTotalPages(data.pages || 1);
        } catch (error) {
            console.error("Failed to fetch products", error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    // Debounce Search
    useEffect(() => {
        const delaySearch = setTimeout(() => {
            setPage(1); // Reset to page 1 on search change
            fetchProducts();
        }, 500);
        return () => clearTimeout(delaySearch);
    }, [searchTerm, selectedCategory]); // Trigger on filter change

    useEffect(() => {
        fetchProducts();
    }, [page]); // Trigger on page change

    const handleDirectBuy = (product) => {
        // Direct Buy: Skip adding to global cart, pass item directly to checkout
        const priceToUse = user?.subscriptionPlan === 'paid'
            ? (product.resellerPricePaid || product.resellerPrice)
            : (product.resellerPrice || product.price);
        navigate('/checkout', { state: { directBuyItem: { ...product, price: priceToUse } } });
    };

    // No client-side filtering needed anymore
    const filteredProducts = products;

    return (
        <MainLayout>
            <div className="max-w-[1600px] mx-auto p-4 md:p-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">
                            Market Place<span className="text-red-600">.</span>
                        </h1>
                        <p className="text-zinc-400 font-medium text-sm md:text-base">Curated wholesale products for your business growth.</p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-96 group z-20">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <div className="text-zinc-500 group-focus-within:text-red-500 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        <input
                            type="text"
                            placeholder="Search for products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-11 pr-4 py-4 rounded-2xl bg-zinc-900/50 border-2 border-red-600 md:border md:border-zinc-800 text-white placeholder-zinc-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none shadow-xl shadow-black/20 backdrop-blur-sm"
                        />
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="mb-8 md:mb-10 overflow-hidden">
                    <div className="flex p-1 md:p-1.5 bg-zinc-900/60 backdrop-blur-xl rounded-xl md:rounded-2xl border-2 border-zinc-900 md:border md:border-zinc-800/60 overflow-x-auto no-scrollbar shadow-inner">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-300 ${selectedCategory === cat
                                    ? 'bg-white text-black shadow-lg shadow-black/10 scale-[1.02]'
                                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-pulse">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                            <div key={i} className="bg-zinc-900/50 rounded-3xl h-[400px]"></div>
                        ))}
                    </div>
                ) : (filteredProducts || []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-zinc-900/30 rounded-[3rem] border-2 border-zinc-900 md:border md:border-zinc-800/50 border-dashed text-center">
                        <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-inner text-5xl">🔍</div>
                        <h3 className="text-3xl font-bold text-white mb-3">No products found</h3>
                        <p className="text-zinc-500 max-w-md mx-auto">We couldn't find exactly what you're looking for. Try adjusting your search or category filters.</p>
                        <button onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }} className="mt-8 px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition">
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {filteredProducts.map((product, index) => (
                            <div
                                key={product._id}
                                className="group relative bg-zinc-900/40 backdrop-blur-md rounded-3xl border-2 border-zinc-900 md:border md:border-zinc-800/50 hover:border-red-500/30 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-red-900/10 "
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Image Container */}
                                <Link to={`/products/${product._id}`} className="block relative aspect-[4/5] overflow-hidden bg-zinc-800/50">
                                    <img
                                        src={(() => {
                                            const img = product.images?.[0];
                                            if (!img) return 'https://via.placeholder.com/300';
                                            if (img.startsWith('http')) return img;
                                            return `${FILE_BASE_URL}${img}`;
                                        })()}
                                        alt={product.title}
                                        className="w-full h-full object-cover transform"
                                    />

                                    {/* Badges */}


                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                                </Link>

                                {/* Content */}
                                <div className="p-3 md:p-5 flex-1 flex flex-col relative">
                                    <div className="mb-1 text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-red-500">{product.category}</div>

                                    <Link to={`/products/${product._id}`} className="block mb-2 md:mb-3">
                                        <h3 className="text-white font-bold text-xs md:text-base leading-snug line-clamp-2 group-hover:text-red-400 transition-colors">
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

                                        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2">
                                            <button
                                                onClick={() => {
                                                    const priceToUse = user?.subscriptionPlan === 'paid' ? (product.resellerPricePaid || product.resellerPrice) : (product.resellerPrice || product.price);
                                                    addToCart({ ...product, price: priceToUse, quantity: 1 });
                                                }}
                                                className="py-2.5 md:py-3 rounded-lg md:rounded-xl bg-zinc-800 text-white font-bold text-[10px] md:text-xs uppercase tracking-wide hover:bg-white hover:text-black transition-colors border border-zinc-700 hover:border-white"
                                            >
                                                Add to Cart
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleDirectBuy(product);
                                                }}
                                                className="py-2.5 md:py-3 flex items-center justify-center gap-1.5 md:gap-2 rounded-lg md:rounded-xl bg-red-600 text-white font-bold text-[10px] md:text-xs uppercase tracking-wide hover:bg-red-500 transition-colors shadow-lg shadow-red-900/20"
                                                title="Buy Now"
                                            >
                                                <FaBolt className="text-[8px] md:text-xs" /> Buy Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-16 pb-8">
                        <button
                            onClick={() => {
                                setPage(p => Math.max(1, p - 1));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            disabled={page === 1}
                            className="px-6 py-3 rounded-xl border-2 border-red-600 md:border md:border-zinc-800 bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:scale-105 active:scale-95"
                        >
                            Previous
                        </button>
                        <span className="text-zinc-500 font-medium">
                            Page <span className="text-white font-bold text-lg mx-1">{page}</span> of <span className="text-white font-bold text-lg mx-1">{totalPages}</span>
                        </span>
                        <button
                            onClick={() => {
                                setPage(p => Math.min(totalPages, p + 1));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            disabled={page === totalPages}
                            className="px-6 py-3 rounded-xl border-2 border-red-600 md:border md:border-zinc-800 bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:scale-105 active:scale-95"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default Products;
