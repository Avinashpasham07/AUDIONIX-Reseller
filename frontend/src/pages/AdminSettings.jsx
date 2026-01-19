import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { FaSave, FaQrcode, FaUpload, FaTrash, FaGlobe, FaBuilding, FaCalendarCheck, FaLock } from 'react-icons/fa';

const AdminSettings = () => {
    const [upiId, setUpiId] = useState('');
    const [pixelId, setPixelId] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [premiumQrUrl, setPremiumQrUrl] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountHolder, setAccountHolder] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');

    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [workStart, setWorkStart] = useState('09:00');
    const [workEnd, setWorkEnd] = useState('17:00');
    const [premiumPrice, setPremiumPrice] = useState('499'); // Default
    const [premiumOriginalPrice, setPremiumOriginalPrice] = useState(''); // Cutoff Price

    // Company / Invoice Details
    const [companyName, setCompanyName] = useState('');
    const [companyGst, setCompanyGst] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');
    const [loading, setLoading] = useState(false);

    // Password Change State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/admin/settings'); // Use admin route or public one? Public is fine for reading, but we want the description/metadata potentially. Let's use the public GET for simplicity if it returns everything.
            // The controller returns { key: value }.
            if (data.upi_id) setUpiId(data.upi_id);
            if (data.pixel_id) setPixelId(data.pixel_id);
            if (data.upi_qr_url) setQrCodeUrl(data.upi_qr_url);
            if (data.premium_subscription_qr_url) setPremiumQrUrl(data.premium_subscription_qr_url);
            if (data.bank_name) setBankName(data.bank_name);
            if (data.account_holder) setAccountHolder(data.account_holder);
            if (data.account_number) setAccountNumber(data.account_number);
            if (data.account_number) setAccountNumber(data.account_number);
            if (data.ifsc_code) setIfscCode(data.ifsc_code);
            if (data.ifsc_code) setIfscCode(data.ifsc_code);
            if (data.ifsc_code) setIfscCode(data.ifsc_code);
            if (data.whatsapp_number) setWhatsappNumber(data.whatsapp_number);
            if (data.premium_subscription_price) setPremiumPrice(data.premium_subscription_price);
            if (data.premium_subscription_original_price) setPremiumOriginalPrice(data.premium_subscription_original_price);

            if (data.company_name) setCompanyName(data.company_name);
            if (data.company_gstin) setCompanyGst(data.company_gstin);
            if (data.company_address) setCompanyAddress(data.company_address);
            if (data.company_phone) setCompanyPhone(data.company_phone);
            if (data.company_email) setCompanyEmail(data.company_email);
            if (data.work_start) setWorkStart(data.work_start);
            if (data.work_end) setWorkEnd(data.work_end);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load settings");
        }
    };

    const handleUpload = async (e, isPremium = false) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const loadingToast = toast.loading('Uploading QR Code...');
            const { data } = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.dismiss(loadingToast);

            if (isPremium) {
                setPremiumQrUrl(data.fullUrl);
            } else {
                setQrCodeUrl(data.fullUrl);
            }

            toast.success("QR Uploaded! Don't forget to Save.");
        } catch (err) {
            console.error(err);
            toast.error("Upload Failed");
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        if (!currentPassword || !newPassword) {
            toast.error("Please fill all password fields");
            return;
        }

        setPasswordLoading(true);
        try {
            await api.put('/users/profile', {
                currentPassword,
                password: newPassword
            });
            toast.success("Password Updated Successfully! 🔒");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to update password");
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Save UPI ID
            await api.put('/admin/settings', {
                key: 'upi_id',
                value: upiId,
                description: 'The UPI ID (VPA) for receiving payments.'
            });

            // Save Pixel ID
            await api.put('/admin/settings', {
                key: 'pixel_id',
                value: pixelId,
                description: 'Meta Pixel ID for Event Tracking'
            });

            // Save QR Code URL
            await api.put('/admin/settings', {
                key: 'upi_qr_url',
                value: qrCodeUrl,
                description: 'URL of the QR Code image for scanning.'
            });

            // Save Premium QR Code URL
            await api.put('/admin/settings', {
                key: 'premium_subscription_qr_url',
                value: premiumQrUrl,
                description: 'URL of the Premium Subscription QR Code.'
            });

            // Save Bank Details
            await api.put('/admin/settings', { key: 'bank_name', value: bankName, description: 'Bank Name for transfers' });
            await api.put('/admin/settings', { key: 'account_holder', value: accountHolder, description: 'Bank Account Holder Name' });
            await api.put('/admin/settings', { key: 'account_number', value: accountNumber, description: 'Bank Account Number' });
            await api.put('/admin/settings', { key: 'account_number', value: accountNumber, description: 'Bank Account Number' });
            await api.put('/admin/settings', { key: 'ifsc_code', value: ifscCode, description: 'Bank IFSC Code' });

            // Save WhatsApp Number
            await api.put('/admin/settings', { key: 'whatsapp_number', value: whatsappNumber, description: 'Admin WhatsApp Number for Notifications' });

            // Save Premium Price
            await api.put('/admin/settings', { key: 'premium_subscription_price', value: premiumPrice, description: 'Monthly price for Premium Subscription' });
            await api.put('/admin/settings', { key: 'premium_subscription_original_price', value: premiumOriginalPrice, description: 'Original (Cutoff) Price for Premium Subscription' });

            // Save Company Details
            await api.put('/admin/settings', { key: 'company_name', value: companyName, description: 'Company Name for Invoices' });
            await api.put('/admin/settings', { key: 'company_gstin', value: companyGst, description: 'Company GSTIN' });
            await api.put('/admin/settings', { key: 'company_address', value: companyAddress, description: 'Company Office Address' });
            await api.put('/admin/settings', { key: 'company_phone', value: companyPhone, description: 'Company Support Phone' });
            await api.put('/admin/settings', { key: 'company_email', value: companyEmail, description: 'Company Support Email' });

            // Save Scheduling Details
            await api.put('/admin/settings', { key: 'work_start', value: workStart, description: 'Support Scheduling Start Time' });
            await api.put('/admin/settings', { key: 'work_end', value: workEnd, description: 'Support Scheduling End Time' });

            toast.success("Settings Saved Successfully! ⚙️");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">
                    Platform Settings<span className="text-red-600">.</span>
                </h1>
                <p className="text-zinc-400 mb-8">Manage your payment configurations and application defaults.</p>

                <form onSubmit={handleSave} className="space-y-6">

                    {/* Payment Settings Card */}
                    <div className="glass-panel bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 overflow-hidden">
                        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                                <FaQrcode className="text-blue-500" /> Payment & UPI Configuration
                            </h2>
                            <p className="text-sm text-zinc-400 mt-1">Configure the account where resellers will send payments.</p>
                        </div>

                        <div className="p-6 md:p-8 space-y-6">
                            {/* UPI ID Input */}
                            <div>
                                <label className="block text-sm font-bold text-zinc-400 mb-2">UPI ID (VPA)</label>
                                <input
                                    type="text"
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                    placeholder="e.g. business@upi"
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition font-medium"
                                />
                            </div>

                            {/* Meta Pixel ID Input */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-bold text-zinc-400">Meta Pixel ID</label>
                                    <span className="text-xs text-blue-400 cursor-pointer hover:underline" onClick={() => window.open('https://www.facebook.com/business/help/952192354843755', '_blank')}>Where do I find this?</span>
                                </div>
                                <input
                                    type="text"
                                    value={pixelId}
                                    onChange={(e) => setPixelId(e.target.value)}
                                    placeholder="e.g. 1234567890123456"
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition font-medium"
                                />
                                <p className="text-xs text-zinc-500 mt-2">Enter your Facebook Pixel ID to track conversions (Purchase, PageView, Registration).</p>
                            </div>

                            {/* QR Code Upload */}
                            <div>
                                <label className="block text-sm font-bold text-zinc-400 mb-2">UPI QR Code Image</label>

                                <div className="flex flex-col md:flex-row gap-6 items-start">
                                    {/* Preview */}
                                    <div className="w-48 h-48 bg-zinc-800 rounded-xl border-2 border-dashed border-zinc-700 flex items-center justify-center overflow-hidden relative group">
                                        {qrCodeUrl ? (
                                            <img src={qrCodeUrl} alt="QR Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-zinc-500 text-center p-4">
                                                <FaQrcode size={40} className="mx-auto mb-2 opacity-50" />
                                                <span className="text-xs">No QR Uploaded</span>
                                            </div>
                                        )}

                                        {/* Hover Actions */}
                                        {qrCodeUrl && (
                                            <button
                                                type="button"
                                                onClick={() => setQrCodeUrl('')}
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white font-bold"
                                            >
                                                <FaTrash /> Remove
                                            </button>
                                        )}
                                    </div>

                                    {/* Upload Controls */}
                                    <div className="flex-1">
                                        <div className="relative inline-block overflow-hidden mb-3">
                                            <button type="button" className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition shadow-lg shadow-red-900/20">
                                                <FaUpload /> Upload New QR Image
                                            </button>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleUpload(e, false)}
                                                className="absolute inset-0 opacity-0 cursor-pointer text-[0]"
                                            />
                                        </div>
                                        <div className="text-sm text-zinc-400 leading-relaxed">
                                            <p>Upload a clear image of your Payment QR Code.</p>
                                            <p>This will be displayed to Resellers during checkout.</p>
                                            <p className="mt-2 text-xs text-zinc-500">Supported formats: JPG, PNG. Max size: 5MB.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bank Transfer Details Settings */}
                    <div className="glass-panel bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 overflow-hidden">
                        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                                <FaGlobe className="text-blue-500" /> Bank Transfer Details
                            </h2>
                            <p className="text-sm text-zinc-400 mt-1">Configure bank details to display below the QR code.</p>
                        </div>

                        <div className="p-6 md:p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">Bank Name</label>
                                    <input
                                        type="text"
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        placeholder="e.g. HDFC Bank"
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">Account Holder Name</label>
                                    <input
                                        type="text"
                                        value={accountHolder}
                                        onChange={(e) => setAccountHolder(e.target.value)}
                                        placeholder="e.g. Audionix PTY LTD"
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">Account Number</label>
                                    <input
                                        type="text"
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value)}
                                        placeholder="e.g. 1234567890"
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">IFSC Code</label>
                                    <input
                                        type="text"
                                        value={ifscCode}
                                        onChange={(e) => setIfscCode(e.target.value)}
                                        placeholder="e.g. HDFC0001234"
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Company & Invoice Settings */}
                    <div className="glass-panel bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 overflow-hidden">
                        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                                <FaBuilding className="text-purple-500" /> Company Details (For Invoice)
                            </h2>
                            <p className="text-sm text-zinc-400 mt-1">These details will appear on the invoices generated for resellers.</p>
                        </div>
                        <div className="p-6 md:p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">Company Name</label>
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="e.g. Audionix Enterprises"
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">GSTIN</label>
                                    <input
                                        type="text"
                                        value={companyGst}
                                        onChange={(e) => setCompanyGst(e.target.value)}
                                        placeholder="e.g. 29ABCDE1234F1Z5"
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition font-medium"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">Office Address</label>
                                    <textarea
                                        value={companyAddress}
                                        onChange={(e) => setCompanyAddress(e.target.value)}
                                        placeholder="Full address required for invoicing..."
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition font-medium h-24 resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">Support/Office Phone</label>
                                    <input
                                        type="text"
                                        value={companyPhone}
                                        onChange={(e) => setCompanyPhone(e.target.value)}
                                        placeholder="e.g. +91 98765 43210"
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">Support Email</label>
                                    <input
                                        type="email"
                                        value={companyEmail}
                                        onChange={(e) => setCompanyEmail(e.target.value)}
                                        placeholder="e.g. support@audionix.com"
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="glass-panel bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 overflow-hidden">
                        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                                <FaGlobe className="text-green-500" /> Notification Settings
                            </h2>
                            <p className="text-sm text-zinc-400 mt-1">Configure where you want to receive alerts.</p>
                        </div>
                        <div className="p-6 md:p-8">
                            <div>
                                <label className="block text-sm font-bold text-zinc-400 mb-2">Admin WhatsApp Number (with Country Code)</label>
                                <input
                                    type="text"
                                    value={whatsappNumber}
                                    onChange={(e) => setWhatsappNumber(e.target.value)}
                                    placeholder="e.g. 919876543210"
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition font-medium"
                                />
                                <p className="text-xs text-zinc-500 mt-2">Used for redirection when Resellers request support meetings.</p>
                            </div>
                        </div>
                    </div>

                    {/* Scheduling Settings */}
                    <div className="glass-panel bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 overflow-hidden">
                        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                                <FaCalendarCheck className="text-blue-500" /> Appointment Settings
                            </h2>
                            <p className="text-sm text-zinc-400 mt-1">Configure your automated 9-5 scheduling system.</p>
                        </div>
                        <div className="p-6 md:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">Service Start Time</label>
                                    <input
                                        type="time"
                                        value={workStart}
                                        onChange={(e) => setWorkStart(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white outline-none focus:border-blue-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">Service End Time</label>
                                    <input
                                        type="time"
                                        value={workEnd}
                                        onChange={(e) => setWorkEnd(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white outline-none focus:border-blue-500 transition"
                                    />
                                </div>
                            </div>

                            <div className="p-6 bg-zinc-800/30 border border-zinc-800 rounded-2xl">
                                <p className="text-zinc-300 text-sm leading-relaxed">
                                    The system is now configured to automatically offer 30-minute support slots between **9:00 AM and 5:00 PM**. Resellers will book these directly, and you can manage them in the Support Meetings menu.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Subscription Settings */}
                    <div className="glass-panel bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 overflow-hidden">
                        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                                <FaGlobe className="text-yellow-500" /> Subscription Settings
                            </h2>
                            <p className="text-sm text-zinc-400 mt-1">Manage subscription pricing.</p>
                        </div>
                        <div className="p-6 md:p-8">
                            <div>
                                <label className="block text-sm font-bold text-zinc-400 mb-2">Premium Subscription Price (Monthly)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">₹</span>
                                    <input
                                        type="number"
                                        value={premiumPrice}
                                        onChange={(e) => setPremiumPrice(e.target.value)}
                                        placeholder="e.g. 499"
                                        className="w-full pl-8 pr-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/10 outline-none transition font-medium"
                                    />
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">This price will be displayed to users in the upgrade modal.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-zinc-400 mb-2">Original Price (Strike-through)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">₹</span>
                                    <input
                                        type="number"
                                        value={premiumOriginalPrice}
                                        onChange={(e) => setPremiumOriginalPrice(e.target.value)}
                                        placeholder="e.g. 999"
                                        className="w-full pl-8 pr-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition font-medium"
                                    />
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">Optional. Shows as a crossed-out price (e.g. <span className="line-through text-red-400">₹999</span> ₹499).</p>
                            </div>

                            {/* Premium QR Code Upload */}
                            <div className="pt-6 border-t border-zinc-800">
                                <label className="block text-sm font-bold text-zinc-400 mb-4">Premium Support/Payment QR</label>
                                <div className="flex flex-col md:flex-row gap-6 items-start bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/50">
                                    {/* Preview */}
                                    <div className="w-32 h-32 bg-zinc-800 rounded-xl border-2 border-dashed border-zinc-700 flex items-center justify-center overflow-hidden relative group shrink-0">
                                        {premiumQrUrl ? (
                                            <img src={premiumQrUrl} alt="Premium QR" className="w-full h-full object-cover" />
                                        ) : (
                                            <FaQrcode size={24} className="mx-auto opacity-50 text-zinc-500" />
                                        )}
                                        {premiumQrUrl && (
                                            <button
                                                type="button"
                                                onClick={() => setPremiumQrUrl('')}
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white font-bold text-xs backdrop-blur-sm"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="relative inline-block overflow-hidden mb-3">
                                            <button type="button" className="px-5 py-2.5 bg-zinc-800 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-zinc-700 transition border border-zinc-700 text-sm shadow-sm group-hover:border-zinc-500">
                                                <FaUpload className="text-zinc-400" /> Upload Premium QR
                                            </button>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleUpload(e, true)}
                                                className="absolute inset-0 opacity-0 cursor-pointer text-[0]"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-zinc-300 font-medium">Specific QR for Premium Payments</p>
                                            <p className="text-xs text-zinc-500 leading-relaxed">This QR code will only be shown in the Premium Upgrade popup. Use this to separate subscription revenue from regular order payments.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Settings (Password Change) */}
                    <div className="glass-panel bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 overflow-hidden mb-8">
                        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                                <FaLock className="text-red-500" /> Security Settings
                            </h2>
                            <p className="text-sm text-zinc-400 mt-1">Update your admin password securely.</p>
                        </div>
                        <div className="p-6 md:p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-zinc-400 mb-2">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition font-medium"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition font-medium"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={handlePasswordUpdate}
                                    disabled={passwordLoading}
                                    className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition ${passwordLoading ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700'}`}
                                >
                                    {passwordLoading ? 'Updating...' : 'Update Password Only'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2 shadow-xl hover:shadow-2xl transition transform hover:-translate-y-1 ${loading ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'
                                }`}
                        >
                            <FaSave /> {loading ? 'Saving Changes...' : 'Save All Settings'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default AdminSettings;
