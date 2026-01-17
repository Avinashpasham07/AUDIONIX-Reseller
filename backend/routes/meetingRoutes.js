const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    createRequest,
    getAllRequests,
    updateStatus,
    getAvailableSlots,
    getPendingCount
} = require('../controllers/meetingController');

// Public route (handles auth check internally)
router.post('/request', createRequest);
router.get('/slots/:date', getAvailableSlots);

// Admin Routes
router.get('/admin', protect, admin, getAllRequests);
router.get('/admin/pending-count', protect, admin, getPendingCount);
router.put('/:id', protect, admin, updateStatus);

module.exports = router;
