import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaBoxOpen, FaClipboardList, FaUser } from 'react-icons/fa';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const MobileNav = () => {
    const location = useLocation();
    const { user } = useContext(AuthContext);

    const isActive = (path) => location.pathname === path;

    const resellerLinks = [
        { path: '/', icon: <FaHome size={20} />, label: 'Home' },
        { path: '/products', icon: <FaBoxOpen size={20} />, label: 'Products' },
        { path: '/orders', icon: <FaClipboardList size={20} />, label: 'Orders' },
        { path: '/profile', icon: <FaUser size={20} />, label: 'Profile' },
    ];

    const adminLinks = [
        { path: '/', icon: <FaHome size={20} />, label: 'Home' },
        { path: '/admin/resellers', icon: <FaUser size={20} />, label: 'Resellers' },
        { path: '/admin/orders', icon: <FaClipboardList size={20} />, label: 'Orders' },
        { path: '/admin/products', icon: <FaBoxOpen size={20} />, label: 'Products' },
        { path: '/profile', icon: <FaUser size={20} />, label: 'Profile' },
    ];

    const navItems = user?.role === 'admin' ? adminLinks : resellerLinks;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 flex justify-around items-center h-16 px-2 z-50 md:hidden pb-safe">
            {navItems.map((item) => (
                <Link
                    key={item.path}
                    to={item.path}
                    className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive(item.path) ? 'text-red-600' : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                >
                    <div className={`${isActive(item.path) ? 'transform scale-110 transition-transform' : ''}`}>
                        {item.icon}
                    </div>
                    <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
            ))}
        </div>
    );
};

export default MobileNav;
