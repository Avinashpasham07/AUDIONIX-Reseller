const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
});

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
        type: String,
        required: true,
        // Removed enum to allow dynamic categories
    },
    price: { type: Number, required: true }, // Selling price to customer (Reseller + Margin)
    hsnCode: { type: String, required: false }, // HSN/SAC Code for tax purposes
    shippingFee: { type: Number, required: false, default: 0 }, // Shipping fee per unit
    originalPrice: { type: Number, required: false, default: 0 }, // Cost Price (for profit calc) - ADMIN ONLY
    cutoffPrice: { type: Number, required: false, default: 0 }, // MRP / Strikethrough Price
    resellerPrice: { type: Number, required: false, default: 0 }, // Base price for reseller (FREE Plan)
    resellerPricePaid: { type: Number, required: false, default: 0 }, // Discounted price (PAID Plan)
    stock: { type: Number, required: true, default: 0 },
    images: [{ type: String }], // Array of image URLs
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional for now, could be Admin or specific Supplier
    },
    pickupAddress: { type: String, required: false }, // Address for Self Ship pickup

    reviews: [reviewSchema],
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },

    createdAt: { type: Date, default: Date.now }
});

// Comprehensive Indexes
productSchema.index({ category: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
