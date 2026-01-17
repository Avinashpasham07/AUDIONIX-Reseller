const express = require('express');
const router = express.Router();
const {
    createOrder,
    getOrderById,
    getMyOrders,
    uploadPaymentProof,
    selectShippingMethod,
    verifyPayment,
    uploadShippingLabel,
    getDispatchSummary,
    getResellerStats,
    markOrderAsShipped,
    markOrderAsDelivered,
    exportMyOrders,
    exportAllOrders,
    getAdminStats
} = require('../controllers/orderController');

const { protect, admin } = require('../middleware/authMiddleware');

router.route('/admin/stats')
    .get(protect, admin, getAdminStats);

router.route('/stats')
    .get(protect, getResellerStats);

router.route('/export')
    .get(protect, exportMyOrders);

router.route('/')
    .post(protect, createOrder)
    .get(protect, getMyOrders);

// Admin route for summary
router.route('/admin/dispatch-summary')
    .get(protect, admin, getDispatchSummary);

router.route('/admin/export')
    .get(protect, admin, exportAllOrders);

router.route('/:id')
    .get(protect, getOrderById);

router.route('/:id/payment')
    .put(protect, uploadPaymentProof);

router.route('/:id/verify-payment')
    .put(protect, admin, verifyPayment);

router.route('/:id/shipping-fee')
    .put(protect, admin, require('../controllers/orderController').updateShippingFee);

router.route('/:id/shipping')
    .put(protect, selectShippingMethod);

router.route('/:id/label')
    .put(protect, uploadShippingLabel);

router.route('/:id/ship')
    .put(protect, admin, markOrderAsShipped);

router.route('/:id/deliver')
    .put(protect, admin, markOrderAsDelivered);

module.exports = router;
