const express = require('express');
const router = express.Router();
const { registerReseller, loginUser, getMe, submitSubscriptionRequest } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest, schemas } = require('../middleware/validationMiddleware');

const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, validateRequest(schemas.register), registerReseller);
router.post('/login', authLimiter, validateRequest(schemas.login), loginUser);
router.get('/me', protect, getMe);
router.post('/upgrade-request', protect, submitSubscriptionRequest);

module.exports = router;
