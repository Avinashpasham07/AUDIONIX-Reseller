
const Order = require('../models/Order');
const Settings = require('../models/Settings');
const User = require('../models/User');
const Analytics = require('../models/Analytics');
const MeetingRequest = require('../models/MeetingRequest');
// const sendEmail = require('../utils/sendEmail'); // Commented out until verified, but User is critical

const NodeCache = require('node-cache');
const analyticsCache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

// @desc    Get Admin Analytics (Dashboard)
// @route   GET /api/admin/analytics
// @access  Private (Admin)
exports.getAnalytics = async (req, res) => {
    try {
        // Create a unique cache key based on query parameters
        const cacheKey = `admin_analytics_${JSON.stringify(req.query)}`;
        const cachedData = analyticsCache.get(cacheKey);

        if (cachedData) {
            // console.log("Serving Analytics from Cache");
            return res.json(cachedData);
        }

        const now = new Date();
        const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
        const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const yesterdayEnd = new Date(todayStart); yesterdayEnd.setMilliseconds(-1);
        const lastWeekStart = new Date(todayStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastMonthStart = new Date(todayStart); lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        const lastYearStart = new Date(todayStart); lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);

        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisYearStart = new Date(now.getFullYear(), 0, 1);

        // --- Optimized Aggregation for All-Time and Time-Range Stats ---
        const pipeline = [
            { $match: { orderStatus: { $ne: 'cancelled' } } },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            {
                $facet: {
                    allTime: [{ $group: { _id: null, revenue: { $sum: "$totalAmount" }, count: { $sum: 1 }, items: { $push: "$items" }, details: { $push: "$productDetails" } } }],
                    today: [{ $match: { createdAt: { $gte: todayStart } } }, { $group: { _id: null, revenue: { $sum: "$totalAmount" }, count: { $sum: 1 }, items: { $push: "$items" }, details: { $push: "$productDetails" } } }],
                    yesterday: [{ $match: { createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd } } }, { $group: { _id: null, revenue: { $sum: "$totalAmount" }, count: { $sum: 1 }, items: { $push: "$items" }, details: { $push: "$productDetails" } } }],
                    lastWeek: [{ $match: { createdAt: { $gte: lastWeekStart } } }, { $group: { _id: null, revenue: { $sum: "$totalAmount" }, count: { $sum: 1 }, items: { $push: "$items" }, details: { $push: "$productDetails" } } }],
                    lastMonth: [{ $match: { createdAt: { $gte: lastMonthStart } } }, { $group: { _id: null, revenue: { $sum: "$totalAmount" }, count: { $sum: 1 }, items: { $push: "$items" }, details: { $push: "$productDetails" } } }],
                    lastYear: [{ $match: { createdAt: { $gte: lastYearStart } } }, { $group: { _id: null, revenue: { $sum: "$totalAmount" }, count: { $sum: 1 }, items: { $push: "$items" }, details: { $push: "$productDetails" } } }],
                    thisMonth: [{ $match: { createdAt: { $gte: thisMonthStart } } }, { $group: { _id: null, revenue: { $sum: "$totalAmount" }, count: { $sum: 1 }, items: { $push: "$items" }, details: { $push: "$productDetails" } } }],
                    thisYear: [{ $match: { createdAt: { $gte: thisYearStart } } }, { $group: { _id: null, revenue: { $sum: "$totalAmount" }, count: { $sum: 1 }, items: { $push: "$items" }, details: { $push: "$productDetails" } } }],
                    topProducts: [
                        { $unwind: "$items" },
                        { $group: { _id: "$items.product", count: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } } } },
                        { $sort: { count: -1 } },
                        { $limit: 10 },
                        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'info' } },
                        { $unwind: "$info" },
                        { $project: { title: "$info.title", count: 1, revenue: 1 } }
                    ],
                    statusDistribution: [
                        { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
                    ]
                }
            }
        ];

        const [results] = await Order.aggregate(pipeline);

        // Helper to calculate profit from faceted results (requires matching items to details)
        // Note: Full Aggregation of profit is complex due to originalPrice being on Product.
        const calculateProfit = (data) => {
            if (!data || data.length === 0) return { count: 0, revenue: 0, profit: 0 };
            const entry = data[0];
            let totalCost = 0;
            const priceMap = {};

            // Safety Check for missing data
            if (entry.details) {
                entry.details.forEach(prodPack => {
                    if (prodPack) {
                        prodPack.forEach(p => {
                            if (p && p._id) priceMap[p._id.toString()] = p.originalPrice || 0;
                        });
                    }
                });
            }

            if (entry.items) {
                entry.items.forEach(itemPack => {
                    if (itemPack) {
                        itemPack.forEach(item => {
                            if (item && item.product) {
                                const cost = priceMap[item.product.toString()] || 0;
                                totalCost += cost * (item.quantity || 0);
                            }
                        });
                    }
                });
            }

            return {
                count: entry.count || 0,
                revenue: entry.revenue || 0,
                profit: (entry.revenue || 0) - totalCost
            };
        };

        // Recent Orders (Still needs populate for business names)
        const recentOrdersRaw = await Order.find({ orderStatus: { $ne: 'cancelled' } })
            .populate('resellerId', 'name businessName')
            .populate('items.product', 'originalPrice')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        const recentOrders = recentOrdersRaw.map(o => {
            const cost = o.items.reduce((acc, item) => acc + ((item.product?.originalPrice || 0) * item.quantity), 0);
            return {
                _id: o._id,
                orderId: o._id,
                customer: o.shippingAddress?.name || 'Unknown',
                reseller: o.resellerId?.businessName || o.resellerId?.name || 'Unknown',
                date: o.createdAt,
                status: o.orderStatus,
                amount: o.totalAmount,
                profit: (o.totalAmount || 0) - cost
            };
        });

        // Monthly Data (Aggregate for last 12 months)
        // --- 3. DYNAMIC TREND TIMELINE (Daily or Monthly) ---
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const { period, startDate, endDate } = req.query;
        let timelineData = [];
        let trendType = 'monthly';

        if (['lastWeek', 'today', 'yesterday', 'thisMonth'].includes(period)) trendType = 'daily';
        if (period === 'lastMonth') trendType = 'daily';
        if (period === 'custom') {
            const diff = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
            if (diff <= 35) trendType = 'daily';
        }

        if (trendType === 'daily') {
            const dailyStart = ['today', 'yesterday'].includes(period) ? yesterdayStart : (period === 'lastWeek' ? lastWeekStart : (period === 'thisMonth' ? thisMonthStart : (period === 'custom' ? new Date(startDate) : lastMonthStart)));
            const dailyEnd = period === 'custom' ? new Date(endDate) : new Date();

            const dailyTimeline = await Order.aggregate([
                { $match: { orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: dailyStart, $lte: dailyEnd } } },
                { $unwind: "$items" },
                { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'p' } },
                { $unwind: "$p" },
                {
                    $group: {
                        _id: {
                            day: { $dayOfMonth: "$createdAt" },
                            month: { $month: "$createdAt" },
                            year: { $year: "$createdAt" }
                        },
                        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                        cost: { $sum: { $multiply: ["$p.originalPrice", "$items.quantity"] } }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
            ]);

            const daysToCover = Math.ceil((dailyEnd - dailyStart) / (1000 * 60 * 60 * 24));
            for (let i = 0; i <= daysToCover; i++) {
                const d = new Date(dailyStart);
                d.setDate(d.getDate() + i);
                const day = d.getDate();
                const month = d.getMonth() + 1;
                const year = d.getFullYear();
                const label = `${day} ${monthNames[month - 1]}`;

                const existing = dailyTimeline.find(item => item._id.day === day && item._id.month === month && item._id.year === year);
                timelineData.push({
                    name: label,
                    revenue: existing ? existing.revenue : 0,
                    profit: existing ? (existing.revenue - existing.cost) : 0
                });
            }
        } else {
            const monthlyStart = period === 'thisYear' ? thisYearStart : (period === 'allTime' ? new Date(2025, 0, 1) : lastYearStart);
            const monthlyTimeline = await Order.aggregate([
                { $match: { orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: monthlyStart } } },
                { $unwind: "$items" },
                { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'p' } },
                { $unwind: "$p" },
                {
                    $group: {
                        _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                        cost: { $sum: { $multiply: ["$p.originalPrice", "$items.quantity"] } }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } }
            ]);

            const monthsToCover = 12;
            for (let i = monthsToCover - 1; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const m = d.getMonth() + 1;
                const y = d.getFullYear();
                const label = `${monthNames[m - 1]} ${y}`;

                const existing = monthlyTimeline.find(item => item._id.month === m && item._id.year === y);
                timelineData.push({
                    name: label,
                    revenue: existing ? existing.revenue : 0,
                    profit: existing ? (existing.revenue - existing.cost) : 0
                });
            }
        }

        // Convert status distribution array to object
        const statusMap = {};
        results.statusDistribution.forEach(s => { statusMap[s._id] = s.count; });

        // Visitor Analytics (Consolidated Aggregates)
        const getAggs = async (start, end) => {
            const q = {};
            if (start) q.date = { $gte: start };
            if (end) q.date = { ...q.date, $lte: end };
            const data = await Analytics.aggregate([
                { $match: q },
                {
                    $group: {
                        _id: null,
                        uniqueVisitors: { $sum: "$uniqueVisitors" },
                        totalPageViews: { $sum: "$totalPageViews" },
                        newRegistrations: { $sum: "$registrations" },
                        leads: { $sum: "$leads" },
                        totalOrders: { $sum: "$totalOrders" }
                    }
                }
            ]);
            return data[0] || { uniqueVisitors: 0, totalPageViews: 0, newRegistrations: 0, leads: 0, totalOrders: 0 };
        };

        const analyticsData = {
            allTime: await getAggs(),
            today: await getAggs(todayStart),
            yesterday: await getAggs(yesterdayStart, yesterdayEnd),
            lastWeek: await getAggs(lastWeekStart),
            lastMonth: await getAggs(lastMonthStart),
            lastYear: await getAggs(lastYearStart)
        };

        const responseData = {
            allTime: calculateProfit(results.allTime),
            today: calculateProfit(results.today),
            yesterday: calculateProfit(results.yesterday),
            lastWeek: calculateProfit(results.lastWeek),
            lastMonth: calculateProfit(results.lastMonth),
            lastYear: calculateProfit(results.lastYear),
            thisMonth: calculateProfit(results.thisMonth),
            thisYear: calculateProfit(results.thisYear),
            topProducts: results.topProducts,
            recentOrders,
            monthlyData: timelineData,
            statusDistribution: statusMap,
            analytics: analyticsData
        };

        // Save to cache
        analyticsCache.set(cacheKey, responseData);

        console.log(`[ADMIN ANALYTICS] Result: ${timelineData.length} entries found, ${recentOrders.length} recent orders.`);

        return res.json(responseData);

    } catch (error) {
        console.error("Analytics Pipeline Error:", error);
        res.status(500).json({ message: 'Analytics calculation failed' });
    }
};

