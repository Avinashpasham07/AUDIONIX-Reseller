const express = require('express');
const cors = require('cors');

const helmet = require('helmet');
const compression = require('compression');
const trackVisitor = require('./middleware/trackVisitor');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Trust Render's Proxy (Required for Rate Limiting & Logs)
app.set('trust proxy', 1);

// Middleware
app.use(cors()); // Moved to top to handle Preflight/Network errors gracefully
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());
app.use(morgan('dev'));

// Rate Limiting (5000 requests per 15 minutes to support 100 concurrent resellers)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5000,
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

app.use(express.json());
// Internal Analytics: Track Visitors
app.use(trackVisitor);
// app.use(cors()); // Removed from here

// Routes (Placeholders)
app.get('/', (req, res) => {
    res.send('Audionix Backend is running');
});

// Make uploads folder static
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/meetings', require('./routes/meetingRoutes'));

app.use(errorHandler);

module.exports = app;
