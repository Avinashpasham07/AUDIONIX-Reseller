import React, { useState } from 'react';
import { FaCheck, FaCrown, FaTimes, FaQrcode, FaUpload, FaArrowLeft } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const PlansModal = ({ onClose, user, onUpdateUser }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState('plans'); // 'plans' | 'payment'
    const [loading, setLoading] = useState(false);
    const [premiumPrice, setPremiumPrice] = useState('499'); // Default
    const [premiumOriginalPrice, setPremiumOriginalPrice] = useState(null);
    const [premiumQrUrl, setPremiumQrUrl] = useState('');
    const [paymentData, setPaymentData] = useState({
        transactionId: '',
        screenshotUrl: ''
    });

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/admin/settings');
                if (data.premium_subscription_price) {
                    setPremiumPrice(data.premium_subscription_price);
                }
                if (data.premium_subscription_original_price) {
                    setPremiumOriginalPrice(data.premium_subscription_original_price);
                }
                if (data.premium_subscription_qr_url) {
                    setPremiumQrUrl(data.premium_subscription_qr_url);
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            }
        };
        fetchSettings();
    }, []);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const loadingToast = toast.loading('Uploading screenshot...');
            const { data } = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.dismiss(loadingToast);
            setPaymentData(prev => ({ ...prev, screenshotUrl: data.fullUrl }));
            toast.success("Screenshot Uploaded! Now Submit.", { duration: 3000 });
        } catch (err) {
            console.error(err);
            toast.error("Upload Failed");
        }
    };

    const handleSubmitRequest = async () => {
        if (!paymentData.transactionId || !paymentData.screenshotUrl) {
            return toast.error("Please provide Transaction ID and Screenshot");
        }

        setLoading(true);
        try {
            await api.post('/auth/upgrade-request', paymentData);
            toast.success("Request Submitted! Admin will approve shortly. 🕒");
            if (onUpdateUser) {

            }
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Request failed");
        } finally {
            setLoading(false);
        }
    };

    if (step === 'payment') {
        return (
            <div
                className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm"
                onClick={onClose}
            >
                <div
                    className="bg-white rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={() => setStep('plans')} className="absolute top-4 left-4 text-zinc-500 hover:text-zinc-900 z-10 p-2 bg-white/50 rounded-full">
                        <FaArrowLeft />
                    </button>
                    <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 z-10 p-2 bg-white/50 rounded-full">
                        <FaTimes size={20} />
                    </button>

                    <div className="p-5 pb-4 md:p-8 md:pb-4 text-center">
                        <h3 className="text-xl font-bold text-zinc-900 mb-1">Scan to Pay</h3>
                        <p className="text-zinc-500 text-sm">₹{premiumPrice} for 1 Month Premium</p>
                    </div>

                    <div className="flex justify-center mb-6">
                        <div className="bg-zinc-100 p-4 rounded-xl border-2 border-dashed border-zinc-300">
                            {/* Dynamic QR or Fallback */}
                            <img
                                src={premiumQrUrl || "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg"}
                                alt="Payment QR"
                                className="w-48 h-48 object-contain"
                            />
                            <p className="text-xs text-center mt-2 font-mono text-zinc-400">upi@bankname (Demo)</p>
                        </div>
                    </div>

                    <div className="px-5 pb-5 md:px-8 md:pb-8 space-y-4">
                        {/* Transaction ID */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-600 mb-1">Transaction Ref ID</label>
                            <input
                                type="text"
                                value={paymentData.transactionId}
                                onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:border-yellow-500 font-mono text-sm"
                                placeholder="e.g. 1234567890"
                            />
                        </div>

                        {/* Screenshot Upload */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-600 mb-1">Payment Screenshot</label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full z-10"
                                />
                                <div className={`w-full px-4 py-3 rounded-xl border border-zinc-200 flex items-center justify-between text-sm ${paymentData.screenshotUrl ? 'bg-green-50 border-green-200 text-green-700' : 'bg-zinc-50 text-zinc-400'}`}>
                                    <span>{paymentData.screenshotUrl ? 'Screenshot Attached ✅' : 'Tap to Upload Screenshot'}</span>
                                    <FaUpload />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmitRequest}
                            disabled={loading}
                            className={`w-full py-4 rounded-xl bg-gradient-to-r from-zinc-900 to-black text-white font-bold text-lg shadow-lg shadow-zinc-200 flex items-center justify-center gap-2 mt-4 ${loading ? 'opacity-75' : 'hover:scale-[1.02] transition'}`}
                        >
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl md:rounded-3xl w-[90%] md:w-full max-w-4xl relative shadow-2xl flex flex-col md:flex-row max-h-[80vh] md:max-h-none overflow-y-auto md:overflow-hidden scrollbar-hide"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 md:top-4 md:right-4 text-zinc-400 hover:text-zinc-600 z-10 p-1.5 md:p-2 bg-white/50 rounded-full"
                >
                    <FaTimes size={16} className="md:w-5 md:h-5" />
                </button>

                {/* Free Plan Side */}
                <div className="flex-1 p-4 md:p-8 bg-zinc-50 flex flex-col justify-center border-b md:border-b-0 md:border-r border-zinc-100">
                    <div className="text-center mb-3 md:mb-6">
                        <h3 className="text-sm md:text-xl font-bold text-zinc-500 uppercase tracking-widest mb-1 md:mb-2">Basic</h3>
                        <div className="text-2xl md:text-4xl font-extrabold text-zinc-900">Free</div>
                        <p className="text-xs md:text-base text-zinc-500 mt-1 md:mt-2">Get started with dropshipping</p>
                    </div>

                    <ul className="space-y-2 md:space-y-4 mb-4 md:mb-8 text-sm md:text-base">
                        <li className="flex items-center gap-2 md:gap-3 text-zinc-600">
                            <FaCheck className="text-green-500 text-xs md:text-base" /> Standard Margins
                        </li>
                        <li className="flex items-center gap-2 md:gap-3 text-zinc-600">
                            <FaCheck className="text-green-500 text-xs md:text-base" /> Basic Support
                        </li>
                        <li className="flex items-center gap-2 md:gap-3 text-zinc-600">
                            <FaCheck className="text-green-500 text-xs md:text-base" /> Access to all products
                        </li>
                    </ul>

                    <div className="mt-auto">
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 md:py-3 rounded-xl border border-zinc-200 font-bold text-sm md:text-base text-zinc-500 hover:bg-zinc-100 transition"
                        >
                            Continue with Free
                        </button>
                    </div>
                </div>

                {/* Premium Plan Side */}
                <div className="flex-1 p-4 md:p-8 bg-gradient-to-br from-zinc-900 to-black text-white relative flex flex-col justify-center overflow-hidden">
                    <div className="absolute top-0 right-0 p-20 md:p-32 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                    <div className="text-center mb-3 md:mb-6 relative">
                        <div className="inline-flex items-center gap-1.5 md:gap-2 bg-yellow-400/20 text-yellow-300 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold mb-2 md:mb-3 border border-yellow-400/30">
                            <FaCrown size={10} className="md:w-3 md:h-3" /> RECOMMENDED
                        </div>
                        <h3 className="text-sm md:text-xl font-bold text-yellow-400 uppercase tracking-widest mb-1 md:mb-2">Premium</h3>
                        <div className="text-2xl md:text-4xl font-extrabold text-white">
                            {premiumOriginalPrice && Number(premiumOriginalPrice) > Number(premiumPrice) && (
                                <span className="text-lg md:text-2xl text-zinc-500 line-through mr-1.5 md:mr-2 font-bold">₹{premiumOriginalPrice}</span>
                            )}
                            ₹{premiumPrice}<span className="text-sm md:text-lg text-zinc-400 font-normal">/mo</span>
                        </div>
                        <p className="text-xs md:text-base text-zinc-400 mt-1 md:mt-2">Maximize your profits</p>
                    </div>

                    <ul className="space-y-2 md:space-y-4 mb-4 md:mb-8 relative text-sm md:text-base">
                        <li className="flex items-center gap-2 md:gap-3 text-zinc-100">
                            <div className="p-1 bg-yellow-400 rounded-full text-black"><FaCheck size={8} className="md:w-2.5 md:h-2.5" /></div>
                            <span className="font-bold">Lowest Prices</span> {/* Shortened for mobile */}
                        </li>
                        <li className="flex items-center gap-2 md:gap-3 text-zinc-100">
                            <div className="p-1 bg-yellow-400 rounded-full text-black"><FaCheck size={8} className="md:w-2.5 md:h-2.5" /></div>
                            <span>Priority Shipping</span>
                        </li>
                        <li className="flex items-center gap-2 md:gap-3 text-zinc-100">
                            <div className="p-1 bg-yellow-400 rounded-full text-black"><FaCheck size={8} className="md:w-2.5 md:h-2.5" /></div>
                            <span>Dedicated Account Manager</span>
                        </li>
                        <li className="flex items-center gap-2 md:gap-3 text-zinc-100">
                            <div className="p-1 bg-yellow-400 rounded-full text-black"><FaCheck size={8} className="md:w-2.5 md:h-2.5" /></div>
                            <span>Premium Badge</span>
                        </li>
                    </ul>

                    <div className="mt-auto relative">
                        {user?.subscriptionRequest?.status === 'pending' ? (
                            <button
                                disabled
                                className="w-full py-2.5 md:py-3 rounded-xl bg-zinc-800 text-yellow-500 font-bold border border-yellow-500/50 opacity-100 flex items-center justify-center gap-2 text-sm md:text-base"
                            >
                                <FaCheck /> Request Pending...
                            </button>
                        ) : (
                            <button
                                onClick={() => setStep('payment')}
                                className="w-full py-2.5 md:py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-extrabold hover:to-yellow-500 transition shadow-lg shadow-yellow-400/20 flex items-center justify-center gap-2 group text-sm md:text-base"
                            >
                                <FaCrown className="group-hover:scale-110 transition" /> Upgrade Now
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlansModal;
