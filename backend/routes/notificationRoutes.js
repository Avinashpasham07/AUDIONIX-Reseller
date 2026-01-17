const express = require('express');
const router = express.Router();
const { getMyNotifications, markAsRead, getUnreadCount } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMyNotifications);
router.get('/unread', protect, getUnreadCount);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
