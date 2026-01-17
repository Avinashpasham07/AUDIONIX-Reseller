const mongoose = require('mongoose');

const meetingRequestSchema = new mongoose.Schema({
    reseller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    guestName: {
        type: String,
        trim: true
    },
    guestPhone: {
        type: String,
        trim: true
    },
    topic: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    preferredDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'scheduled', 'completed', 'cancelled'],
        default: 'pending'
    },
    adminNotes: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('MeetingRequest', meetingRequestSchema);
