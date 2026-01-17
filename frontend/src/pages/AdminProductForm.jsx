import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import MainLayout from '../components/MainLayout';
import { FaSave, FaArrowLeft, FaImage, FaUpload, FaTrash } from 'react-icons/fa';

const AdminProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        originalPrice: '',
        cutoffPrice: '',
        resellerPrice: '',
        resellerPricePaid: '',
        category: 'Electronics',
        stock: '100',
        images: [],
        pickupAddress: '',
        shippingFee: '',
        hsnCode: ''
    });
    const [loading, setLoading] = useState(false);
    const [tempUrl, setTempUrl] = useState('');

    // Category Logic
    const [categories, setCategories] = useState([
        'Electronics', 'Fashion', 'Home & Utility Products', 'Lifestyle & Daily-Use Items', 'Beauty & Health'
    ]);
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [customCategory, setCustomCategory] = useState('');

    useEffect(() => {
        if (isEditMode) {
            fetchProduct();
        }
        fetchCategories();
    }, [id]);

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/products/categories');
            // Merge defaults with DB categories, ensuring uniqueness
            const defaults = ['Electronics', 'Fashion', 'Home & Utility Products', 'Lifestyle & Daily-Use Items', 'Beauty & Health'];
            const merged = Array.from(new Set([...defaults, ...data]));
            setCategories(merged);
        } catch (err) {
            console.error("Failed to fetch categories");
        }
    };

    const fetchProduct = async () => {
        try {
            const { data } = await api.get(`/products/${id}`);
            setFormData({
                title: data.title,
                description: data.description,
                price: data.price,
                originalPrice: data.originalPrice || '',
                cutoffPrice: data.cutoffPrice || '',
                resellerPrice: data.resellerPrice || '',
                resellerPricePaid: data.resellerPricePaid || '',
                category: data.category,
                stock: data.stock,
                images: data.images || [],
                pickupAddress: data.pickupAddress || '',
                shippingFee: data.shippingFee || '',
                hsnCode: data.hsnCode || ''
            });
        } catch (error) {
            console.error("Failed to fetch product", error);
            toast.error("Failed to load product");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1200;
                    const MAX_HEIGHT = 1200;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    }, 'image/jpeg', 0.7);
                };
            };
        });
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const loadingToast = toast.loading('Compressing & Uploading...');

            // 1. Compress Image
            const compressedFile = await compressImage(file);
            console.log(`Original: ${file.size / 1024}KB, Compressed: ${compressedFile.size / 1024}KB`);

            // 2. Upload
            const uploadData = new FormData();
            uploadData.append('file', compressedFile);

            const { data } = await api.post('/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.dismiss(loadingToast);

            // Append new image to list
            setFormData(prev => ({ ...prev, images: [...prev.images, data.fullUrl] }));
            toast.success(`Image Added! (${Math.round(compressedFile.size / 1024)}KB)`, { duration: 3000 });
        } catch (err) {
            console.error(err);
            toast.error("Upload Failed");
        }
    };

    const handleAddUrl = () => {
        if (!tempUrl.trim()) return;
        setFormData(prev => ({ ...prev, images: [...prev.images, tempUrl.trim()] }));
        setTempUrl('');
        toast.success("Image URL Added");
    };

    const removeImage = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, index) => index !== indexToRemove)
        }));
    };

    const moveImage = (index, direction) => {
        const newImages = [...formData.images];
        if (direction === 'left' && index > 0) {
            [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
        } else if (direction === 'right' && index < newImages.length - 1) {
            [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
        }
        setFormData(prev => ({ ...prev, images: newImages }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                images: formData.images.filter(img => img && img.trim() !== '')
            };

            if (isEditMode) {
                await api.put(`/products/${id}`, payload);
                toast.success('Product Updated Successfully! 🚀');
            } else {
                await api.post('/products', payload);
                toast.success('Product Created Successfully! 🎉');
            }
            navigate('/admin/products');
        } catch (error) {
            console.error(error);
            toast.error('Failed to save product. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto p-4 md:p-6">
                <button
                    onClick={() => navigate('/admin/products')}
                    className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition font-medium"
                >
                    <FaArrowLeft /> Back to Products
                </button>

                <div className="glass-panel bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-white mb-8 border-b border-zinc-800 pb-4">
                        {isEditMode ? 'Edit Product' : 'Add New Product'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-bold text-zinc-400 mb-2">Product Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition placeholder-zinc-500"
                                placeholder="e.g. Wireless Noise Cancelling Headphones"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-bold text-zinc-400 mb-2">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows={5}
                                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition font-inherit placeholder-zinc-500"
                                placeholder="Detailed product description..."
                            />
                        </div>

                        {/* Price & Stock Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 bg-blue-900/20 p-6 rounded-2xl border border-blue-900/50">
                                <h3 className="text-sm font-bold text-blue-400 mb-4 uppercase tracking-wider">Pricing Structure</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {/* Cost Price */}
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-400 mb-1">Original Price (Cost)</label>
                                        <input
                                            type="number"
                                            name="originalPrice"
                                            value={formData.originalPrice}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition placeholder-zinc-500"
                                            placeholder="0"
                                        />
                                        <p className="text-[10px] text-zinc-500 mt-1">For internal profit calc</p>
                                    </div>

                                    {/* MRP (Cutoff) */}
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-400 mb-1">MRP (Cutoff Price)</label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition font-bold placeholder-zinc-500"
                                            placeholder="0"
                                        />
                                        <p className="text-[10px] text-zinc-500 mt-1">Shown as strikethrough</p>
                                    </div>

                                    {/* HSN Code */}
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-400 mb-1">HSN/SAC Code</label>
                                        <input
                                            type="text"
                                            name="hsnCode"
                                            value={formData.hsnCode}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition placeholder-zinc-500"
                                            placeholder="e.g 851830"
                                        />
                                        <p className="text-[10px] text-zinc-500 mt-1">For Tax Invoice</p>
                                    </div>

                                    {/* Reseller Price (Free) */}
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-400 mb-1">Free Plan Price</label>
                                        <input
                                            type="number"
                                            name="resellerPrice"
                                            value={formData.resellerPrice}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition font-bold placeholder-zinc-500"
                                            placeholder="0"
                                        />
                                        <p className="text-[10px] text-zinc-500 mt-1">For standard resellers</p>
                                    </div>

                                    {/* Reseller Price (Paid) */}
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-400 mb-1">Premium Plan Price</label>
                                        <input
                                            type="number"
                                            name="resellerPricePaid"
                                            value={formData.resellerPricePaid}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-yellow-500 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/10 outline-none transition font-bold placeholder-zinc-500"
                                            placeholder="0"
                                        />
                                        <p className="text-[10px] text-zinc-500 mt-1">For premium resellers</p>
                                    </div>

                                    {/* Shipping Fee */}
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-400 mb-1">Shipping Fee</label>
                                        <input
                                            type="number"
                                            name="shippingFee"
                                            value={formData.shippingFee}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition placeholder-zinc-500"
                                            placeholder="0"
                                        />
                                        <p className="text-[10px] text-zinc-500 mt-1">Added to Total (per unit)</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-zinc-400 mb-2">Stock Quantity</label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition placeholder-zinc-500"
                                    placeholder="100"
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-bold text-zinc-400 mb-2">Category</label>
                            <div className="flex flex-col gap-3">
                                <div className="relative">
                                    <select
                                        name="category"
                                        value={isCustomCategory ? 'Other' : formData.category}
                                        onChange={(e) => {
                                            if (e.target.value === 'Other') {
                                                setIsCustomCategory(true);
                                                setFormData({ ...formData, category: '' });
                                            } else {
                                                setIsCustomCategory(false);
                                                setFormData({ ...formData, category: e.target.value });
                                            }
                                        }}
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition appearance-none font-medium"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                        <option value="Other">Other (Add New)</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-zinc-500">
                                        ▼
                                    </div>
                                </div>

                                {isCustomCategory && (
                                    <input
                                        type="text"
                                        placeholder="Enter New Category Name"
                                        value={customCategory}
                                        onChange={(e) => {
                                            setCustomCategory(e.target.value);
                                            setFormData({ ...formData, category: e.target.value });
                                        }}
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition font-bold"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Pickup Address */}
                        <div className="bg-orange-900/10 p-6 rounded-2xl border border-orange-900/20">
                            <h3 className="text-sm font-bold text-orange-500 mb-4 uppercase tracking-wider">Logistics & Shipping</h3>
                            <div>
                                <label className="block text-sm font-bold text-zinc-400 mb-2">Pickup Address (for Self Ship)</label>
                                <textarea
                                    name="pickupAddress"
                                    value={formData.pickupAddress}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition placeholder-zinc-500"
                                    placeholder="Enter the full address where a courier can pick up this item..."
                                />
                                <p className="text-xs text-zinc-500 mt-1">This address will be shown to Resellers who opt for 'Ship by Self'.</p>
                            </div>
                        </div>

                        {/* Image Gallery */}
                        <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-800">
                            <label className="block text-sm font-bold text-zinc-400 mb-4">Product Images ({formData.images.length})</label>

                            {/* Upload Area */}
                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <div className="relative overflow-hidden group">
                                    <button type="button" className="px-6 py-3 bg-red-600 text-white rounded-xl flex items-center gap-2 font-bold group-hover:bg-red-700 transition">
                                        <FaUpload /> Upload Image
                                    </button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                                <div className="flex-1 flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Or paste image URL here..."
                                        value={tempUrl}
                                        onChange={(e) => setTempUrl(e.target.value)}
                                        className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white outline-none focus:border-zinc-500 placeholder-zinc-500"
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddUrl}
                                        className="px-6 py-3 bg-zinc-800 border border-zinc-700 text-white font-bold rounded-xl hover:bg-zinc-700"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Gallery Grid */}
                            {formData.images.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {formData.images.map((img, idx) => (
                                        <div key={idx} className="group relative aspect-square bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
                                            <img
                                                src={img}
                                                alt={`Product ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            {/* Overlay Actions */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(idx)}
                                                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-xl"
                                                    title="Remove"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                                {/* Move controls could go here */}
                                            </div>
                                            {idx === 0 && (
                                                <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded shadow-sm">
                                                    MAIN
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-zinc-900 rounded-xl border-2 border-dashed border-zinc-800 text-zinc-500">
                                    <FaImage className="mx-auto text-4xl mb-2 opacity-30" />
                                    <p>No images added yet.</p>
                                </div>
                            )}

                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`
                                    px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-900/20 transition transform hover:-translate-y-0.5
                                    ${loading ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}
                                `}
                            >
                                <FaSave /> {loading ? 'Saving...' : (isEditMode ? 'Update Product' : 'Create Product')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
};

export default AdminProductForm;
