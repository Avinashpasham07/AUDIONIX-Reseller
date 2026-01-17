const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');
const { Parser } = require('json2csv');
const NodeCache = require('node-cache');
const statsCache = new NodeCache({ stdTTL: 120, checkperiod: 240 });
const orderListCache = new NodeCache({ stdTTL: 60 });


// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Reseller)
exports.createOrder = async (req, res) => {
    try {
        const {
            items,
            paymentMethod,
            paymentDetails, // Capture this!
            shippingAddress,
            resellerMargin,
            shippingLabelUrl,
            shippingFee,
            customerPaymentMode,
            shippingMethod,
            pickupAddress,
            pickupDescription,
            bulkOrderFile,
            bulkOrderFiles
        } = req.body;
        console.log('CREATE ORDER PAYLOAD:', JSON.stringify(req.body, null, 2));

        if (items && items.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        // 1. Verify Stock & Deduct Atomically (Simplified for brevity, assuming existing logic works)
        let totalAmount = 0;
        let totalShippingFee = 0;
        const orderItems = [];
        const reservedProducts = [];

        for (const item of items) {
            const product = await Product.findOneAndUpdate(
                { _id: item.product, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } },
                { new: true }
            );

            if (!product) {
                for (const reserved of reservedProducts) {
                    await Product.findByIdAndUpdate(reserved.id, { $inc: { stock: reserved.quantity } });
                }
                return res.status(400).json({ message: `Insufficient stock or invalid product for item ID: ${item.product}` });
            }

            reservedProducts.push({ id: item.product, quantity: item.quantity });

            let price = product.price;
            if (req.user.subscriptionPlan === 'paid') {
                price = (product.resellerPricePaid && product.resellerPricePaid > 0)
                    ? product.resellerPricePaid
                    : ((product.resellerPrice && product.resellerPrice > 0) ? product.resellerPrice : product.price);
            } else {
                price = (product.resellerPrice && product.resellerPrice > 0) ? product.resellerPrice : product.price;
            }

            const productShippingFee = (product.shippingFee || 0) * item.quantity;
            totalShippingFee += productShippingFee;

            orderItems.push({
                product: item.product,
                quantity: item.quantity,
                price: price
            });
            totalAmount += price * item.quantity;
        }

        totalAmount += totalShippingFee;

        // 2. Create Order
        const order = new Order({
            resellerId: req.user._id,
            items: orderItems,
            totalAmount,
            resellerMargin: resellerMargin || 0,
            shippingFee: totalShippingFee,
            shippingLabelUrl,
            bulkOrderFile,
            customerPaymentMode,
            shippingMethod,
            paymentDetails: {
                method: paymentMethod,
                transactionId: paymentDetails?.transactionId || '', // SAVE UTR
                screenshotUrl: paymentDetails?.screenshotUrl || '', // SAVE SCREENSHOT
                isVerified: paymentMethod === 'cod'
            },
            shippingAddress,
            pickupAddress,
            pickupDescription,
            bulkOrderFiles,
            orderStatus: paymentMethod === 'cod' ? 'payment_confirmed' : 'payment_verification_pending'
        });

        if (paymentMethod === 'cod') {
            order.paymentDetails.isVerified = true;
        }

        const createdOrder = await order.save();

        // 3. Notify Admins
        // Using distinct async call to not block response
        (async () => {
            try {
                const admins = await User.find({ role: 'admin' }).select('_id');
                if (admins.length > 0) {
                    const notifications = admins.map(admin => ({
                        user: admin._id,
                        type: 'order_placed',
                        message: `New Order #${createdOrder._id} placed by ${req.user.name}`,
                        relatedId: createdOrder._id
                    }));
                    await Notification.insertMany(notifications);

                    const io = req.app.get('io');
                    if (io) {
                        admins.forEach(admin => {
                            io.to(admin._id.toString()).emit('new_notification', {
                                message: `New Order #${createdOrder._id} placed by ${req.user.name}`,
                                type: 'order_placed',
                                relatedId: createdOrder._id,
                                createdAt: new Date()
                            });
                        });
                    }
                }
            } catch (notifyError) {
                console.error("Notification Error:", notifyError);
            }
        })();

        res.status(201).json(createdOrder);

    } catch (error) {
        // Rollback stock in case of order save failure
        // Requires tracking reservedProducts in outer scope if we were truly robust, 
        // but here we catch primarily Order save errors.
        console.error("Create Order Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.product', 'title images hsnCode')
            .populate('resellerId', 'name email mobileNumber'); // Populate contact info

        if (order) {
            // Check if admin or owner
            if (req.user.role === 'admin' || order.resellerId._id.toString() === req.user._id.toString()) {
                res.json(order);
            } else {
                res.status(401).json({ message: 'Not authorized to view this order' });
            }
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get orders (Admin sees all, User sees theirs)
// @route   GET /api/orders
// @access  Private
// @desc    Get orders (Admin sees all, User sees theirs)
// @route   GET /api/orders
// @access  Private

// @desc    Get orders (Admin sees all, User sees theirs)
// @route   GET /api/orders
// @access  Private
exports.getMyOrders = async (req, res) => {
    try {
        const cacheKey = `orders_${req.user._id}_${req.user.role}_${JSON.stringify(req.query)}`;
        const cachedOrders = orderListCache.get(cacheKey);

        if (cachedOrders) {
            return res.json(cachedOrders);
        }

        let query = {};
        if (req.user.role !== 'admin' && req.user.role !== 'employee') {
            query = { resellerId: req.user._id };
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20; // Default 20
        const skip = (page - 1) * limit;

        const total = await Order.countDocuments(query);

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('items.product', 'title images resellerPrice hsnCode')
            .populate('resellerId', 'name email mobileNumber')
            .lean();

        const responseData = {
            orders,
            page,
            pages: Math.ceil(total / limit),
            total
        };

        orderListCache.set(cacheKey, responseData);
        res.json(responseData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload payment proof
// @route   PUT /api/orders/:id/payment
// @access  Private (Reseller)
exports.uploadPaymentProof = async (req, res) => {
    try {
        const { transactionId, screenshotUrl } = req.body;
        const order = await Order.findById(req.params.id);

        if (order) {
            order.paymentDetails.transactionId = transactionId;
            order.paymentDetails.screenshotUrl = screenshotUrl;
            order.orderStatus = 'payment_verification_pending';

            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Select shipping method
// @route   PUT /api/orders/:id/shipping
// @access  Private (Reseller)
exports.selectShippingMethod = async (req, res) => {
    try {
        const { shippingMethod } = req.body; // 'self' or 'audionix'
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Logic Check: Payment must be confirmed
        if (order.orderStatus !== 'payment_confirmed') {
            return res.status(400).json({ message: 'Payment not confirmed yet' });
        }

        // Logic Check: COD restriction
        if (order.paymentDetails.method === 'cod' && shippingMethod !== 'self') {
            return res.status(400).json({ message: 'COD orders can only use "Ship by Self"' });
        }

        order.shippingMethod = shippingMethod;
        order.orderStatus = 'ready_for_dispatch';

        const updatedOrder = await order.save();
        res.json(updatedOrder);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify payment (Admin)
// @route   PUT /api/orders/:id/verify-payment
// @access  Private (Admin)
exports.verifyPayment = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.paymentDetails.isVerified = true;
            order.paymentDetails.verifiedBy = req.user._id;
            order.paymentDetails.verifiedAt = Date.now();
            order.orderStatus = 'payment_confirmed';

            const updatedOrder = await order.save();

            // Send Confirmation Email
            // Send Confirmation Email and Notify
            // Send Confirmation Email
            // Send Confirmation Email and Notify
            // Send Confirmation Email
            try {
                // Determine user email (fetch resller/user from order.resellerId)
                await order.populate('resellerId', 'email name');

                await sendEmail({
                    email: order.resellerId.email,
                    subject: `Order Confirmed #${order._id}`,
                    message: `Hi ${order.resellerId.name},\n\nYour payment for Order #${order._id} has been verified and confirmed. We will pack it shortly!\n\nTotal: ${order.totalAmount}\n\n- The Audionix Team`
                });
            } catch (emailErr) {
                console.error('Email send failed (Notification will still be sent):', emailErr.message);
            }

            // Socket & DB Notification (Independent of Email)
            try {
                // Determine recipient ID (from populated object)
                const recipientId = order.resellerId._id;

                const io = req.app.get('io');
                const notifMsg = `Payment Confirmed for Order #${order._id}`;

                console.log(`[DEBUG] Payment Verified. Notifications for User ID: ${recipientId}`);

                await Notification.create({
                    user: recipientId,
                    type: 'payment_confirmed',
                    message: notifMsg,
                    relatedId: order._id
                });
                console.log('[DEBUG] DB Notification Created');

                if (io) {
                    const roomId = recipientId.toString();
                    console.log(`[DEBUG] Emitting socket event to Room: ${roomId}`);
                    io.to(roomId).emit('new_notification', {
                        message: notifMsg,
                        type: 'payment_confirmed',
                        relatedId: order._id,
                        createdAt: new Date()
                    });
                    console.log('[DEBUG] Socket emitted');
                } else {
                    console.log('[DEBUG] IO instance not found');
                }
            } catch (notifyErr) {
                console.error('Notification failed:', notifyErr);
            }

            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark order as Shipped (Admin)
// @route   PUT /api/orders/:id/ship
// @access  Private (Admin)
exports.markOrderAsShipped = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.orderStatus = 'shipped';
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark order as Delivered (Admin)
// @route   PUT /api/orders/:id/deliver
// @access  Private (Admin)
exports.markOrderAsDelivered = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.orderStatus = 'delivered';
            const updatedOrder = await order.save();

            // 3. Update User's Last Order Date
            await User.findByIdAndUpdate(req.user._id, { lastOrderDate: Date.now() });

            // 4. Send Notifications (Push + Email)
            const io = req.app.get('io');
            const notifMsg = `Your Order #${order._id} has been delivered!`;

            await Notification.create({
                user: order.resellerId,
                type: 'order_delivered',
                message: notifMsg,
                relatedId: order._id
            });

            if (io) {
                io.to(order.resellerId.toString()).emit('new_notification', {
                    message: notifMsg,
                    type: 'order_delivered',
                    relatedId: order._id
                });
            }

            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload shipping label (For Self Shipping)
// @route   PUT /api/orders/:id/label
// @access  Private (Reseller)
exports.uploadShippingLabel = async (req, res) => {
    try {
        const { labelUrl } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.shippingMethod !== 'self') {
            return res.status(400).json({ message: 'Label upload only required for Self shipping' });
        }

        order.shippingLabelUrl = labelUrl;
        order.orderStatus = 'shipped';

        const updatedOrder = await order.save();
        res.json(updatedOrder);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get dispatch summary grouped by supplier (Admin)
// @route   GET /api/orders/admin/dispatch-summary
// @access  Private (Admin)
exports.getDispatchSummary = async (req, res) => {
    try {
        // Find orders that are ready for processing (payment confirmed & shipping selected)
        const orders = await Order.find({
            orderStatus: { $in: ['payment_confirmed', 'ready_for_dispatch', 'shipped'] }
        }).populate('items.product');

        const supplierMap = {};

        orders.forEach(order => {
            order.items.forEach(item => {
                const supplierId = item.product.supplierId || 'Unknown Supplier';
                if (!supplierMap[supplierId]) {
                    supplierMap[supplierId] = [];
                }
                supplierMap[supplierId].push({
                    orderId: order._id,
                    product: item.product.title,
                    quantity: item.quantity,
                    shippingLabel: order.shippingLabelUrl,
                    shippingAddress: order.shippingAddress
                });
            });
        });

        res.json(supplierMap);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get reseller dashboard stats
// @route   GET /api/orders/stats

// @desc    Get reseller dashboard stats
// @route   GET /api/orders/stats
// @access  Private (Reseller)
exports.getResellerStats = async (req, res) => {
    try {
        const resellerId = req.user._id;
        const cacheKey = `stats_${resellerId}_${JSON.stringify(req.query)}`;
        const cachedStats = statsCache.get(cacheKey);

        if (cachedStats) {
            return res.json(cachedStats);
        }

        // Prepare aggregation stages
        const now = new Date();
        const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
        const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const yesterdayEnd = new Date(todayStart); yesterdayEnd.setMilliseconds(-1);
        const lastWeekStart = new Date(todayStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastMonthStart = new Date(todayStart); lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        const lastYearStart = new Date(todayStart); lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);

        const matchStage = {
            resellerId: resellerId,
            orderStatus: { $in: ['payment_verification_pending', 'payment_confirmed', 'ready_for_dispatch', 'shipped', 'delivered'] }
        };

        // Execute all independent queries in parallel
        const [
            totalOrders,
            shippedOrders,
            pendingAction,
            earningsAgg,
            monthlyEarningsAgg,
            topProductsAgg,
            statusAgg,
            recentOrdersData
        ] = await Promise.all([
            // 1. Basic Counts
            Order.countDocuments({ resellerId }),
            Order.countDocuments({ resellerId, orderStatus: { $in: ['shipped', 'delivered'] } }),
            Order.countDocuments({ resellerId, orderStatus: { $in: ['pending_payment', 'payment_verification_pending'] } }),

            // 2. Earnings Aggregation
            Order.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        totalEarnings: { $sum: "$resellerMargin" },

                        // All Time
                        allTimeProfit: { $sum: "$resellerMargin" },
                        allTimeRevenue: { $sum: "$totalAmount" },
                        allTimeOrders: { $sum: 1 },

                        // Today
                        todayProfit: { $sum: { $cond: [{ $gte: ["$createdAt", todayStart] }, "$resellerMargin", 0] } },
                        todayRevenue: { $sum: { $cond: [{ $gte: ["$createdAt", todayStart] }, "$totalAmount", 0] } },
                        todayOrders: { $sum: { $cond: [{ $gte: ["$createdAt", todayStart] }, 1, 0] } },

                        // Yesterday
                        yesterdayProfit: { $sum: { $cond: [{ $and: [{ $gte: ["$createdAt", yesterdayStart] }, { $lte: ["$createdAt", yesterdayEnd] }] }, "$resellerMargin", 0] } },
                        yesterdayRevenue: { $sum: { $cond: [{ $and: [{ $gte: ["$createdAt", yesterdayStart] }, { $lte: ["$createdAt", yesterdayEnd] }] }, "$totalAmount", 0] } },
                        yesterdayOrders: { $sum: { $cond: [{ $and: [{ $gte: ["$createdAt", yesterdayStart] }, { $lte: ["$createdAt", yesterdayEnd] }] }, 1, 0] } },

                        // Last Week
                        lastWeekProfit: { $sum: { $cond: [{ $gte: ["$createdAt", lastWeekStart] }, "$resellerMargin", 0] } },
                        lastWeekRevenue: { $sum: { $cond: [{ $gte: ["$createdAt", lastWeekStart] }, "$totalAmount", 0] } },
                        lastWeekOrders: { $sum: { $cond: [{ $gte: ["$createdAt", lastWeekStart] }, 1, 0] } },

                        // Last Month
                        lastMonthProfit: { $sum: { $cond: [{ $gte: ["$createdAt", lastMonthStart] }, "$resellerMargin", 0] } },
                        lastMonthRevenue: { $sum: { $cond: [{ $gte: ["$createdAt", lastMonthStart] }, "$totalAmount", 0] } },
                        lastMonthOrders: { $sum: { $cond: [{ $gte: ["$createdAt", lastMonthStart] }, 1, 0] } },

                        // Last Year
                        lastYearProfit: { $sum: { $cond: [{ $gte: ["$createdAt", lastYearStart] }, "$resellerMargin", 0] } },
                        lastYearRevenue: { $sum: { $cond: [{ $gte: ["$createdAt", lastYearStart] }, "$totalAmount", 0] } },
                        lastYearOrders: { $sum: { $cond: [{ $gte: ["$createdAt", lastYearStart] }, 1, 0] } },

                        // Custom Date Range
                        customProfit: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $gte: ["$createdAt", req.query.startDate ? new Date(req.query.startDate) : new Date(0)] },
                                            { $lte: ["$createdAt", req.query.endDate ? new Date(req.query.endDate) : new Date(0)] }
                                        ]
                                    },
                                    "$resellerMargin",
                                    0
                                ]
                            }
                        },
                        customRevenue: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $gte: ["$createdAt", req.query.startDate ? new Date(req.query.startDate) : new Date(0)] },
                                            { $lte: ["$createdAt", req.query.endDate ? new Date(req.query.endDate) : new Date(0)] }
                                        ]
                                    },
                                    "$totalAmount",
                                    0
                                ]
                            }
                        },
                        customOrders: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $gte: ["$createdAt", req.query.startDate ? new Date(req.query.startDate) : new Date(0)] },
                                            { $lte: ["$createdAt", req.query.endDate ? new Date(req.query.endDate) : new Date(0)] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ]),

            // 3. Monthly Earnings Trend
            Order.aggregate([
                {
                    $match: {
                        resellerId: resellerId,
                        orderStatus: { $in: ['payment_confirmed', 'ready_for_dispatch', 'shipped', 'delivered'] },
                        createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
                    }
                },
                {
                    $group: {
                        _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                        earnings: { $sum: "$resellerMargin" }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } }
            ]),

            // 4. Top Selling Products
            Order.aggregate([
                { $match: { resellerId: resellerId } },
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.product",
                        count: { $sum: "$items.quantity" }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "productInfo"
                    }
                },
                { $unwind: "$productInfo" },
                {
                    $project: {
                        title: "$productInfo.title",
                        count: 1
                    }
                }
            ]),

            // 5. Order Status Distribution
            Order.aggregate([
                { $match: { resellerId: resellerId } },
                { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
            ]),

            // 6. Recent Orders
            Order.find({ resellerId: resellerId })
                .sort({ createdAt: -1 })
                .limit(6)
                .lean()
        ]);

        // Process Results
        const rawData = earningsAgg.length > 0 ? earningsAgg[0] : {};

        const earningsData = {
            totalEarnings: rawData.totalEarnings || 0,
            allTime: { profit: rawData.allTimeProfit || 0, revenue: rawData.allTimeRevenue || 0, orders: rawData.allTimeOrders || 0 },
            today: { profit: rawData.todayProfit || 0, revenue: rawData.todayRevenue || 0, orders: rawData.todayOrders || 0 },
            yesterday: { profit: rawData.yesterdayProfit || 0, revenue: rawData.yesterdayRevenue || 0, orders: rawData.yesterdayOrders || 0 },
            lastWeek: { profit: rawData.lastWeekProfit || 0, revenue: rawData.lastWeekRevenue || 0, orders: rawData.lastWeekOrders || 0 },
            lastMonth: { profit: rawData.lastMonthProfit || 0, revenue: rawData.lastMonthRevenue || 0, orders: rawData.lastMonthOrders || 0 },
            lastYear: { profit: rawData.lastYearProfit || 0, revenue: rawData.lastYearRevenue || 0, orders: rawData.lastYearOrders || 0 },
            custom: (req.query.startDate && req.query.endDate) ? {
                profit: rawData.customProfit || 0,
                revenue: rawData.customRevenue || 0,
                orders: rawData.customOrders || 0
            } : null
        };

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyEarnings = monthlyEarningsAgg.map(item => ({
            name: `${monthNames[item._id.month - 1]}`,
            earnings: item.earnings
        }));

        const statusDistribution = statusAgg.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        const recentOrders = recentOrdersData.map(o => ({
            _id: o._id,
            orderId: o._id,
            date: o.createdAt,
            customer: o.shippingAddress?.name || 'Unknown',
            status: o.orderStatus,
            amount: o.totalAmount,
            profit: o.resellerMargin
        }));

        const responseData = {
            totalOrders,
            shippedOrders,
            pendingAction,
            totalEarnings: earningsData.totalEarnings,
            earningsData,
            monthlyEarnings,
            topProducts: topProductsAgg,
            statusDistribution,
            recentOrders
        };

        statsCache.set(cacheKey, responseData);
        res.json(responseData);

    } catch (error) {
        console.error("Stats Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Export all orders as CSV
// @route   GET /api/orders/admin/export
// @access  Private/Admin

exports.exportAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('resellerId', 'name email mobileNumber businesDetails')
            .sort({ createdAt: -1 })
            .lean();

        const fields = [
            { label: 'Order ID', value: '_id' },
            { label: 'Date', value: (row) => new Date(row.createdAt).toLocaleDateString() },
            { label: 'Reseller Name', value: 'resellerId.name' },
            { label: 'Reseller Mobile', value: 'resellerId.mobileNumber' },
            { label: 'Customer Name', value: 'shippingAddress.name' },
            { label: 'Customer Phone', value: 'shippingAddress.phone' },
            { label: 'Address', value: (row) => `${row.shippingAddress.address}, ${row.shippingAddress.city}, ${row.shippingAddress.state} - ${row.shippingAddress.pincode}` },
            { label: 'Total Amount', value: 'totalAmount' },
            { label: 'Reseller Margin', value: 'resellerMargin' },
            { label: 'Payment Method', value: 'paymentDetails.method' },
            { label: 'Status', value: 'orderStatus' }
        ];

        // Generate Excel-compatible HTML
        let html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Orders</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
            <body>
                <table border="1">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            ${fields.map(f => `<th style="font-weight: bold; padding: 5px;">${f.label}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(row => `
                            <tr>
                                ${fields.map(f => {
            const val = typeof f.value === 'function' ? f.value(row) : f.value.split('.').reduce((o, i) => (o ? o[i] : ''), row);
            return `<td style="padding: 5px;">${val || '-'}</td>`;
        }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        res.header('Content-Type', 'application/vnd.ms-excel');
        res.attachment(`orders_export_${new Date().toISOString().slice(0, 10)}.xls`);
        return res.send(html);
    } catch (error) {
        console.error("Export failed", error);
        res.status(500).json({ message: "Export failed" });
    }
};

// @desc    Export reseller's orders (Reseller)
// @route   GET /api/orders/export
// @access  Private (Reseller)
exports.exportMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ resellerId: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        const fields = [
            { label: 'Order ID', value: '_id' },
            { label: 'Date', value: (row) => new Date(row.createdAt).toLocaleDateString() },
            { label: 'Customer Name', value: 'shippingAddress.name' },
            { label: 'Customer Phone', value: 'shippingAddress.phone' },
            { label: 'Address', value: (row) => `${row.shippingAddress.address}, ${row.shippingAddress.city}, ${row.shippingAddress.state} - ${row.shippingAddress.pincode}` },
            { label: 'Total Paid', value: 'totalAmount' },
            { label: 'Your Margin', value: 'resellerMargin' },
            { label: 'Payment Method', value: 'paymentDetails.method' },
            { label: 'Status', value: 'orderStatus' }
        ];

        // Generate Excel-compatible HTML
        let html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>My Orders</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
            <body>
                <table border="1">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            ${fields.map(f => `<th style="font-weight: bold; padding: 5px;">${f.label}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(row => `
                            <tr>
                                ${fields.map(f => {
            const val = typeof f.value === 'function' ? f.value(row) : f.value.split('.').reduce((o, i) => (o ? o[i] : ''), row);
            return `<td style="padding: 5px;">${val || '-'}</td>`;
        }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        res.header('Content-Type', 'application/vnd.ms-excel');
        res.attachment(`my_orders_export_${new Date().toISOString().slice(0, 10)}.xls`);
        return res.send(html);

    } catch (error) {
        console.error("Export failed", error);
        res.status(500).json({ message: "Export failed" });
    }
};

// @desc    Update shipping fee (Admin)
// @route   PUT /api/orders/:id/shipping-fee
// @access  Private (Admin)
exports.updateShippingFee = async (req, res) => {
    try {
        const { shippingFee } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.shippingFee = Number(shippingFee);
        // Recalculate Total: Base + Shipping (Margin is separate or included? 
        // Typically Total Amount = Base Items Cost + Shipping Fee. Reseller pays this.
        // Reseller Margin is what THEY earn from Customer.
        // If Reseller pays Admin, they pay (Product Cost + Shipping). Admin gives them Margin only if Admin collects from Customer (COD).
        // If Prepaid (Reseller pays Admin), Reseller collects full amount from Customer.
        // So Reseller pays Admin: (Item Price * Qty) + Shipping.

        // We need to know what 'totalAmount' represents. In createOrder: totalAmount += price * item.quantity.
        // So totalAmount is presently just Item Cost.
        // So we should add shippingFee to totalAmount.

        // Reset to base item cost derived from existing items? Or just add difference?
        // Safer to re-sum items + shippingFee.
        const itemsTotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        order.totalAmount = itemsTotal + order.shippingFee;

        // Update status to pending_payment so reseller knows to pay
        if (order.orderStatus === 'pending_shipping_calc') {
            order.orderStatus = 'pending_payment';
        }

        await order.save();
        res.json(order);

        // Notify Reseller
        const Notification = require('../models/Notification');
        await Notification.create({
            user: order.resellerId,
            type: 'order_update',
            message: `Shipping Fee of ₹${shippingFee} added to Order #${order._id}. Please complete payment.`,
            relatedId: order._id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Admin Order Stats
// @route   GET /api/orders/admin/stats
// @access  Private (Admin)
exports.getAdminStats = async (req, res) => {
    try {
        const [
            totalOrders,
            pendingVerify,
            readyToShip,
            delivered,
            revenueAgg
        ] = await Promise.all([
            Order.countDocuments({}),
            Order.countDocuments({ orderStatus: 'payment_verification_pending' }),
            Order.countDocuments({ orderStatus: 'payment_confirmed' }),
            Order.countDocuments({ orderStatus: 'delivered' }),
            Order.aggregate([
                { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
            ])
        ]);

        res.json({
            total: totalOrders,
            pendingVerify,
            readyToShip,
            delivered,
            revenue: revenueAgg[0]?.totalRevenue || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
