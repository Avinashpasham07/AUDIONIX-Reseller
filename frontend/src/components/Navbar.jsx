import { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaBell, FaShoppingCart, FaCircle, FaHeart, FaUser, FaSignOutAlt, FaCheckCircle, FaBoxOpen, FaClipboardCheck } from 'react-icons/fa';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import AuthContext from '../context/AuthContext';
import api, { SOCKET_URL } from '../services/api';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const profileDropdownRef = useRef(null);

    // Fetch Notifications
    const fetchNotifications = async () => {
        if (!user) return; // Don't fetch if not logged in
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data);
            const { data: countData } = await api.get('/notifications/unread');
            setUnreadCount(countData.count);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        if (!user) return;

        fetchNotifications();

        // Socket.io Connection
        const socket = io(SOCKET_URL, {
            transports: ['websocket'], // Force websocket
            reconnectionAttempts: 5
        });

        socket.on('connect', () => {
            console.log('Socket Connected:', socket.id);
            // Join User Room
            socket.emit('join_user_room', user._id);
        });

        socket.on('connect_error', (err) => {
            console.error('Socket Connection Error:', err);
        });

        socket.on('new_notification', (data) => {
            console.log('New Notification Received:', data);
            toast(data.message, {
                icon: '🔔',
                duration: 4000,
                position: 'top-right'
            });

            // Add to list and increment unread
            setNotifications(prev => [
                { ...data, isRead: false, createdAt: new Date().toISOString(), _id: Date.now().toString() },
                ...prev
            ]);
            setUnreadCount(prev => prev + 1);

            // Play sound (optional, helps debugging)
            // const audio = new Audio('/notification.mp3');
            // audio.play().catch(e => console.log('Audio play failed', e));
        });

        return () => {
            socket.off('new_notification');
            socket.disconnect();
        };
    }, [user]);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNotificationClick = async (notif) => {
        if (!notif.isRead) {
            try {
                await api.put(`/notifications/${notif._id}/read`);
                setUnreadCount(prev => Math.max(0, prev - 1));
                setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
            } catch (error) {
                console.error("Failed to mark read", error);
            }
        }
        setShowDropdown(false);

        // Navigate based on Role
        if (user.role === 'admin') {
            navigate('/admin/orders');
        } else {
            navigate('/orders');
        }
    };

    return (
        <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 px-4 py-3 md:px-8 min-h-[var(--header-height)] flex flex-row items-center justify-between gap-0 transition-all duration-300">
            {/* Logo Section */}
            <div>
                <Link to="/" className="inline-block relative no-underline group">
                    <div className="text-2xl font-black italic tracking-tighter text-red-600 leading-none">AUDIONIX</div>
                    <span className="absolute -bottom-4 italic right-0 text-white tracking-tight text-[15px] font-normal ">Reseller</span>
                </Link>
            </div>

            {/* Profile Section */}
            <div className="flex items-center justify-end w-auto gap-4 md:gap-6">
                {user?.role === 'reseller' && (
                    <>
                        <Link to="/wishlist">
                            <FaHeart className="text-zinc-400 text-xl cursor-pointer hover:text-red-500 transition" />
                        </Link>
                        <Link to="/cart">
                            <FaShoppingCart className="text-zinc-400 text-xl cursor-pointer hover:text-red-500 transition" />
                        </Link>
                    </>
                )}

                {/* Notification Bell */}
                <div className="relative" ref={dropdownRef}>
                    <div
                        className="relative cursor-pointer select-none"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        <FaBell className="text-zinc-400 text-xl hover:text-red-500 transition" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </div>

                    {/* Dropdown */}
                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-3 border-b border-zinc-800 font-bold text-zinc-200 text-sm flex justify-between items-center bg-zinc-900">
                                <span>Notifications</span>
                                <span className="text-xs text-blue-400 cursor-pointer hover:underline" onClick={fetchNotifications}>Refresh</span>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                                {notifications.filter(n => !n.isRead).length === 0 ? (
                                    <div className="p-8 text-center text-zinc-500 text-sm">
                                        <FaBell className="mx-auto text-zinc-800 text-2xl mb-2" />
                                        No new notifications
                                    </div>
                                ) : (
                                    notifications.filter(n => !n.isRead).map(notif => (
                                        <div
                                            key={notif._id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className={`p-3 border-b border-zinc-800 hover:bg-zinc-800/50 cursor-pointer flex gap-3 items-start transition-colors ${!notif.isRead ? 'bg-blue-900/10' : ''}`}
                                        >
                                            <div className="mt-1 shrink-0">
                                                {notif.type === 'payment_confirmed' ? (
                                                    <FaCheckCircle className="text-green-500 text-sm" />
                                                ) : notif.type === 'order_delivered' ? (
                                                    <FaBoxOpen className="text-blue-500 text-sm" />
                                                ) : notif.type === 'order_placed' ? (
                                                    <FaClipboardCheck className="text-purple-500 text-sm" />
                                                ) : (
                                                    <FaCircle className="text-blue-500 text-[8px]" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm leading-snug font-semibold text-zinc-200">
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] text-zinc-500 mt-1">
                                                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {' • '}
                                                    {new Date(notif.createdAt).toLocaleDateString('en-GB')}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Toggle & Dropdown */}
                <div className="relative" ref={profileDropdownRef}>
                    <div
                        className="flex items-center gap-3 cursor-pointer select-none"
                        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    >
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-semibold text-zinc-200">{user?.name}</div>
                            <div className="text-xs text-zinc-500">{user?.businessName}</div>
                        </div>
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg shadow-sm border border-zinc-800">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                    </div>

                    {showProfileDropdown && (
                        <div className="absolute right-0 mt-3 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-4 border-b border-zinc-800 bg-zinc-900 block sm:hidden">
                                <div className="font-bold text-zinc-200 truncate">{user?.name}</div>
                                <div className="text-xs text-zinc-500 truncate">{user?.businessName}</div>
                            </div>

                            <div className="p-1">
                                <Link
                                    to="/profile"
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                                    onClick={() => setShowProfileDropdown(false)}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500">
                                        <FaUser size={14} />
                                    </div>
                                    My Profile
                                </Link>
                                <button
                                    onClick={() => {
                                        logout();
                                        setShowProfileDropdown(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors text-left mt-1"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-red-900/20 flex items-center justify-center text-red-500">
                                        <FaSignOutAlt size={14} />
                                    </div>
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Navbar;