// @desc    Get System Settings (e.g. UPI QR)
// @route   GET /api/admin/settings
// @access  Public (or semi-private for checkout)
exports.getSettings = async (req, res) => {
    try {
        const settings = await Settings.find({});
        const formatted = {};
        settings.forEach(s => formatted[s.key] = s.value);
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update System Settings
// @route   PUT /api/admin/settings
// @access  Private (Admin)
exports.updateSettings = async (req, res) => {
    console.log("UPDATE SETTINGS BODY:", req.body);
    try {
        const { key, value, description } = req.body;

        let setting = await Settings.findOne({ key });
        if (setting) {
            setting.value = value;
            if (description) setting.description = description;
            setting.updatedAt = Date.now();
            await setting.save();
        } else {
            setting = await Settings.create({ key, value, description });
        }

        res.json(setting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all resellers (or filter by status)
// @route   GET /api/admin/resellers
// @access  Private (Admin)
exports.getResellers = async (req, res) => {
    try {
        const { status } = req.query;
        // Cache key
        const cacheKey = `resellers_list_${status || 'all'}`;
        const cached = analyticsCache.get(cacheKey);

        if (cached) return res.json(cached);

        let query = { role: 'reseller' };

        if (status) {
            query.accountStatus = status;
        }

        const resellers = await User.find(query).select('-password').lean();

        analyticsCache.set(cacheKey, resellers, 120);
        res.json(resellers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve or Reject reseller
// @route   PUT /api/admin/resellers/:id/status
// @access  Private (Admin)
exports.updateResellerStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'approved' or 'rejected'
        const reseller = await User.findById(req.params.id);

        if (!reseller || reseller.role !== 'reseller') {
            return res.status(404).json({ message: 'Reseller not found' });
        }

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        reseller.accountStatus = status;
        await reseller.save();

        // Send Email Notification
        if (status === 'approved') {
            try {
                await sendEmail({
                    email: reseller.email,
                    subject: 'Audionix Account Approved',
                    message: `Hello ${reseller.name},\n\nYour reseller account has been approved! You can now login and start listing products.\n\nLogin here: http://localhost:3000/login\n\n- The Audionix Team`
                });
            } catch (err) {
                console.error('Email send failed:', err);
                // We don't want to crash the request if email fails
            }
        }

        res.json({ message: `Reseller ${status}`, reseller });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Get subscription requests (filter by status)
// @route   GET /api/admin/subscription-requests
// @access  Private (Admin)
exports.getSubscriptionRequests = async (req, res) => {
    try {
        console.log('[DEBUG] getSubscriptionRequests called. Query:', req.query);
        const { status } = req.query;
        // Cache key based on filter status
        const cacheKey = `sub_requests_${status || 'all'}`;
        console.log('[DEBUG] Cache Key:', cacheKey);

        const cached = analyticsCache.get(cacheKey);

        if (cached) {
            console.log('[DEBUG] Serving from cache');
            return res.json(JSON.parse(cached));
        }

        const filter = status ? { 'subscriptionRequest.status': status } : { 'subscriptionRequest.status': { $ne: null } };
        console.log('[DEBUG] DB Filter:', filter);

        const users = await User.find(filter)
            .select('name email mobileNumber subscriptionRequest subscriptionExpiry subscriptionPlan subscriptionHistory')
            .lean();

        console.log('[DEBUG] DB Fetch success. Users found:', users.length);

        analyticsCache.set(cacheKey, JSON.stringify(users), 120); // Cache string to avoid deep clone issues
        console.log('[DEBUG] Cache set success');

        res.json(users);
    } catch (error) {
        console.error('[DEBUG] Error in getSubscriptionRequests:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve or Reject Subscription Upgrade
// @route   PUT /api/admin/subscription-requests/:userId
// @access  Private (Admin)
exports.handleSubscriptionRequest = async (req, res) => {
    try {
        const { status, expiryMonths = 1 } = req.body; // status: 'approved' | 'rejected'
        const user = await User.findById(req.params.userId);

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Update Request Status
        user.subscriptionRequest.status = status;

        // Create History Entry
        const historyEntry = {
            plan: 'paid',
            status: status,
            transactionId: user.subscriptionRequest.transactionId,
            screenshotUrl: user.subscriptionRequest.screenshotUrl,
            processedAt: Date.now()
        };

        if (status === 'approved') {
            user.subscriptionPlan = 'paid';
            // Set Expiry: Exactly 1 Month from now
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1); // Fixed 1 month
            user.subscriptionExpiry = expiryDate;

            historyEntry.startDate = new Date();
            historyEntry.expiryDate = expiryDate;
        }

        // Push to History
        user.subscriptionHistory.push(historyEntry);

        await user.save();
        res.json({ message: `Request ${status}`, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Manually Revoke/Downgrade Subscription
// @route   PUT /api/admin/subscription-revoke/:userId
// @access  Private (Admin)
exports.revokeSubscription = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const historyEntry = {
            plan: 'free',
            status: 'revoked',
            processedAt: Date.now(),
            notes: 'Manually revoked by admin'
        };

        // Push historical record of revocation
        user.subscriptionHistory.push(historyEntry);

        user.subscriptionPlan = 'free';
        user.subscriptionExpiry = null;
        user.subscriptionRequest = { status: null }; // Reset request status

        await user.save();
        res.json({ message: 'Subscription revoked (downgraded to Free)', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Detailed Analytics (Drill-down)
// @route   GET /api/admin/analytics/details
// @access  Private (Admin)
exports.getAnalyticsDetails = async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query; // type: 'registrations' | 'orders' | 'leads'

        // Determine Date Range
        const now = new Date();
        let start = new Date(0); // Default all time
        let end = new Date();

        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        }

        let data = [];

        if (type === 'registrations') {
            data = await User.find({
                createdAt: { $gte: start, $lte: end }
            }).select('name email mobileNumber createdAt role businessDetails')
                .sort({ createdAt: -1 });

            data = data.map(u => ({
                id: u._id,
                col1: u.name, // Name
                col2: u.email, // Email
                col3: u.mobileNumber || 'N/A', // Phone
                col4: new Date(u.createdAt).toLocaleDateString('en-GB'), // Date
                extra: u.role
            }));

        } else if (type === 'orders') {
            const orders = await Order.find({
                createdAt: { $gte: start, $lte: end },
                orderStatus: { $ne: 'cancelled' }
            }).populate('resellerId', 'name businessName mobileNumber email')
                .sort({ createdAt: -1 });

            data = orders.map(o => ({
                id: o._id,
                col1: o.shippingAddress?.name || 'Unknown', // Customer Name
                col2: o.resellerId?.businessName || o.resellerId?.name || 'Unknown', // Reseller
                col3: o.resellerId?.mobileNumber || o.shippingAddress?.phone || 'N/A', // Reseller Phone
                col4: `₹${o.totalAmount}`, // Amount
                extra: o.orderStatus
            }));
        } else if (type === 'leads') {
            const leads = await MeetingRequest.find({
                createdAt: { $gte: start, $lte: end }
            }).populate('reseller', 'name businessName mobileNumber email')
                .sort({ createdAt: -1 });

            data = leads.map(l => ({
                id: l._id,
                col1: l.reseller ? l.reseller.name : (l.guestName || 'Guest'), // Name
                col2: l.reseller ? l.reseller.email : 'N/A', // Email
                col3: l.reseller ? l.reseller.mobileNumber : (l.guestPhone || 'N/A'), // Phone
                col4: new Date(l.createdAt).toLocaleDateString('en-GB'), // Date
                extra: l.status // Status
            }));
        }

        res.json(data);

    } catch (error) {
        console.error("Analytics Detail Error:", error);
        res.status(500).json({ message: 'Failed to fetch details' });
    }
};

// @desc    Get all employees
// @route   GET /api/admin/employees
// @access  Private (Admin)
exports.getEmployees = async (req, res) => {
    try {
        const employees = await User.find({ role: 'employee' }).select('-password');
        res.json(employees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create new employee
// @route   POST /api/admin/employees
// @access  Private (Admin)
exports.createEmployee = async (req, res) => {
    try {
        const { name, email, password, mobileNumber, permissions } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const employee = await User.create({
            name,
            email,
            password,
            mobileNumber: mobileNumber || 'N/A', // Set default if missing
            role: 'employee',
            permissions: permissions || [],
            accountStatus: 'approved'
        });

        res.status(201).json({
            _id: employee._id,
            name: employee.name,
            email: employee.email,
            role: employee.role,
            permissions: employee.permissions
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update employee permissions
// @route   PUT /api/admin/employees/:id/permissions
// @access  Private (Admin)
exports.updateEmployeePermissions = async (req, res) => {
    try {
        const { permissions } = req.body;
        const employee = await User.findById(req.params.id);

        if (employee && employee.role === 'employee') {
            employee.permissions = permissions;
            await employee.save();
            res.json({ message: 'Permissions updated successfully', permissions: employee.permissions });
        } else {
            res.status(404).json({ message: 'Employee not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete employee
// @route   DELETE /api/admin/employees/:id
// @access  Private (Admin)
exports.deleteEmployee = async (req, res) => {
    try {
        const employee = await User.findById(req.params.id);

        if (employee && employee.role === 'employee') {
            await employee.deleteOne();
            res.json({ message: 'Employee removed' });
        } else {
            res.status(404).json({ message: 'Employee not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Inactive Resellers (Inactive > 30 Days)
// @route   GET /api/admin/inactive-users
// @access  Private (Admin)
exports.getInactiveResellers = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Find resellers who are NOT 'inactive' yet, but haven't logged in OR ordered in 30 days
        // Or users who have never logged in/ordered and created > 30 days ago
        const inactiveUsers = await User.find({
            role: 'reseller',
            accountStatus: { $ne: 'inactive' },
            $and: [
                {
                    $or: [
                        { lastLogin: { $lt: thirtyDaysAgo } },
                        { lastLogin: { $exists: false } }
                    ]
                },
                {
                    $or: [
                        { lastOrderDate: { $lt: thirtyDaysAgo } },
                        { lastOrderDate: { $exists: false } }
                    ]
                },
                { createdAt: { $lt: thirtyDaysAgo } } // Ensure they are at least 30 days old
            ]
        }).select('_id name email mobileNumber lastLogin lastOrderDate createdAt');

        res.json(inactiveUsers);
    } catch (error) {
        console.error("Fetch Inactive Users Error:", error);
        res.status(500).json({ message: 'Failed to fetch inactive users' });
    }
};

// @desc    Revoke Reseller Access (Manual)
// @route   PUT /api/admin/revoke-user/:id
// @access  Private (Admin)
exports.revokeReseller = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.accountStatus = 'inactive';
        await user.save();

        res.json({ message: `User ${user.name} has been revoked/deactivated.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
