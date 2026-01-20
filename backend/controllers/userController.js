const User = require('../models/User');

// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
exports.getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('wishlist');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user.wishlist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add product to wishlist
// @route   POST /api/users/wishlist/:id
// @access  Private
exports.addToWishlist = async (req, res) => {
    try {
        const product_id = req.params.id;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.wishlist.includes(product_id)) {
            return res.status(400).json({ message: 'Product already in wishlist' });
        }

        user.wishlist.push(product_id);
        await user.save();

        res.json({ message: 'Added to wishlist', wishlist: user.wishlist });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/users/wishlist/:id
// @access  Private
exports.removeFromWishlist = async (req, res) => {
    try {
        const product_id = req.params.id;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        user.wishlist = user.wishlist.filter(id => id.toString() !== product_id);
        await user.save();

        res.json({ message: 'Removed from wishlist', wishlist: user.wishlist });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Admin Reset Password for User
// @route   PUT /api/users/:id/password
// @access  Private (Admin)
exports.resetUserPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.password = password;
        await user.save(); // Pre-save hook will hash this

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update user profile & password
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.mobileNumber = req.body.mobileNumber || user.mobileNumber;

            // Update Business Details
            if (req.body.businessName || req.body.gstNumber || req.body.address) {
                user.businessDetails = {
                    businessName: req.body.businessName || user.businessDetails?.businessName,
                    gstNumber: req.body.gstNumber || user.businessDetails?.gstNumber,
                    address: req.body.address || user.businessDetails?.address
                };
            }

            if (req.body.password) {
                if (req.body.currentPassword && await user.matchPassword(req.body.currentPassword)) {
                    user.password = req.body.password;
                } else {
                    return res.status(400).json({ message: 'Invalid current password' });
                }
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                mobileNumber: updatedUser.mobileNumber,
                businessDetails: updatedUser.businessDetails,
                token: generateToken(updatedUser._id), // Optional: Refresh token if needed
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const generateToken = (id) => {
    const jwt = require('jsonwebtoken'); // Ensure jwt is available
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};
