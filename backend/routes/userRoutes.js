const express = require('express');
const router = express.Router();
const { getWishlist, addToWishlist, removeFromWishlist, resetUserPassword, updateUserProfile } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/:id', protect, addToWishlist);
router.delete('/wishlist/:id', protect, removeFromWishlist);
router.put('/profile', protect, updateUserProfile);

// Admin Routes
router.put('/:id/password', protect, admin, resetUserPassword);

module.exports = router;
