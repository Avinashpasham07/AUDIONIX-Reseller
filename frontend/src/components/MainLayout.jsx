import { useState, useContext, useEffect, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import PlansModal from './PlansModal';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

const MainLayout = ({ children }) => {
    const { user, setUser } = useContext(AuthContext);
    const [showPlansModal, setShowPlansModal] = useState(false);
    const location = useLocation();

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
        // Check for ?upgrade=true query param
        const params = new URLSearchParams(location.search);
        if (params.get('upgrade') === 'true') {
            setShowPlansModal(true);
            // Clean up URL (optional, but cleaner)
            // We use history api directly to avoid triggering another router navigation
            const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({ path: newUrl }, '', newUrl);
        }
    }, [user, location.search]);

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
                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center p-20 h-full">
                            <div className="w-8 h-8 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin mb-4"></div>
                        </div>
                    }>
                        {children || <Outlet />}
                    </Suspense>
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
