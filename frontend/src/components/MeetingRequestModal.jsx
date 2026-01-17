import { useState, useContext, useEffect } from 'react';
import { FaTimes, FaWhatsapp, FaCalendarAlt, FaClock } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../services/api';
import AuthContext from '../context/AuthContext';
import { usePixel } from '../context/PixelContext';
import TimeSlotPicker from './TimeSlotPicker';

const MeetingRequestModal = ({ onClose }) => {
    const { user } = useContext(AuthContext);
    const { trackEvent } = usePixel();
    const [topic, setTopic] = useState('General Support');
    const [description, setDescription] = useState('');
    // Use local date for default value to avoid UTC lag (e.g. showing yesterday late at night)
    const [preferredDate, setPreferredDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [slotsLoading, setSlotsLoading] = useState(false);

    useEffect(() => {
        fetchSlots(preferredDate);
    }, []);

    const fetchSlots = async (date) => {
        if (!date) return;
        setSlotsLoading(true);
        try {
            const { data } = await api.get(`/meetings/slots/${date}`);
            setAvailableSlots(data);
            setSelectedSlot(null);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to fetch free slots');
            setAvailableSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    };

    // Guest Fields
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');

    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [bookingDetails, setBookingDetails] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data } = await api.post('/meetings/request', {
                topic,
                description,
                preferredDate,
                selectedSlot, // Added for automated booking
                guestName: !user ? guestName : undefined,
                guestPhone: !user ? guestPhone : undefined
            });

            toast.success('Meeting Request Sent!');

            // Track Conversion (Lead)
            trackEvent('Lead', {
                value: 0,
                currency: 'INR',
                content_name: topic,
                status: 'scheduled'
            });

            setBookingDetails({ ...data, selectedSlot });
            setSubmitted(true);

            // Only auto-open WhatsApp for MANUAL requests (no slot)
            if (!selectedSlot && data.whatsappNumber) {
                const name = user?.name || guestName || 'Visitor';
                const message = `Hi Admin, I am *${name}*. I requested a meeting regarding *${topic}*.\n\nDescription: ${description}\nPreferred Date: ${preferredDate || 'Flexible'}`;
                const url = `https://wa.me/${data.whatsappNumber}?text=${encodeURIComponent(message)}`;
                window.open(url, '_blank');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn"
                onClick={onClose}
            >
                <div
                    className="bg-zinc-900 border border-zinc-700 p-8 rounded-3xl w-full max-w-md relative shadow-2xl text-center"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-20 h-20 bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">

                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {bookingDetails?.selectedSlot ? 'Meeting Confirmed!' : 'Request Sent!'}
                    </h2>
                    <p className="text-zinc-400 mb-6">
                        {bookingDetails?.selectedSlot
                            ? `Your meeting is scheduled for ${new Date(bookingDetails.selectedSlot.start).toLocaleString()}.`
                            : 'Admin has been notified of your support request.'}
                    </p>

                    <div className="space-y-3">
                        {bookingDetails?.whatsappNumber && (
                            <a
                                href={`https://wa.me/${bookingDetails.whatsappNumber}`}
                                target="_blank"
                                rel="noreferrer"
                                className="block w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
                            >
                                <FaWhatsapp /> Chat on WhatsApp
                            </a>
                        )}
                        <button
                            onClick={onClose}
                            className="block w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="bg-zinc-900 border border-zinc-700 p-6 md:p-8 rounded-3xl w-full max-w-lg relative shadow-2xl overflow-y-auto max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white transition"
                >
                    <FaTimes size={24} />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-red-600/20 text-red-500 rounded-2xl flex items-center justify-center shadow-inner">
                        <FaCalendarAlt size={24} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tighter">Book Support<span className="text-red-600">.</span></h2>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Instant 9-5 Appointment System</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* STEP 1: IDENTITY & TOPIC */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-black flex items-center justify-center border border-zinc-700">01</span>
                            <p className="text-sm font-bold text-white uppercase tracking-tighter">Describe your Query</p>
                        </div>

                        {!user && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    required
                                    type="text"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    placeholder="Full Name"
                                    className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-xl px-4 py-3 outline-none focus:border-red-500 transition text-sm"
                                />
                                <input
                                    required
                                    type="tel"
                                    value={guestPhone}
                                    onChange={(e) => setGuestPhone(e.target.value)}
                                    placeholder="Mobile (+91)"
                                    className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-xl px-4 py-3 outline-none focus:border-red-500 transition text-sm"
                                />
                            </div>
                        )}

                        <div className="space-y-3">
                            <select
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-xl px-4 py-3 outline-none focus:border-red-500 transition text-sm font-medium"
                            >
                                <option>General Support</option>
                                <option>Order Issue</option>
                                <option>Product Inquiry</option>
                                <option>Payment & Earnings</option>
                                <option>Technical Issue</option>
                                <option>Other</option>
                            </select>

                            <textarea
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows="3"
                                placeholder="Tell us what we can help you with today..."
                                className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-xl px-4 py-3 outline-none focus:border-red-500 transition resize-none text-sm leading-relaxed"
                            ></textarea>
                        </div>
                    </div>

                    {/* STEP 2: TIME SELECTION */}
                    <div className="space-y-4 bg-zinc-950/30 p-4 md:p-6 rounded-3xl border border-zinc-800/50 shadow-inner">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-6 h-6 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-red-900/20">02</span>
                            <p className="text-sm font-bold text-white uppercase tracking-tighter">Pick your Slot</p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="relative">

                                <input
                                    type="date"
                                    value={preferredDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => {
                                        setPreferredDate(e.target.value);
                                        fetchSlots(e.target.value);
                                    }}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl pl-12 pr-4 py-3 outline-none focus:border-red-500 transition text-sm font-bold"
                                />
                            </div>

                            <div className="min-h-[140px]">
                                <TimeSlotPicker
                                    slots={availableSlots}
                                    selectedSlot={selectedSlot}
                                    onSelect={setSelectedSlot}
                                    loading={slotsLoading}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <button
                            type="submit"
                            disabled={loading || (preferredDate && !selectedSlot)}
                            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${loading || (preferredDate && !selectedSlot)
                                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700'
                                : 'bg-white text-black hover:bg-zinc-200 shadow-2xl active:scale-95'
                                }`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-zinc-400 border-t-black rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    {selectedSlot ? 'Confirm My Appointment' : 'Submit Support Request'}
                                </>
                            )}
                        </button>

                        <div className="flex items-center justify-center gap-2 opacity-50">
                            <div className="h-[1px] w-8 bg-zinc-700"></div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Instant 1-on-1 Support</p>
                            <div className="h-[1px] w-8 bg-zinc-700"></div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MeetingRequestModal;
