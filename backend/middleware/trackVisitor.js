const Analytics = require('../models/Analytics');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// IN-MEMORY BUFFER
let visitBuffer = [];
const FLUSH_INTERVAL = 60 * 1000; // 60 seconds

// Flush Buffer to DB
const flushAnalytics = async () => {
    if (visitBuffer.length === 0) return;

    // Deep copy and clear buffer immediately to avoid race conditions
    const bufferToProcess = [...visitBuffer];
    visitBuffer = [];

    try {
        const now = new Date();
        const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

        // Aggregate buffer data (simple count + unique IPs)
        const uniqueIps = new Set(bufferToProcess);
        const totalViews = bufferToProcess.length;

        // Atomic Upsert
        let analytics = await Analytics.findOne({ date: today });

        if (!analytics) {
            analytics = new Analytics({
                date: today,
                visitorIps: Array.from(uniqueIps),
                uniqueVisitors: uniqueIps.size,
                totalPageViews: totalViews
            });
        } else {
            analytics.totalPageViews += totalViews;

            // Add new unique IPs
            let newVisitors = 0;
            uniqueIps.forEach(ipHash => {
                if (!analytics.visitorIps.includes(ipHash)) {
                    analytics.visitorIps.push(ipHash);
                    newVisitors++;
                }
            });
            analytics.uniqueVisitors += newVisitors;
        }

        await analytics.save();
        // console.log(`[Analytics] Flushed ${totalViews} views to DB.`);
    } catch (error) {
        console.error("[Analytics] Flush Error:", error);
    }
};

// Set Interval to flush
setInterval(flushAnalytics, FLUSH_INTERVAL);

const trackVisitor = (req, res, next) => {
    try {
        // Exclude Admins
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.decode(token);
                if (decoded && decoded.role === 'admin') return next();
            } catch (err) { }
        }

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'] || 'unknown';
        const visitorHash = crypto.createHash('md5').update(`${ip}-${userAgent}`).digest('hex');

        // Push to buffer (sync operation, extremely fast)
        visitBuffer.push(visitorHash);

    } catch (error) {
        console.error("Tracking Error:", error);
    }
    next();
};

module.exports = trackVisitor;
