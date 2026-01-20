const express = require('express');
const router = express.Router();
const {
    getResellers,
    updateResellerStatus,
    getAnalytics,
    getSettings,
    updateSettings,
    getSubscriptionRequests,
    handleSubscriptionRequest,
    revokeSubscription,
    getAnalyticsDetails,
    getEmployees,
    createEmployee,
    updateEmployeePermissions,
    deleteEmployee,
    getInactiveResellers,
    revokeReseller,
    syncResellerActivity
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/resellers')
    .get(protect, admin, getResellers);

router.route('/resellers/:id/status')
    .put(protect, admin, updateResellerStatus);

// Inactive Reseller Management
router.get('/inactive-users', protect, admin, getInactiveResellers);
router.put('/revoke-user/:id', protect, admin, revokeReseller);
router.put('/sync-data', protect, admin, syncResellerActivity);

// Analytics - Admin Only
router.get('/analytics', protect, admin, getAnalytics);
router.get('/analytics/details', protect, admin, getAnalyticsDetails);

// Settings
router.get('/settings', getSettings); // Public read for Checkout
router.put('/settings', protect, admin, updateSettings); // Admin write

// Subscription Management
router.get('/subscription-requests', protect, admin, getSubscriptionRequests);
router.put('/subscription-requests/:userId', protect, admin, handleSubscriptionRequest);
router.put('/subscription-revoke/:userId', protect, admin, revokeSubscription);

// Employee Management
router.route('/employees')
    .get(protect, admin, getEmployees)
    .post(protect, admin, createEmployee);

router.route('/employees/:id')
    .delete(protect, admin, deleteEmployee);

router.put('/employees/:id/permissions', protect, admin, updateEmployeePermissions);

module.exports = router;
