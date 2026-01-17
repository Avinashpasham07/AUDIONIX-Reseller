import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FaCheck, FaTimes, FaExternalLinkAlt, FaImage, FaHistory, FaClock, FaList } from 'react-icons/fa';

const AdminSubscriptionRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedHistory, setSelectedHistory] = useState(null); // User object for modal
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const query = activeTab === 'pending' ? '?status=pending' : '';
            const { data } = await api.get(`/admin/subscription-requests${query}`);

            // Filter out 'pending' from history view to show only processed ones
            const filtered = activeTab === 'history'
                ? data.filter(r => r.subscriptionRequest?.status !== 'pending')
                : data;

            setRequests(filtered);
        } catch (error) {
            toast.error("Failed to fetch requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [activeTab]);

    const handleAction = async (userId, status) => {
        if (!window.confirm(`Are you sure you want to ${status} this request?`)) return;

        try {
            await api.put(`/admin/subscription-requests/${userId}`, { status });
            toast.success(`Request ${status} successfully`);
            fetchRequests();
        } catch (error) {
            toast.error("Action failed");
        }
    };

    if (loading) return <MainLayout><div className="p-8 text-center">Loading requests...</div></MainLayout>;

    return (
        <MainLayout>
            <div className="mb-6 p-4 md:p-0 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>

                    <h1 className="text-4xl mb-10 md:text-6xl font-black text-white tracking-tighter">
                        Premium Requests<span className="text-red-600">.</span>
                    </h1>

                    <p className="text-zinc-400 text-sm">Manage incoming subscription upgrades.</p>
                </div>
                <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center gap-2 ${activeTab === 'pending' ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-zinc-400 hover:text-white'}`}
                    >
                        <FaClock /> Pending
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center gap-2 ${activeTab === 'history' ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-zinc-400 hover:text-white'}`}
                    >
                        <FaHistory /> History
                    </button>
                </div>
            </div>

            {requests.length === 0 ? (
                <div className="glass-panel bg-zinc-900 p-8 rounded-xl border border-zinc-800 text-center text-zinc-500">
                    No {activeTab} requests found.
                </div>
            ) : (
                <div className="glass-panel bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-900/50 border-b border-zinc-800 text-zinc-400 font-medium">
                                <tr>
                                    <th className="p-4">User</th>
                                    <th className="p-4">Mobile</th>
                                    <th className="p-4">Transaction ID</th>
                                    <th className="p-4">Proof</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Expiry</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {requests.map((user) => (
                                    <tr key={user._id} className="hover:bg-zinc-800/50 transition">
                                        <td className="p-4 font-medium text-white">
                                            <div>{user.name}</div>
                                            <div className="text-xs text-zinc-500 font-normal">{user.email}</div>
                                        </td>
                                        <td className="p-4 text-zinc-400">{user.mobileNumber}</td>
                                        <td className="p-4 font-mono text-zinc-500">{user.subscriptionRequest?.transactionId || 'N/A'}</td>
                                        <td className="p-4">
                                            {user.subscriptionRequest?.screenshotUrl ? (
                                                <button
                                                    onClick={() => setSelectedImage(user.subscriptionRequest.screenshotUrl)}
                                                    className="flex items-center gap-2 text-blue-400 hover:text-white hover:bg-blue-600 bg-blue-900/20 px-3 py-1 rounded-full text-xs font-bold transition"
                                                >
                                                    <FaImage /> View
                                                </button>
                                            ) : (
                                                <span className="text-zinc-600 italic">No Image</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${user.subscriptionRequest?.status === 'approved' ? 'bg-green-900/20 text-green-400 border border-green-900/30' :
                                                user.subscriptionRequest?.status === 'rejected' ? 'bg-red-900/20 text-red-500 border border-red-900/30' :
                                                    'bg-yellow-900/20 text-yellow-500 border border-yellow-900/30'
                                                }`}>
                                                {user.subscriptionRequest?.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-zinc-500">
                                            {user.subscriptionExpiry ? new Date(user.subscriptionExpiry).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* History Button (Always/Visible) */}
                                                <button
                                                    onClick={() => setSelectedHistory(user)}
                                                    className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition"
                                                    title="View Full History"
                                                >
                                                    <FaList />
                                                </button>

                                                {activeTab === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(user._id, 'approved')}
                                                            className="p-2 bg-green-900/20 text-green-500 border border-green-900/50 rounded-lg hover:bg-green-900/40 transition"
                                                            title="Approve"
                                                        >
                                                            <FaCheck />
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(user._id, 'rejected')}
                                                            className="p-2 bg-red-900/20 text-red-500 border border-red-900/50 rounded-lg hover:bg-red-900/40 transition"
                                                            title="Reject"
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {selectedHistory && (
                <div className="fixed inset-0 bg-black/90 z-50 flex justify-center items-center p-4 backdrop-blur-sm" onClick={() => setSelectedHistory(null)}>
                    <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col border border-zinc-800" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                            <div>
                                <h3 className="text-xl font-bold text-white">{selectedHistory.name}'s History</h3>
                                <p className="text-sm text-zinc-400">Past subscription requests</p>
                            </div>
                            <button onClick={() => setSelectedHistory(null)} className="text-zinc-500 hover:text-white"><FaTimes size={20} /></button>
                        </div>

                        <div className="overflow-y-auto p-0">
                            {(!selectedHistory.subscriptionHistory || selectedHistory.subscriptionHistory.length === 0) ? (
                                <div className="p-10 text-center text-zinc-500">No history found for this user.</div>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-zinc-900/50 text-zinc-400 font-medium sticky top-0 border-b border-zinc-800">
                                        <tr>
                                            <th className="p-4 pl-6">Processed At</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Transaction</th>
                                            <th className="p-4">Proof</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800">
                                        {selectedHistory.subscriptionHistory.slice().reverse().map((record, idx) => (
                                            <tr key={idx} className="hover:bg-zinc-800/30 text-zinc-300">
                                                <td className="p-4 pl-6 text-zinc-400">
                                                    {new Date(record.processedAt).toLocaleDateString()}
                                                    <div className="text-xs text-zinc-500">{new Date(record.processedAt).toLocaleTimeString()}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${record.status === 'approved' ? 'bg-green-900/20 text-green-400 border border-green-900/30' :
                                                        record.status === 'rejected' ? 'bg-red-900/20 text-red-500 border border-red-900/30' : 'bg-zinc-800 text-zinc-400'
                                                        }`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-mono text-xs text-zinc-500">{record.transactionId || '-'}</td>
                                                <td className="p-4">
                                                    {record.screenshotUrl && (
                                                        <button
                                                            onClick={() => setSelectedImage(record.screenshotUrl)}
                                                            className="text-blue-400 hover:underline text-xs font-bold"
                                                        >
                                                            View
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Image Modal */}
            {selectedImage && (
                <div className="fixed inset-0 bg-black/90 z-50 flex justify-center items-center p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <button className="absolute -top-10 right-0 text-white hover:text-zinc-300">
                            <FaTimes size={24} />
                        </button>
                        <img src={selectedImage} alt="Payment Proof" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default AdminSubscriptionRequests;
