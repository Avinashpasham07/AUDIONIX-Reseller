const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new reseller
// @route   POST /api/auth/register
// @access  Public
exports.registerReseller = async (req, res) => {
    const { name, email, mobileNumber, password, businessName, gstNumber, address } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            mobileNumber,
            password,
            role: 'reseller',
            subscriptionPlan: 'free',
            businessDetails: {
                businessName,
                gstNumber,
                address
            }
        });

        // Track Registration in Analytics
        const Analytics = require('../models/Analytics');
        const now = new Date();
        const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        await Analytics.findOneAndUpdate(
            { date: today },
            { $inc: { registrations: 1 } },
            { upsert: true }
        );

        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            accountStatus: user.accountStatus,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            // Allow all roles to proceed with login
            // Handling of pending/rejected status will be managed on the frontend dashboard

            // 1. Check for Inactivity (Auto-Revoke > 45 Days)
            // Activity = Max(lastLogin, lastOrderDate, createdAt)
            const lastActive = new Date(Math.max(
                user.lastLogin ? new Date(user.lastLogin) : 0,
                user.lastOrderDate ? new Date(user.lastOrderDate) : 0,
                new Date(user.createdAt)
            ));

            const diffTime = Math.abs(Date.now() - lastActive);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 45 && user.role === 'reseller') {
                user.accountStatus = 'inactive';
                await user.save();
                return res.status(403).json({
                    message: 'Your account is inactive for more than 45 days. Contact admin drop an email to : support@audionix.com , wtsapp : +91-9876543210'
                });
            }

            if (user.accountStatus === 'inactive' && user.role === 'reseller') {
                return res.status(403).json({
                    message: 'Your account is inactive for more than 45 days. Contact admin drop an email to : support@audionix.com , wtsapp : +91-9876543210'
                });
            }

            // Update Last Login
            user.lastLogin = Date.now();
            await user.save();

            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                subscriptionPlan: user.subscriptionPlan,
                subscriptionExpiry: user.subscriptionExpiry,
                accountStatus: user.accountStatus,
                permissions: user.permissions, // Include permissions for Employees
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    const user = await User.findById(req.user.id);
    if (user) {
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            mobileNumber: user.mobileNumber,
            businessDetails: user.businessDetails,
            subscriptionPlan: user.subscriptionPlan,
            subscriptionExpiry: user.subscriptionExpiry,
            accountStatus: user.accountStatus,
            permissions: user.permissions // Include permissions for Employees
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Request Premium Upgrade (Submit Screenshot)
// @route   POST /api/auth/upgrade-request
// @access  Private
exports.submitSubscriptionRequest = async (req, res) => {
    const { screenshotUrl, transactionId } = req.body;

    try {
        const user = await User.findById(req.user.id);

        if (user) {
            user.subscriptionRequest = {
                status: 'pending',
                screenshotUrl,
                transactionId,
                requestedAt: Date.now()
            };
            await user.save();

            res.json({
                message: 'Upgrade request submitted successfully! Waiting for Admin approval.',
                subscriptionRequest: user.subscriptionRequest
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
