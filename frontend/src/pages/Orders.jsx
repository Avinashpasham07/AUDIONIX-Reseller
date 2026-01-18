import { useState, useEffect } from 'react';
import api from '../services/api';
import { Link, useSearchParams } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import MainLayout from '../components/MainLayout';
import ShippingLabel from '../components/ShippingLabel';
import { FaPrint, FaTags, FaEye, FaTimes, FaBox, FaMapMarkerAlt, FaMoneyBillWave, FaDownload, FaCheckCircle, FaUpload } from 'react-icons/fa';
import toast from 'react-hot-toast';
import InvoiceHTML from '../components/InvoiceHTML';
import { generateInvoicePDF } from '../utils/pdfGenerator';


const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedOrderForLabel, setSelectedOrderForLabel] = useState(null);
    const [companySettings, setCompanySettings] = useState({});

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Invoice Preview State
    const [invoicePreviewUrl, setInvoicePreviewUrl] = useState(null);
    const [invoicePreviewOrder, setInvoicePreviewOrder] = useState(null);

    // Filtering
    const [searchParams, setSearchParams] = useSearchParams();
    const filterStatus = searchParams.get('status') || 'all';

    const handleFilterChange = (status) => {
        setSearchParams({ status });
        setPage(1); // Reset to page 1 on filter change
    };

    const getFilteredOrders = () => {
        if (filterStatus === 'all') return orders;
        if (filterStatus === 'pending') {
            return orders.filter(o => ['pending_payment', 'pending_shipping_calc', 'payment_verification_pending', 'payment_confirmed', 'ready_for_dispatch'].includes(o.orderStatus));
        }
        if (filterStatus === 'shipped') return orders.filter(o => o.orderStatus === 'shipped');
        if (filterStatus === 'delivered') return orders.filter(o => o.orderStatus === 'delivered');
        if (filterStatus === 'cancelled') return orders.filter(o => o.orderStatus === 'cancelled');
        return orders;
    };

    const filteredOrders = getFilteredOrders();

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/orders?page=${page}&limit=10`);
                if (data.orders) {
                    setOrders(data.orders);
                    setTotalPages(data.pages);
                } else {
                    setOrders(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error("Failed to fetch orders", error);
                toast.error("Could not load orders");
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

        fetchOrders();
        fetchSettings();
    }, [page]);

    // Payment Modal State
    const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
    const [paymentUtr, setPaymentUtr] = useState('');
    const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState('');
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (!paymentUtr || !paymentScreenshotUrl) {
            return toast.error("Please provide UTR and Screenshot");
        }

        setIsSubmittingPayment(true);
        try {
            await api.put(`/orders/${selectedOrderForPayment._id}/payment`, {
                transactionId: paymentUtr,
                screenshotUrl: paymentScreenshotUrl
            });
            toast.success("Payment Details Submitted!");
            setSelectedOrderForPayment(null);
            setPaymentUtr('');
            setPaymentScreenshotUrl('');

            // Refresh Orders
            const { data } = await api.get('/orders');
            setOrders(data);
        } catch (error) {
            console.error("Payment submit failed", error);
            toast.error("Failed to submit payment");
        } finally {
            setIsSubmittingPayment(false);
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

    const getStatusColorClass = (status) => {
        switch (status) {
            case 'pending_payment': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'pending_shipping_calc': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'payment_verification_pending': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
            case 'payment_confirmed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'ready_for_dispatch': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
            case 'shipped': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
            case 'delivered': return 'text-green-400 bg-green-500/10 border-green-500/20';
            case 'cancelled': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-zinc-400 bg-zinc-800 border-zinc-700';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto p-4 md:p-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl md:text-8xl font-black text-white tracking-tighter mb-2">
                            My Orders<span className="text-red-600">.</span>
                        </h1>
                        <p className="text-zinc-400">Track and manage your extensive portfolio.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <button
                            onClick={async () => {
                                try {
                                    const loadingToast = toast.loading('Generating Export...');
                                    const { data } = await api.get('/orders/export', { responseType: 'blob' });

                                    const url = window.URL.createObjectURL(new Blob([data], { type: 'application/vnd.ms-excel' }));
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', `my_orders_export_${new Date().toISOString().slice(0, 10)}.xls`);
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
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition flex items-center justify-center gap-2 font-bold"
                        >
                            <FaDownload /> Export Excel
                        </button>

                        {/* Premium Filter Tabs */}
                        <div className="flex flex-wrap md:flex-nowrap gap-2 md:gap-0 p-1.5 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800/50 w-full md:w-auto overflow-visible md:overflow-x-auto no-scrollbar shadow-inner">
                            {['all', 'pending', 'shipped', 'delivered', 'cancelled'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => handleFilterChange(status)}
                                    className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-sm font-bold capitalize transition-all duration-300 whitespace-nowrap text-center ${filterStatus === status
                                        ? 'bg-zinc-800 text-white shadow-lg shadow-black/20 ring-1 ring-white/10'
                                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid gap-4 animate-pulse">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 bg-zinc-900/50 rounded-3xl border border-zinc-800/50"></div>
                        ))}
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/50 border-dashed">
                        <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-6 text-4xl shadow-inner">🛍️</div>
                        <h3 className="text-2xl font-bold text-white mb-2">No orders found</h3>
                        <p className="text-zinc-500 max-w-xs text-center">Your order history is currently empty. Start your journey today!</p>
                        <Link to="/products" className="mt-8 px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition shadow-lg shadow-white/5">
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Mobile: Modern Card View */}
                        <div className="grid grid-cols-1 md:hidden gap-5">
                            {filteredOrders.map((order) => (
                                <div key={order._id}
                                    className="bg-zinc-900/80 backdrop-blur-sm p-5 rounded-3xl shadow-lg shadow-black/20 border border-zinc-800/50 active:scale-[0.98] transition-transform duration-200"
                                    onClick={() => setSelectedOrder(order)}>

                                    <div className="flex justify-between items-start mb-5 pb-5 border-b border-zinc-800/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                                                <FaBox />
                                            </div>
                                            <div>
                                                <div className="font-mono text-sm font-bold text-white tracking-wide">#{order._id.slice(-6).toUpperCase()}</div>
                                                <div className="text-xs text-zinc-500 font-medium">{formatDate(order.createdAt)}</div>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusColorClass(order.orderStatus)}`}>
                                            {order.orderStatus.replace(/_/g, ' ')}
                                        </span>
                                    </div>

                                    <div className="space-y-3 mb-5">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-zinc-500">Amount</span>
                                            <div className="font-bold text-white text-lg">₹{order.totalAmount}</div>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-zinc-500">Payment</span>
                                            <span className={`font-bold ${order.customerPaymentMode === 'cod' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                {order.customerPaymentMode === 'cod' ? 'COD' : 'Prepaid'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Action Buttons */}
                                        {order.orderStatus === 'pending_payment' ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedOrderForPayment(order); }}
                                                className="col-span-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                                            >
                                                <FaMoneyBillWave /> Pay Now
                                            </button>
                                        ) : (
                                            <>
                                                {order.shippingMethod === 'self' && order.orderStatus === 'payment_confirmed' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedOrderForLabel(order); }}
                                                        className="w-full py-2 rounded-xl bg-amber-100 text-amber-800 font-bold text-sm"
                                                    >
                                                        Label
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                                                    className={`w-full py-3 rounded-xl bg-zinc-800 text-white font-bold text-sm border border-zinc-700 hover:bg-zinc-700 transition ${order.shippingMethod === 'self' && order.orderStatus === 'payment_confirmed' ? '' : 'col-span-2'}`}
                                                >
                                                    View Details
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handlePreviewInvoice(order); }}
                                                    className="col-span-2 py-3 rounded-xl bg-blue-900/20 text-blue-400 font-bold text-sm border border-blue-900/30 hover:bg-blue-900/30 transition flex items-center justify-center gap-2"
                                                >
                                                    <FaEye /> Preview Invoice
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop: Premium Table View */}
                        <div className="hidden md:block bg-zinc-900/40 backdrop-blur-md rounded-3xl border border-zinc-800/50 overflow-hidden shadow-2xl shadow-black/20">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-zinc-800/50 bg-zinc-900/80">
                                        <th className="p-6 font-bold text-zinc-500 text-xs uppercase tracking-wider">Order ID</th>
                                        <th className="p-6 font-bold text-zinc-500 text-xs uppercase tracking-wider">Date</th>
                                        <th className="p-6 font-bold text-zinc-500 text-xs uppercase tracking-wider">Status</th>
                                        <th className="p-6 font-bold text-zinc-500 text-xs uppercase tracking-wider">Payment</th>
                                        <th className="p-6 font-bold text-zinc-500 text-xs uppercase tracking-wider text-right">Amount</th>
                                        <th className="p-6 font-bold text-zinc-500 text-xs uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {filteredOrders.map((order) => (
                                        <tr key={order._id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                            <td className="p-6">
                                                <div className="font-mono font-bold text-white group-hover:text-red-500 transition-colors">
                                                    #{order._id.slice(-6).toUpperCase()}
                                                </div>
                                            </td>
                                            <td className="p-6 text-zinc-400 font-medium text-sm">
                                                {formatDate(order.createdAt)}
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border capitalize tracking-wide ${getStatusColorClass(order.orderStatus)}`}>
                                                    {order.orderStatus.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${order.customerPaymentMode === 'cod' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
                                                    <span className="text-zinc-300 font-medium text-sm">{order.customerPaymentMode === 'cod' ? 'COD' : 'Prepaid'}</span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <span className="font-bold text-white text-lg">₹{order.totalAmount}</span>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex gap-2 justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                                                    {order.orderStatus === 'pending_payment' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedOrderForPayment(order); }}
                                                            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/20 mr-2"
                                                        >
                                                            Pay
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                                                        className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-zinc-700"
                                                    >
                                                        Details
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handlePreviewInvoice(order); }}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 transition border border-blue-900/30"
                                                        title="Preview Invoice"
                                                    >
                                                        <FaEye size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 pt-6 pb-2">
                                <button
                                    onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    disabled={page === 1}
                                    className="px-5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-white font-bold hover:bg-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                >
                                    Previous
                                </button>
                                <span className="text-zinc-400 font-medium bg-zinc-900/50 px-4 py-2 rounded-lg border border-zinc-800">
                                    Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages}</span>
                                </span>
                                <button
                                    onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    disabled={page === totalPages}
                                    className="px-5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-white font-bold hover:bg-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}


                {/* --- PAYMENT MODAL --- */}
                {selectedOrderForPayment && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 min-h-screen" onClick={() => setSelectedOrderForPayment(null)}>
                        <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <FaMoneyBillWave className="text-green-500" /> Complete Payment
                                </h3>
                                <button onClick={() => setSelectedOrderForPayment(null)} className="text-zinc-500 hover:text-white transition">
                                    <FaTimes size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Amount Display */}
                                <div className="bg-gradient-to-r from-green-900/20 to-zinc-900 p-4 rounded-2xl border border-green-900/30 text-center">
                                    <p className="text-zinc-400 text-sm font-medium mb-1">Total Amount to Pay</p>
                                    <p className="text-3xl font-black text-white">₹{selectedOrderForPayment.totalAmount}</p>
                                    <div className="text-xs text-zinc-500 mt-2 flex justify-center gap-4">
                                        <span>Items: ₹{selectedOrderForPayment.totalAmount - (selectedOrderForPayment.shippingFee || 0)}</span>
                                        <span>Shipping: ₹{selectedOrderForPayment.shippingFee || 0}</span>
                                    </div>
                                </div>

                                {/* Payment Details (Admin) */}
                                <div className="space-y-4">
                                    <div className="flex flex-col items-center">
                                        {companySettings.upi_qr_url ? (
                                            <img src={companySettings.upi_qr_url} alt="Pay QR" className="w-48 h-48 rounded-xl border-2 border-white shadow-lg mb-3" />
                                        ) : (
                                            <div className="w-48 h-48 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 text-xs mb-3">QR Not Available</div>
                                        )}
                                        <div className="text-center">
                                            <p className="text-white font-bold text-lg select-all">{companySettings.upi_id || 'Contact Admin'}</p>
                                            <p className="text-zinc-500 text-xs">UPI ID</p>
                                        </div>
                                    </div>

                                    {(companySettings.bank_name || companySettings.account_number) && (
                                        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-sm space-y-2">
                                            <p className="font-bold text-zinc-400 uppercase text-xs mb-2">Bank Transfer Details</p>
                                            <div className="flex justify-between"><span className="text-zinc-500">Bank:</span> <span className="text-white font-medium">{companySettings.bank_name}</span></div>
                                            <div className="flex justify-between"><span className="text-zinc-500">Account:</span> <span className="text-white font-medium select-all">{companySettings.account_number}</span></div>
                                            <div className="flex justify-between"><span className="text-zinc-500">IFSC:</span> <span className="text-white font-medium select-all">{companySettings.ifsc_code}</span></div>
                                            <div className="flex justify-between"><span className="text-zinc-500">Name:</span> <span className="text-white font-medium">{companySettings.account_holder}</span></div>
                                        </div>
                                    )}
                                </div>

                                {/* User Input Form */}
                                <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-4 border-t border-zinc-800">
                                    <div>
                                        <label className="block text-sm font-bold text-zinc-400 mb-2">Transaction ID / UTR <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            value={paymentUtr}
                                            onChange={(e) => setPaymentUtr(e.target.value)}
                                            placeholder="Enter 12-digit UTR Number"
                                            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:ring-2 focus:ring-green-500 outline-none transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-zinc-400 mb-2">Payment Screenshot <span className="text-red-500">*</span></label>
                                        {paymentScreenshotUrl ? (
                                            <div className="flex items-center gap-3 bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                                                <FaCheckCircle className="text-green-500" />
                                                <span className="text-sm text-white flex-1 truncate">Screenshot Uploaded</span>
                                                <button type="button" onClick={() => setPaymentScreenshotUrl('')} className="text-red-500 text-xs font-bold hover:underline">Remove</button>
                                            </div>
                                        ) : (
                                            <div className="relative overflow-hidden group">
                                                <button type="button" className="w-full py-3 bg-zinc-900 border border-dashed border-zinc-600 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-500 transition flex justify-center items-center gap-2 font-medium">
                                                    <FaUpload /> Upload Screenshot
                                                </button>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (!file) return;
                                                        const formData = new FormData();
                                                        formData.append('file', file);
                                                        try {
                                                            const toastId = toast.loading("Uploading...");
                                                            const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                                                            setPaymentScreenshotUrl(data.fullUrl);
                                                            toast.success("Uploaded!", { id: toastId });
                                                        } catch (err) { toast.error("Upload Failed"); }
                                                    }}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmittingPayment}
                                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition ${isSubmittingPayment ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white hover:-translate-y-1 shadow-green-900/20'}`}
                                    >
                                        {isSubmittingPayment ? 'Verifying...' : 'Submit Payment Details'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- ORDER DETAILS MODAL --- */}
                {selectedOrder && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 min-h-screen" onClick={() => setSelectedOrder(null)}>
                        <div className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>

                            {/* Modal Header */}
                            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/90 backdrop-blur sticky top-0 z-10">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Order Details</h2>
                                    <p className="text-zinc-500 text-xs mt-1">ID: #{selectedOrder._id}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:bg-red-900/50 hover:text-red-400 transition"
                                >
                                    <FaTimes size={14} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 md:p-8 space-y-8">

                                {/* Status Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                                        <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Status</div>
                                        <div className={`font-bold capitalize text-sm ${getStatusColorClass(selectedOrder.orderStatus).split(' ')[0]}`}>
                                            {selectedOrder.orderStatus.replace(/_/g, ' ')}
                                        </div>
                                    </div>
                                    <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                                        <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Shipping</div>
                                        <div className="font-bold text-white text-sm">
                                            {selectedOrder.shippingMethod === 'audionix' ? 'Audionix Managed' : 'Self Ship'}
                                        </div>
                                    </div>
                                    <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                                        <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Payment</div>
                                        <div className={`font-bold text-sm ${selectedOrder.customerPaymentMode === 'cod' ? 'text-orange-500' : 'text-green-500'}`}>
                                            {selectedOrder.customerPaymentMode === 'cod' ? 'COD' : 'Prepaid'}
                                        </div>
                                    </div>
                                </div>

                                {/* Items */}
                                <div>
                                    <h4 className="flex items-center gap-2 mb-4 text-white font-bold text-sm uppercase tracking-wide">
                                        <FaBox className="text-zinc-500" /> Items Ordered
                                    </h4>
                                    <div className="border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
                                        {selectedOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex gap-4 p-4 items-center bg-zinc-900/50 hover:bg-zinc-900 transition">
                                                <img
                                                    src={item.product?.images?.[0] || 'https://via.placeholder.com/100'}
                                                    alt="Product"
                                                    className="w-16 h-16 rounded-xl object-cover bg-zinc-800 border border-zinc-700"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-white text-sm md:text-base truncate">{item.product?.title || 'Unknown Product'}</div>
                                                    <div className="text-xs text-zinc-500 mt-1">Qty: <span className="font-semibold text-zinc-300">{item.quantity}</span> × ₹{item.price}</div>
                                                </div>
                                                <div className="font-bold text-white text-base">₹{item.price * item.quantity}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                <div>
                                    <h4 className="flex items-center gap-2 mb-4 text-white font-bold text-sm uppercase tracking-wide">
                                        <FaMapMarkerAlt className="text-zinc-500" /> Shipping Address
                                    </h4>
                                    <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 text-sm leading-relaxed text-zinc-400">
                                        <div className="font-bold text-white text-base mb-1">{selectedOrder.shippingAddress?.name}</div>
                                        <p>{selectedOrder.shippingAddress?.address}</p>
                                        <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - <span className="font-semibold text-zinc-300">{selectedOrder.shippingAddress?.pincode}</span></p>
                                        <div className="mt-3 pt-3 border-t border-zinc-800 font-medium text-white">
                                            📞 {selectedOrder.shippingAddress?.phone}
                                        </div>
                                    </div>
                                </div>

                                {/* Financials */}
                                <div>
                                    <h4 className="flex items-center gap-2 mb-4 text-white font-bold text-sm uppercase tracking-wide">
                                        <FaMoneyBillWave className="text-zinc-500" /> Financial Details
                                    </h4>
                                    <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
                                        <div className="flex justify-between mb-2 text-sm">
                                            <span className="text-zinc-400 font-medium">Base Cost (Items)</span>
                                            <span className="font-bold text-white">₹{selectedOrder.totalAmount - (selectedOrder.shippingFee || 0)}</span>
                                        </div>
                                        <div className="flex justify-between mb-2 text-sm">
                                            <span className="text-zinc-400 font-medium">Shipping Fee</span>
                                            <span className="font-bold text-white">₹{selectedOrder.shippingFee || 0}</span>
                                        </div>
                                        <div className="flex justify-between mb-4 text-sm mt-2 pt-2 border-t border-zinc-800">
                                            <span className="text-white font-bold">Total You Pay</span>
                                            <span className="font-bold text-xl text-white">₹{selectedOrder.totalAmount}</span>
                                        </div>

                                        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 mt-4">
                                            <div className="flex justify-between mb-2 text-sm">
                                                <span className="text-green-500 font-bold">Your Margin</span>
                                                <span className="font-bold text-green-500">+ ₹{selectedOrder.resellerMargin}</span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="font-bold text-zinc-300 text-sm">Customer Pays</span>
                                                <span className="font-black text-white">₹{selectedOrder.totalAmount + selectedOrder.resellerMargin}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {selectedOrder.orderStatus === 'pending_payment' && (
                                    <div className="pt-4 border-t border-zinc-800">
                                        <button
                                            onClick={() => {
                                                setSelectedOrderForPayment(selectedOrder);
                                                setSelectedOrder(null);
                                            }}
                                            className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-900/20 transition flex items-center justify-center gap-2 animate-pulse"
                                        >
                                            <FaMoneyBillWave /> Pay Now: ₹{selectedOrder.totalAmount}
                                        </button>
                                    </div>
                                )}

                                {/* Admin Added Shipping / Payment Info (If paid) */}
                                {selectedOrder.paymentDetails?.transactionId && (
                                    <div className="mt-6 p-4 bg-blue-900/10 rounded-xl border border-blue-900/30">
                                        <h5 className="font-bold text-blue-400 text-xs uppercase mb-2">Payment Record</h5>
                                        <p className="text-sm text-zinc-300"><b>UTR:</b> {selectedOrder.paymentDetails.transactionId}</p>
                                        <p className="text-xs text-zinc-500 mt-1">Status: <span className="text-white font-bold">{selectedOrder.paymentDetails.isVerified ? 'Verified' : 'Pending Verification'}</span></p>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                )}

                {selectedOrderForLabel && (
                    <ShippingLabel
                        order={selectedOrderForLabel}
                        onClose={() => setSelectedOrderForLabel(null)}
                    />
                )}

                {/* --- INVOICE PREVIEW MODAL --- */}
                {invoicePreviewUrl && (
                    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-0 md:p-6" onClick={() => setInvoicePreviewUrl(null)}>
                        <div className="bg-zinc-900 w-full max-w-5xl h-full md:h-[95vh] md:rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300 border border-zinc-800" onClick={e => e.stopPropagation()}>
                            <div className="p-4 md:px-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 backdrop-blur-xl">
                                <div>
                                    <h3 className="text-lg font-bold text-white tracking-tight">Invoice System<span className="text-red-600">.</span></h3>
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
            </div>
        </MainLayout>
    );
};

export default Orders;
