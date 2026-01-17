import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import MainLayout from '../components/MainLayout';
import { FaCheck, FaTimes, FaCrown, FaTrash, FaSearch, FaKey } from 'react-icons/fa';

const AdminResellers = () => {
    const [resellers, setResellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'all' | 'inactive'
    const [searchTerm, setSearchTerm] = useState('');

    const fetchResellers = async () => {
        setLoading(true);
        try {
            let data;
            if (activeTab === 'inactive') {
                const response = await api.get('/admin/inactive-users');
                data = response.data;
            } else {
                const query = activeTab === 'pending' ? '?status=pending' : '?status=approved';
                const response = await api.get(`/admin/resellers${query}`);
                data = response.data;
            }
            setResellers(data);
        } catch (error) {
            console.error("Failed to fetch resellers", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResellers();
    }, [activeTab]);

    const handleStatusUpdate = async (id, status) => {
        if (!window.confirm(`Are you sure you want to ${status} this reseller account?`)) return;
        try {
            await api.put(`/admin/resellers/${id}/status`, { status });
            toast.success(`Reseller ${status} successfully!`);
            fetchResellers();
        } catch (error) {
            toast.error('Action failed');
        }
    };

    const handleRevokeUser = async (id, name) => {
        if (!window.confirm(`Are you sure you want to REVOKE access for ${name}? User will be marked as inactive.`)) return;
        try {
            await api.put(`/admin/revoke-user/${id}`);
            toast.success(`User ${name} revoked successfully.`);
            fetchResellers();
        } catch (error) {
            toast.error("Revocation failed: " + (error.response?.data?.message || "Server Error"));
        }
    };

    const handleResetPassword = async (id, name) => {
        const newPassword = window.prompt(`Enter new password for ${name}:`);
        if (!newPassword) return; // Cancelled

        try {
            await api.put(`/users/${id}/password`, { password: newPassword });
            toast.success('Password updated successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update password');
        }
    };

    const handleDowngrade = async (id) => {
        if (!window.confirm("Are you sure you want to downgrade this user to FREE plan?")) return;
        try {
            await api.put(`/admin/subscription-revoke/${id}`);
            toast.success("User downgraded to Free successfully");
            fetchResellers();
        } catch (error) {
            toast.error("Downgrade failed");
        }
    };

    const filteredResellers = resellers.filter(reseller => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            reseller.name?.toLowerCase().includes(term) ||
            reseller.email?.toLowerCase().includes(term) ||
            reseller.mobileNumber?.includes(term) ||
            reseller.businessName?.toLowerCase().includes(term)
        );
    });

    return (
        <MainLayout>
            <div className="mb-6 p-4 md:p-0 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">
                        Reseller Management<span className="text-red-600">.</span>
                    </h1>
                    <p className="text-zinc-400">Manage reseller logic, subscriptions, and inactivity.</p>
                </div>
                <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'pending' ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'all' ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setActiveTab('inactive')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'inactive' ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Inactive
                    </button>
                </div>
            </div>

            {/* SEARCH BAR */}
            <div className="mb-6 px-4 md:px-0">
                <div className="relative w-full md:w-[400px]">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search by Name, Email, Business..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full py-3 pl-10 pr-4 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-zinc-500"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-zinc-500 text-center py-10">Loading...</div>
            ) : filteredResellers.length === 0 ? (
                <div className="text-zinc-500 text-center py-10">No resellers found.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-0">
                    {filteredResellers.map((reseller) => (
                        <div key={reseller._id} className="glass-panel bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-800 flex flex-col relative overflow-hidden">
                            {reseller.subscriptionPlan === 'paid' && (
                                <div className="absolute top-0 right-0 bg-yellow-900/50 text-yellow-400 border-l border-b border-yellow-900/80 text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                                    <FaCrown /> PREMIUM
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-4 pr-16">
                                <h3 className="m-0 text-xl font-bold text-white line-clamp-1">{reseller.businessName || 'No Business Name'}</h3>
                            </div>

                            <div className="text-sm text-zinc-400 mb-6 space-y-2 flex-1">
                                <p><span className="font-semibold text-zinc-300">Name:</span> {reseller.name}</p>
                                <p><span className="font-semibold text-zinc-300">Email:</span> {reseller.email}</p>
                                <p><span className="font-semibold text-zinc-300">Mobile:</span> {reseller.mobileNumber || 'N/A'}</p>
                                <p><span className="font-semibold text-zinc-300">Last Login:</span> {reseller.lastLogin ? new Date(reseller.lastLogin).toLocaleDateString() : 'Never'}</p>
                                <p><span className="font-semibold text-zinc-300">Last Order:</span> {reseller.lastOrderDate ? new Date(reseller.lastOrderDate).toLocaleDateString() : 'Never'}</p>
                            </div>

                            <div className="mt-auto pt-4 border-t border-zinc-800">
                                {activeTab === 'pending' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => handleStatusUpdate(reseller._id, 'approved')}
                                            className="bg-green-600 hover:bg-green-700 text-white border-none py-2 rounded-lg flex justify-center items-center gap-2 font-bold transition text-sm shadow-lg shadow-green-900/20"
                                        >
                                            <FaCheck /> Approve
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(reseller._id, 'rejected')}
                                            className="bg-red-600 hover:bg-red-700 text-white border-none py-2 rounded-lg flex justify-center items-center gap-2 font-bold transition text-sm shadow-lg shadow-red-900/20"
                                        >
                                            <FaTimes /> Reject
                                        </button>
                                    </div>
                                )}

                                {activeTab === 'all' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleResetPassword(reseller._id, reseller.name)}
                                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 py-2 rounded-lg flex justify-center items-center gap-2 font-bold transition text-xs px-3"
                                            title="Reset Password"
                                        >
                                            <FaKey /> Reset Pass
                                        </button>

                                        {reseller.subscriptionPlan === 'paid' && (
                                            <button
                                                onClick={() => handleDowngrade(reseller._id)}
                                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 py-2 rounded-lg flex justify-center items-center gap-2 font-bold transition text-xs"
                                                title="Downgrade to Free"
                                            >
                                                <FaTrash /> Revoke Premium
                                            </button>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'inactive' && (
                                    <button
                                        onClick={() => handleRevokeUser(reseller._id, reseller.name)}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white border-none py-2 rounded-lg flex justify-center items-center gap-2 font-bold transition text-sm shadow-lg shadow-red-900/20"
                                    >
                                        <FaTrash /> Revoke Access
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </MainLayout>
    );
};

export default AdminResellers;
