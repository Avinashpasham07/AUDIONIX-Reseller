const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    resellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true } // Price at time of order
    }],
    resellerMargin: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    paymentDetails: {
        method: {
            type: String,
            enum: ['upi_scanner', 'cod', 'pay_later', 'upi'],
            required: true
        },
        transactionId: { type: String }, // For UPI
        screenshotUrl: { type: String }, // For UPI
        isVerified: { type: Boolean, default: false },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: { type: Date }
    },
    shippingMethod: {
        type: String,
        enum: ['self', 'audionix'],
        // Not required initially, selected after payment
    },
    shippingAddress: {
        name: { type: String, required: true },
        email: { type: String },
        address: { type: String, required: true },
        city: { type: String, required: true },
        pincode: { type: String, required: true },
        state: { type: String, required: true },
        phone: { type: String, required: true }
    },
    pickupAddress: { type: String },
    pickupDescription: { type: String },
    customerPaymentMode: {
        type: String,
        enum: ['prepaid', 'cod'],
        required: true
    },
    shippingLabelUrl: { type: String },
    bulkOrderFile: { type: String },
    bulkOrderFiles: [{ type: String }],
    orderStatus: {
        type: String,
        enum: [
            'pending_payment',
            'pending_shipping_calc', // Admin needs to add shipping
            'payment_verification_pending',
            'payment_confirmed',
            'ready_for_dispatch',
            'shipped',
            'delivered',
            'cancelled'
        ],
        default: 'pending_payment'
    },
    createdAt: { type: Date, default: Date.now }
});

// Indexes for performance
orderSchema.index({ resellerId: 1, createdAt: -1 }); // Critical for My Orders & Dashboard
orderSchema.index({ orderStatus: 1 }); // For filtering status (Dashboard counts)
orderSchema.index({ createdAt: -1 }); // For sorting global list
orderSchema.index({ "paymentDetails.isVerified": 1 }); // For admin verification queue

module.exports = mongoose.model('Order', orderSchema);
