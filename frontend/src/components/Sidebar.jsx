import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaBoxOpen, FaUser, FaSignOutAlt, FaClipboardList, FaBars, FaWhatsapp, FaCrown, FaCalendarAlt, FaCog, FaShieldAlt } from 'react-icons/fa';
import { useContext, useState, useEffect } from 'react';
import AuthContext from '../context/AuthContext';
import PlansModal from './PlansModal';
import api from '../services/api';

const Sidebar = () => {
    const location = useLocation();
    const { user, logout, setUser } = useContext(AuthContext);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showPlansModal, setShowPlansModal] = useState(false);
    const [pendingMeetings, setPendingMeetings] = useState(0);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    useEffect(() => {
        if (user?.role === 'admin') {
            const fetchCount = async () => {
                try {
                    const { data } = await api.get('/meetings/admin/pending-count');
                    setPendingMeetings(data.count);
                } catch (err) {
                    console.error("Failed to fetch pending meetings", err);
                }
            };
            fetchCount();
            const interval = setInterval(fetchCount, 30000); // Check every 30s
            return () => clearInterval(interval);
        }
    }, [user]);

    const isActive = (path) => location.pathname === path;

    const resellerLinks = [
        { path: '/dashboard', icon: <FaHome size={20} />, label: 'Dashboard' },
        { path: '/products', icon: <FaBoxOpen size={20} />, label: 'Products' },
        { path: '/orders', icon: <FaClipboardList size={20} />, label: 'My Orders' },
        { path: '/profile', icon: <FaUser size={20} />, label: 'Profile' },
    ];

    const adminLinks = [
        { path: '/dashboard', icon: <FaHome size={20} />, label: 'Dashboard' },
        { path: '/admin/resellers', icon: <FaUser size={20} />, label: 'Resellers', permission: 'resellers' },
        { path: '/admin/orders', icon: <FaClipboardList size={20} />, label: 'Verify Orders', permission: 'orders' },
        { path: '/admin/products', icon: <FaBoxOpen size={20} />, label: 'Manage Products', permission: 'products' },
        { path: '/admin/meetings', icon: <FaCalendarAlt size={20} />, label: 'Schedule Meetings', permission: 'meetings' },
        { path: '/admin/requests', icon: <FaCrown size={20} />, label: 'Premium Requests', permission: 'requests' },
        { path: '/admin/employees', icon: <FaShieldAlt size={20} />, label: 'Manage Employees', permission: 'employees' },
        { path: '/admin/settings', icon: <FaCog size={20} />, label: 'Settings', permission: 'settings' },
    ];

    const getNavItems = () => {
        if (user?.role === 'admin') return adminLinks;
        if (user?.role === 'employee') {
            return adminLinks.filter(link =>
                link.label === 'Dashboard' || (user.permissions && user.permissions.includes(link.permission))
            );
        }
        return resellerLinks;
    };

    const navItems = getNavItems();

    return (
        <>
            <div
                className={`fixed left-0 top-0 h-full flex-col bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-800 z-50 transition-all duration-300 hidden md:flex ${isExpanded ? 'w-[250px] shadow-2xl' : 'w-[72px]'}`}
            >
                {/* --- HEADER / TOGGLE SECTION --- */}
                <div className={`h-10 mt-10 flex items-center mb-12 ${isExpanded ? 'px-6 justify-start' : 'justify-center'} whitespace-nowrap`}>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="bg-none border-none cursor-pointer text-zinc-100 text-xl flex items-center justify-center p-0 min-w-[40px] hover:bg-zinc-900 rounded-lg h-10 w-10 transition"
                    >
                        <FaBars />
                    </button>

                    <div className={`transition-all  duration-200 overflow-hidden ${isExpanded ? 'opacity-100 w-auto ml-4' : 'opacity-0 w-0'}`}>
                        <div className="inline-block relative">
                            <h2 className="m-0  text-2xl font-black italic text-red-600 leading-none">AUDIONIX</h2>
                            <span className="absolute -bottom-2 right-0 text-white tracking-widest text-[10px] font-normal lowercase">reseller</span>
                        </div>
                    </div>
                </div>

                {/* --- NAVIGATION LINKS --- */}
                <nav className="flex-1 flex flex-col gap-2 px-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center rounded-xl transition-all duration-200 whitespace-nowrap py-3.5 px-3 mx-2 ${isActive(item.path)
                                ? 'bg-red-600 text-white shadow-lg shadow-zinc-900/50 font-bold scale-[1.02]'
                                : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100'
                                } ${isExpanded ? 'gap-4 justify-start' : 'justify-center'}`}
                        >
                            <div className="min-w-[24px] flex justify-center items-center text-xl relative">
                                {item.icon}
                                {item.label === 'Schedule Meetings' && pendingMeetings > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse border-2 border-zinc-950">
                                        {pendingMeetings}
                                    </span>
                                )}
                            </div>

                            <span className={`transition-all duration-200 overflow-hidden ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                                {item.label}
                                {item.label === 'Schedule Meetings' && pendingMeetings > 0 && isExpanded && (
                                    <span className="ml-2 bg-red-600/20 text-red-500 text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase">New</span>
                                )}
                            </span>
                        </Link>
                    ))}
                </nav>

                {/* --- PREMIUM BUTTON --- */}
                {user?.role === 'reseller' && (
                    <div className="px-2 mb-2">
                        {user.subscriptionPlan === 'paid' ? (
                            <Link
                                to="/profile"
                                className={`flex items-center rounded-xl transition-all duration-200 py-3 px-3 mx-2 border border-yellow-300/50 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-900 shadow-sm ${isExpanded ? 'gap-4 justify-start pro-shine' : 'justify-center'}`}
                                title={`Expires: ${user.subscriptionExpiry ? new Date(user.subscriptionExpiry).toLocaleDateString('en-GB') : 'N/A'}`}
                            >
                                <div className="min-w-[24px] flex justify-center items-center text-xl text-amber-600">
                                    <FaCrown />
                                </div>
                                <div className={`transition-all duration-200 overflow-hidden text-left ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                                    <span className="font-bold whitespace-nowrap block leading-none text-sm">
                                        Premium Member
                                    </span>
                                    {user.subscriptionExpiry && (
                                        <span className="text-[10px] font-medium opacity-75 block whitespace-nowrap mt-1">
                                            Valid: {new Date(user.subscriptionExpiry).toLocaleDateString('en-GB')}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        ) : (
                            <button
                                onClick={() => setShowPlansModal(true)}
                                className={`flex items-center rounded-xl transition-all duration-200 py-3 px-3 mx-2 border border-yellow-300/50 bg-gradient-to-r from-zinc-900 to-zinc-800 text-yellow-400 hover:shadow-lg hover:scale-[1.02] ${isExpanded ? 'gap-4 justify-start' : 'justify-center'}`}
                                title="Get Premium"
                            >
                                <div className="min-w-[24px] flex justify-center items-center text-xl">
                                    <FaCrown className="animate-pulse" />
                                </div>
                                <span className={`transition-all duration-200 overflow-hidden font-bold whitespace-nowrap ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                                    Get Premium
                                </span>
                            </button>
                        )}
                    </div>
                )}

                {/* --- WHATSAPP BUTTON --- */}
                {user?.role === 'reseller' && (
                    <div className="px-2 mb-2">
                        <a
                            href="https://wa.me/8099301082"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center rounded-xl transition-all duration-200 py-3 px-3 mx-2 hover:bg-green-50 ${isExpanded
                                ? 'gap-4 justify-start text-green-700 font-medium'
                                : 'justify-center text-green-600'
                                }`}
                        >
                            <div className="min-w-[24px] flex justify-center items-center text-xl">
                                <FaWhatsapp />
                            </div>

                            <span className={`transition-all duration-200 overflow-hidden font-medium ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                                WhatsApp Support
                            </span>
                        </a>
                    </div>
                )}

                {/* --- LOGOUT BUTTON --- */}
                <div className="px-2 mb-8">
                    <button
                        onClick={logout}
                        className={`flex items-center rounded-xl cursor-pointer w-auto mt-auto h-[50px] transition-all duration-200 py-3 px-3 mx-2 ${isExpanded
                            ? 'border border-red-900/30 bg-red-900/10 text-red-500 gap-4 justify-start w-[calc(100%-16px)]'
                            : 'border-none bg-transparent text-red-600 justify-center hover:bg-zinc-900'
                            }`}
                    >
                        <div className="min-w-[24px] flex justify-center items-center text-xl">
                            <FaSignOutAlt />
                        </div>

                        <span className={`transition-all duration-200 overflow-hidden ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                            Logout
                        </span>
                    </button>
                </div>
            </div>

            {/* --- MOBILE BOTTOM NAVIGATION --- */}
            <div className="fixed bottom-4 left-4 right-4 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl h-16 md:hidden z-50 flex justify-around items-center px-1 shadow-2xl active:scale-[0.99] transition-transform">
                {navItems.slice(0, user?.role === 'admin' ? 4 : 3).map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setShowMobileMenu(false)}
                        className={`flex flex-col items-center justify-center gap-1 w-full h-full rounded-xl transition-all ${isActive(item.path)
                            ? 'text-white font-bold scale-110'
                            : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <div className="text-xl relative">
                            {item.icon}
                            {item.label === 'Schedule Meetings' && pendingMeetings > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-zinc-900">
                                    {pendingMeetings}
                                </span>
                            )}
                        </div>
                    </Link>
                ))}

                <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className={`flex flex-col items-center justify-center gap-1 w-full h-full rounded-xl transition-all ${showMobileMenu ? 'text-white scale-110' : 'text-zinc-500'}`}
                >
                    <FaBars className="text-xl" />
                </button>
            </div>

            {/* --- MOBILE MORE MENU POPUP --- */}
            {showMobileMenu && (
                <div className="fixed bottom-24 right-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-2 min-w-[200px] animate-slideUp max-h-[60vh] overflow-y-auto">
                    {/* Remaining Nav Items */}
                    {navItems.slice(user?.role === 'admin' ? 4 : 3).map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setShowMobileMenu(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(item.path)
                                ? 'bg-red-600 text-white font-bold'
                                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                        >
                            {item.icon}
                            <span className="text-sm font-medium">{item.label}</span>
                        </Link>
                    ))}

                    {/* Reseller Specific Actions (Premium & WhatsApp) */}
                    {user?.role === 'reseller' && (
                        <>
                            {/* PREMIUM */}
                            {user.subscriptionPlan === 'paid' ? (
                                <Link
                                    to="/profile"
                                    onClick={() => setShowMobileMenu(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-amber-500 hover:bg-zinc-800"
                                >
                                    <FaCrown />
                                    <span className="text-sm font-bold">Premium Member</span>
                                </Link>
                            ) : (
                                <button
                                    onClick={() => { setShowPlansModal(true); setShowMobileMenu(false); }}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-yellow-400 hover:bg-zinc-800 w-full text-left"
                                >
                                    <FaCrown className="animate-pulse" />
                                    <span className="text-sm font-bold">Get Premium</span>
                                </button>
                            )}

                            {/* WHATSAPP */}
                            <a
                                href="https://wa.me/8099301082"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setShowMobileMenu(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-green-500 hover:bg-zinc-800"
                            >
                                <FaWhatsapp />
                                <span className="text-sm font-medium">WhatsApp Help</span>
                            </a>
                        </>
                    )}
                </div>
            )}

            {showPlansModal && (
                <PlansModal
                    user={user}
                    onClose={() => setShowPlansModal(false)}
                    onUpdateUser={setUser}
                />
            )}
        </>
    );
};

export default Sidebar;