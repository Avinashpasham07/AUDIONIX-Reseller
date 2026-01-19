import { useState, useEffect } from 'react';
import api from '../services/api';
import { FaCalendarCheck, FaClock, FaCommentDots, FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';

const AdminMeetings = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all'); // all, pending, scheduled, completed, cancelled
    const [filterDate, setFilterDate] = useState('all'); // all, today, yesterday, custom
    const [customDate, setCustomDate] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const { data } = await api.get('/meetings/admin');
            setRequests(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load meetings');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.put(`/meetings/${id}`, { status });
            toast.success('Status Updated');
            fetchRequests();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update status');
        }
    };

    const filteredRequests = requests.filter(req => {
        // Status Filter
        if (filterStatus !== 'all' && req.status !== filterStatus) return false;

        // Date Filter
        const reqDate = new Date(req.preferredDate).toDateString();
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (filterDate === 'today' && reqDate !== today) return false;
        if (filterDate === 'yesterday' && reqDate !== yesterday) return false;
        if (filterDate === 'custom' && customDate) {
            if (reqDate !== new Date(customDate).toDateString()) return false;
        }

        return true;
    }).sort((a, b) => new Date(b.preferredDate) - new Date(a.preferredDate));

    if (loading) {
        return <div className="flex justify-center items-center h-screen text-zinc-500">Loading requests...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight">Support Agenda<span className="text-red-600">.</span></h1>
                        <p className="text-zinc-500 font-medium">Clear overview of your reseller support schedule.</p>
                    </div>

                    {/* Minimalist Stats */}
                    <div className="flex gap-8 border-l border-zinc-800 pl-8">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest mb-1">Today</p>
                            <p className="text-2xl font-black text-white">
                                {requests.filter(r => new Date(r.preferredDate).toDateString() === new Date().toDateString() && r.status === 'scheduled').length}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest mb-1">Pending</p>
                            <p className="text-2xl font-black text-yellow-500">
                                {requests.filter(r => r.status === 'pending').length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-4 mb-8 bg-black/40 p-4 rounded-2xl border border-zinc-800/50 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Status</span>
                        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800/50">
                            {['all', 'pending', 'scheduled', 'completed'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setFilterStatus(s)}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filterStatus === s ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-zinc-600 hover:text-zinc-400'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-6 w-[1px] bg-zinc-800 hidden md:block"></div>

                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Timeframe</span>
                        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800/50">
                            {['all', 'today', 'yesterday', 'custom'].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setFilterDate(d)}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filterDate === d ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-zinc-600 hover:text-zinc-400'}`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filterDate === 'custom' && (
                        <input
                            type="date"
                            value={customDate}
                            onChange={(e) => setCustomDate(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 text-white rounded-xl px-3 py-1.5 text-[10px] font-black outline-none focus:border-red-600 transition-colors"
                        />
                    )}

                    <div className="ml-auto text-zinc-600 text-[10px] font-black uppercase tracking-tighter mr-2">
                        {filteredRequests.length} Scheduled Slots
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="space-y-4 mb-20">
                    {filteredRequests.length === 0 ? (
                        <div className="glass-panel text-center py-32 rounded-[2rem] border-zinc-800/50">
                            <div className="w-20 h-20 bg-zinc-800/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-700/30">
                                <FaCalendarCheck size={32} className="text-zinc-700" />
                            </div>
                            <h3 className="text-white font-black text-2xl tracking-tight">No Agenda Found</h3>
                            <p className="text-zinc-500 text-sm mt-2 max-w-xs mx-auto">Your schedule looks clear for these filters. Use the top bar to explore other dates.</p>
                        </div>
                    ) : (
                        filteredRequests.map(req => {
                            const mDate = new Date(req.preferredDate);
                            const isToday = mDate.toDateString() === new Date().toDateString();

                            return (
                                <div
                                    key={req._id}
                                    className={`glass-panel flex flex-col lg:flex-row items-center p-6 lg:p-8 gap-8 transition-all duration-300 rounded-[2rem] border-2 group
                                        ${isToday ? 'bg-red-600/[0.03] border-red-600' : 'bg-zinc-900/30 border-red-600 md:border-zinc-800/50'}
                                        hover:border-red-600 hover:shadow-[0_0_30px_rgba(220,38,38,0.15)] hover:bg-zinc-900/50`}
                                >

                                    {/* Date/Time Pillar */}
                                    <div className="w-full lg:w-36 flex lg:flex-col items-center justify-center text-center gap-2 border-b lg:border-b-0 lg:border-r border-zinc-800/50 pb-6 lg:pb-0 lg:pr-8">
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isToday ? 'bg-red-600 text-white animate-pulse' : 'bg-zinc-800 text-zinc-500'}`}>
                                            {isToday ? 'Starting Soon' : mDate.toLocaleDateString('en-IN', { weekday: 'short' })}
                                        </div>
                                        <p className="text-2xl font-black text-white group-hover:text-red-500 transition-colors uppercase tracking-tight">
                                            {mDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{mDate.toLocaleDateString([], { day: 'numeric', month: 'short' })}</p>
                                    </div>

                                    {/* Main Details */}
                                    <div className="flex-1 text-center lg:text-left">
                                        <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
                                            <span className={`w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor] ${req.status === 'pending' ? 'text-yellow-500 bg-yellow-500 animate-pulse' :
                                                req.status === 'scheduled' ? 'text-blue-500 bg-blue-500' :
                                                    req.status === 'completed' ? 'text-green-500 bg-green-500' : 'text-zinc-600 bg-zinc-600'
                                                }`} />
                                            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{req.status} Request</span>
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter mb-2 group-hover:translate-x-1 transition-transform">{req.topic}</h3>
                                        <p className="text-zinc-400 text-sm italic font-medium max-w-lg leading-relaxed">
                                            <FaCommentDots className="inline mr-2 text-zinc-600" />
                                            {req.description}
                                        </p>
                                    </div>

                                    {/* Reseller Quick Profile */}
                                    <div className="flex items-center gap-4 bg-black/40 px-6 py-4 rounded-2xl border border-zinc-800/50 min-w-[300px] w-full lg:w-auto hover:bg-black/60 transition-colors group/card">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center font-black text-white text-lg border border-zinc-700/50 shadow-inner">
                                            {req.reseller?.name?.charAt(0) || req.guestName?.charAt(0) || 'G'}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-base font-black text-white leading-none mb-1.5">{req.reseller?.name || req.guestName || 'Guest User'}</p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_5px_rgba(220,38,38,0.5)]" />
                                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{req.reseller?.businessName || 'UNVERIFIED ENTITY'}</p>
                                            </div>
                                        </div>
                                        <a
                                            href={`https://wa.me/${req.reseller?.mobileNumber || req.guestPhone}?text=Hi ${req.reseller?.name || req.guestName}, regarding your ${req.topic} meeting at ${mDate.toLocaleTimeString()}...`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-12 h-12 bg-green-600/10 text-green-500 border border-green-500/20 rounded-2xl flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-lg active:scale-90"
                                            title="Connect via WhatsApp"
                                        >
                                            <FaWhatsapp size={22} />
                                        </a>
                                    </div>

                                    {/* Row Actions */}
                                    <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-40 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-zinc-800/50 lg:pl-8">
                                        {req.status === 'pending' && (
                                            <button
                                                onClick={() => handleStatusUpdate(req._id, 'scheduled')}
                                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition shadow-lg shadow-blue-900/20 active:scale-95"
                                            >
                                                Confirm
                                            </button>
                                        )}
                                        {req.status === 'scheduled' && (
                                            <button
                                                onClick={() => handleStatusUpdate(req._id, 'completed')}
                                                className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition shadow-lg shadow-green-900/20 active:scale-95"
                                            >
                                                Finalize
                                            </button>
                                        )}
                                        {(req.status === 'pending' || req.status === 'scheduled') && (
                                            <button
                                                onClick={() => handleStatusUpdate(req._id, 'cancelled')}
                                                className="flex-1 py-3 bg-zinc-800/50 border border-zinc-700/50 hover:bg-red-600/10 hover:text-red-500 hover:border-red-600/30 text-zinc-500 text-xs font-black uppercase tracking-widest rounded-xl transition active:scale-95"
                                            >
                                                Drop
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <p className="text-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-10 opacity-30">
                    &copy; Audionix Internal Support System v2.0
                </p>
            </div>
        </div>
    );
};

export default AdminMeetings;
