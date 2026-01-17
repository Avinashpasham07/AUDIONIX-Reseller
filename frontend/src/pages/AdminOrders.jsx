import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api, { FILE_BASE_URL } from '../services/api';
import MainLayout from '../components/MainLayout';
import ShippingLabel from '../components/ShippingLabel';
import Skeleton from '../components/Skeleton';
import { FaCheck, FaShippingFast, FaSearch, FaFilter, FaBoxOpen, FaMoneyBillWave, FaClock, FaClipboardList, FaFileDownload, FaPrint, FaEye, FaDownload, FaTimes, FaTruck, FaMapMarkerAlt, FaUpload, FaChevronDown, FaChevronUp, FaInfoCircle, FaQrcode, FaFileDownload as FaDownloadAlt } from 'react-icons/fa';
import InvoiceHTML from '../components/InvoiceHTML';
import { generateInvoicePDF } from '../utils/pdfGenerator';

const AdminOrders = () => {
    const handleDownloadFile = async (url, defaultName) => {
        if (!url) return;
        try {
            const loadingToast = toast.loading('Preparing Download...');

            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            // MAGIC BYTE DETECTION (X-Ray for files)
            const getExtensionByHeader = async (blob) => {
                const head = blob.slice(0, 8); // Read first 8 bytes
                const buffer = await head.arrayBuffer();
                const view = new Uint8Array(buffer);
                const hex = Array.from(view).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

                // 1. XLSX (and other Zip-based like DOCX/PPTX) starts with 'PK' (50 4B 03 04)
                if (hex.startsWith('504B0304')) return '.xlsx';

                // 2. PDF starts with '%PDF' (25 50 44 46)
                if (hex.startsWith('25504446')) return '.pdf';

                // 3. JPEG starts with FF D8 FF
                if (hex.startsWith('FFD8FF')) return '.jpg';

                // 4. PNG starts with 89 50 4E 47
                if (hex.startsWith('89504E47')) return '.png';

                // 5. Old XLS (Legacy Binary) starts with D0 CF 11 E0
                if (hex.startsWith('D0CF11E0')) return '.xls';

                return null;
            };

            let extension = await getExtensionByHeader(blob);

            // Fallback to MIME type if Magic Bytes didn't help (e.g. for Text/CSV/HTML)
            if (!extension) {
                const contentType = response.headers.get('content-type');
                const mimeMap = {
                    'text/csv': '.csv',
                    'text/comma-separated-values': '.csv',
                    'application/vnd.ms-excel': '.xls', // HTML based XLS usually
                    'text/html': '.xls', // Often used for Excel-compatible HTML reports
                    'image/webp': '.webp'
                };
                if (contentType) {
                    const baseMime = contentType.split(';')[0].toLowerCase().trim();
                    extension = mimeMap[baseMime] || '';
                }
            }

            // Final fallback logic based on defaultName or URL
            if (!extension) {
                const urlExtMatch = url.split(/[#?]/)[0].match(/\.[0-9a-z]+$/i);
                if (urlExtMatch) {
                    extension = urlExtMatch[0];
                } else if (defaultName?.toLowerCase().includes('bulk_details')) {
                    extension = '.csv'; // Default to CSV for non-binary spreadsheet data
                } else if (defaultName?.toLowerCase().includes('label')) {
                    extension = '.pdf';
                }
            }

            // Ensure fileName has the correct extension
            let fileName = defaultName || 'download';
            if (extension && !fileName.toLowerCase().endsWith(extension.toLowerCase())) {
                fileName += extension;
            }

            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);

            toast.dismiss(loadingToast);
            toast.success('Download Started');
        } catch (error) {
            console.error('Download failed:', error);
            const downloadUrl = url.includes('cloudinary.com')
                ? url.replace('/upload/', '/upload/fl_attachment/')
                : url;
            window.open(downloadUrl, '_blank');
        }
    };
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null); // For Modal
    const [showLabelModal, setShowLabelModal] = useState(false);
    const [companySettings, setCompanySettings] = useState({});

    // Invoice Preview State
    const [invoicePreviewUrl, setInvoicePreviewUrl] = useState(null);
    const [invoicePreviewOrder, setInvoicePreviewOrder] = useState(null);

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [stats, setStats] = useState({
        total: 0,
        pendingVerify: 0,
        readyToShip: 0,
        revenue: 0,
        delivered: 0
    });

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/orders/admin/stats');
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch stats", error);
        }
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            // Fetch paginated
            const { data } = await api.get(`/orders?page=${page}&limit=20`);
            if (data.orders) {
                setOrders(data.orders);
                setTotalPages(data.pages);
            } else {
                setOrders([]);
            }
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/admin/settings');
            setCompanySettings(data);
        } catch (e) { console.error("Settings fetch error", e); }
    };

    useEffect(() => {
        // Fetch Stats once
        fetchStats();
        fetchSettings();
    }, []);

    useEffect(() => {
        // Fetch Orders whenever page changes (or potentially activeTab if we add server-side filter)
        // Note: Currently activeTab filters CLIENT-SIDE on the paginated result. 
        // This is imperfect (only filters the 20 loaded orders).
        // Ideally we pass status to query.
        fetchOrders();
    }, [page]);

    const handleExport = async () => {
        try {
            const loadingToast = toast.loading('Generating Export...');
            const { data } = await api.get('/orders/admin/export', { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([data], { type: 'application/vnd.ms-excel' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0, 10)}.xls`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.dismiss(loadingToast);
            toast.success('Export Downloaded!');
        } catch (error) {
            console.error(error);
            toast.error('Export Failed');
        }
    };

    const handleVerifyPayment = async (id) => {
        if (!window.confirm("Confirm payment receipt?")) return;
        try {
            await api.put(`/orders/${id}/verify-payment`);
            alert("Payment Verified!");
            fetchOrders();
        } catch (error) {
            alert("Verification Failed");
        }
    };

    const handlePreviewInvoice = (order) => {
        setInvoicePreviewOrder(order);
        setInvoicePreviewUrl(true);
        toast.success("Ready!");
    };

    const handleDownloadInvoice = (order) => {
        try {
            const doc = generateInvoicePDF(order, companySettings);
            doc.save(`Invoice_${order._id}.pdf`);
            toast.success("Invoice Downloaded!");
        } catch (error) {
            console.error("Download failed:", error);
            toast.error("Failed to download invoice.");
        }
    };

    const handleMarkShipped = async (id) => {
        if (!window.confirm("Mark this order as SHIPPED?")) return;
        try {
            await api.put(`/orders/${id}/ship`);
            alert("Order marked as Shipped!");
            fetchOrders();
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const handleMarkDelivered = async (id) => {
        if (!window.confirm("Mark this order as DELIVERED?")) return;
        try {
            await api.put(`/orders/${id}/deliver`);
            alert("Order marked as Delivered!");
            fetchOrders();
        } catch (error) {
            alert("Failed to update status");
        }
    };



    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending_shipping_calc': return 'Add Shipping';
            case 'payment_verification_pending': return 'Verify Payment';
            case 'pending_payment': return 'Pending Pay';
            case 'payment_confirmed': return 'Ready to Ship';
            case 'shipped': return 'Shipped';
            case 'delivered': return 'Delivered';
            default: return status;
        }
    };

    const handleUpdateShippingFee = async (id, fee) => {
        if (!fee) return toast.error("Please enter a shipping fee");
        try {
            const loadingToast = toast.loading("Updating Shipping Fee...");
            await api.put(`/orders/${id}/shipping-fee`, { shippingFee: fee });
            toast.dismiss(loadingToast);
            toast.success("Shipping Fee Updated!");

            // Update local state if selectedOrder is the same
            if (selectedOrder && selectedOrder._id === id) {
                // Fetch updated order to be safe or update locally
                // Ideally fetch fresh order
                const { data } = await api.get(`/orders/${id}`);
                setSelectedOrder(data);
            }
            fetchOrders();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update shipping fee");
        }
    };

    // Filter Logic
    const filteredOrders = orders.filter(order => {
        // Tab Filter
        if (activeTab !== 'all' && order.orderStatus !== activeTab) return false;

        // Search Filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const idMatch = order._id.toLowerCase().includes(term);

            // Reseller Info
            const rName = order.resellerId?.name?.toLowerCase().includes(term);
            const rEmail = order.resellerId?.email?.toLowerCase().includes(term);
            const rPhone = order.resellerId?.mobileNumber?.includes(term) || order.resellerId?.phone?.includes(term);

            // Customer Info (Shipping Address)
            const cName = order.shippingAddress?.name?.toLowerCase().includes(term);
            const cEmail = order.shippingAddress?.email?.toLowerCase().includes(term);
            const cPhone = order.shippingAddress?.phone?.includes(term);
            const cCity = order.shippingAddress?.city?.toLowerCase().includes(term);
            const cState = order.shippingAddress?.state?.toLowerCase().includes(term);
            const cZip = order.shippingAddress?.pincode?.includes(term);

            const matches = idMatch || rName || rEmail || rPhone || cName || cEmail || cPhone || cCity || cState || cZip;
            if (!matches) return false;
        }
        return true;
    });

    return (
        <>
            <MainLayout>
                <div className="p-4 md:p-8">
                    <h1 className="text-4xl mb-10 md:text-6xl font-black text-white tracking-tighter">
                        Order Command Center<span className="text-red-600">.</span>
                    </h1>

                    <div className="mb-6 bg-blue-900/20 border border-blue-900/50 text-blue-400 px-4 py-3 rounded-xl flex items-center gap-3">
                        <FaClock className="text-blue-500" />
                        <div>
                            <span className="font-bold">Approval Hours:</span> Orders should be approved between <span className="font-bold">9:00 AM - 9:00 PM</span>.
                        </div>
                    </div>

                    {/* STATS CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800 flex items-center gap-4">
                            <div className="p-4 bg-red-900/20 rounded-full text-red-500 shrink-0"><FaClipboardList size={24} /></div>
                            <div>
                                <div className="text-3xl font-bold text-white">{stats.total}</div>
                                <div className="text-zinc-400 text-sm">Total Orders</div>
                            </div>
                        </div>
                        <div className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800 flex items-center gap-4">
                            <div className="p-4 bg-orange-900/20 rounded-full text-orange-500 shrink-0"><FaClock size={24} /></div>
                            <div>
                                <div className="text-3xl font-bold text-white">{stats.pendingVerify}</div>
                                <div className="text-zinc-400 text-sm">Pending Verify</div>
                            </div>
                        </div>
                        <div className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800 flex items-center gap-4">
                            <div className="p-4 bg-blue-900/20 rounded-full text-blue-500 shrink-0"><FaBoxOpen size={24} /></div>
                            <div>
                                <div className="text-3xl font-bold text-white">{stats.readyToShip}</div>
                                <div className="text-zinc-400 text-sm">Ready to Ship</div>
                            </div>
                        </div>
                        <div className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800 flex items-center gap-4">
                            <div className="p-4 bg-green-900/20 rounded-full text-green-500 shrink-0"><FaCheck size={24} /></div>
                            <div>
                                <div className="text-3xl font-bold text-white">{stats.delivered}</div>
                                <div className="text-zinc-400 text-sm">Delivered Orders</div>
                            </div>
                        </div>
                    </div>

                    {/* CONTROLS: TABS & SEARCH */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                            {[
                                { id: 'all', label: 'All Orders' },
                                { id: 'pending_shipping_calc', label: 'Add Shipping' },
                                { id: 'payment_verification_pending', label: 'Verify Payment' },
                                { id: 'payment_confirmed', label: 'To Ship' },
                                { id: 'shipped', label: 'Shipped' },
                                { id: 'delivered', label: 'Delivered' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id
                                        ? 'border-red-600 bg-red-600 text-white'
                                        : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="relative w-full md:w-[300px]">

                                <input
                                    type="text"
                                    placeholder="Search Order ID or Reseller..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full py-3 pl-12 pr-4 rounded-xl border border-zinc-700 bg-zinc-900 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-zinc-500"
                                />
                            </div>
                            <button
                                onClick={handleExport}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl shadow-sm transition flex items-center gap-2 font-bold whitespace-nowrap"
                                title="Download All Orders CSV"
                            >
                                <FaFileDownload /> Export CSV
                            </button>
                        </div>
                    </div>

                    {/* TABLE VIEW & MOBILE CARDS */}
                    <div className="space-y-6">
                        {loading ? (
                            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-4">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="flex gap-4 p-4 border-b border-zinc-800 animate-pulse">
                                        <div className="h-5 w-16 bg-zinc-800 rounded"></div>
                                        <div className="h-5 w-32 bg-zinc-800 rounded"></div>
                                        <div className="h-5 w-24 bg-zinc-800 rounded"></div>
                                        <div className="flex-1"></div>
                                        <div className="h-8 w-20 bg-zinc-800 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-12 text-center text-zinc-500">
                                No orders found matching your filters.
                            </div>
                        ) : (
                            <>
                                <div className="glass-panel bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm hidden md:block">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-zinc-900/50 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
                                                <tr>
                                                    <th className="p-4 whitespace-nowrap">Order ID</th>
                                                    <th className="p-4 whitespace-nowrap">Date</th>
                                                    <th className="p-4 whitespace-nowrap">Reseller</th>
                                                    <th className="p-4 whitespace-nowrap">Status</th>
                                                    <th className="p-4 whitespace-nowrap">Total</th>
                                                    <th className="p-4 whitespace-nowrap">Shipping</th>
                                                    <th className="p-4 whitespace-nowrap text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-800">
                                                {filteredOrders.map(order => (
                                                    <tr key={order._id} className="hover:bg-zinc-800/50 transition-colors">
                                                        <td className="p-4 font-bold text-white">#{order._id.slice(-6)}</td>
                                                        <td className="p-4 text-zinc-500 text-xs">
                                                            {new Date(order.createdAt).toLocaleDateString('en-GB')}
                                                            <br />
                                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="font-medium text-white">{order.resellerId?.name || 'Unknown'}</div>
                                                            <div className="text-xs text-zinc-500">{order.resellerId?.email}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-1 rounded text-xs font-bold inline-block whitespace-nowrap ${order.orderStatus === 'payment_verification_pending' ? 'bg-orange-900/20 text-orange-400' :
                                                                order.orderStatus === 'payment_confirmed' ? 'bg-blue-900/20 text-blue-400' :
                                                                    order.orderStatus === 'shipped' ? 'bg-purple-900/20 text-purple-400' :
                                                                        order.orderStatus === 'delivered' ? 'bg-green-900/20 text-green-400' : 'bg-zinc-800 text-zinc-400'
                                                                }`}>
                                                                {getStatusLabel(order.orderStatus)}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 font-bold text-white">₹{order.totalAmount}</td>
                                                        <td className="p-4">
                                                            <div className="flex flex-col items-start gap-1">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${order.shippingMethod === 'audionix'
                                                                    ? 'bg-blue-900/20 text-blue-400 border-blue-900/30'
                                                                    : 'bg-orange-900/20 text-orange-400 border-orange-900/30'
                                                                    }`}>
                                                                    {order.shippingMethod === 'audionix' ? 'Audionix Ship' : 'Self Ship'}
                                                                </span>

                                                                {order.shippingLabelUrl && (
                                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-900/20 text-green-400 border border-green-900/30 flex items-center gap-1">
                                                                        <FaFileDownload /> Label Ready
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex gap-2 justify-end">
                                                                {order.orderStatus === 'pending_shipping_calc' && (
                                                                    <button onClick={() => setSelectedOrder(order)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded transition flex items-center gap-1.5 font-semibold text-xs whitespace-nowrap animate-pulse">
                                                                        <FaMoneyBillWave /> Add Fee
                                                                    </button>
                                                                )}
                                                                {order.orderStatus === 'payment_verification_pending' && (
                                                                    <button onClick={() => handleVerifyPayment(order._id)} title="Verify Payment" className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded transition flex items-center gap-1.5 font-semibold text-xs whitespace-nowrap">
                                                                        <FaCheck /> Approve
                                                                    </button>
                                                                )}
                                                                {order.orderStatus === 'payment_confirmed' && (
                                                                    <button onClick={() => handleMarkShipped(order._id)} title="Mark Shipped" className="bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1.5 rounded transition flex items-center gap-1.5 font-semibold text-xs whitespace-nowrap">
                                                                        <FaShippingFast /> Ship
                                                                    </button>
                                                                )}
                                                                {order.orderStatus === 'shipped' && (
                                                                    <button onClick={() => handleMarkDelivered(order._id)} title="Mark Delivered" className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded transition flex items-center gap-1.5 font-semibold text-xs whitespace-nowrap">
                                                                        <FaCheck /> Delivered
                                                                    </button>
                                                                )}
                                                                <button onClick={() => setSelectedOrder(order)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded text-sm font-semibold transition">View</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-4">
                                    {filteredOrders.map(order => (
                                        <div key={order._id} className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-sm flex flex-col gap-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-lg text-white">#{order._id.slice(-6)}</span>
                                                        {order.shippingLabelUrl && <FaPrint className="text-zinc-500" />}
                                                    </div>
                                                    <div className="text-xs text-zinc-500 mt-1">
                                                        {new Date(order.createdAt).toLocaleDateString('en-GB')} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${order.orderStatus === 'payment_verification_pending' ? 'bg-orange-900/20 text-orange-400' :
                                                    order.orderStatus === 'payment_confirmed' ? 'bg-blue-900/20 text-blue-400' :
                                                        order.orderStatus === 'shipped' ? 'bg-purple-900/20 text-purple-400' :
                                                            order.orderStatus === 'delivered' ? 'bg-green-900/20 text-green-400' : 'bg-zinc-800 text-zinc-400'
                                                    }`}>
                                                    {getStatusLabel(order.orderStatus)}
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center text-sm border-t border-b border-zinc-800 py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-zinc-500">Reseller</span>
                                                    <span className="font-medium text-white">{order.resellerId?.name || 'Unknown'}</span>
                                                </div>
                                                <div className="flex flex-col text-right">
                                                    <span className="text-xs text-zinc-500">Total</span>
                                                    <span className="font-bold text-white text-base">₹{order.totalAmount}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <button onClick={() => setSelectedOrder(order)} className="col-span-1 bg-zinc-800 border border-zinc-700 text-zinc-300 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-700 transition">
                                                    View Details
                                                </button>
                                                <div className="col-span-1">
                                                    {order.orderStatus === 'pending_shipping_calc' && (
                                                        <button onClick={() => setSelectedOrder(order)} className="w-full bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2 animate-pulse">
                                                            <FaMoneyBillWave /> Add Fee
                                                        </button>
                                                    )}
                                                    {order.orderStatus === 'payment_verification_pending' && (
                                                        <button onClick={() => handleVerifyPayment(order._id)} className="w-full bg-orange-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition flex items-center justify-center gap-2">
                                                            <FaCheck /> Approve
                                                        </button>
                                                    )}
                                                    {order.orderStatus === 'payment_confirmed' && (
                                                        <button onClick={() => handleMarkShipped(order._id)} className="w-full bg-zinc-700 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-600 transition flex items-center justify-center gap-2">
                                                            <FaShippingFast /> Ship
                                                        </button>
                                                    )}
                                                    {order.orderStatus === 'shipped' && (
                                                        <button onClick={() => handleMarkDelivered(order._id)} className="w-full bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2">
                                                            <FaCheck /> Done
                                                        </button>
                                                    )}
                                                    {order.orderStatus === 'delivered' && (
                                                        <div className="w-full bg-zinc-800 text-zinc-500 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center cursor-not-allowed">
                                                            Completed
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8 pb-8">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition"
                            >
                                Previous
                            </button>
                            <span className="text-zinc-400">
                                Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages}</span>
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

                {/* MODAL */}
                {selectedOrder && (
                    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
                        {/* Inner Modal Content */}
                        {!showLabelModal && (
                            <div className="bg-zinc-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative shadow-2xl flex flex-col border border-zinc-800">
                                <div className="p-6 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-zinc-900 z-10">
                                    <h2 className="m-0 text-xl font-bold text-white">Order #{selectedOrder._id.slice(-6)}</h2>
                                    <button onClick={() => setSelectedOrder(null)} className="text-zinc-500 hover:text-white text-2xl leading-none">&times;</button>
                                </div>

                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        {selectedOrder.shippingMethod === 'self' && (
                                            <>
                                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Reseller Info (Order Placed By)</h4>
                                                <div className="bg-purple-900/20 p-4 rounded-xl border border-purple-900/30 mb-8">
                                                    <p className="font-bold text-white text-lg mb-1">{selectedOrder.resellerId?.name}</p>
                                                    <p className="text-zinc-400 mb-1">{selectedOrder.resellerId?.email}</p>
                                                    <p className="text-white font-semibold">{selectedOrder.resellerId?.mobileNumber || 'No Phone'}</p>
                                                </div>
                                            </>
                                        )}

                                        {selectedOrder.shippingMethod !== 'self' && (
                                            <>
                                                {selectedOrder.bulkOrderFile ? (
                                                    <div className="mt-2">
                                                        <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-4">Bulk Order (Audionix Ship)</h4>
                                                        <div className="bg-blue-900/10 p-4 rounded-xl border border-blue-900/20">
                                                            <p className="text-sm text-zinc-300 mb-4">
                                                                This is a Bulk Order. Please download the file below for customer addresses and details.
                                                            </p>
                                                            <button
                                                                onClick={() => handleDownloadFile(selectedOrder.bulkOrderFile.startsWith('http') ? selectedOrder.bulkOrderFile : `${FILE_BASE_URL}${selectedOrder.bulkOrderFile.startsWith('/') ? '' : '/'}${selectedOrder.bulkOrderFile}`, `Order_${selectedOrder._id}_Bulk_Details`)}
                                                                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-bold transition shadow-lg shadow-blue-900/20"
                                                            >
                                                                <FaFileDownload size={18} /> Download Bulk Excel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Customer Shipping Info</h4>
                                                        <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-800">
                                                            <p className="font-bold text-white text-lg mb-1">
                                                                {selectedOrder.shippingAddress?.name}
                                                            </p>
                                                            <p className="text-zinc-400 mb-1">
                                                                {selectedOrder.shippingAddress?.email || 'No Email Provided'}
                                                            </p>
                                                            <p className="text-white font-semibold mb-2">
                                                                {selectedOrder.shippingAddress?.phone}
                                                            </p>
                                                            <p className="text-sm text-zinc-500 leading-relaxed">
                                                                {selectedOrder.shippingAddress?.address}, {selectedOrder.shippingAddress?.city}<br />
                                                                {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        )}

                                        {selectedOrder.shippingMethod === 'self' && (
                                            <div className="mt-6">
                                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Self-Ship Details</h4>
                                                <div className="bg-orange-900/10 p-4 rounded-xl border border-orange-900/20">
                                                    {selectedOrder.pickupAddress && (
                                                        <div className="mb-3">
                                                            <span className="block text-xs text-orange-500 font-bold uppercase mb-1">Pickup Address</span>
                                                            <p className="text-white font-medium whitespace-pre-wrap text-sm">{selectedOrder.pickupAddress}</p>
                                                            {selectedOrder.pickupDescription && (
                                                                <p className="text-xs text-zinc-500 mt-1 italic">"{selectedOrder.pickupDescription}"</p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {selectedOrder.bulkOrderFiles && selectedOrder.bulkOrderFiles.length > 0 ? (
                                                        <div className="mb-4">
                                                            <span className="block text-xs text-orange-500 font-bold uppercase mb-2">Bulk Shipping Labels ({selectedOrder.bulkOrderFiles.length})</span>
                                                            <div className="grid grid-cols-1 gap-2">
                                                                {selectedOrder.bulkOrderFiles.map((url, index) => (
                                                                    <button
                                                                        key={index}
                                                                        onClick={() => handleDownloadFile(url.startsWith('http') ? url : `${FILE_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`, `Order_${selectedOrder._id}_Label_${index + 1}`)}
                                                                        className="flex items-center gap-2 bg-zinc-900 border border-orange-900/50 text-orange-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-800 transition"
                                                                    >
                                                                        <FaFileDownload /> Label {index + 1}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : selectedOrder.shippingLabelUrl ? (
                                                        <div>
                                                            <span className="block text-xs text-orange-500 font-bold uppercase mb-2">Shipping Label</span>
                                                            <button
                                                                onClick={() => handleDownloadFile(selectedOrder.shippingLabelUrl.startsWith('http') ? selectedOrder.shippingLabelUrl : `${FILE_BASE_URL}${selectedOrder.shippingLabelUrl.startsWith('/') ? '' : '/'}${selectedOrder.shippingLabelUrl}`, `Order_${selectedOrder._id}_Shipping_Label`)}
                                                                className="inline-flex items-center gap-2 bg-zinc-900 border border-orange-900/50 text-orange-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-800 transition"
                                                            >
                                                                <FaFileDownload /> View Label
                                                            </button>
                                                            {selectedOrder.shippingLabelUrl.match(/\.(jpeg|jpg|png|webp)$/i) && (
                                                                <div className="mt-3 rounded-lg overflow-hidden border border-orange-900/30 w-full h-auto">
                                                                    <img src={selectedOrder.shippingLabelUrl} alt="Label Preview" className="w-full h-auto object-contain bg-black" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-orange-400 flex items-center gap-2 bg-orange-900/20 p-2 rounded-lg mt-2">
                                                            <FaClock /> Label pending upload
                                                        </div>
                                                    )}

                                                    {selectedOrder.bulkOrderFile && (
                                                        <div className="mt-4 pt-4 border-t border-orange-900/20">
                                                            <span className="block text-xs text-orange-500 font-bold uppercase mb-2">Bulk Order Details (Excel)</span>
                                                            <button
                                                                onClick={() => handleDownloadFile(selectedOrder.bulkOrderFile.startsWith('http') ? selectedOrder.bulkOrderFile : `${FILE_BASE_URL}${selectedOrder.bulkOrderFile}`, `Order_${selectedOrder._id}_Bulk_Details`)}
                                                                className="inline-flex items-center gap-2 bg-green-600 border border-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition shadow-sm"
                                                            >
                                                                <FaFileDownload /> Download Excel Sheet
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Payment & Stats</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg border border-zinc-800">
                                                <span className="text-zinc-500">Status</span>
                                                <span className="font-bold text-red-500">{getStatusLabel(selectedOrder.orderStatus)}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg border border-zinc-800">
                                                <span className="text-zinc-500">Total Amount</span>
                                                <span className="font-bold text-white text-lg">₹{selectedOrder.totalAmount}</span>
                                            </div>

                                            {/* Shipping Fee Section */}
                                            <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg border border-zinc-800">
                                                <span className="text-zinc-500">Shipping</span>
                                                {selectedOrder.shippingFee > 0 ? (
                                                    <span className="font-bold text-white text-lg">₹{selectedOrder.shippingFee}</span>
                                                ) : (
                                                    <span className="font-bold text-orange-500">Pending</span>
                                                )}
                                            </div>

                                            {/* Logic to Add Shipping Fee if pending */}
                                            {selectedOrder.orderStatus === 'pending_shipping_calc' && (
                                                <div className="mt-3 p-4 bg-zinc-800 rounded-xl border border-zinc-700">
                                                    <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase">Set Shipping Fee</label>
                                                    <div className="flex gap-2">
                                                        <div className="relative flex-1">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">₹</span>
                                                            <input
                                                                type="number"
                                                                placeholder="0"
                                                                className="w-full bg-zinc-900 border border-zinc-600 rounded-lg pl-8 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                                                                id="shippingFeeInput"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const val = document.getElementById('shippingFeeInput').value;
                                                                handleUpdateShippingFee(selectedOrder._id, val);
                                                            }}
                                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition"
                                                        >
                                                            Add Fee
                                                        </button>
                                                    </div>
                                                </div>
                                            )}


                                            {selectedOrder.paymentDetails && (
                                                <div className="mt-4 p-5 bg-blue-900/10 rounded-2xl border border-blue-900/30">
                                                    <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mb-3">Payment Proof</h4>

                                                    {selectedOrder.paymentDetails.transactionId ? (
                                                        <div className="flex items-center justify-between gap-4 mb-4">
                                                            <div>
                                                                <span className="block text-xs text-zinc-500 mb-0.5">UTR / Transaction ID</span>
                                                                <span className="text-white font-mono font-bold text-base select-all">{selectedOrder.paymentDetails.transactionId}</span>
                                                            </div>
                                                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                                                <FaQrcode size={18} />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-orange-500 font-bold text-sm bg-orange-900/20 p-2 rounded-lg mb-3">
                                                            <FaInfoCircle /> UTR Missing
                                                        </div>
                                                    )}

                                                    {selectedOrder.paymentDetails.screenshotUrl ? (
                                                        <a
                                                            href={selectedOrder.paymentDetails.screenshotUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold transition shadow-lg shadow-blue-900/20 text-sm"
                                                        >
                                                            <FaEye /> View Payment Screenshot
                                                        </a>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-2 w-full bg-zinc-800 text-zinc-500 px-4 py-2.5 rounded-xl font-bold text-sm border border-dashed border-zinc-700">
                                                            <FaUpload /> Screenshot Missing
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
                                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Order Items</h4>
                                    <div className="bg-zinc-800/30 rounded-xl border border-zinc-800 overflow-hidden">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-zinc-800 text-zinc-400 border-b border-zinc-700">
                                                <tr>
                                                    <th className="p-3 font-medium">Product</th>
                                                    <th className="p-3 font-medium text-right">Qty</th>
                                                    <th className="p-3 font-medium text-right">Price</th>
                                                    <th className="p-3 font-medium text-right">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-700">
                                                {selectedOrder.items.map((item, i) => (
                                                    <tr key={i}>
                                                        <td className="p-3 text-white font-medium">{item.product?.title || 'Unknown Product'}</td>
                                                        <td className="p-3 text-right text-zinc-400">{item.quantity}</td>
                                                        <td className="p-3 text-right text-zinc-400">₹{item.price}</td>
                                                        <td className="p-3 text-right font-bold text-white">₹{item.price * item.quantity}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-zinc-800 border-t border-zinc-700">
                                                <tr>
                                                    <td colSpan="3" className="p-3 text-right font-bold text-white">Total</td>
                                                    <td className="p-3 text-right font-bold text-red-500">₹{selectedOrder.totalAmount}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 flex-wrap">
                                    <button onClick={() => handlePreviewInvoice(selectedOrder)} className="px-4 py-2.5 bg-zinc-800 text-white rounded-lg font-bold hover:bg-zinc-700 transition border border-zinc-700 flex items-center gap-2 text-sm"><FaEye /> View Invoice</button>
                                    <button onClick={() => setShowLabelModal(true)} className="px-4 py-2.5 bg-zinc-800 text-white rounded-lg font-bold hover:bg-zinc-700 transition border border-zinc-700 flex items-center gap-2 text-sm"><FaPrint /> Print Label</button>
                                    <button onClick={() => setSelectedOrder(null)} className="px-4 py-2.5 bg-white text-black rounded-lg font-bold hover:bg-zinc-200 transition shadow-lg shadow-white/5 text-sm">Close Details</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {showLabelModal && selectedOrder && (
                    <ShippingLabel
                        order={selectedOrder}
                        onClose={() => setShowLabelModal(false)}
                    />
                )}

            </MainLayout >

            {/* --- INVOICE PREVIEW MODAL --- */}
            {invoicePreviewUrl && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[60] flex items-center justify-center p-0 md:p-6" onClick={() => setInvoicePreviewUrl(null)}>
                    <div className="bg-zinc-900 w-full max-w-5xl h-full md:h-[95vh] md:rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300 border border-zinc-800" onClick={e => e.stopPropagation()}>
                        <div className="p-4 md:px-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 backdrop-blur-xl">
                            <div>
                                <h3 className="text-lg font-bold text-white tracking-tight">Admin Invoice Console<span className="text-red-600">.</span></h3>
                            </div>
                            <div className="flex gap-3">
                                {invoicePreviewOrder && (
                                    <button
                                        onClick={() => handleDownloadInvoice(invoicePreviewOrder)}
                                        className="px-5 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition flex items-center gap-2 shadow-lg shadow-red-900/20"
                                    >
                                        <FaDownload size={14} /> Download PDF
                                    </button>
                                )}
                                <button
                                    onClick={() => setInvoicePreviewUrl(null)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:bg-red-900/50 hover:text-red-400 transition border border-zinc-700"
                                >
                                    <FaTimes size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-zinc-100 overflow-y-auto p-4 md:p-12 scrollbar-thin scrollbar-thumb-zinc-300">
                            <div className="max-w-[850px] mx-auto">
                                <InvoiceHTML
                                    order={invoicePreviewOrder}
                                    companySettings={companySettings}
                                    onDownload={handleDownloadInvoice}
                                    onClose={() => setInvoicePreviewUrl(null)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminOrders;
