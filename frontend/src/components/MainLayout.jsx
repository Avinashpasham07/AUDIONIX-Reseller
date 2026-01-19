import { useState, useContext, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import PlansModal from './PlansModal';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

const MainLayout = ({ children }) => {
    const { user, setUser } = useContext(AuthContext);
    const [showPlansModal, setShowPlansModal] = useState(false);

    useEffect(() => {
        if (!user || user.role !== 'reseller') return;

        // Check for expiry warning (<= 1 day or expired)
        if (user.subscriptionPlan === 'paid' && user.subscriptionExpiry) {
            const expiry = new Date(user.subscriptionExpiry);
            const now = new Date();
            const oneDayMs = 24 * 60 * 60 * 1000;
            const diff = expiry - now;

            // If expired or expiring in less than 24 hours (or already expired)
            if (diff <= oneDayMs) {
                const hasSeenExpiry = sessionStorage.getItem('hasSeenExpiryWarning');
                if (!hasSeenExpiry) {
                    setShowPlansModal(true);
                    // Use sessionStorage so it shows once per session
                    sessionStorage.setItem('hasSeenExpiryWarning', 'true');
                }
            }
        }

        // Existing Free User logic
        if (user.subscriptionPlan === 'free' || !user.subscriptionPlan) {
            const hasSeen = localStorage.getItem('hasSeenPlansModal');
            if (!hasSeen) {
                setShowPlansModal(true);
            }
        }
    }, [user]);

    const handleCloseModal = () => {
        setShowPlansModal(false);
        localStorage.setItem('hasSeenPlansModal', 'true');
    };

    return (
        <div className="flex bg-black min-h-screen">
            <Sidebar />

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 ml-0 md:ml-[72px] overflow-x-hidden">
                <Navbar />

                {/* Content Area */}
                <main className="flex-1 p-4 pt-24 pb-24 md:p-8 md:pt-28 md:pb-8 max-w-full">
                    {children || <Outlet />}
                </main>

                <Footer />
            </div>

            {showPlansModal && (
                <PlansModal
                    user={user}
                    onClose={handleCloseModal}
                    onUpdateUser={setUser}
                />
            )}
        </div>
    );
};

export default MainLayout;
