const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['reseller', 'admin', 'employee'], default: 'reseller' },
    permissions: [{ type: String }], // Array of assigned page permissions
    mobileNumber: { type: String, required: true },
    businessDetails: {
        businessName: { type: String },
        gstNumber: { type: String },
        address: { type: String },
    },
    kycDocuments: [{ type: String }], // Array of URLs
    accountStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'inactive'],
        default: 'pending'
    },
    subscriptionPlan: {
        type: String,
        enum: ['free', 'paid'],
        default: 'free'
    },
    subscriptionExpiry: { type: Date }, // Valid until
    subscriptionRequest: {
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: null },
        screenshotUrl: String,
        transactionId: String,
        requestedAt: Date
    },
    subscriptionHistory: [{
        plan: String,
        status: String,
        transactionId: String,
        screenshotUrl: String,
        startDate: Date,
        expiryDate: Date,
        processedAt: { type: Date, default: Date.now }
    }],
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    lastLogin: { type: Date }, // Track last user activity
    lastOrderDate: { type: Date }, // Track last order
    createdAt: { type: Date, default: Date.now }
});

// Password Hash Middleware
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Match Password Method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Performance Indexes
userSchema.index({ role: 1 });
userSchema.index({ accountStatus: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
