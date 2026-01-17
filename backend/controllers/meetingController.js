const MeetingRequest = require('../models/MeetingRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Settings = require('../models/Settings');
const schedulingService = require('../services/internalSchedulingService');
const NodeCache = require('node-cache');
const meetingCache = new NodeCache({ stdTTL: 120 }); // 2 minutes


// @desc    Create a new meeting request
// @route   POST /api/meetings/request
// @access  Private (Reseller)
const jwt = require('jsonwebtoken');

// @desc    Create a new meeting request
// @route   POST /api/meetings/request
// @access  Public (Guest & Reseller)
exports.createRequest = async (req, res) => {
    try {
        let user = null;

        // Manually check for token if present
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                user = await User.findById(decoded.id).select('-password');
            } catch (err) {
                console.log("Token verification failed (Guest mode confirmed)");
            }
        }

        const { topic, description, preferredDate, guestName, guestPhone, selectedSlot } = req.body;

        const requestData = {
            topic,
            description,
            preferredDate: selectedSlot ? new Date(selectedSlot.start) : preferredDate
        };

        if (user) {
            requestData.reseller = user._id;
        } else {
            requestData.guestName = guestName;
            requestData.guestPhone = guestPhone;
        }

        const senderName = user ? user.name : (guestName || 'Visitor');
        const request = await MeetingRequest.create(requestData);

        // --- AUTOMATED INTERNAL BOOKING ---
        if (selectedSlot) {
            request.status = 'scheduled';
            request.adminNotes = `Automated Booking via Internal Scheduler. Slot: ${new Date(selectedSlot.start).toLocaleString()}`;
            await request.save();
        }

        // Notify Admins
        const admins = await User.find({ role: 'admin' });

        const notifications = admins.map(admin => ({
            user: admin._id,
            type: 'meeting_request',
            message: `New Support Request from ${senderName}: ${topic}`,
            relatedId: request._id
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        // --- TRACK ANALYTICS (LEAD) ---
        try {
            const Analytics = require('../models/Analytics');
            const now = new Date();
            const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
            await Analytics.findOneAndUpdate(
                { date: today },
                { $inc: { leads: 1 } },
                { upsert: true }
            );
        } catch (err) {
            console.error("Failed to track meeting lead:", err);
        }

        // Fetch WhatsApp Number setting to return to frontend
        const waSetting = await Settings.findOne({ key: 'whatsapp_number' });
        const whatsappNumber = waSetting ? waSetting.value : null;

        res.status(201).json({
            success: true,
            data: request,
            whatsappNumber
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Get all meeting requests (Admin)
// @route   GET /api/meetings/admin
// @access  Private (Admin)
exports.getAllRequests = async (req, res) => {
    try {
        const cacheKey = 'all_meetings_admin';
        const cached = meetingCache.get(cacheKey);
        if (cached) return res.json(cached);

        const requests = await MeetingRequest.find()
            .populate('reseller', 'name email businessName mobileNumber')
            .sort({ createdAt: -1 })
            .lean();

        meetingCache.set(cacheKey, requests);
        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update request status
// @route   PUT /api/meetings/:id
// @access  Private (Admin)
exports.updateStatus = async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const request = await MeetingRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (status) request.status = status;
        if (adminNotes) request.adminNotes = adminNotes;

        await request.save();

        res.json(request);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Available Slots for a Date (Internal)
// @route   GET /api/meetings/slots/:date
exports.getAvailableSlots = async (req, res) => {
    try {
        const slots = await schedulingService.getAvailableSlots(req.params.date);
        res.json(slots);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Failed to fetch slots' });
    }
};

// @desc    Get count of pending requests
// @route   GET /api/meetings/admin/pending-count
// @access  Private (Admin)
exports.getPendingCount = async (req, res) => {
    try {
        const count = await MeetingRequest.countDocuments({ status: 'pending' });
        res.json({ count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
