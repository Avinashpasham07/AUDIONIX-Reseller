import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../components/MainLayout';
import CartContext from '../context/CartContext';
import AuthContext from '../context/AuthContext';
import { usePixel } from '../context/PixelContext';
import api from '../services/api';
import ShippingLabel from '../components/ShippingLabel';
import { FaMapMarkerAlt, FaTruck, FaMoneyBillWave, FaQrcode, FaCheckCircle, FaUpload, FaInfoCircle, FaTags } from 'react-icons/fa';

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { cart, clearCart } = useContext(CartContext);
    const { trackEvent } = usePixel();
    const { user } = useContext(AuthContext);

    const directBuyItem = location.state?.directBuyItem;

    // State from Cart Navigation
    // We now capture "Customer Total" instead of just margin
    const [customerTotal, setCustomerTotal] = useState('');
    // Initialize freshCart logic will be handled by effect, but if we have direct buy, we might want to show loading
    const [freshCart, setFreshCart] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(true);

    useEffect(() => {
        const refreshCart = async () => {
            let itemsToProcess = [];

            if (directBuyItem) {
                // Formatting to match cart structure: { ...product, quantity: 1 }
                itemsToProcess = [{ ...directBuyItem, quantity: 1, _id: directBuyItem._id }];
            } else if (cart.length > 0) {
                itemsToProcess = cart;
            } else {
                setIsRefreshing(false);
                return;
            }

            try {
                const refreshedItems = await Promise.all(itemsToProcess.map(async (item) => {
                    try {
                        const { data } = await api.get(`/products/${item._id}`);
                        console.log(`Fetched fresh product ${item._id}:`, data);
                        return { ...data, quantity: item.quantity, _id: item._id };
                    } catch (err) {
                        console.error(`Failed to refresh product ${item._id}`, err);
                        return item;
                    }
                }));
                console.log('Refreshed Cart Items:', refreshedItems);
                setFreshCart(refreshedItems);
            } catch (error) {
                console.error("Cart refresh failed", error);
            } finally {
                setIsRefreshing(false);
            }
        };
        refreshCart();
    }, [cart, directBuyItem]);

    const [step, setStep] = useState(1);
    const [maxStep, setMaxStep] = useState(1); // Track furthest progress
    const [loading, setLoading] = useState(false);

    // Step 2: Address
    const [address, setAddress] = useState({
        name: '',
        email: '',
        phone: '',
        addressLine: '',
        city: '',
        state: '',
        pincode: ''
    });

    // Step 1: Shipping
    const [shippingMethod, setShippingMethod] = useState('');
    const [shippingLabelUrl, setShippingLabelUrl] = useState('');
    const [bulkFileUrl, setBulkFileUrl] = useState('');
    const [bulkFiles, setBulkFiles] = useState([]); // Array for multiple files (Self Ship)
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [uploadingBulk, setUploadingBulk] = useState(false);
    const [showLabelModal, setShowLabelModal] = useState(false);

    // Step 3: Payment
    // Reseller ALWAYS pays via UPI (Prepaid) to Admin.
    // 'customerPaymentMode' tracks if the END customer is COD or Prepaid.
    const [customerPaymentMode, setCustomerPaymentMode] = useState('prepaid');
    const [agreedToPolicy, setAgreedToPolicy] = useState(false);

    // Payment details for Reseller -> Admin transaction
    const [utr, setUtr] = useState('');
    const [screenshotUrl, setScreenshotUrl] = useState('');
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

    // Effect: Update customer payment mode based on shipping method defaults
    useEffect(() => {
        if (shippingMethod === 'self') {
            setCustomerPaymentMode('prepaid');
        } else if (shippingMethod === 'audionix') {
            setCustomerPaymentMode('prepaid');
        }
    }, [shippingMethod]);

    const handleShippingSubmit = (e) => {
        e.preventDefault();
        if (!shippingMethod) return toast.error('Please select a shipping method');
        setStep(2);
        if (maxStep < 2) setMaxStep(2); // Unlock step 2
    };

    const handleBulkUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploadingBulk(true);
        const newUrls = [];

        try {
            // Check if we are in Self Ship mode (Multiple Files Allowed)
            if (shippingMethod === 'self') {
                // Upload Sequentially to ensure reliability
                for (const file of files) {
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                        const { data } = await api.post('/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        newUrls.push(data.fullUrl);
                    } catch (err) {
                        console.error('Failed to upload a file:', file.name, err);
                        toast.error(`Failed to upload ${file.name}`);
                    }
                }

                if (newUrls.length > 0) {
                    setBulkFiles(prev => [...prev, ...newUrls]); // Append new files
                    toast.success(`${newUrls.length} Labels Uploaded Successfully`);
                }
            } else {
                // Audionix Ship - Single Excel File
                const file = files[0];
                const formData = new FormData();
                formData.append('file', file);

                const { data } = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setBulkFileUrl(data.fullUrl);
                toast.success('Excel Sheet Uploaded');
            }

        } catch (error) {
            console.error(error);
            toast.error('Upload Process Failed');
        } finally {
            setUploadingBulk(false);
            // Reset input value so same files can be selected again if needed
            e.target.value = '';
        }
    };

    const downloadSampleExcel = () => {
        const headers = ["order_id", "payment_mode", "user_name", "user_phone", "user_address", "user_city", "user_state", "user_pincode", "product_name", "product_weight", "quantity", "product_price"];
        const row1 = ["R1", "Prepaid", "Nihal Gupta", "9988776655", "456 Park Road", "Delhi", "Delhi", "110001", "Dress Floral", "0.60", "1", "13.60"];

        // Generate Excel-compatible HTML content
        const html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Template</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
            <body>
                <table border="1">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            ${headers.map(h => `<th style="font-weight: bold; padding: 5px;">${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            ${row1.map(v => `<td style="padding: 5px;">${v}</td>`).join('')}
                        </tr>
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "bulk_order_template.xls");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleAddressSubmit = (e) => {
        e.preventDefault();

        // 1. BULK UPLOAD PRIORITY
        // If user has uploaded a bulk file, we prioritize that and skip standard validation.
        if (bulkFileUrl) {
            // Auto-fill dummy address so backend validation passes
            setAddress({
                name: 'Bulk Order User',
                phone: '9999999999',
                addressLine: 'Refer to Bulk Excel Sheet',
                city: 'Bulk City',
                state: 'Bulk State',
                pincode: '000000'
            });
            setStep(3);
            if (maxStep < 3) setMaxStep(3);
            return;
        }

        // 2. STANDARD VALIDATION
        if (shippingMethod === 'self') {
            // Updated Requirement: Mandatory FILE UPLOAD for Self Ship
            // Check for Single Label or Multiple Labels (Bulk)
            if (!shippingLabelUrl && bulkFiles.length === 0 && !bulkFileUrl) {
                return toast.error("Please upload the Shipping Label / Bill to proceed.");
            }

            // Auto-fill dummy address for Self Ship as form is hidden
            setAddress({
                name: 'Self Ship Reseller',
                phone: '9999999999',
                addressLine: 'Refer to Shipping Label / Bill',
                city: 'Self Ship',
                state: 'Self Ship',
                pincode: '000000'
            });
            setStep(3);
            if (maxStep < 3) setMaxStep(3);
            return;
        }

        // Validate that address fields are present (since we removed the 'required' attribute from inputs in some conditional paths)
        if (!address.name || !address.phone || !address.addressLine || !address.city || !address.state || !address.pincode) {
            return toast.error('Please fill in all customer address details.');
        }
        setStep(3);
        if (maxStep < 3) setMaxStep(3);
    };

    // Calculations
    const finalItems = freshCart.length > 0 ? freshCart : (directBuyItem ? [{ ...directBuyItem, quantity: 1 }] : cart);
    console.log('Final Items for Checkout:', finalItems); // DEBUG
    const basePrice = finalItems.reduce((t, i) => {
        let cost = i.price; // Default to MRP
        if (user?.subscriptionPlan === 'paid') {
            cost = i.resellerPricePaid || i.resellerPrice || i.price;
        } else {
            // Free User: Use Reseller Price (Base)
            // Explicitly ignore resellerPricePaid
            cost = i.resellerPrice || i.price;
        }
        return t + cost * i.quantity;
    }, 0);

    // Shipping Fee Calculation (Only for Audionix Ship)
    const shippingFeeTotal = shippingMethod === 'audionix' ? finalItems.reduce((acc, item) => acc + (item.shippingFee || 0) * item.quantity, 0) : 0;
    const totalPayable = basePrice + shippingFeeTotal;

    const margin = customerTotal ? (Number(customerTotal) - totalPayable) : 0;

    // Track InitiateCheckout once items are loaded
    useEffect(() => {
        if (finalItems.length > 0) {
            trackEvent('InitiateCheckout', {
                content_ids: finalItems.map(i => i._id),
                content_type: 'product',
                num_items: finalItems.length,
                value: basePrice,
                currency: 'INR'
            });
        }
    }, [finalItems.length]); // Dependencies to trigger once loaded

    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const orderItems = finalItems.map(item => ({
                product: item._id,
                quantity: item.quantity
            }));

            // Margin can be negative (Reseller can sell at loss)
            // if (margin < 0) { ... } validation removed

            if (!utr || !screenshotUrl) {
                toast.error("Please provide payment details (UTR & Screenshot)");
                setLoading(false);
                return;
            }

            // 1. Create Order
            // Payment Method is 'pay_later' initially. Admin will add shipping fee.
            const { data: orderData } = await api.post('/orders', {
                items: orderItems,
                shippingAddress: {
                    name: address.name,
                    email: address.email,
                    address: address.addressLine,
                    city: address.city,
                    pincode: address.pincode,
                    state: address.state,
                    phone: address.phone
                },
                paymentMethod: 'upi',
                paymentDetails: {
                    transactionId: utr,
                    screenshotUrl: screenshotUrl
                },
                resellerMargin: Number(margin) || 0,
                shippingMethod,
                shippingFee: shippingFeeTotal,
                shippingLabelUrl: shippingLabelUrl || '',
                bulkOrderFile: bulkFileUrl,
                bulkOrderFiles: bulkFiles,
                customerPaymentMode
            });

            // NO Payment Upload here. Reseller pays later.

            toast.success('Order Placed Successfully! Payment Verified.');

            // Track Purchase (Pending)
            trackEvent('Purchase', {
                content_ids: finalItems.map(i => i._id),
                content_type: 'product',
                value: basePrice,
                currency: 'INR',
                order_id: orderData._id
            });

            clearCart();
            navigate('/orders');

        } catch (error) {
            console.error('Checkout failed', error);
            toast.error('Order Failed: ' + (error.response?.data?.message || 'Unknown Error'));
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0 && !directBuyItem) return <MainLayout><h2>Cart is empty</h2></MainLayout>;

    return (
        <MainLayout>
            <h1 className="text-gradient text-2xl md:text-3xl font-bold mb-8">Checkout</h1>

            {/* Stepper */}
            <div className="flex items-center justify-between mb-8 max-w-xl mx-auto px-2">
                <div
                    onClick={() => setStep(1)}
                    className={`flex items-center gap-2 cursor-pointer text-sm md:text-base ${step >= 1 ? 'text-red-500 font-bold' : 'text-zinc-500'}`}
                >
                    <FaTruck /> Shipping
                </div>

                <span className="text-zinc-700">-</span>

                <div
                    onClick={() => maxStep >= 2 && setStep(2)}
                    className={`flex items-center gap-2 text-sm md:text-base ${step >= 2 ? 'text-red-500 font-bold' : 'text-zinc-500'} ${maxStep >= 2 ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                >
                    <FaMapMarkerAlt /> Address
                </div>

                <span className="text-zinc-700">-</span>

                <div
                    onClick={() => maxStep >= 3 && setStep(3)}
                    className={`flex items-center gap-2 text-sm md:text-base ${step >= 3 ? 'text-red-500 font-bold' : 'text-zinc-500'} ${maxStep >= 3 ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                >
                    <FaMoneyBillWave /> Payment
                </div>
            </div>

            <div className="glass-panel w-full max-w-2xl mx-auto p-4 md:p-8 rounded-2xl bg-zinc-950/50">

                {/* STEP 1: SHIPPING */}
                {step === 1 && (
                    <form onSubmit={handleShippingSubmit} className="animate-fadeIn">
                        <h3 className="text-xl font-bold mb-4">Select Shipping Method</h3>

                        <div onClick={() => {
                            setShippingMethod('audionix');
                            setAddress({ name: '', email: '', phone: '', addressLine: '', city: '', state: '', pincode: '' });
                        }} className={`p-6 border-2 rounded-xl mb-4 cursor-pointer transition ${shippingMethod === 'audionix' ? 'border-red-500 bg-red-900/10' : 'border-zinc-800 hover:border-zinc-700'}`}>
                            <div className="text-lg font-bold text-white">Ship by Audionix</div>
                            <div className="text-zinc-400 text-sm">We handle packing and delivery | we will take only prepaid orders</div>
                        </div>

                        <div onClick={() => {
                            setShippingMethod('self');
                            setAddress({ name: '', email: '', phone: '', addressLine: '', city: '', state: '', pincode: '' });
                        }} className={`p-6 border-2 rounded-xl mb-4 cursor-pointer transition ${shippingMethod === 'self' ? 'border-red-500 bg-red-900/10' : 'border-zinc-800 hover:border-zinc-700'}`}>
                            <div className="text-lg font-bold text-white">Ship by Self</div>
                            <div className="text-zinc-400 text-sm">You handle the delivery.</div>
                        </div>

                        <button type="submit" className="w-full py-3 mt-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition">
                            Next: Address & details
                        </button>
                    </form>
                )}

                {/* STEP 2: ADDRESS & DOCS */}
                {step === 2 && (
                    <form onSubmit={handleAddressSubmit} className="grid grid-cols-1 gap-4 animate-fadeIn">

                        {/* Order Type Tabs */}
                        <div className="flex p-1 bg-zinc-900 rounded-xl mb-6 border border-zinc-800">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsBulkMode(false);
                                    setIsBulkMode(false);
                                    setBulkFileUrl(''); // Clear bulk data
                                    setBulkFiles([]); // Clear labels
                                    // Optional: Reset address to blank or keep it? unique logic suggests blanking is cleaner
                                    // setAddress(prev => ({ ...prev, name: '', phone: '', city: '', state: '', pincode: '', addressLine: '' }));
                                }}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${!isBulkMode ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                Individual Order
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsBulkMode(true);
                                    // Trigger bulk mode logic (auto-fill dummy address handled in submit or effect)
                                }}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${isBulkMode ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                Bulk Order
                            </button>
                        </div>

                        {/* MODE A: INDIVIDUAL ORDER */}
                        {!isBulkMode ? (
                            <div className="animate-fadeIn">
                                {/* SELF SHIP SPECIFIC: Label Upload */}
                                {shippingMethod === 'self' && (
                                    <div className="mb-8">
                                        <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                                            <FaMapMarkerAlt className="text-blue-500" /> Pickup Location(s)
                                        </h3>
                                        <div className="bg-blue-900/10 p-4 rounded-2xl border border-blue-900/30 mb-6">
                                            <p className="text-lg text-blue-300 mb-3 font-medium">Please select the below warehouse as pickup location in your respective shipping platforms</p>
                                            <span className='text-lg font-bold text-red-500 italic'>  (warehouses may vary based on product , please check the warehouse address with product name)</span>
                                            <div className="space-y-3">
                                                {(() => {
                                                    // Deduplicate addresses
                                                    const uniqueAddresses = [...new Set(finalItems.map(item => item.pickupAddress).filter(Boolean))];
                                                    if (uniqueAddresses.length === 0) return <p className="text-zinc-500 italic">No specific pickup address listed. Please contact Admin.</p>;

                                                    return uniqueAddresses.map((addr, idx) => (
                                                        <div key={idx} className="flex gap-3 bg-white p-3 rounded-xl border border-zinc-800">
                                                            <div className="shrink-0 mt-1">
                                                                <div className="w-6 h-6 rounded-full bg-blue-500 text-black flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-zinc-500 mt-1">
                                                                    Product Name: {finalItems.filter(i => i.pickupAddress === addr).map(i => i.title).join(', ')}
                                                                </p>
                                                                <p className="text-black text-sm font-bold">Pickup Address: {addr}</p>

                                                            </div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                                            <FaUpload className="text-orange-500" /> Upload Label / Bill
                                        </h3>
                                        <div className="bg-orange-900/10 p-6 rounded-2xl border border-orange-900/30">
                                            <p className="text-sm text-orange-400 mb-4 font-medium">Since you are shipping this yourself, please upload the Shipping Label or Bill for our records.</p>

                                            {shippingLabelUrl ? (
                                                <div className="flex items-center gap-3 bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                                                    <div className="p-2 bg-green-900/20 rounded-lg text-green-500">
                                                        <FaCheckCircle size={20} />
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="text-sm font-bold text-white truncate">File Uploaded Successfully</p>
                                                        <a href={shippingLabelUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">View File</a>
                                                    </div>
                                                    <button type="button" onClick={() => setShippingLabelUrl('')} className="px-3 py-1 text-xs font-bold text-red-500 hover:bg-zinc-800 rounded">Remove</button>
                                                </div>
                                            ) : (
                                                <div className="relative group">
                                                    <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center bg-zinc-900/50 hover:bg-zinc-900 hover:border-orange-500 transition cursor-pointer">
                                                        <FaUpload className="mx-auto text-3xl text-zinc-500 mb-3 group-hover:text-orange-500 transition" />
                                                        <p className="text-zinc-300 font-bold mb-1">Click to Upload File</p>
                                                        <p className="text-xs text-zinc-500">PDF, JPG, PNG allowed</p>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept="image/*,application/pdf"
                                                        onChange={async (e) => {
                                                            const file = e.target.files[0];
                                                            if (!file) return;
                                                            const formData = new FormData();
                                                            formData.append('file', file);
                                                            try {
                                                                const loadingToast = toast.loading('Uploading file...');
                                                                const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                                                                toast.dismiss(loadingToast);
                                                                setShippingLabelUrl(data.fullUrl);
                                                                toast.success("Uploaded!");
                                                            } catch (err) { toast.error("Upload Failed"); }
                                                        }}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* CUSTOMER ADDRESS FORM (Only for Audionix) */}
                                {shippingMethod !== 'self' && (
                                    <div>
                                        <h3 className="text-xl font-bold mb-4 text-white">Customer Details</h3>

                                        <div className="space-y-4">
                                            <input type="text" placeholder="Customer Name" value={address.name} onChange={e => setAddress({ ...address, name: e.target.value })} className="w-full p-4 border border-zinc-800 bg-zinc-900 text-white rounded-xl focus:ring-2 focus:ring-red-600 outline-none font-medium placeholder-zinc-600 transition focus:border-red-600" />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <input type="tel" placeholder="Phone Number" value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })} className="w-full p-4 border border-zinc-800 bg-zinc-900 text-white rounded-xl focus:ring-2 focus:ring-red-600 outline-none font-medium placeholder-zinc-600 transition focus:border-red-600" />
                                                <input type="email" placeholder="Email (Optional)" value={address.email} onChange={e => setAddress({ ...address, email: e.target.value })} className="w-full p-4 border border-zinc-800 bg-zinc-900 text-white rounded-xl focus:ring-2 focus:ring-red-600 outline-none font-medium placeholder-zinc-600 transition focus:border-red-600" />
                                            </div>

                                            <input type="text" placeholder="Address Line (House No, Street, Area)" value={address.addressLine} onChange={e => setAddress({ ...address, addressLine: e.target.value })} className="w-full p-4 border border-zinc-800 bg-zinc-900 text-white rounded-xl focus:ring-2 focus:ring-red-600 outline-none font-medium placeholder-zinc-600 transition focus:border-red-600" />

                                            <div className="grid grid-cols-2 gap-4">
                                                <input type="text" placeholder="City" value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} className="w-full p-4 border border-zinc-800 bg-zinc-900 text-white rounded-xl focus:ring-2 focus:ring-red-600 outline-none font-medium placeholder-zinc-600 transition focus:border-red-600" />
                                                <input type="text" placeholder="Pincode" value={address.pincode} onChange={e => setAddress({ ...address, pincode: e.target.value })} className="w-full p-4 border border-zinc-800 bg-zinc-900 text-white rounded-xl focus:ring-2 focus:ring-red-600 outline-none font-medium placeholder-zinc-600 transition focus:border-red-600" />
                                            </div>
                                            <input type="text" placeholder="State" value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} className="w-full p-4 border border-zinc-800 bg-zinc-900 text-white rounded-xl focus:ring-2 focus:ring-red-600 outline-none font-medium placeholder-zinc-600 transition focus:border-red-600" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* MODE B: BULK ORDER UPLOAD */
                            <div className="animate-fadeIn">
                                <div className="bg-blue-900/10 rounded-2xl border border-blue-900/30 p-6 sm:p-8 text-center">
                                    <div className="inline-flex p-4 bg-blue-900/20 rounded-full text-blue-400 mb-4">
                                        <FaUpload size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Bulk Order Upload</h3>
                                    <p className="text-zinc-400 mb-6 max-w-sm mx-auto">
                                        {shippingMethod === 'self'
                                            ? "Upload multiple Shipping Labels for your orders."
                                            : "Upload the Excel sheet with customer addresses for all your orders."}
                                    </p>

                                    {shippingMethod === 'self' ? (
                                        // SELF SHIP - MULTIPLE FILES UI
                                        <div className="flex flex-col items-center gap-4 w-full">
                                            {/* PICKUP ADDRESS DISPLAY FOR BULK */}
                                            <div className="w-full text-left mb-4">
                                                <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                                                    <FaMapMarkerAlt className="text-blue-500" /> Pickup Location(s)
                                                </h3>
                                                <div className="bg-blue-900/10 p-4 rounded-2xl border border-blue-900/30 mb-6">
                                                    <p className="text-lg text-blue-300 mb-3 font-medium">Please select the below warehouse as pickup location in your respective shipping platforms</p>
                                                    <span className='text-lg font-bold text-red-500 italic'>  (warehouses may vary based on product , please check the warehouse address with product name)</span>
                                                    <div className="space-y-3">
                                                        {(() => {
                                                            // Deduplicate addresses
                                                            const uniqueAddresses = [...new Set(finalItems.map(item => item.pickupAddress).filter(Boolean))];
                                                            if (uniqueAddresses.length === 0) return <p className="text-zinc-500 italic">No specific pickup address listed. Please contact Admin.</p>;

                                                            return uniqueAddresses.map((addr, idx) => (
                                                                <div key={idx} className="flex gap-3 bg-white p-3 rounded-xl border border-zinc-800">
                                                                    <div className="shrink-0 mt-1">
                                                                        <div className="w-6 h-6 rounded-full bg-blue-500 text-black flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-zinc-500 mt-1">
                                                                            Product Name: {finalItems.filter(i => i.pickupAddress === addr).map(i => i.title).join(', ')}
                                                                        </p>
                                                                        <p className="text-black text-sm font-bold">Pickup Address: {addr}</p>
                                                                    </div>
                                                                </div>
                                                            ));
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>

                                            {bulkFiles.length > 0 && (
                                                <div className="w-full grid grid-cols-2 gap-2 mb-4">
                                                    {bulkFiles.map((url, index) => (
                                                        <div key={index} className="flex items-center gap-2 bg-zinc-900 p-2 rounded-lg border border-zinc-800 overflow-hidden relative group">
                                                            <FaCheckCircle className="text-green-500 flex-shrink-0" />
                                                            <span className="text-xs text-white truncate flex-1">Label {index + 1}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setBulkFiles(prev => prev.filter((_, i) => i !== index))}
                                                                className="text-red-500 hover:text-red-400 p-1"
                                                            >
                                                                &times;
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="relative overflow-hidden group">
                                                <button type="button" className={`px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-900/20 flex items-center gap-2 ${uploadingBulk ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                    <FaUpload /> {uploadingBulk ? 'Uploading...' : 'Click to Upload Labels (PDF/Img)'}
                                                </button>
                                                <input
                                                    type="file"
                                                    multiple={true} // Allow multiple
                                                    accept="image/*,.pdf"
                                                    onChange={handleBulkUpload}
                                                    disabled={uploadingBulk}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                            <p className="text-xs text-zinc-500">You can select multiple files at once.</p>
                                        </div>
                                    ) : (
                                        // AUDIONIX - SINGLE EXCEL UI
                                        !bulkFileUrl ? (
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="relative overflow-hidden group">
                                                    <button type="button" className={`px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-900/20 flex items-center gap-2 ${uploadingBulk ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                        {uploadingBulk ? 'Uploading...' : 'Click to Upload Excel / File'}
                                                    </button>
                                                    <input type="file" accept=".csv, .xlsx, .xls, .pdf" onChange={handleBulkUpload} disabled={uploadingBulk} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                </div>
                                                <button type="button" onClick={downloadSampleExcel} className="text-sm font-bold text-zinc-500 hover:text-white underline">
                                                    Download Sample Excel Format
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 inline-flex flex-col items-center min-w-[200px]">
                                                <FaCheckCircle className="text-green-500 text-3xl mb-2" />
                                                <span className="text-white font-bold mb-1">File Attached</span>
                                                <span className="text-xs text-zinc-500 mb-3 max-w-[200px] truncate">{bulkFileUrl.split('/').pop()}</span>
                                                <button type="button" onClick={() => setBulkFileUrl('')} className="text-xs text-red-500 font-bold hover:underline">Remove & Upload Another</button>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 mt-8">
                            <button type="button" onClick={() => setStep(1)} className="px-6 py-3 rounded-xl font-bold text-zinc-500 hover:text-white hover:bg-zinc-900 transition">
                                Back
                            </button>
                            <button type="submit" className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-900/20 transform hover:-translate-y-0.5">
                                Continue to Payment
                            </button>
                        </div>
                    </form>
                )}

                {/* STEP 3: REVIEW & SUBMIT */}
                {step === 3 && (
                    <form onSubmit={handleFinalSubmit} className="animate-fadeIn">
                        <h3 className="text-xl font-bold mb-4">Review & Submit Order</h3>

                        {/* SECTION A: Customer Info */}
                        <div className="p-4 bg-zinc-900 rounded-xl mb-6 border border-zinc-800">
                            {shippingMethod !== 'self' && (
                                <>
                                    <h4 className="mt-0 text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">1. Customer Pay Mode</h4>
                                    <div className="flex gap-4 mb-4">
                                        <div
                                            className="flex-1 p-4 rounded-xl border border-green-600 bg-green-900/20 transition"
                                        >
                                            <div className="font-bold text-green-500">Prepaid</div>
                                            <div className="text-xs text-zinc-500">Customer paid online</div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex justify-between items-center mb-2">
                                <label className="font-medium text-zinc-300">Total Customer Price (₹):</label>
                                <input
                                    type="number"
                                    min={basePrice}
                                    placeholder="Total"
                                    value={customerTotal}
                                    onChange={e => setCustomerTotal(e.target.value)}
                                    className="w-32 p-2 border border-zinc-700 bg-zinc-900 text-white rounded-lg text-right font-bold focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>

                            <div className="flex justify-between items-center mt-2 text-lg text-white border-t border-dashed border-zinc-700 pt-2">
                                <span>Your Margin:</span>
                                <span className={`font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    ₹{margin.toLocaleString()}
                                </span>
                            </div>
                            <div className="text-xs text-zinc-500 text-right mt-1">
                                (Total Payable: ₹{totalPayable})
                            </div>
                        </div>

                        {/* Order Summary & Payment */}
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl mb-8">
                            <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <FaMoneyBillWave className="text-green-500" /> Payment Details
                            </h4>

                            {/* Cost Breakdown */}
                            <div className="space-y-3 mb-6 pb-6 border-b border-zinc-800">
                                <div className="flex justify-between text-zinc-400">
                                    <span>Item Total</span>
                                    <span>₹{basePrice}</span>
                                </div>
                                {shippingFeeTotal > 0 && (
                                    <div className="flex justify-between text-zinc-400">
                                        <span>Shipping Fee</span>
                                        <span>₹{shippingFeeTotal}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-zinc-800">
                                    <span>Total Payable</span>
                                    <span className="text-green-500">₹{totalPayable}</span>
                                </div>
                            </div>

                            {/* QR Code & Bank Details */}
                            <div className="bg-black/40 p-4 rounded-xl mb-6 flex flex-col items-center text-center">
                                {settings.upi_qr_url ? (
                                    <img src={settings.upi_qr_url} alt="QR Code" className="w-48 h-48 rounded-lg mb-3 border-2 border-white" />
                                ) : (
                                    <div className="w-48 h-48 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500 mb-3">No QR Available</div>
                                )}
                                <p className="text-white font-bold text-lg mb-1 select-all">{settings.upi_id}</p>
                                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Scan to Pay</p>

                                {(settings.bank_name || settings.account_number) && (
                                    <div className="w-full text-left bg-zinc-800/50 p-3 rounded-lg text-sm space-y-1">
                                        <p><span className="text-zinc-500">Bank:</span> {settings.bank_name}</p>
                                        <p><span className="text-zinc-500">Acc:</span> {settings.account_number}</p>
                                        <p><span className="text-zinc-500">IFSC:</span> {settings.ifsc_code}</p>
                                    </div>
                                )}
                            </div>

                            {/* Payment Proof Inputs */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">Transaction ID / UTR <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={utr}
                                        onChange={(e) => setUtr(e.target.value)}
                                        placeholder="Enter 12-digit UTR"
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-green-500 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">Upload Screenshot <span className="text-red-500">*</span></label>
                                    {screenshotUrl ? (
                                        <div className="flex items-center gap-3 bg-zinc-800 p-3 rounded-xl border border-zinc-700">
                                            <FaCheckCircle className="text-green-500" />
                                            <span className="text-xs text-white truncate flex-1">Screenshot Uploaded</span>
                                            <button type="button" onClick={() => setScreenshotUrl('')} className="text-red-500 text-xs font-bold hover:underline">Remove</button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <button type="button" className="w-full py-3 bg-zinc-800 border border-dashed border-zinc-600 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-500 transition flex justify-center items-center gap-2 text-sm font-bold">
                                                <FaUpload /> Upload Payment Screenshot
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
                                                        const t = toast.loading("Uploading...");
                                                        const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                                                        toast.dismiss(t);
                                                        setScreenshotUrl(data.fullUrl);
                                                        toast.success("Uploaded!");
                                                    } catch (err) { toast.error("Upload Failed"); }
                                                }}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Return Policy Agreement */}
                        <div
                            className={`flex items-start gap-3 mb-8 p-4 rounded-xl border transition-all duration-300 ${agreedToPolicy ? 'border-green-500 bg-green-900/10 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'border-zinc-800/50 bg-zinc-900/50'}`}
                            onClick={() => setAgreedToPolicy(!agreedToPolicy)}
                        >
                            <div className="shrink-0 mt-0.5 relative">
                                <input
                                    type="checkbox"
                                    id="policy"
                                    checked={agreedToPolicy}
                                    onChange={(e) => setAgreedToPolicy(e.target.checked)}
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-zinc-600 bg-zinc-900 checked:border-green-500 checked:bg-green-500 transition-all"
                                />
                                <FaCheckCircle className="absolute top-0 left-0 h-6 w-6 text-green-500 opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity scale-90" />
                            </div>
                            <label htmlFor="policy" className="text-sm text-zinc-400 cursor-pointer select-none">
                                I agree to the <Link to="/returns" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline" onClick={(e) => e.stopPropagation()}>Return & Replacement Policy</Link>.
                                I understand that returns are only accepted for transit damage or incorrect products, with a mandatory unboxing video.
                            </label>
                        </div>

                        <div className="flex gap-4">
                            <button type="button" onClick={() => setStep(2)} className="px-6 py-3 rounded-xl font-bold text-zinc-500 hover:text-white hover:bg-zinc-900 transition">
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={!agreedToPolicy}
                                className={`flex-1 py-4 text-white rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2 text-lg ${agreedToPolicy ? 'bg-green-600 hover:bg-green-700 shadow-green-900/20 transform hover:-translate-y-0.5' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                            >
                                <FaCheckCircle /> Pay ₹{totalPayable} & Place Order
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </MainLayout >
    );
};


export default Checkout;
