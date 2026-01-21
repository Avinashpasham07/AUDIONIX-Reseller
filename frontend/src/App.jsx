import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { PixelProvider } from './context/PixelContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';
import api from './services/api';

// Lazy Load Pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Cart = lazy(() => import('./pages/Cart'));
const Orders = lazy(() => import('./pages/Orders'));
const AdminResellers = lazy(() => import('./pages/AdminResellers'));
const AdminOrders = lazy(() => import('./pages/AdminOrders'));
const AdminProducts = lazy(() => import('./pages/AdminProducts'));
const AdminProductForm = lazy(() => import('./pages/AdminProductForm'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const AdminSubscriptionRequests = lazy(() => import('./pages/AdminSubscriptionRequests'));
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));
const AdminMeetings = lazy(() => import('./pages/AdminMeetings'));
const AdminEmployees = lazy(() => import('./pages/AdminEmployees'));
const Profile = lazy(() => import('./pages/Profile'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const ReturnsPolicy = lazy(() => import('./pages/ReturnsPolicy'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const PendingApproval = lazy(() => import('./pages/PendingApproval'));

// Loading Fallback Component
const PageLoader = () => (
  <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
    <div className="w-12 h-12 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin mb-4"></div>
    <div className="text-zinc-500 font-bold animate-pulse">Loading Audionix...</div>
  </div>
);

function App() {
  // WAKE UP BACKEND (Cold Start Handling)
  useEffect(() => {
    const wakeUpBackend = async () => {
      try {
        await api.get('/ping');
        console.log("Backend Woken Up 🚀");
      } catch (err) {
        // Silent fail (it might just be waking up)
        console.log("Backend waking up...", err);
      }
    };
    wakeUpBackend();
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <CartProvider>
            <PixelProvider>
              <div className="app-container">
                {/* ... (rest of the component) */}
                <Toaster position="top-center" toastOptions={{
                  style: {
                    background: '#333',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '16px',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: 'white',
                    },
                  },
                }} />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* ... (routes) */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/pending-approval" element={<PendingApproval />} />

                    {/* Public Landing Page */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/returns" element={<ReturnsPolicy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />

                    {/* Protected Dashboard Layout Route */}
                    <Route element={
                      <ProtectedRoute>
                        <MainLayout />
                      </ProtectedRoute>
                    }>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/products/:id" element={<ProductDetails />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/orders" element={<Orders />} />

                      {/* Admin Routes */}
                      <Route path="/admin/resellers" element={<ProtectedRoute permission="resellers"><AdminResellers /></ProtectedRoute>} />
                      <Route path="/admin/orders" element={<ProtectedRoute permission="orders"><AdminOrders /></ProtectedRoute>} />
                      <Route path="/admin/settings" element={<ProtectedRoute permission="settings"><AdminSettings /></ProtectedRoute>} />
                      <Route path="/admin/requests" element={<ProtectedRoute permission="requests"><AdminSubscriptionRequests /></ProtectedRoute>} />
                      <Route path="/admin/analytics-view" element={<ProtectedRoute permission="analytics"><AdminAnalytics /></ProtectedRoute>} />
                      <Route path="/admin/meetings" element={<ProtectedRoute permission="meetings"><AdminMeetings /></ProtectedRoute>} />
                      <Route path="/admin/employees" element={<ProtectedRoute permission="employees"><AdminEmployees /></ProtectedRoute>} />
                      <Route path="/admin/products" element={<ProtectedRoute permission="products"><AdminProducts /></ProtectedRoute>} />
                      <Route path="/admin/products/create" element={<ProtectedRoute permission="products"><AdminProductForm /></ProtectedRoute>} />
                      <Route path="/admin/products/edit/:id" element={<ProtectedRoute permission="products"><AdminProductForm /></ProtectedRoute>} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </Suspense>
              </div>
            </PixelProvider>
          </CartProvider>
        </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  )
}

export default App;
