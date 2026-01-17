const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'employee')) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin or employee' });
    }
};

const checkPermission = (permission) => {
    return (req, res, next) => {
        if (req.user && req.user.role === 'admin') {
            return next();
        }
        if (req.user && req.user.role === 'employee' && req.user.permissions.includes(permission)) {
            return next();
        }
        res.status(403).json({ message: `Access denied: Missing permission [${permission}]` });
    };
};

module.exports = { protect, admin, checkPermission };
