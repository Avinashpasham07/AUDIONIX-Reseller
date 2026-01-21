import { HelmetProvider } from 'react-helmet-async';

// ... (previous imports)

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
