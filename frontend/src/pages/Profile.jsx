import React, { useContext } from 'react';
import MainLayout from '../components/MainLayout';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import { FaUser, FaEnvelope, FaBuilding, FaMapMarkerAlt, FaIdCard, FaCrown } from 'react-icons/fa';

const Profile = () => {
    const { user } = useContext(AuthContext);

    if (!user) return <div>Loading...</div>;

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-black text-white mb-10 tracking-tighter mb-2">
                    My Profile<span className="text-red-600">.</span>
                </h1>

                <div className="glass-panel p-6 md:p-10 rounded-3xl w-full mx-auto shadow-lg bg-zinc-900 border border-zinc-800 relative overflow-hidden">
                    {/* Premium Profile Decoration */}
                    {user.subscriptionPlan === 'paid' && (
                        <>
                            <div className="absolute top-0 right-0 bg-yellow-400 text-black px-6 py-2 rounded-bl-3xl font-extrabold flex items-center gap-2 shadow-lg z-10">
                                <FaCrown className="animate-pulse" /> PREMIUM MEMBER
                            </div>
                            <div className="absolute top-0 right-0 p-32 bg-yellow-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                        </>
                    )}

                    {/* User Header */}
                    <div className="flex flex-col md:flex-row items-center gap-6 mb-10 pb-8 border-b border-zinc-800 relative">
                        <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center text-4xl md:text-5xl text-white font-bold shadow-md shrink-0 border-4 ${user.subscriptionPlan === 'paid' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 border-yellow-900' : 'bg-gradient-to-br from-red-600 to-red-800 border-zinc-700'}`}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-center md:text-left">
                            <h2 className="m-0 text-2xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-2">
                                {user.name}
                                {user.subscriptionPlan === 'paid' && <FaCrown className="text-yellow-500 text-2xl" title="Premium Member" />}
                            </h2>
                            <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
                                <span className="inline-block bg-zinc-800 text-red-500 px-4 py-1 rounded-full text-xs font-bold border border-zinc-700">
                                    {user.role.toUpperCase()}
                                </span>
                                {user.subscriptionPlan === 'paid' && (
                                    <span className="inline-block bg-yellow-900/30 text-yellow-400 px-4 py-1 rounded-full text-xs font-bold border border-yellow-800">
                                        PLAN: PREMIUM
                                    </span>
                                )}
                            </div>
                            <div className="mt-2 text-zinc-400 text-sm">Member since {new Date(user.createdAt || Date.now()).toLocaleDateString('en-GB')}</div>
                        </div>
                    </div>
                    {/* Premium Benefits Summary (Optional) or Expiry */}
                    {user.subscriptionPlan === 'paid' && user.subscriptionExpiry && (
                        <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-yellow-900/20 to-zinc-900 p-4 mb-10 rounded-2xl border border-yellow-900/50 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-yellow-900/30 text-yellow-500 flex items-center justify-center shadow-sm shrink-0">
                                <FaCrown />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Premium Subscription</div>
                                <div className="text-white font-medium text-sm">Valid until: {new Date(user.subscriptionExpiry).toLocaleDateString('en-GB')}</div>
                            </div>
                        </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-2xl border border-zinc-800">
                            <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 border border-zinc-700 shadow-sm">
                                <FaEnvelope />
                            </div>
                            <div className="overflow-hidden">
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email</div>
                                <div className="text-white font-medium truncate">{user.email}</div>
                            </div>
                        </div>

                        {user.mobileNumber && (
                            <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-2xl border border-zinc-800">
                                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 border border-zinc-700 shadow-sm">
                                    <FaIdCard />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Mobile</div>
                                    <div className="text-white font-medium">{user.mobileNumber}</div>
                                </div>
                            </div>
                        )}

                        {user.businessDetails && (
                            <>
                                <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-2xl border border-zinc-800">
                                    <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 border border-zinc-700 shadow-sm">
                                        <FaBuilding />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Business Name</div>
                                        <div className="text-white font-medium">{user.businessDetails.businessName || 'N/A'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-2xl border border-zinc-800">
                                    <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 border border-zinc-700 shadow-sm">
                                        <FaIdCard />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">GST Number</div>
                                        <div className="text-white font-medium">{user.businessDetails.gstNumber || 'N/A'}</div>
                                    </div>
                                </div>
                                <div className="col-span-1 md:col-span-2 flex items-center gap-4 p-4 bg-zinc-800/50 rounded-2xl border border-zinc-800">
                                    <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 border border-zinc-700 shadow-sm shrink-0">
                                        <FaMapMarkerAlt />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Address</div>
                                        <div className="text-white font-medium">{user.businessDetails.address || 'N/A'}</div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Premium Benefits Summary (Optional) or Expiry */}

                    </div>
                </div>

                {/* Change Password Section */}
                <div className="mt-8 glass-panel p-6 md:p-10 rounded-3xl w-full mx-auto shadow-lg bg-zinc-900 border border-zinc-800">
                    <h2 className="text-2xl font-bold text-white mb-6">Change Password</h2>
                    <ChangePasswordForm />
                </div>
            </div>
        </MainLayout>
    );
};

const ChangePasswordForm = () => {
    const [currentPassword, setCurrentPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await api.put('/users/profile', { currentPassword, password: newPassword });
            alert('Password Updated Significantly!'); // User asked for "significantly" (sic) or simply updated. keeping logic clean.
            // Actually user asked: "after that they can able to cvhnage there password"
            // Reset fields
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
                <label className="block text-zinc-400 text-sm font-bold mb-2">Current Password</label>
                <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-zinc-800 border-zinc-700 text-white rounded-xl px-4 py-3 outline-none focus:border-red-600 transition"
                />
            </div>
            <div>
                <label className="block text-zinc-400 text-sm font-bold mb-2">New Password</label>
                <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-zinc-800 border-zinc-700 text-white rounded-xl px-4 py-3 outline-none focus:border-red-600 transition"
                />
            </div>
            <div>
                <label className="block text-zinc-400 text-sm font-bold mb-2">Confirm New Password</label>
                <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-zinc-800 border-zinc-700 text-white rounded-xl px-4 py-3 outline-none focus:border-red-600 transition"
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition w-full disabled:opacity-50"
            >
                {loading ? 'Updating...' : 'Update Password'}
            </button>
        </form>
    );
};

export default Profile;
