import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { FaPlus, FaEdit, FaTrash, FaBox } from 'react-icons/fa';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const fetchProducts = async () => {
        setLoading(true);
        try {
            // Server-side pagination and search
            const { data } = await api.get(`/products?page=${page}&limit=20&search=${searchTerm}`);
            setProducts(data.products || []);
            setTotalPages(data.pages || 1);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchProducts();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [page, searchTerm]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to permanently DELETE this product?")) return;
        try {
            await api.delete(`/products/${id}`);
            toast.success("Product Deleted! 🗑️");
            fetchProducts(); // Refresh list
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete product");
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="p-4 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">
                            Market Place<span className="text-red-600">.</span>
                        </h1>
                        <p className="text-zinc-400 mt-2">Manage your catalog, edit details, or remove items.</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/products/create')}
                        className="bg-red-600 hover:bg-red-700 text-white border-none py-3 px-6 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-900/20 transition transform hover:scale-105"
                    >
                        <FaPlus /> Add New Product
                    </button>
                </div>

                {/* SEARCH BAR */}
                <div className="mb-6">
                    <div className="relative w-full md:w-[400px]">
                        <input
                            type="text"
                            placeholder="Search products by title or ID..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1); // Reset to page 1 on search
                            }}
                            className="w-full py-3 pl-10 pr-4 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-zinc-500"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-zinc-500">Loading inventory...</div>
                ) : (products && products.length === 0) ? (
                    <div className="glass-panel bg-zinc-900 rounded-2xl border border-zinc-800 p-16 text-center shadow-sm">
                        <div className="inline-flex p-4 bg-zinc-800 rounded-full mb-4 text-zinc-600">
                            <FaBox size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No products found</h3>
                        <p className="text-zinc-400">Try adjusting your search or add a new product.</p>
                    </div>
                ) : (
                    <>
                        <div className="glass-panel bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-sm hidden md:block">
                            <table className="min-w-full divide-y divide-zinc-800">
                                <thead className="bg-zinc-900/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Product</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Stock</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-zinc-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-zinc-900/30 divide-y divide-zinc-800">
                                    {products.map((product) => (
                                        <tr key={product._id} className="hover:bg-zinc-800/50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-12 w-12 border border-zinc-800 rounded-lg overflow-hidden bg-zinc-800 p-1">
                                                        <img className="h-full w-full object-contain" src={product.images?.[0] || 'https://via.placeholder.com/100'} alt="" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-bold text-white line-clamp-1 max-w-xs" title={product.title}>{product.title}</div>
                                                        <div className="text-xs text-zinc-500">ID: {product._id.slice(-6)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900/20 text-blue-400 border border-blue-900/30">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-bold">
                                                ₹{product.price}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.stock > 0 ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-500'}`}>
                                                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => navigate(`/admin/products/edit/${product._id}`)} className="text-zinc-500 hover:text-blue-400 mx-2 transition" title="Edit"><FaEdit size={18} /></button>
                                                <button onClick={() => handleDelete(product._id)} className="text-zinc-500 hover:text-red-500 mx-2 transition" title="Delete"><FaTrash size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="md:hidden space-y-4">
                            {products.map((product) => (
                                <div key={product._id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-sm flex flex-col gap-3">
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 h-20 w-20 border border-zinc-800 rounded-lg overflow-hidden bg-zinc-800 p-1">
                                            <img className="h-full w-full object-contain" src={product.images?.[0] || 'https://via.placeholder.com/100'} alt="" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-white line-clamp-2 mb-1 leading-snug">{product.title}</div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-2 py-0.5 inline-flex text-[10px] font-bold rounded bg-blue-900/20 text-blue-400 border border-blue-900/30 uppercase tracking-wide">
                                                    {product.category}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center py-3 border-t border-b border-zinc-800">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Price</span>
                                            <span className="text-lg font-black text-white">₹{product.price}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Stock</span>
                                            <span className={`text-sm font-bold ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {product.stock > 0 ? `${product.stock} Units` : 'Out of Stock'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => navigate(`/admin/products/edit/${product._id}`)}
                                            className="bg-zinc-800 border border-zinc-700 text-zinc-300 py-2.5 rounded-lg text-sm font-bold hover:bg-zinc-700 transition flex items-center justify-center gap-2"
                                        >
                                            <FaEdit /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product._id)}
                                            className="bg-red-900/20 border border-red-900/50 text-red-500 py-2.5 rounded-lg text-sm font-bold hover:bg-red-900/30 transition flex items-center justify-center gap-2"
                                        >
                                            <FaTrash /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Pagination Controls */}
                {!loading && products.length > 0 && totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-8 pb-8">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition font-bold"
                        >
                            Previous
                        </button>
                        <span className="text-zinc-400">
                            Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages}</span>
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition font-bold"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminProducts;
