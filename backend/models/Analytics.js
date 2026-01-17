const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true // One document per day
    },
    uniqueVisitors: {
        type: Number,
        default: 0
    },
    totalPageViews: {
        type: Number,
        default: 0
    },
    registrations: {
        type: Number,
        default: 0
    },
    leads: {
        type: Number,
        default: 0
    },
    totalOrders: {
        type: Number,
        default: 0
    },
    // Array of hashed IPs/VisitorIDs to track uniqueness for the day
    // In a high-scale app, use Redis or HyperLogLog. For this scale, array is fine.
    visitorIps: [{
        type: String
    }]
});

// Index for fast date lookups
// Index for fast date lookups is already created by unique: true option above


module.exports = mongoose.model('Analytics', analyticsSchema);
